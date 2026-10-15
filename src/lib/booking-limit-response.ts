import { NextResponse } from 'next/server';
import { BookingContactLimitError, MAX_GUESTS_PER_CONTACT_DATE } from './booking-policy';

export function bookingContactLimitResponse(error: BookingContactLimitError) {
  const phone = process.env.GROUP_BOOKING_CONTACT_PHONE?.trim();
  return NextResponse.json({
    success: false, code: error.code, error: error.message,
    alreadyBooked: error.alreadyBooked, requested: error.requestedGuests,
    contactRemaining: Math.max(0, MAX_GUESTS_PER_CONTACT_DATE - error.alreadyBooked),
    maxGuestsPerDate: MAX_GUESTS_PER_CONTACT_DATE,
    ...(phone ? { contactPhone: phone } : {}),
  }, { status: 409, headers: { 'Cache-Control': 'no-store' } });
}
