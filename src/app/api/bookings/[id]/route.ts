import { NextRequest, NextResponse } from 'next/server';
import { getBookingById, updateBooking } from '@/lib/db/queries';
import { updateBookingSchema } from '@/lib/validations';
import { sendRescheduleNotification } from '@/lib/email';
import { ZodError } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/bookings/[id] — Get Single Booking
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid booking ID format',
        },
        { status: 400 }
      );
    }

    // Fetch booking from database
    const booking = await getBookingById(id);

    if (!booking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found',
        },
        { status: 404 }
      );
    }

    // Return booking details
    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error) {
    console.error('[API] Failed to fetch booking:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch booking',
        code: 'BOOKING_FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/bookings/[id] — Reschedule Booking
// ═══════════════════════════════════════════════════════════════════════════

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid booking ID format',
        },
        { status: 400 }
      );
    }

    // Get existing booking
    const existingBooking = await getBookingById(id);

    if (!existingBooking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found',
        },
        { status: 404 }
      );
    }

    // Check if booking can be rescheduled
    if (existingBooking.status === 'cancelled') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot reschedule a cancelled booking',
        },
        { status: 400 }
      );
    }

    if (existingBooking.status === 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot reschedule a completed booking',
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateBookingSchema.parse(body);

    // Store old booking details for email
    const oldBookingDetails = {
      bookingDate: existingBooking.bookingDate,
      bookingTime: existingBooking.bookingTime,
    };

    // Update booking in database
    const updatedBooking = await updateBooking(id, {
      bookingDate: validatedData.bookingDate || existingBooking.bookingDate,
      bookingTime: validatedData.bookingTime || existingBooking.bookingTime,
      reminderSent: false, // Reset reminder flag since date/time changed
      reminderSentAt: null,
    });

    if (!updatedBooking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update booking',
        },
        { status: 500 }
      );
    }

    // Send reschedule notification email (non-blocking)
    let emailSent = false;
    try {
      const emailResult = await sendRescheduleNotification(updatedBooking, oldBookingDetails);
      emailSent = emailResult.success;
    } catch (emailError) {
      console.error('[API] Reschedule email send failed:', emailError);
      // Continue - booking update is still valid even if email fails
    }

    // Return updated booking
    return NextResponse.json({
      success: true,
      booking: {
        id: updatedBooking.id,
        visitorName: updatedBooking.visitorName,
        bookingDate: updatedBooking.bookingDate,
        bookingTime: updatedBooking.bookingTime,
        numberOfGuests: updatedBooking.numberOfGuests,
        status: updatedBooking.status,
      },
      emailSent,
    });
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
    console.error('[API] Booking update failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update booking',
        code: 'BOOKING_UPDATE_ERROR',
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/bookings/[id] — Cancel Booking
// ═══════════════════════════════════════════════════════════════════════════

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid booking ID format',
        },
        { status: 400 }
      );
    }

    // Get existing booking
    const existingBooking = await getBookingById(id);

    if (!existingBooking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking not found',
        },
        { status: 404 }
      );
    }

    // Check if booking is already cancelled
    if (existingBooking.status === 'cancelled') {
      return NextResponse.json(
        {
          success: false,
          error: 'Booking is already cancelled',
        },
        { status: 400 }
      );
    }

    // Update booking status to cancelled
    const cancelledBooking = await updateBooking(id, {
      status: 'cancelled',
    });

    if (!cancelledBooking) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to cancel booking',
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: {
        id: cancelledBooking.id,
        status: cancelledBooking.status,
      },
    });
  } catch (error) {
    console.error('[API] Booking cancellation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel booking',
        code: 'BOOKING_CANCEL_ERROR',
      },
      { status: 500 }
    );
  }
}
