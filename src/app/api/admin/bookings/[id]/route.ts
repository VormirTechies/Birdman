import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  BookingCapacityExceededError,
  BookingCounterIntegrityError,
  BookingCutoffError,
  BookingDateClosedError,
  BookingNotEditableError,
  BookingNotFoundError,
} from '@/lib/firebase/booking-capacity';
import {
  deleteFirestoreBooking,
  updateFirestoreBooking,
} from '@/lib/firebase/bookings';
import { requireAdmin } from '@/lib/require-admin';
import { bookingMutationSchema } from '@/models/firestore/booking';

function mutationError(error: unknown) {
  if (error instanceof BookingCapacityExceededError) {
    return NextResponse.json(
      {
        success: false,
        code: error.code,
        error: `Only ${error.availableGuests} seats are available for this date.`,
        available: error.availableGuests,
      },
      { status: 409 }
    );
  }
  if (
    error instanceof BookingDateClosedError ||
    error instanceof BookingCutoffError ||
    error instanceof BookingNotEditableError
  ) {
    return NextResponse.json(
      { success: false, code: error.code, error: error.message },
      { status: 409 }
    );
  }
  if (error instanceof BookingNotFoundError) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }
  if (error instanceof BookingCounterIntegrityError) {
    return NextResponse.json(
      { success: false, code: error.code, error: error.message },
      { status: 400 }
    );
  }
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.user) return authResult.response;

    const { id } = await params;
    const body = await request.json();
    const normalizedBody: Record<string, unknown> = { ...body };
    if (normalizedBody.visitorName === undefined && body.visitor_name !== undefined) {
      normalizedBody.visitorName = body.visitor_name;
    }
    if (normalizedBody.bookingDate === undefined && body.booking_date !== undefined) {
      normalizedBody.bookingDate = body.booking_date;
    }
    if (normalizedBody.bookingTime === undefined && body.booking_time !== undefined) {
      normalizedBody.bookingTime = body.booking_time;
    }
    delete normalizedBody.visitor_name;
    delete normalizedBody.numberOfGuests;
    delete normalizedBody.number_of_guests;
    delete normalizedBody.booking_date;
    delete normalizedBody.booking_time;
    const parsed = bookingMutationSchema.parse(normalizedBody);
    const booking = await updateFirestoreBooking(id, parsed, {
      actorUid: authResult.user.uid,
      enforceCutoff: false,
      requireNonPastTarget: parsed.bookingDate !== undefined,
    });

    return NextResponse.json({
      success: true,
      booking,
      visitor: {
        id: booking.visitorId ?? booking.id,
        isVip: booking.isVip === true,
        vipNotes: booking.vipNotes ?? null,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    const response = mutationError(error);
    if (response) return response;
    console.error('[API] PATCH /admin/bookings/[id] failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.user) return authResult.response;

    const { id } = await params;
    await deleteFirestoreBooking(id, { actorUid: authResult.user.uid });

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully',
      booking: { id },
    });
  } catch (error) {
    const response = mutationError(error);
    if (response) return response;
    console.error('[API] DELETE /admin/bookings/[id] failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
