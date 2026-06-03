export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createBooking, getBookings, markConfirmationSent } from '@/lib/db/queries';
import { createBookingSchema } from '@/lib/validations';
import { sendBookingConfirmation } from '@/lib/email';
import { sendVipWelcomeEmail } from '@/lib/email';
import { sendPushToAllAdmins } from '@/lib/push';
import { findOrCreateVisitor, linkBookingToVisitor } from '@/lib/visitors';
import { ZodError } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/bookings — Create New Booking
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createBookingSchema.parse(body);

    // Create booking in database
    const booking = await createBooking({
      visitorName: validatedData.visitorName,
      phone: validatedData.phone,
      email: validatedData.email,
      adults: validatedData.adults,
      children: validatedData.children,
      numberOfGuests: validatedData.numberOfGuests || (validatedData.adults + validatedData.children), // Backward compatibility
      bookingDate: validatedData.bookingDate,
      bookingTime: validatedData.bookingTime,
    });

    // Match or create visitor profile (non-blocking for booking creation)
    let isVip = false;
    let isReturning = false;
    let totalVisits = 1;
    try {
      const visitorResult = await findOrCreateVisitor(
        validatedData.phone,
        validatedData.email,
        validatedData.visitorName,
        validatedData.bookingDate
      );
      isVip = visitorResult.isVip;
      isReturning = visitorResult.isReturning;
      totalVisits = visitorResult.visitor.totalVisits ?? 1;
      await linkBookingToVisitor(booking.id, visitorResult.visitor.id);
    } catch (visitorError) {
      console.error('[API] Visitor matching failed (non-fatal):', visitorError);
    }

    // Format guest count for display
    const guestCount = booking.children > 0 
      ? `${booking.adults} adult(s) + ${booking.children} child(ren)`
      : `${booking.adults} guest(s)`;

    // Notify Admins Immediately
    await sendPushToAllAdmins({
      title: isVip ? '⭐ VIP Visitor Booked!' : 'New Parakeet Visit Booked!',
      body: `${booking.visitorName} scheduled ${guestCount} for ${booking.bookingDate}.${
        isVip ? ' VIP visitor!' : isReturning ? ' (Returning visitor)' : ''
      }`,
      url: '/admin',
      visitorName: booking.visitorName,
      bookingDate: booking.bookingDate,
    });

    // Send confirmation email (non-blocking - failure should not fail booking)
    let emailSent = false;
    try {
      // VIPs get a special welcome-back email; new/returning visitors get the standard confirmation
      const emailResult = isVip
        ? await sendVipWelcomeEmail(booking, totalVisits)
        : await sendBookingConfirmation(booking);
      emailSent = emailResult.success;

      if (emailResult.success) {
        // Mark confirmation as sent in database
        await markConfirmationSent(booking.id);
      }
    } catch (emailError) {
      console.error('[API] Email send failed, but booking created:', emailError);
      // Continue - booking is still valid even if email fails
    }

    // Return success response
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
          numberOfGuests: booking.numberOfGuests, // Keep for backward compatibility
          status: booking.status,
        },
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
    console.error('[API] Booking creation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create booking',
        code: 'BOOKING_CREATE_ERROR',
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/bookings — List All Bookings (Admin Only)
// Query params: ?status=confirmed&date=2026-04-15&limit=50&offset=0
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // For now, this endpoint is unprotected (Sprint 1)
    // const session = await getServerSession();
    // if (!session || !session.user.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as 'confirmed' | 'cancelled' | 'completed' | null;
    const date = searchParams.get('date');
    const minDate = searchParams.get('minDate');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') as 'checklist' | null;
    const visitedFilter = searchParams.get('visitedFilter') as 'visited' | 'not-visited' | 'yet-to-visit' | null;
    const sortBy = searchParams.get('sortBy') as 'name' | 'email' | 'date' | 'guestCount' | null;
    const sortDir = searchParams.get('sortDir') as 'asc' | 'desc' | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate limit and offset
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Limit must be between 1 and 100',
        },
        { status: 400 }
      );
    }

    if (offset < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Offset must be non-negative',
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !['confirmed', 'cancelled', 'completed'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status. Must be: confirmed, cancelled, or completed',
        },
        { status: 400 }
      );
    }

    // Validate date format if provided
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD',
        },
        { status: 400 }
      );
    }

    // Fetch bookings from database
    const { bookings, total } = await getBookings({
      status: status || undefined,
      date: date || undefined,
      minDate: minDate || undefined,
      search: search || undefined,
      sort: sort || undefined,
      visitedFilter: visitedFilter || undefined,
      sortBy: sortBy || undefined,
      sortDir: sortDir || undefined,
      limit,
      offset,
    });

    // Return bookings
    return NextResponse.json({
      success: true,
      bookings,
      total,
      pagination: {
        limit,
        offset,
        count: bookings.length,
      },
    });
  } catch (error) {
    console.error('[API] Failed to fetch bookings:', error);
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
