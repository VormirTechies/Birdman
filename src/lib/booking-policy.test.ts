import { expect, it } from 'vitest';
import { assertContactDateLimit, BookingContactLimitError, matchesBookingContact } from './booking-policy';
const party = (numberOfGuests: number, extra = {}) => ({ phone: '9876543210', email: 'visitor@example.com', status: 'confirmed', numberOfGuests, ...extra });
it('accepts exactly 25 and rejects 26 guests including children', () => {
  expect(() => assertContactDateLimit([party(10), party(10)], party(5))).not.toThrow();
  expect(() => assertContactDateLimit([party(10), party(10)], party(6))).toThrow(BookingContactLimitError);
});
it('counts same phone or email once, ignoring unrelated and cancelled bookings', () => {
  const others = [party(10, { email: 'other@example.com' }), party(10, { phone: '8765432109' }), party(10, { status: 'cancelled' }), party(10, { phone: '7654321098', email: 'else@example.com' })];
  expect(() => assertContactDateLimit(others, party(6))).toThrow();
  expect(() => assertContactDateLimit([party(10)], party(10))).not.toThrow();
});
it('counts completed visits and supports India country-code formatting', () => {
  expect(() => assertContactDateLimit([party(20, { phone: '+91 98765 43210', status: 'completed' })], party(6, { email: '' }))).toThrow();
});
it('allows cancellation and reductions for a legacy group already above 25', () => {
  expect(() => assertContactDateLimit([party(25)], party(8), party(10))).not.toThrow();
  expect(() => assertContactDateLimit([party(25)], party(10), party(8))).toThrow();
  expect(() => assertContactDateLimit([party(25)], party(10, { status: 'cancelled' }))).not.toThrow();
});
it('requires original contact details, preserving foreign country codes', () => {
  expect(matchesBookingContact(party(1), '+91 98765 43210')).toBe(true);
  expect(matchesBookingContact(party(1), ' VISITOR@EXAMPLE.COM ')).toBe(true);
  expect(matchesBookingContact(party(1), '+1 9876543210')).toBe(false);
  expect(matchesBookingContact(party(1), 'wrong@example.com')).toBe(false);
  expect(matchesBookingContact(party(1), '3210')).toBe(false);
});
