export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminBookingSchema } from '@/lib/validations';
import { createBooking, getBookings, markConfirmationSent } from '@/lib/db/queries';
import type { Booking } from '@/lib/db/schema';
import { ZodError } from 'zod';

function withLegacyAliases(booking: Booking & { visitor?: unknown }) {
  return {
    ...booking,
    visitor_name: booking.visitorName,
    number_of_guests: booking.numberOfGuests,
    booking_date: booking.bookingDate,
    booking_time: booking.bookingTime,
    created_at: booking.createdAt,
    updated_at: booking.updatedAt,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { requireAdmin } = await import('@/lib/require-admin');
    const authResult = await requireAdmin(request);
    if (!authResult.user) return authResult.response;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = searchParams.has('offset')
      ? parseInt(searchParams.get('offset') || '0')
      : (page - 1) * limit;
    const status = searchParams.get('status') as 'confirmed' | 'cancelled' | 'completed' | null;
    const date = searchParams.get('date');
    const minDate = searchParams.get('minDate');
    const visitedParam = searchParams.get('visited');
    const visitedFilter = searchParams.get('visitedFilter') as 'visited' | 'not-visited' | 'yet-to-visit' | null;
    const search = searchParams.get('search')?.trim();
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
    if (status && !['confirmed', 'cancelled', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    if (visitedParam && !['true', 'false'].includes(visitedParam)) {
      return NextResponse.json({ error: 'Visited must be true or false' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const effectiveDate = isToday ? today : date;
    const effectiveMinDate = effectiveDate || showPast ? minDate : (minDate ?? today);
    const sortBy =
      sort === 'name' || sort === 'visitorName' || sort === 'visitor_name'
        ? 'name'
        : sort === 'date' || sort === 'bookingDate' || sort === 'booking_date'
          ? 'date'
          : sort === 'guests' || sort === 'numberOfGuests' || sort === 'number_of_guests'
            ? 'guestCount'
            : undefined;

    const result = await getBookings({
      status: status ?? undefined,
      date: effectiveDate ?? undefined,
      minDate: effectiveMinDate ?? undefined,
      search,
      visited: visitedParam ? visitedParam === 'true' : undefined,
      visitedFilter: visitedFilter ?? undefined,
      sort: sort === 'checklist' ? 'checklist' : undefined,
      sortBy,
      sortDir: order,
      limit,
      offset,
    });

    return NextResponse.json({
      bookings: result.bookings.map(withLegacyAliases),
      total: result.total,
    });
  } catch (error: unknown) {
    console.error('[API] Failed to fetch bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { requireAdmin } = await import('@/lib/require-admin');
    const authResult = await requireAdmin(request);
    if (!authResult.user) return authResult.response;

    const body = await request.json();
    const validatedData = createAdminBookingSchema.parse(body);
    const numberOfGuests = validatedData.adults + validatedData.children;

    const booking = await createBooking({
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
    });

    const guestCount = booking.children > 0
      ? `${booking.adults} adult(s) + ${booking.children} child(ren)`
      : `${booking.adults} guest(s)`;

    try {
      const { sendPushToAllAdmins } = await import('@/lib/push');
      await sendPushToAllAdmins({
        title: 'Walk-in Visitor Registered',
        body: `${booking.visitorName} (${guestCount}) checked in for ${booking.bookingDate}.`,
        url: '/admin',
        visitorName: booking.visitorName,
        bookingDate: booking.bookingDate,
      });
    } catch (pushError) {
      console.error('[Admin API] Push notification failed, but booking created:', pushError);
    }

    let emailSent = false;
    if (validatedData.email && validatedData.email.trim() !== '') {
      try {
        const { sendBookingConfirmation } = await import('@/lib/email');
        const emailResult = await sendBookingConfirmation(booking);
        emailSent = emailResult.success;

        if (emailResult.success) {
          await markConfirmationSent(booking.id);
        }
      } catch (emailError) {
        console.error('[Admin API] Email send failed, but booking created:', emailError);
      }
    }

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
          visitorId: booking.visitorId,
        },
        isVip: false,
        isReturning: false,
        emailSent,
      },
      { status: 201 }
    );
  } catch (error) {
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
