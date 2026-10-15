export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { z, ZodError } from 'zod';
import type { Booking } from '@/lib/db/schema';
import { getAdminDb } from '@/lib/firebase/admin';
import {
  BookingCapacityExceededError,
  BookingCounterIntegrityError,
  BookingCutoffError,
  BookingDateClosedError,
  BookingNotEditableError,
  BookingNotFoundError,
} from '@/lib/firebase/booking-capacity';
import {
  cancelFirestoreBooking,
  updateFirestoreBooking,
} from '@/lib/firebase/bookings';
import { sendBookingCancellation, sendRescheduleNotification } from '@/lib/email';
import { getPublicBookingCode, parsePublicBookingNumber } from '@/lib/booking-number';
import { canonicalBookingPhone, matchesBookingContact, BookingContactLimitError, BookingContactMismatchError } from '@/lib/booking-policy';
import { bookingContactLimitResponse } from '@/lib/booking-limit-response';
import { limitBookingAttempts } from '@/lib/firebase/booking-attempt-limit';

const lookupSchema = z.object({
  bookingCode: z.string().trim().min(1).max(12),
  contact: z.string().trim().min(5).max(255),
}).strict();

const patchSchema = lookupSchema.extend({
  bookingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
  adults: z.number().int().min(1).max(10).optional(),
  children: z.number().int().min(0).max(10).optional(),
}).strict();

type FirestoreBookingData = Record<string, unknown>;

function normalizeBookingCode(code: string) {
  return code.replace(/^#/, '').trim().toUpperCase();
}

function normalizePhone(value: string) {
  return canonicalBookingPhone(value);
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

async function findVerifiedBooking(bookingCode: string, contact: string) {
  const code = normalizeBookingCode(bookingCode);
  const bookingNumber = parsePublicBookingNumber(code);

  if (!bookingNumber) return null;

  const snapshot = await getAdminDb()
    .collection('bookings')
    .where('bookingNumber', '==', bookingNumber)
    .limit(1)
    .get();

  const document = snapshot.docs[0];
  if (!document) return null;

  const booking = bookingFromFirestore(document.id, document.data());
  const verified = booking.bookingNumber === bookingNumber && matchesBookingContact(booking, contact);

  return verified ? booking : null;
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

interface CapacityErrorContext {
  currentDate: string;
  currentGuests: number;
  targetDate: string;
  requestedGuests: number;
}

function mutationError(error: unknown, context?: CapacityErrorContext) {
  if (error instanceof BookingContactLimitError) return bookingContactLimitResponse(error);
  if (error instanceof BookingContactMismatchError) return NextResponse.json({ success: false, error: error.message }, { status: 404 });
  if (error instanceof BookingCapacityExceededError) {
    const available = error.availableGuests + (
      context && context.targetDate === context.currentDate
        ? context.currentGuests
        : 0
    );
    return NextResponse.json(
      {
        success: false,
        code: error.code,
        error: `Only ${available} ${available === 1 ? 'seat is' : 'seats are'} available for this date.`,
        available,
        requested: context?.requestedGuests ?? error.requestedGuests,
        maxCapacity: error.maxCapacity,
      },
      { status: 409 }
    );
  }
  if (error instanceof BookingDateClosedError || error instanceof BookingCutoffError) {
    return NextResponse.json(
      { success: false, code: error.code, error: error.message },
      { status: 409 }
    );
  }
  if (error instanceof BookingNotEditableError) {
    return NextResponse.json(
      { success: false, code: error.code, error: error.message },
      { status: 409 }
    );
  }
  if (error instanceof BookingNotFoundError) {
    return NextResponse.json(
      { success: false, code: error.code, error: 'Booking ID and email/phone do not match. Please check your details.' },
      { status: 404 }
    );
  }
  if (error instanceof BookingCounterIntegrityError) {
    return NextResponse.json(
      { success: false, code: error.code, error: error.message },
      { status: 400 }
    );
  }
  return null;
}

export async function POST(request: NextRequest) {
  const rateLimit = await limitBookingAttempts(request, 'self-service');
  if (rateLimit) return rateLimit;
  try {
    const body = lookupSchema.parse(await request.json());
    const booking = await findVerifiedBooking(body.bookingCode, body.contact);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking ID and email/phone do not match. Please check your details.' },
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
  const rateLimit = await limitBookingAttempts(request, 'self-service');
  if (rateLimit) return rateLimit;
  let capacityContext: CapacityErrorContext | undefined;
  try {
    const body = patchSchema.parse(await request.json());
    const booking = await findVerifiedBooking(body.bookingCode, body.contact);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking ID and email/phone do not match. Please check your details.' },
        { status: 404 }
      );
    }

    const nextDate = body.bookingDate ?? booking.bookingDate;
    const nextAdults = body.adults ?? booking.adults;
    const nextChildren = body.children ?? booking.children;
    if (nextAdults + nextChildren > 10) {
      return NextResponse.json(
        { success: false, error: 'Total guests cannot exceed 10.' },
        { status: 400 }
      );
    }
    capacityContext = {
      currentDate: booking.bookingDate,
      currentGuests: booking.numberOfGuests,
      targetDate: nextDate,
      requestedGuests: nextAdults + nextChildren,
    };

    const oldBooking = {
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
    };
    const mutation = {
      adults: nextAdults,
      children: nextChildren,
      ...(nextDate !== booking.bookingDate ? { bookingDate: nextDate } : {}),
    };
    const transactionResult = await updateFirestoreBooking(
      booking.id,
      mutation,
      {
        enforceCutoff: true,
        requireConfirmed: true,
        requireEditableVisit: true,
        enforceContactLimit: true,
        verifiedContact: body.contact,
        verifiedBookingNumber: booking.bookingNumber,
      }
    );

    const updated: Booking = {
      ...booking,
      bookingDate: transactionResult.bookingDate,
      bookingTime: transactionResult.bookingTime,
      adults: transactionResult.adults,
      children: transactionResult.children,
      numberOfGuests: transactionResult.numberOfGuests,
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
    const response = mutationError(error, capacityContext);
    if (response) return response;
    console.error('[Self Service Booking] Update failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to update booking.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const rateLimit = await limitBookingAttempts(request, 'self-service');
  if (rateLimit) return rateLimit;
  try {
    const body = lookupSchema.parse(await request.json());
    const booking = await findVerifiedBooking(body.bookingCode, body.contact);

    if (!booking) {
      return NextResponse.json(
        { success: false, error: 'Booking ID and email/phone do not match. Please check your details.' },
        { status: 404 }
      );
    }

    await cancelFirestoreBooking(booking.id, {
      requireConfirmed: true,
      requireNonPastVisit: true,
      verifiedContact: body.contact,
      verifiedBookingNumber: booking.bookingNumber,
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
    const response = mutationError(error);
    if (response) return response;
    console.error('[Self Service Booking] Cancellation failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to cancel booking.' }, { status: 500 });
  }
}
