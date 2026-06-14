import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { Booking } from '@/lib/db/schema';
import { getAdminDb } from '@/lib/firebase/admin';
import { createAdminBookingSchema } from '@/lib/validations';
import { sendBookingConfirmation } from '@/lib/email';
import { sendPushToAllAdmins } from '@/lib/push';
import { requireAdmin } from '@/lib/require-admin';
import { ZodError } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/admin/bookings — Fetch Bookings (Admin)
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.user) return authResult.response;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = searchParams.has('offset')
      ? parseInt(searchParams.get('offset') || '0')
      : (page - 1) * limit;
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const minDate = searchParams.get('minDate');
    const visitedParam = searchParams.get('visited');
    const visitedFilter = searchParams.get('visitedFilter');
    const search = searchParams.get('search')?.trim().toLowerCase();
    const sort = searchParams.get('sort');
    const order = searchParams.get('order')?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    const isToday = searchParams.get('isToday') === 'true';
    const showPast = searchParams.get('showPast') === 'true';

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Limit must be between 1 and 100' }, { status: 400 });
    }
    if (!Number.isInteger(page) || page < 1) {
      return NextResponse.json({ error: 'Page must be a positive integer' }, { status: 400 });
    }
    if (!Number.isInteger(offset) || offset < 0) {
      return NextResponse.json({ error: 'Offset must be non-negative' }, { status: 400 });
    }
    if (visitedParam && !['true', 'false'].includes(visitedParam)) {
      return NextResponse.json({ error: 'Visited must be true or false' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const effectiveDate = isToday ? today : date;
    const effectiveMinDate = effectiveDate || showPast ? minDate : (minDate ?? today);
    const snapshot = await getAdminDb().collection('bookings').get();

    const serializeValue = (value: unknown): unknown => {
      if (value instanceof Timestamp) return value.toDate().toISOString();
      if (value instanceof Date) return value.toISOString();
      if (Array.isArray(value)) return value.map(serializeValue);
      if (value && typeof value === 'object') {
        return Object.fromEntries(
          Object.entries(value).map(([key, nestedValue]) => [key, serializeValue(nestedValue)])
        );
      }
      return value;
    };

    const field = (data: Record<string, unknown>, camelCase: string, snakeCase: string) =>
      data[camelCase] ?? data[snakeCase];

    let bookings = snapshot.docs.map((document) => {
      const data = document.data() as Record<string, unknown>;
      const visitorName = field(data, 'visitorName', 'visitor_name') ?? '';
      const numberOfGuests = field(data, 'numberOfGuests', 'number_of_guests') ?? 1;
      const bookingDate = field(data, 'bookingDate', 'booking_date') ?? '';
      const bookingTime = field(data, 'bookingTime', 'booking_time') ?? '';
      const createdAt = field(data, 'createdAt', 'created_at') ?? null;

      return {
        ...data,
        id: document.id,
        visitorName,
        visitor_name: visitorName,
        numberOfGuests,
        number_of_guests: numberOfGuests,
        bookingDate,
        booking_date: bookingDate,
        bookingTime,
        booking_time: bookingTime,
        createdAt,
        created_at: createdAt,
        phone: data.phone ?? '',
        email: data.email ?? null,
        visited: data.visited === true,
        status: data.status ?? 'confirmed',
      };
    });

    bookings = bookings.filter((booking) => {
      const bookingDate = String(booking.bookingDate);
      const isVisited = booking.visited === true;

      if (status && booking.status !== status) return false;
      if (effectiveDate && bookingDate !== effectiveDate) return false;
      if (effectiveMinDate && bookingDate < effectiveMinDate) return false;
      if (visitedParam && isVisited !== (visitedParam === 'true')) return false;

      if (visitedFilter === 'visited' && !isVisited) return false;
      if (visitedFilter === 'not-visited' && (isVisited || bookingDate >= today)) return false;
      if (visitedFilter === 'yet-to-visit' && (isVisited || bookingDate < today)) return false;

      if (search) {
        const values = [booking.visitorName, booking.phone, booking.email]
          .map((value) => String(value ?? '').toLowerCase());
        if (!values.some((value) => value.includes(search))) return false;
      }

      return true;
    });

    const direction = order === 'asc' ? 1 : -1;
    const compareText = (left: unknown, right: unknown) =>
      String(left ?? '').localeCompare(String(right ?? ''));
    const toMillis = (value: unknown) => {
      if (value instanceof Timestamp) return value.toMillis();
      if (value instanceof Date) return value.getTime();
      if (typeof value === 'string') return Date.parse(value) || 0;
      return 0;
    };

    bookings.sort((left, right) => {
      if (sort === 'checklist') {
        const visitedDifference = Number(left.visited) - Number(right.visited);
        return visitedDifference || compareText(left.visitorName, right.visitorName);
      }
      if (sort === 'name' || sort === 'visitorName' || sort === 'visitor_name') {
        return direction * compareText(left.visitorName, right.visitorName);
      }
      if (sort === 'date' || sort === 'bookingDate' || sort === 'booking_date') {
        const dateDifference = compareText(left.bookingDate, right.bookingDate);
        return direction * (dateDifference || compareText(left.bookingTime, right.bookingTime));
      }
      if (sort === 'guests' || sort === 'numberOfGuests' || sort === 'number_of_guests') {
        return direction * (Number(left.numberOfGuests) - Number(right.numberOfGuests));
      }

      return direction * (toMillis(left.createdAt) - toMillis(right.createdAt));
    });

    const total = bookings.length;
    const paginatedBookings = bookings
      .slice(offset, offset + limit)
      .map((booking) => serializeValue(booking));

    return NextResponse.json({
      bookings: paginatedBookings,
      total,
    });
  } catch (error: unknown) {
    console.error('[API] Failed to fetch bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/admin/bookings — Create Booking (Admin - Instant Walk-in)
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.user) return authResult.response;

    // Parse and validate request body with admin schema (relaxed rules)
    const body = await request.json();
    const validatedData = createAdminBookingSchema.parse(body);
    const adminDb = getAdminDb();
    const bookingRef = adminDb.collection('bookings').doc();
    const counterRef = adminDb.collection('_counters').doc('bookings');
    const now = new Date();
    const numberOfGuests = validatedData.adults + validatedData.children;

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
        email: validatedData.email || null,
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
        isVip: false,
        vipNotes: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return nextNumber;
    });

    const booking: Booking = {
      id: bookingRef.id,
      bookingNumber,
      visitorId: null,
      visitorName: validatedData.visitorName,
      phone: validatedData.phone,
      email: validatedData.email || null,
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

    // Format guest count for display
    const guestCount = booking.children > 0 
      ? `${booking.adults} adult(s) + ${booking.children} child(ren)`
      : `${booking.adults} guest(s)`;

    // Notify All Admins
    await sendPushToAllAdmins({
      title: 'Walk-in Visitor Registered',
      body: `${booking.visitorName} (${guestCount}) checked in for ${booking.bookingDate}.`,
      url: '/admin',
      visitorName: booking.visitorName,
      bookingDate: booking.bookingDate,
    });

    // Send confirmation email only if email is provided (non-blocking)
    let emailSent = false;
    if (validatedData.email && validatedData.email.trim() !== '') {
      try {
        const emailResult = await sendBookingConfirmation(booking);
        emailSent = emailResult.success;

        if (emailResult.success) {
          await bookingRef.update({
            confirmationSent: true,
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      } catch (emailError) {
        console.error('[Admin API] Email send failed, but booking created:', emailError);
        // Continue - booking is still valid even if email fails
      }
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        booking: {
          id: booking.id,
          bookingNumber: booking.bookingNumber,
          visitorName: booking.visitorName,
          phone: booking.phone,
          email: booking.email,
          bookingDate: booking.bookingDate,
          bookingTime: booking.bookingTime,
          adults: booking.adults,
          children: booking.children,
          numberOfGuests: booking.numberOfGuests,
          status: booking.status,
          visitorId: null,
        },
        isVip: false,
        isReturning: false,
        emailSent,
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle database errors
    console.error('[Admin API] Booking creation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create booking',
        code: 'ADMIN_BOOKING_CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

