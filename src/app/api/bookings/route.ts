export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createBooking, getBookings, markConfirmationSent } from '@/lib/db/queries';
import { createBookingSchema } from '@/lib/validations';
import { sendBookingConfirmation } from '@/lib/email';
import { sendPushToAllAdmins } from '@/lib/push';
import { ZodError } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/bookings — Create New Booking
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = createBookingSchema.parse(body);

    // Fetch availability for the requested date to enforce capacity and block rules
    const { getDateAvailability } = await import('@/lib/db/queries');
    const dayAvail = await getDateAvailability(validatedData.bookingDate);

    if (dayAvail.isBlocked) {
      return NextResponse.json(
        { success: false, error: 'This date is currently blocked and cannot accept bookings.' },
        { status: 400 }
      );
    }

    if (validatedData.numberOfGuests > dayAvail.remainingGuests) {
      return NextResponse.json(
        { success: false, error: `Only ${dayAvail.remainingGuests} slots remaining on this date.` },
        { status: 400 }
      );
    }

    // Use the dynamic slot time from availability settings
    const slotTimeToUse = dayAvail.slotTime;

    // Create booking in database
    const booking = await createBooking({
      visitorName: validatedData.visitorName,
      phone: validatedData.phone,
      email: validatedData.email,
      numberOfGuests: validatedData.numberOfGuests,
      bookingDate: validatedData.bookingDate,
      bookingTime: slotTimeToUse, // Always use admin-configured time
      category: validatedData.category as any,
      organisationName: validatedData.organisationName,
    });

    // Notify Admins Immediately
    await sendPushToAllAdmins({
      title: 'New Visit Booked!',
      body: `${booking.visitorName} scheduled ${booking.numberOfGuests} guests for ${booking.bookingDate} (${booking.category}).`,
      url: '/admin'
    });

    // Send confirmation email (non-blocking - failure should not fail booking)
    let emailSent = false;
    try {
      const emailResult = await sendBookingConfirmation(booking);
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
          visitorName: booking.visitorName,
          bookingDate: booking.bookingDate,
          bookingTime: booking.bookingTime,
          numberOfGuests: booking.numberOfGuests,
          status: booking.status,
          category: booking.category,
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
    const bookings = await getBookings({
      status: status || undefined,
      date: date || undefined,
      limit,
      offset,
    });

    // Return bookings
    return NextResponse.json({
      success: true,
      bookings,
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
