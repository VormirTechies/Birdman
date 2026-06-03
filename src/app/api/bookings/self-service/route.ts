export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { z, ZodError } from 'zod';
import { db } from '@/lib/db';
import { bookings, type Booking } from '@/lib/db/schema';
import { ensureBookingNumberColumn, getDayDetails, updateBooking } from '@/lib/db/queries';
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

async function findVerifiedBooking(bookingCode: string, contact: string) {
  const code = normalizeBookingCode(bookingCode);
  const bookingNumber = parsePublicBookingNumber(code);
  const email = contact.includes('@') ? contact.trim().toLowerCase() : null;
  const phone = normalizePhone(contact);

  if (!bookingNumber) return null;

  await ensureBookingNumberColumn();

  return db.query.bookings.findFirst({
    where: and(
      eq(bookings.bookingNumber, bookingNumber),
      email
        ? sql`lower(coalesce(${bookings.email}, '')) = ${email}`
        : sql`right(regexp_replace(${bookings.phone}, '\\D', '', 'g'), 10) = ${phone}`
    ),
  });
}

async function validateCapacity(
  booking: Booking,
  targetDate: string,
  adults: number,
  children: number
) {
  const details = await getDayDetails(targetDate);
  const settings = details.settings;

  if (!settings.isOpen) {
    return { ok: false, error: 'Selected date is not open for bookings.' };
  }

  if (!isAllowedDate(targetDate, settings.startTime)) {
    return {
      ok: false,
      error: "Selected date is no longer available for visitor changes.",
    };
  }

  const requestedGuests = adults + children;
  if (requestedGuests > 10) {
    return { ok: false, error: 'Total guests cannot exceed 10.' };
  }

  const bookedExcludingCurrent = details.bookings
    .filter((dayBooking) => dayBooking.id !== booking.id)
    .reduce((sum, dayBooking) => sum + dayBooking.adults + dayBooking.children, 0);

  const available = settings.maxCapacity - bookedExcludingCurrent;
  if (requestedGuests > available) {
    return {
      ok: false,
      error: `Only ${Math.max(0, available)} visitor slot(s) are available on this date.`,
    };
  }

  return { ok: true, startTime: settings.startTime };
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
    const updated = await updateBooking(booking.id, {
      bookingDate: nextDate,
      bookingTime: body.bookingDate ? capacity.startTime : booking.bookingTime,
      adults: nextAdults,
      children: nextChildren,
      numberOfGuests: nextAdults + nextChildren,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update booking.' },
        { status: 500 }
      );
    }

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

    const [cancelled] = await db
      .update(bookings)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(bookings.id, booking.id))
      .returning();

    if (!cancelled) {
      return NextResponse.json(
        { success: false, error: 'Failed to cancel booking.' },
        { status: 500 }
      );
    }

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
