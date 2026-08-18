import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/require-admin';

const patchSchema = z.object({
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
  isVip: z.boolean().optional(),
  vipNotes: z.string().max(500).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

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
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
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
    const parsed = patchSchema.safeParse(normalizedBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const existing = snapshot.data() ?? {};
    const updateData: Record<string, unknown> = {
      ...parsed.data,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (
      parsed.data.numberOfGuests === undefined &&
      (parsed.data.adults !== undefined || parsed.data.children !== undefined)
    ) {
      const adults = parsed.data.adults ?? Number(existing.adults ?? 0);
      const children = parsed.data.children ?? Number(existing.children ?? 0);
      updateData.numberOfGuests = adults + children;
    }

    await bookingRef.update(updateData);
    const updatedSnapshot = await bookingRef.get();
    const booking = serializeValue({
      id: updatedSnapshot.id,
      ...updatedSnapshot.data(),
    });
    const bookingData = updatedSnapshot.data() ?? {};

    return NextResponse.json({
      success: true,
      booking,
      visitor: {
        id: bookingData.visitorId ?? updatedSnapshot.id,
        isVip: bookingData.isVip === true,
        vipNotes: bookingData.vipNotes ?? null,
      },
    });
  } catch (error) {
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
    const bookingRef = getAdminDb().collection('bookings').doc(id);
    const snapshot = await bookingRef.get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    await bookingRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Booking deleted successfully',
      booking: { id },
    });
  } catch (error) {
    console.error('[API] DELETE /admin/bookings/[id] failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
