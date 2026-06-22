export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

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
  console.log('[api/bookings] POST started');
  console.log('[api/bookings] Firebase env presence', firebaseEnvPresence());

  try {
    console.log('[api/bookings] parsing request body');
    const body = await request.json();
    const normalizedBody = {
      ...body,
      visitorName: body.visitorName ?? body.visitor_name,
      numberOfGuests: body.numberOfGuests ?? body.number_of_guests,
      bookingDate: body.bookingDate ?? body.booking_date,
      bookingTime: body.bookingTime ?? body.booking_time,
    };

    console.log('[api/bookings] loading validation schema');
    const { createBookingSchema } = await import('@/lib/validations');
    const validatedData = createBookingSchema.parse(normalizedBody);

    console.log('[api/bookings] loading Firebase Admin modules');
    const [{ FieldValue }, { getAdminDb }] = await Promise.all([
      import('firebase-admin/firestore'),
      import('@/lib/firebase/admin'),
    ]);

    console.log('[api/bookings] creating Firestore booking');
    const adminDb = getAdminDb();
    const now = new Date();
    const bookingRef = adminDb.collection('bookings').doc();
    const counterRef = adminDb.collection('_counters').doc('bookings');
    const numberOfGuests =
      validatedData.numberOfGuests || validatedData.adults + validatedData.children;

    const bookingNumber = await adminDb.runTransaction(async (transaction) => {
      const counterSnapshot = await transaction.get(counterRef);
      const currentNumber = counterSnapshot.exists
        ? Number(counterSnapshot.data()?.value ?? 0)
        : 0;
      const nextNumber = currentNumber + 1;

      transaction.set(counterRef, { value: nextNumber }, { merge: true });
      transaction.set(bookingRef, {
        bookingNumber: nextNumber,
        visitorName: validatedData.visitorName,
        phone: validatedData.phone,
        email: validatedData.email ?? null,
        adults: validatedData.adults,
        children: validatedData.children,
        numberOfGuests,
        bookingDate: validatedData.bookingDate,
        bookingTime: validatedData.bookingTime,
        status: 'confirmed',
        visited: false,
        confirmationSent: false,
        reminderSent: false,
        reminderSentAt: null,
        visitorId: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return nextNumber;
    });

    console.log('[api/bookings] Firestore booking created');
    const booking: BookingForEmail = {
      id: bookingRef.id,
      bookingNumber,
      visitorId: null,
      visitorName: validatedData.visitorName,
      phone: validatedData.phone,
      email: validatedData.email ?? null,
      adults: validatedData.adults,
      children: validatedData.children,
      numberOfGuests,
      bookingDate: validatedData.bookingDate,
      bookingTime: validatedData.bookingTime,
      confirmationSent: false,
      reminderSent: false,
      reminderSentAt: null,
      status: 'confirmed',
      visited: false,
      createdAt: now,
      updatedAt: now,
    };

    const guestCount =
      booking.children > 0
        ? `${booking.adults} adult(s) + ${booking.children} child(ren)`
        : `${booking.adults} guest(s)`;

    try {
      console.log('[api/bookings] loading push sender');
      const { sendPushToAllAdmins } = await import('@/lib/push');
      await sendPushToAllAdmins({
        title: 'New Parakeet Visit Booked!',
        body: `${booking.visitorName} scheduled ${guestCount} for ${booking.bookingDate}.`,
        url: '/admin',
        visitorName: booking.visitorName,
        bookingDate: booking.bookingDate,
      });
    } catch (pushError) {
      logSafeError('[api/bookings] Push notification failed, but booking created', pushError);
    }

    let emailSent = false;
    if (booking.email) {
      try {
        console.log('[api/bookings] loading email sender');
        const { sendBookingConfirmation } = await import('@/lib/email');
        const emailResult = await sendBookingConfirmation(booking);
        emailSent = emailResult.success;

        if (emailResult.success) {
          await bookingRef.update({
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
    logSafeError('[api/bookings] POST failed', error);

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

    const snapshot = await getAdminDb().collection('bookings').get();
    const today = new Date().toISOString().split('T')[0];
    const searchLower = search?.trim().toLowerCase();

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
