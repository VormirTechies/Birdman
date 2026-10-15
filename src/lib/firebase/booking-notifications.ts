import type { BookingDocument } from '@/models/firestore/booking';
import type { NotificationEvent } from '@/models/firestore/notification';
import { assertValidCounter, BookingCounterIntegrityError } from './booking-capacity';

export function nextNotificationRevision(value: unknown) {
  const previous = assertValidCounter(value, 'Notification revision');
  if (previous >= Number.MAX_SAFE_INTEGER) throw new BookingCounterIntegrityError('Notification revision exhausted');
  return previous + 1;
}

// Ignore delivery bookkeeping/check-in metadata to avoid noisy duplicate alerts.
const changedFields = ['visitorName', 'phone', 'email', 'adults', 'children', 'bookingDate', 'bookingTime', 'status'] as const;
export function bookingChangeEvent(id: string, previous: BookingDocument | null, next: BookingDocument): NotificationEvent | null {
  if (previous && !changedFields.some(key => previous[key] !== next[key])) return null;
  const type = next.status === 'cancelled' ? 'booking_cancelled'
    : !previous || previous.status !== 'confirmed' && next.status === 'confirmed' ? 'booking_confirmed'
    : 'booking_changed';
  const titles = { booking_confirmed: 'Booking confirmed', booking_cancelled: 'Booking cancelled', booking_changed: 'Booking changed' };
  const bodies = {
    booking_confirmed: 'A booking was confirmed. Open the admin dashboard for details.',
    booking_cancelled: 'A booking was cancelled. Open the admin dashboard for details.',
    booking_changed: 'A booking was changed. Open the admin dashboard for details.',
  };
  return {
    eventKey: `booking:${id}:${next.notificationRevision}:${type}`, type, bookingId: id,
    bookingDate: next.bookingDate, title: titles[type],
    body: bodies[type], url: '/admin',
  };
}

export function capacityFullEvent(date: string, before: number, after: number, maximum: number, revision: number): NotificationEvent | null {
  if (before >= maximum || after < maximum || maximum <= 0) return null;
  return {
    eventKey: `capacity:${date}:full:${revision}`, type: 'capacity_full', bookingId: null,
    bookingDate: date, title: 'Allocated seats are full',
    body: 'A visit date has reached its allocated capacity. Open the admin dashboard for details.', url: '/admin',
  };
}
