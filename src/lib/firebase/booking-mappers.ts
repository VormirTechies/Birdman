import 'server-only';

import type { Timestamp } from 'firebase-admin/firestore';
import { formatBookingNumber } from '@/lib/booking-number';
import {
  BOOKING_SCHEMA_VERSION,
  type AdminBooking,
  type AdminBookingCreation,
  type BookingDocument,
  type BookingSource,
  type PublicBookingResult,
  type PublicBookingSubmission,
} from '@/models/firestore/booking';

type BookingCreationInput = PublicBookingSubmission | AdminBookingCreation;

function timestampToIso(value: Timestamp | null | undefined) {
  return value?.toDate().toISOString() ?? null;
}

export function bookingDocumentFromInput(
  input: BookingCreationInput,
  options: {
    bookingNumber: number;
    source: BookingSource;
    now: Timestamp;
    actorUid?: string | null;
    visitorId?: string | null;
  }
): BookingDocument {
  const email = input.email ?? null;
  const actorUid = options.actorUid ?? null;

  return {
    bookingNumber: options.bookingNumber,
    bookingCode: formatBookingNumber(options.bookingNumber),
    visitorId: options.visitorId ?? null,
    visitorName: input.visitorName,
    visitorNameLowercase: input.visitorName.toLowerCase(),
    phone: input.phone,
    phoneNormalized: input.phone,
    email,
    emailLowercase: email,
    adults: input.adults,
    children: input.children,
    numberOfGuests: input.adults + input.children,
    bookingDate: input.bookingDate,
    bookingTime: input.bookingTime,
    status: 'confirmed',
    visited: false,
    source: options.source,
    confirmationSent: false,
    reminderSent: false,
    reminderSentAt: null,
    reminderClaimedAt: null,
    createdAt: options.now,
    updatedAt: options.now,
    createdBy: actorUid,
    updatedBy: actorUid,
    cancelledAt: null,
    cancelledBy: null,
    isVip: false,
    vipNotes: null,
    schemaVersion: BOOKING_SCHEMA_VERSION,
  };
}

export function toPublicBookingResult(
  id: string,
  booking: BookingDocument
): PublicBookingResult {
  return {
    id,
    bookingNumber: booking.bookingNumber,
    bookingCode: booking.bookingCode,
    visitorName: booking.visitorName,
    bookingDate: booking.bookingDate,
    bookingTime: booking.bookingTime,
    adults: booking.adults,
    children: booking.children,
    numberOfGuests: booking.numberOfGuests,
    status: booking.status,
  };
}

export function toAdminBooking(id: string, booking: BookingDocument): AdminBooking {
  return {
    ...toPublicBookingResult(id, booking),
    visitorId: booking.visitorId,
    phone: booking.phone,
    email: booking.email,
    visited: booking.visited,
    source: booking.source,
    confirmationSent: booking.confirmationSent,
    reminderSent: booking.reminderSent,
    reminderSentAt: timestampToIso(booking.reminderSentAt),
    createdAt: timestampToIso(booking.createdAt)!,
    updatedAt: timestampToIso(booking.updatedAt)!,
    createdBy: booking.createdBy,
    updatedBy: booking.updatedBy,
    cancelledAt: timestampToIso(booking.cancelledAt),
    cancelledBy: booking.cancelledBy,
    isVip: booking.isVip ?? false,
    vipNotes: booking.vipNotes ?? null,
  };
}
