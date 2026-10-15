// @vitest-environment node
import { expect, it } from 'vitest';
import type { BookingDocument } from '@/models/firestore/booking';
import { bookingChangeEvent, capacityFullEvent, nextNotificationRevision } from './booking-notifications';
const booking = {
  visitorName: 'Private Visitor', email: 'private@example.com', phone: '9876543210',
  adults: 1, children: 0, bookingDate: '2099-11-01', bookingTime: '16:30:00',
  status: 'confirmed', notificationRevision: 1,
} as BookingDocument;
it('builds stable confirmed/cancelled/changed event IDs without contact data', () => {
  const event = bookingChangeEvent('doc-123', null, booking)!;
  expect(event.type).toBe('booking_confirmed');
  expect(event.eventKey).toBe('booking:doc-123:1:booking_confirmed');
  expect(JSON.stringify(event)).not.toMatch(/Private Visitor|private@example.com|9876543210/);
  expect(bookingChangeEvent('doc-123', booking, { ...booking, adults: 2, notificationRevision: 2 })?.type).toBe('booking_changed');
  expect(bookingChangeEvent('doc-123', booking, { ...booking, status: 'cancelled', notificationRevision: 2 })?.type).toBe('booking_cancelled');
  expect(bookingChangeEvent('doc-123', { ...booking, status: 'cancelled' }, { ...booking, notificationRevision: 3 })?.type).toBe('booking_confirmed');
});
it('does not alert on no-op, delivery bookkeeping or check-in-only changes', () => {
  expect(bookingChangeEvent('doc-123', booking, { ...booking })).toBeNull();
  expect(bookingChangeEvent('doc-123', booking, { ...booking, visited: true, confirmationSent: true, reminderSent: true })).toBeNull();
  expect(bookingChangeEvent('doc-123', { ...booking, status: 'cancelled' }, { ...booking, status: 'cancelled' })).toBeNull();
});
it('alerts only on a positive capacity transition and allows distinct refill events', () => {
  expect(capacityFullEvent('2099-11-01', 9, 10, 10, 1)?.eventKey).toBe('capacity:2099-11-01:full:1');
  expect(capacityFullEvent('2099-11-01', 9, 10, 10, 2)?.eventKey).toBe('capacity:2099-11-01:full:2');
  expect(capacityFullEvent('2099-11-01', 10, 10, 10, 2)).toBeNull();
  expect(capacityFullEvent('2099-11-01', 8, 9, 10, 2)).toBeNull();
  expect(capacityFullEvent('2099-11-01', 0, 0, 0, 1)).toBeNull();
});
it('starts migrated records at revision one and rejects invalid revisions', () => {
  expect(nextNotificationRevision(undefined)).toBe(1);
  for (const value of [-1, NaN, 1.5, Number.MAX_SAFE_INTEGER]) {
    expect(() => nextNotificationRevision(value)).toThrow();
  }
});
