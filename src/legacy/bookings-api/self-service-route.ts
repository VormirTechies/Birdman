export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z, ZodError } from 'zod';
import type { Booking } from '@/lib/db/schema';
import { getAdminDb } from '@/lib/firebase/admin';
import { getFirestoreDayDetails } from '@/lib/firebase/calendar';
import { sendBookingCancellation, sendRescheduleNotification } from '@/lib/email';
import { getPublicBookingCode, parsePublicBookingNumber } from '@/lib/booking-number';

const lookupSchema = z.object({
  bookingCode: z.string().trim().min(1).max(12),
  contact: z.string().trim().min(5).max(255),
});

const patchSchema = lookupSchema.extend({
  bookingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  adults: z.number().int().min(1).max(10).optional(),
  children: z.number().int().min(0).max(10).optional(),
});

type FirestoreBookingData = Record<string, unknown>;

function normalizeBookingCode(code: string) {
  return code.replace(/^#/, '').trim().toUpperCase();
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function maskEmail(email: string | null) {
  if (!email) return null;
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;
  return `${name.slice(0, 2)}***@${domain}`;
}

function maskPhone(phone: string) {
  const digits = normalizePhone(phone);
  if (digits.length < 4) return '****';
  return `******${digits.slice(-4)}`;
}

function numberValue(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function dateValue(value: unknown) {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function bookingFromFirestore(id: string, data: FirestoreBookingData): Booking {
  const adults = numberValue(data.adults, 1);
  const children = numberValue(data.children, 0);

  return {
    id,
    bookingNumber: numberValue(data.bookingNumber, 0),
    visitorId: typeof data.visitorId === 'string' ? data.visitorId : null,
    visitorName: String(data.visitorName ?? data.visitor_name ?? ''),
    phone: String(data.phone ?? ''),
    email: data.email ? String(data.email) : null,
    adults,
    children,
    numberOfGuests: numberValue(data.numberOfGuests ?? data.number_of_guests, adults + children),
    bookingDate: String(data.bookingDate ?? data.booking_date ?? ''),
    bookingTime: String(data.bookingTime ?? data.booking_time ?? '16:30:00'),
    confirmationSent: data.confirmationSent === true,
    reminderSent: data.reminderSent === true,
    reminderSentAt: data.reminderSentAt ? dateValue(data.reminderSentAt) : null,
    status: String(data.status ?? 'confirmed'),
    visited: data.visited === true,
    createdAt: dateValue(data.createdAt ?? data.created_at),
    updatedAt: dateValue(data.updatedAt ?? data.updated_at),
  };
}

function sanitizeBooking(booking: Booking) {
  return {
    bookingCode: getPublicBookingCode(booking),
    visitorName: booking.visitorName,
    phone: maskPhone(booking.phone),
    email: maskEmail(booking.email),
    bookingDate: booking.bookingDate,
    bookingTime: booking.bookingTime,
    adults: booking.adults,
    children: booking.children,
    numberOfGuests: booking.adults + booking.children,
    status: booking.status,
    createdAt: booking.createdAt,
  };
}

function isPastVisit(booking: Booking) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const visitDate = new Date(`${booking.bookingDate}T00:00:00`);
  return visitDate < today;
}

function assertEditable(booking: Booking) {
  if (booking.status !== 'confirmed') {
    return 'Only confirmed bookings can be changed.';
  }
  if (isPastVisit(booking)) {
    return 'Past bookings cannot be changed.';
  }
  return null;
}

function isAllowedDate(date: string, startTime: string) {
  const bookingDate = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (bookingDate < today) return false;
  if (bookingDate > today) return true;

  const [hour, minute] = startTime.split(':').map(Number);
  const sessionStart = new Date();
  sessionStart.setHours(hour || 16, minute || 30, 0, 0);
  const oneHourBefore = new Date(sessionStart.getTime() - 60 * 60 * 1000);
  return new Date() < oneHourBefore;
}

async function findVerifiedBooking(bookingCode: string, contact: string) {
  const code = normalizeBookingCode(bookingCode);
  const bookingNumber = parsePublicBookingNumber(code);
  const email = contact.includes('@') ? contact.trim().toLowerCase() : null;
  const phone = normalizePhone(contact);

  if (!bookingNumber) return null;

  const snapshot = await getAdminDb()
    .collection('bookings')
    .where('bookingNumber', '==', bookingNumber)
    .limit(1)
    .get();

  const document = snapshot.docs[0];
  if (!document) return null;

  const booking = bookingFromFirestore(document.id, document.data());
  const bookingEmail = booking.email?.trim().toLowerCase() ?? '';
  const bookingPhone = normalizePhone(booking.phone);
  const verified = email ? bookingEmail === email : bookingPhone === phone;

  return verified ? booking : null;
}

async function validateCapacity(
  booking: Booking,
  targetDate: string,
  adults: number,
  children: number
) {
  const details = await getFirestoreDayDetails(targetDate);
  const settings = details.settings as { isOpen?: boolean; startTime?: string; maxCapacity?: number };
  const startTime = settings.startTime ?? '16:30:00';
  const maxCapacity = settings.maxCapacity ?? 100;

  if (settings.isOpen === false) {
    return { ok: false as const, error: 'Selected date is not open for bookings.' };
  }

  if (!isAllowedDate(targetDate, startTime)) {
    return {
      ok: false as const,
      error: 'Selected date is no longer available for visitor changes.',
    };
  }

  const requestedGuests = adults + children;
  if (requestedGuests > 10) {
    return { ok: false as const, error: 'Total guests cannot exceed 10.' };
  }

  const dayBookings = details.bookings as Array<{ id?: string; adults?: number; children?: number; numberOfGuests?: number }>;
  const bookedExcludingCurrent = dayBookings
    .filter((dayBooking) => dayBooking.id !== booking.id)
    .reduce(
      (sum, dayBooking) =>
        sum + numberValue(dayBooking.numberOfGuests, numberValue(dayBooking.adults) + numberValue(dayBooking.children)),
      0
    );

  const available = maxCapacity - bookedExcludingCurrent;
  if (requestedGuests > available) {
    return {
      ok: false as const,
      error: `Only ${Math.max(0, available)} visitor slot(s) are available on this date.`,
    };
  }

  return { ok: true as const, startTime };
}

function validationError(error: ZodError) {
  return NextResponse.json(
    {
      success: false,
      error: error.issues[0]?.message ?? 'Invalid request.',
      details: error.issues,
    },
    { status: 400 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = lookupSchema.parse(await request.json());
    const booking = await findVerifiedBooking(body.bookingCode, body.contact);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'No matching booking found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, booking: sanitizeBooking(booking) });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    console.error('[Self Service Booking] Lookup failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to find booking.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = patchSchema.parse(await request.json());
    const booking = await findVerifiedBooking(body.bookingCode, body.contact);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'No matching booking found.' },
        { status: 404 }
      );
    }

    const editError = assertEditable(booking);
    if (editError) {
      return NextResponse.json({ success: false, error: editError }, { status: 400 });
    }

    const nextDate = body.bookingDate ?? booking.bookingDate;
    const nextAdults = body.adults ?? booking.adults;
    const nextChildren = body.children ?? booking.children;
    const capacity = await validateCapacity(booking, nextDate, nextAdults, nextChildren);

    if (!capacity.ok) {
      return NextResponse.json({ success: false, error: capacity.error }, { status: 400 });
    }

    const oldBooking = {
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
    };
    const nextBookingTime = body.bookingDate ? capacity.startTime : booking.bookingTime;

    await getAdminDb()
      .collection('bookings')
      .doc(booking.id)
      .update({
        bookingDate: nextDate,
        bookingTime: nextBookingTime,
        adults: nextAdults,
        children: nextChildren,
        numberOfGuests: nextAdults + nextChildren,
        updatedAt: FieldValue.serverTimestamp(),
      });

    const updated: Booking = {
      ...booking,
      bookingDate: nextDate,
      bookingTime: nextBookingTime,
      adults: nextAdults,
      children: nextChildren,
      numberOfGuests: nextAdults + nextChildren,
      updatedAt: new Date(),
    };

    if (body.bookingDate && (oldBooking.bookingDate !== updated.bookingDate || oldBooking.bookingTime !== updated.bookingTime)) {
      sendRescheduleNotification(updated, oldBooking).catch((emailError) => {
        console.error('[Self Service Booking] Reschedule email failed:', emailError);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Booking updated successfully.',
      booking: sanitizeBooking(updated),
    });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    console.error('[Self Service Booking] Update failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to update booking.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = lookupSchema.parse(await request.json());
    const booking = await findVerifiedBooking(body.bookingCode, body.contact);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'No matching booking found.' },
        { status: 404 }
      );
    }

    const editError = assertEditable(booking);
    if (editError) {
      return NextResponse.json({ success: false, error: editError }, { status: 400 });
    }

    await getAdminDb()
      .collection('bookings')
      .doc(booking.id)
      .update({
        status: 'cancelled',
        updatedAt: FieldValue.serverTimestamp(),
      });

    const cancelled: Booking = {
      ...booking,
      status: 'cancelled',
      updatedAt: new Date(),
    };

    sendBookingCancellation(cancelled).catch((emailError) => {
      console.error('[Self Service Booking] Cancellation email failed:', emailError);
    });

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully.',
      booking: sanitizeBooking(cancelled),
    });
  } catch (error) {
    if (error instanceof ZodError) return validationError(error);
    console.error('[Self Service Booking] Cancellation failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to cancel booking.' }, { status: 500 });
  }
}
