export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  cancelBooking,
  getBookingById,
  toggleVisited,
  updateBooking,
} from '@/lib/db/queries';
import type { Booking, NewBooking } from '@/lib/db/schema';
import { requireAdmin } from '@/lib/require-admin';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const updateSchema = z.object({
  status: z.enum(['confirmed', 'cancelled', 'completed']).optional(),
  visited: z.boolean().optional(),
  visitorName: z.string().min(2).max(255).optional(),
  phone: z.string().min(5).max(20).optional(),
  email: z.union([z.string().email(), z.literal(''), z.null()]).optional(),
  adults: z.number().int().min(0).max(10).optional(),
  children: z.number().int().min(0).max(10).optional(),
  numberOfGuests: z.number().int().min(1).max(10).optional(),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  bookingTime: z.string().min(1).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

function serializeBooking(booking: Booking) {
  return {
    ...booking,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    reminderSentAt: booking.reminderSentAt?.toISOString() ?? null,
  };
}

function normalizeBody(body: Record<string, unknown>): Record<string, unknown> {
  return {
    ...body,
    visitorName: body.visitorName ?? body.visitor_name,
    numberOfGuests: body.numberOfGuests ?? body.number_of_guests,
    bookingDate: body.bookingDate ?? body.booking_date,
    bookingTime: body.bookingTime ?? body.booking_time,
  };
}

function toUpdateData(
  parsed: z.infer<typeof updateSchema>,
  existingBooking: Booking
): Partial<NewBooking> {
  const updateData: Partial<NewBooking> = {};

  if (parsed.status !== undefined) updateData.status = parsed.status;
  if (parsed.visited !== undefined) updateData.visited = parsed.visited;
  if (parsed.visitorName !== undefined) updateData.visitorName = parsed.visitorName;
  if (parsed.phone !== undefined) updateData.phone = parsed.phone;
  if (parsed.email !== undefined) updateData.email = parsed.email === '' ? null : parsed.email;
  if (parsed.adults !== undefined) updateData.adults = parsed.adults;
  if (parsed.children !== undefined) updateData.children = parsed.children;
  if (parsed.numberOfGuests !== undefined) updateData.numberOfGuests = parsed.numberOfGuests;
  if (parsed.bookingDate !== undefined) updateData.bookingDate = parsed.bookingDate;
  if (parsed.bookingTime !== undefined) updateData.bookingTime = parsed.bookingTime;

  if (
    parsed.numberOfGuests === undefined &&
    (parsed.adults !== undefined || parsed.children !== undefined)
  ) {
    const adults = parsed.adults ?? existingBooking.adults;
    const children = parsed.children ?? existingBooking.children;
    updateData.numberOfGuests = adults + children;
  }

  if (parsed.bookingDate !== undefined || parsed.bookingTime !== undefined) {
    updateData.reminderSent = false;
    updateData.reminderSentAt = null;
  }

  return updateData;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.user) return authResult.response;

    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking id' },
        { status: 400 }
      );
    }

    const booking = await getBookingById(id);
    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: serializeBooking(booking),
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.user) return authResult.response;

    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking id' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const normalizedBody = normalizeBody(body);
    const parsed = updateSchema.safeParse(normalizedBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: parsed.error.issues,
        },
        { status: 400 }
      );
    }

    const existingBooking = await getBookingById(id);
    if (!existingBooking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    const keys = Object.keys(normalizedBody).filter((key) => normalizedBody[key] !== undefined);
    if (keys.length === 1 && parsed.data.visited !== undefined) {
      const updatedBooking = await toggleVisited(id, parsed.data.visited);
      if (!updatedBooking) {
        return NextResponse.json(
          { success: false, error: 'Booking not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        booking: serializeBooking(updatedBooking),
        emailSent: false,
      });
    }

    const isReschedule =
      parsed.data.bookingDate !== undefined || parsed.data.bookingTime !== undefined;
    const oldBookingDetails = {
      bookingDate: existingBooking.bookingDate,
      bookingTime: existingBooking.bookingTime,
    };

    const updatedBooking = await updateBooking(id, toUpdateData(parsed.data, existingBooking));
    if (!updatedBooking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    let emailSent = false;
    if (isReschedule) {
      try {
        const { sendRescheduleNotification } = await import('@/lib/email');
        const emailResult = await sendRescheduleNotification(updatedBooking, oldBookingDetails);
        emailSent = emailResult.success;
      } catch (emailError) {
        console.error('[API] Reschedule email send failed:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      booking: serializeBooking(updatedBooking),
      emailSent,
    });
  } catch (error) {
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.user) return authResult.response;

    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid booking id' },
        { status: 400 }
      );
    }

    const cancelled = await cancelBooking(id);
    if (!cancelled) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully',
      booking: serializeBooking(cancelled),
    });
  } catch (error) {
    console.error('[API] Booking deletion failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete booking',
        code: 'BOOKING_DELETE_ERROR',
      },
      { status: 500 }
    );
  }
}
