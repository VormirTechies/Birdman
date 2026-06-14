export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  FieldValue,
  Timestamp,
  type DocumentSnapshot,
} from 'firebase-admin/firestore';
import { z } from 'zod';
import type { Booking } from '@/lib/db/schema';
import { getAdminDb } from '@/lib/firebase/admin';
import { sendRescheduleNotification } from '@/lib/email';
import { parsePublicBookingNumber } from '@/lib/booking-number';
import { requireAdmin } from '@/lib/require-admin';

const firestoreUpdateSchema = z.object({
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

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string') return new Date(value);
  return new Date();
}

function toBooking(id: string, data: Record<string, unknown>): Booking {
  return {
    id,
    bookingNumber: Number(data.bookingNumber ?? data.booking_number ?? 0),
    visitorId: typeof data.visitorId === 'string' ? data.visitorId : null,
    visitorName: String(data.visitorName ?? data.visitor_name ?? ''),
    phone: String(data.phone ?? ''),
    email: typeof data.email === 'string' ? data.email : null,
    adults: Number(data.adults ?? 0),
    children: Number(data.children ?? 0),
    numberOfGuests: Number(data.numberOfGuests ?? data.number_of_guests ?? 0),
    bookingDate: String(data.bookingDate ?? data.booking_date ?? ''),
    bookingTime: String(data.bookingTime ?? data.booking_time ?? ''),
    confirmationSent: data.confirmationSent === true,
    reminderSent: data.reminderSent === true,
    reminderSentAt: data.reminderSentAt ? toDate(data.reminderSentAt) : null,
    status: String(data.status ?? 'confirmed'),
    visited: data.visited === true,
    createdAt: toDate(data.createdAt ?? data.created_at),
    updatedAt: toDate(data.updatedAt ?? data.updated_at),
  };
}

function serializeValue(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, serializeValue(nestedValue)])
    );
  }
  return value;
}

async function findBookingSnapshot(idOrBookingNumber: string): Promise<DocumentSnapshot | null> {
  const bookings = getAdminDb().collection('bookings');
  const directSnapshot = await bookings.doc(idOrBookingNumber).get();

  if (directSnapshot.exists) {
    return directSnapshot;
  }

  const parsedBookingNumber = parsePublicBookingNumber(idOrBookingNumber);
  const lookupValues: Array<string | number> = [idOrBookingNumber];

  if (parsedBookingNumber !== null) {
    lookupValues.unshift(parsedBookingNumber);
  }

  for (const field of ['bookingNumber', 'booking_number']) {
    for (const value of lookupValues) {
      const querySnapshot = await bookings.where(field, '==', value).limit(1).get();
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0];
      }
    }
  }

  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.user) return authResult.response;

    const { id } = await params;
    const snapshot = await findBookingSnapshot(id);

    if (!snapshot?.exists) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    const booking = toBooking(snapshot.id, snapshot.data() ?? {});

    return NextResponse.json({
      success: true,
      booking: serializeValue(booking),
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
    const bookingRef = getAdminDb().collection('bookings').doc(id);
    const snapshot = await bookingRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const normalizedBody: Record<string, unknown> = { ...body };
    if (normalizedBody.visitorName === undefined && body.visitor_name !== undefined) {
      normalizedBody.visitorName = body.visitor_name;
    }
    if (normalizedBody.numberOfGuests === undefined && body.number_of_guests !== undefined) {
      normalizedBody.numberOfGuests = body.number_of_guests;
    }
    if (normalizedBody.bookingDate === undefined && body.booking_date !== undefined) {
      normalizedBody.bookingDate = body.booking_date;
    }
    if (normalizedBody.bookingTime === undefined && body.booking_time !== undefined) {
      normalizedBody.bookingTime = body.booking_time;
    }
    const parsed = firestoreUpdateSchema.safeParse(normalizedBody);

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

    const existingBooking = toBooking(id, snapshot.data() ?? {});
    const updateData: Record<string, unknown> = {
      ...parsed.data,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (
      parsed.data.numberOfGuests === undefined &&
      (parsed.data.adults !== undefined || parsed.data.children !== undefined)
    ) {
      const adults = parsed.data.adults ?? existingBooking.adults;
      const children = parsed.data.children ?? existingBooking.children;
      updateData.numberOfGuests = adults + children;
    }

    const isReschedule =
      parsed.data.bookingDate !== undefined || parsed.data.bookingTime !== undefined;
    if (isReschedule) {
      updateData.reminderSent = false;
      updateData.reminderSentAt = null;
    }

    const oldBookingDetails = {
      bookingDate: existingBooking.bookingDate,
      bookingTime: existingBooking.bookingTime,
    };

    await bookingRef.update(updateData);
    const updatedSnapshot = await bookingRef.get();
    const updatedBooking = toBooking(id, updatedSnapshot.data() ?? {});

    let emailSent = false;
    if (isReschedule) {
      try {
        const emailResult = await sendRescheduleNotification(updatedBooking, oldBookingDetails);
        emailSent = emailResult.success;
      } catch (emailError) {
        console.error('[API] Reschedule email send failed:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      booking: serializeValue({
        id: updatedSnapshot.id,
        ...updatedSnapshot.data(),
      }),
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
    const bookingRef = getAdminDb().collection('bookings').doc(id);
    const snapshot = await bookingRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    await bookingRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully',
      booking: { id },
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
