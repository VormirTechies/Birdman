export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, type Query } from 'firebase-admin/firestore';
import {
  BookingCapacityExceededError,
  BookingCutoffError,
  BookingDateClosedError,
  indiaCalendarDate,
} from '@/lib/firebase/booking-capacity';
import { getAdminDb } from '@/lib/firebase/admin';
import { createFirestoreBooking } from '@/lib/firebase/bookings';
import { publicBookingSubmissionSchema } from '@/models/firestore/booking';
import { BookingContactLimitError } from '@/lib/booking-policy';
import { bookingContactLimitResponse } from '@/lib/booking-limit-response';
import { limitBookingAttempts } from '@/lib/firebase/booking-attempt-limit';
import { isWithinPublicBookingWindow, PUBLIC_BOOKING_WINDOW_DAYS } from '@/lib/booking-window';

console.log('[api/bookings] module loaded');

type BookingForEmail = {
  id: string;
  bookingNumber: number;
  visitorId: string | null;
  visitorName: string;
  phone: string;
  email: string | null;
  adults: number;
  children: number;
  numberOfGuests: number;
  bookingDate: string;
  bookingTime: string;
  confirmationSent: boolean;
  reminderSent: boolean;
  reminderSentAt: Date | null;
  status: string;
  visited: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function firebaseEnvPresence() {
  return {
    FIREBASE_PROJECT_ID: Boolean(process.env.FIREBASE_PROJECT_ID),
    FIREBASE_CLIENT_EMAIL: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
    FIREBASE_PRIVATE_KEY: Boolean(process.env.FIREBASE_PRIVATE_KEY),
  };
}

function isFirebaseAdminConfigError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes('Missing Firebase Admin credentials') ||
    error.message.includes('Failed to parse private key') ||
    error.message.includes('Invalid PEM formatted message') ||
    error.message.includes('Firebase Admin configuration')
  );
}

function isValidationError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'issues' in error &&
    Array.isArray((error as { issues?: unknown }).issues)
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unknown error';
}

function logSafeError(message: string, error: unknown) {
  if (error instanceof Error) {
    console.error(message, {
      name: error.name,
      message: error.message,
    });
    return;
  }

  console.error(message, error);
}

function serializeValue(value: unknown): unknown {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, serializeValue(nestedValue)])
    );
  }
  return value;
}

export async function POST(request: NextRequest) {
  const rateLimit = await limitBookingAttempts(request, 'create');
  if (rateLimit) return rateLimit;
  console.log('[api/bookings] POST started');
  console.log('[api/bookings] Firebase env presence', firebaseEnvPresence());

  try {
    console.log('[api/bookings] parsing request body');
    const body = await request.json();
    const normalizedBody: Record<string, unknown> = {
      ...body,
      visitorName: body.visitorName ?? body.visitor_name,
      bookingDate: body.bookingDate ?? body.booking_date,
      bookingTime: body.bookingTime ?? body.booking_time,
    };
    delete normalizedBody.visitor_name;
    delete normalizedBody.booking_date;
    delete normalizedBody.booking_time;
    // Retain backward compatibility while computing the total exclusively
    // from adults + children on the server.
    delete normalizedBody.numberOfGuests;
    delete normalizedBody.number_of_guests;
    const now = new Date();
    const validatedData = publicBookingSubmissionSchema.refine(
      data => isWithinPublicBookingWindow(data.bookingDate, now),
      { path: ['bookingDate'], message: `Booking date must be between today and ${PUBLIC_BOOKING_WINDOW_DAYS} days ahead (India time).` }
    ).parse(normalizedBody);

    console.log('[api/bookings] creating Firestore booking');
    const created = await createFirestoreBooking(validatedData, {
      source: 'public',
      enforceCutoff: true,
      now,
    });

    console.log('[api/bookings] Firestore booking created');
    const booking: BookingForEmail = {
      id: created.id,
      bookingNumber: created.bookingNumber,
      visitorId: null,
      visitorName: created.visitorName,
      phone: created.phone,
      email: created.email,
      adults: created.adults,
      children: created.children,
      numberOfGuests: created.numberOfGuests,
      bookingDate: created.bookingDate,
      bookingTime: created.bookingTime,
      confirmationSent: false,
      reminderSent: false,
      reminderSentAt: null,
      status: 'confirmed',
      visited: false,
      createdAt: now,
      updatedAt: now,
    };

    // Admin alerts are queued atomically by createFirestoreBooking.
    let emailSent = false;
    if (booking.email) {
      try {
        console.log('[api/bookings] loading email sender');
        const { sendBookingConfirmation } = await import('@/lib/email');
        const emailResult = await sendBookingConfirmation(booking);
        emailSent = emailResult.success;

        if (emailResult.success) {
          await getAdminDb().collection('bookings').doc(booking.id).update({
            confirmationSent: true,
            updatedAt: FieldValue.serverTimestamp(),
          });
        } else {
          console.error('[api/bookings] Email sender returned failure, but booking created', {
            error: emailResult.error,
          });
        }
      } catch (emailError) {
        logSafeError('[api/bookings] Email send failed, but booking created', emailError);
      }
    }

    console.log('[api/bookings] POST completed successfully');
    return NextResponse.json(
      {
        success: true,
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          bookingCode: created.bookingCode,
          visitorName: booking.visitorName,
          bookingDate: booking.bookingDate,
          bookingTime: booking.bookingTime,
          adults: booking.adults,
          children: booking.children,
          numberOfGuests: booking.numberOfGuests,
          status: booking.status,
        },
        emailSent,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof BookingContactLimitError) return bookingContactLimitResponse(error);
    logSafeError('[api/bookings] POST failed', error);

    if (error instanceof BookingCapacityExceededError) {
      const available = error.availableGuests;
      return NextResponse.json(
        {
          success: false,
          code: error.code,
          error: `Only ${available} ${available === 1 ? 'seat is' : 'seats are'} available for this date.`,
          available,
          requested: error.requestedGuests,
          maxCapacity: error.maxCapacity,
        },
        { status: 409 }
      );
    }

    if (error instanceof BookingDateClosedError || error instanceof BookingCutoffError) {
      return NextResponse.json(
        { success: false, code: error.code, error: error.message },
        { status: 409 }
      );
    }

    if (isValidationError(error)) {
      const details = (error as { issues: Array<{ path: Array<string | number>; message: string }> })
        .issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

      return NextResponse.json(
        {
          success: false,
          code: 'BOOKING_VALIDATION_ERROR',
          error: 'Validation failed',
          details,
        },
        { status: 400 }
      );
    }

    if (isFirebaseAdminConfigError(error)) {
      return NextResponse.json(
        {
          success: false,
          code: 'FIREBASE_ADMIN_CONFIG_ERROR',
          error: 'Firebase Admin configuration failed',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        code: 'BOOKING_API_ERROR',
        error: errorMessage(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const [{ requireAdmin }, { getAdminDb }] = await Promise.all([
      import('@/lib/require-admin'),
      import('@/lib/firebase/admin'),
    ]);
    const authResult = await requireAdmin(request);
    if (!authResult.user) return authResult.response;

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as 'confirmed' | 'cancelled' | 'completed' | null;
    const date = searchParams.get('date');
    const minDate = searchParams.get('minDate');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') as 'checklist' | null;
    const visitedParam = searchParams.get('visited');
    const visitedFilter = searchParams.get('visitedFilter') as
      | 'visited'
      | 'not-visited'
      | 'yet-to-visit'
      | null;
    const sortBy = searchParams.get('sortBy') as 'name' | 'email' | 'date' | 'guestCount' | null;
    const sortDir = searchParams.get('sortDir') as 'asc' | 'desc' | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = searchParams.has('offset')
      ? parseInt(searchParams.get('offset') || '0')
      : (page - 1) * limit;

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ success: false, error: 'Limit must be between 1 and 100' }, { status: 400 });
    }
    if (!Number.isInteger(page) || page < 1) {
      return NextResponse.json({ success: false, error: 'Page must be a positive integer' }, { status: 400 });
    }
    if (!Number.isInteger(offset) || offset < 0) {
      return NextResponse.json({ success: false, error: 'Offset must be non-negative' }, { status: 400 });
    }
    if (status && !['confirmed', 'cancelled', 'completed'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be: confirmed, cancelled, or completed' },
        { status: 400 }
      );
    }
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }
    if (visitedParam && !['true', 'false'].includes(visitedParam)) {
      return NextResponse.json({ success: false, error: 'Visited must be true or false' }, { status: 400 });
    }

    const today = indiaCalendarDate(new Date());
    const searchLower = search?.trim().toLowerCase();
    const database = getAdminDb();
    let query: Query = database.collection('bookings');
    let hasBookingDateRange = false;

    // Replaced full bookings scan with Firestore-side filters where possible.
    if (status) query = query.where('status', '==', status);
    if (date) {
      query = query.where('bookingDate', '==', date);
    } else if (minDate) {
      query = query.where('bookingDate', '>=', minDate);
      hasBookingDateRange = true;
    }
    if (visitedParam) {
      query = query.where('visited', '==', visitedParam === 'true');
    }
    if (visitedFilter === 'visited') {
      query = query.where('visited', '==', true);
    } else if (visitedFilter === 'not-visited') {
      query = query.where('visited', '==', false).where('bookingDate', '<', today);
      hasBookingDateRange = true;
    } else if (visitedFilter === 'yet-to-visit') {
      query = query.where('visited', '==', false).where('bookingDate', '>=', today);
      hasBookingDateRange = true;
    }

    const hasSearch = Boolean(searchLower);
    const usesInMemoryOnlySort =
      sort === 'checklist' || sortBy === 'name' || sortBy === 'email' || sortBy === 'guestCount';
    const defaultCreatedAtSort = !sort && !sortBy;
    const canPageInFirestore =
      !hasSearch &&
      !usesInMemoryOnlySort &&
      !(defaultCreatedAtSort && hasBookingDateRange) &&
      !(date && minDate);

    const countQuery = query;

    if (canPageInFirestore) {
      if (sortBy === 'date') {
        const direction = sortDir === 'asc' ? 'asc' : 'desc';
        query = query.orderBy('bookingDate', direction).orderBy('bookingTime', direction);
      } else {
        query = query.orderBy('createdAt', 'desc');
      }

      const countSnapshot = await countQuery.count().get();
      const total = countSnapshot.data().count;
      console.log('[FIRESTORE READ]', 'GET /api/bookings:count', 'docs:', total);

      const snapshot = await query.offset(offset).limit(limit).get();
      console.log('[FIRESTORE READ]', 'GET /api/bookings', 'docs:', snapshot.size);

      return NextResponse.json({
        success: true,
        bookings: snapshot.docs.map((doc) => serializeValue({ id: doc.id, ...doc.data() })),
        total,
        pagination: {
          limit,
          offset,
          page,
          count: snapshot.size,
        },
      });
    }

    const snapshot = await query.get();
    console.log('[FIRESTORE READ]', 'GET /api/bookings', 'docs:', snapshot.size);

    let bookings: Array<Record<string, unknown> & { id: string }> = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    bookings = bookings.filter((booking) => {
      const bookingStatus = String(booking.status ?? '');
      const bookingDate = String(booking.bookingDate ?? '');
      const visited = booking.visited === true;

      if (status && bookingStatus !== status) return false;
      if (date && bookingDate !== date) return false;
      if (minDate && bookingDate < minDate) return false;
      if (visitedParam && visited !== (visitedParam === 'true')) return false;
      if (visitedFilter === 'visited' && !visited) return false;
      if (visitedFilter === 'not-visited' && (visited || bookingDate >= today)) return false;
      if (visitedFilter === 'yet-to-visit' && (visited || bookingDate < today)) return false;

      if (searchLower) {
        // TODO: Replace reduced-set in-memory search with indexed normalized fields:
        // visitorNameLowercase, phoneNormalized, emailLowercase, bookingNumberString.
        const searchable = [booking.visitorName, booking.email, booking.phone].map((value) =>
          String(value ?? '').toLowerCase()
        );
        if (!searchable.some((value) => value.includes(searchLower))) return false;
      }

      return true;
    });

    const direction = sortDir === 'asc' ? 1 : -1;
    const compareText = (left: unknown, right: unknown) =>
      String(left ?? '').localeCompare(String(right ?? ''));
    const toMillis = (value: unknown) => {
      if (
        value &&
        typeof value === 'object' &&
        'toMillis' in value &&
        typeof (value as { toMillis?: unknown }).toMillis === 'function'
      ) {
        return (value as { toMillis: () => number }).toMillis();
      }
      if (value instanceof Date) return value.getTime();
      if (typeof value === 'string') return Date.parse(value) || 0;
      return 0;
    };

    bookings.sort((left, right) => {
      if (sort === 'checklist') {
        const visitedDifference = Number(left.visited === true) - Number(right.visited === true);
        return visitedDifference || compareText(left.visitorName, right.visitorName);
      }
      if (sortBy === 'name') return direction * compareText(left.visitorName, right.visitorName);
      if (sortBy === 'email') return direction * compareText(left.email, right.email);
      if (sortBy === 'guestCount') {
        return direction * (Number(left.numberOfGuests ?? 0) - Number(right.numberOfGuests ?? 0));
      }
      if (sortBy === 'date') {
        const dateDifference = compareText(left.bookingDate, right.bookingDate);
        return direction * (dateDifference || compareText(left.bookingTime, right.bookingTime));
      }

      return toMillis(right.createdAt) - toMillis(left.createdAt);
    });

    const total = bookings.length;
    const paginatedBookings = bookings.slice(offset, offset + limit).map(serializeValue);

    return NextResponse.json({
      success: true,
      bookings: paginatedBookings,
      total,
      pagination: {
        limit,
        offset,
        page,
        count: paginatedBookings.length,
      },
    });
  } catch (error) {
    logSafeError('[api/bookings] GET failed', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch bookings',
        code: 'BOOKINGS_FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}
