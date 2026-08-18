import { describe, expect, it } from 'vitest';
import {
  BookingCapacityExceededError,
  BookingCounterIntegrityError,
  applyCapacityDelta,
  bookingStartInstant,
  capacityChangesForTransition,
  capacityContribution,
  hasBookingCutoffPassed,
  indiaCalendarDate,
  isPastBookingDate,
} from './booking-capacity';

describe('booking capacity invariants', () => {
  it('counts only confirmed bookings', () => {
    expect(capacityContribution('confirmed', 4)).toBe(4);
    expect(capacityContribution('cancelled', 4)).toBe(0);
    expect(capacityContribution('completed', 4)).toBe(0);
  });

  it('applies positive and negative capacity changes', () => {
    expect(applyCapacityDelta(7, 3, 12)).toBe(10);
    expect(applyCapacityDelta(7, -2, 12)).toBe(5);
  });

  it('releases and restores capacity when status changes', () => {
    const confirmed = {
      bookingDate: '2026-08-20',
      status: 'confirmed' as const,
      numberOfGuests: 4,
    };
    const cancelled = { ...confirmed, status: 'cancelled' as const };

    expect(capacityChangesForTransition(confirmed, cancelled)).toEqual([
      { bookingDate: '2026-08-20', delta: -4 },
    ]);
    expect(capacityChangesForTransition(cancelled, confirmed)).toEqual([
      { bookingDate: '2026-08-20', delta: 4 },
    ]);
  });

  it('moves confirmed capacity between dates during a reschedule', () => {
    expect(capacityChangesForTransition(
      { bookingDate: '2026-08-20', status: 'confirmed', numberOfGuests: 3 },
      { bookingDate: '2026-08-22', status: 'confirmed', numberOfGuests: 5 }
    )).toEqual([
      { bookingDate: '2026-08-20', delta: -3 },
      { bookingDate: '2026-08-22', delta: 5 },
    ]);
  });

  it('uses only the guest difference for a same-day edit', () => {
    expect(capacityChangesForTransition(
      { bookingDate: '2026-08-20', status: 'confirmed', numberOfGuests: 3 },
      { bookingDate: '2026-08-20', status: 'confirmed', numberOfGuests: 5 }
    )).toEqual([{ bookingDate: '2026-08-20', delta: 2 }]);
  });

  it('rejects capacity overflow with useful availability details', () => {
    expect(() => applyCapacityDelta(8, 4, 10)).toThrow(BookingCapacityExceededError);
    try {
      applyCapacityDelta(8, 4, 10);
    } catch (error) {
      expect(error).toMatchObject({
        requestedGuests: 4,
        availableGuests: 2,
        maxCapacity: 10,
      });
    }
  });

  it('rejects ten guests when only three of one hundred spaces remain', () => {
    try {
      applyCapacityDelta(97, 10, 100);
      throw new Error('Expected capacity enforcement to reject the booking');
    } catch (error) {
      expect(error).toBeInstanceOf(BookingCapacityExceededError);
      expect(error).toMatchObject({
        requestedGuests: 10,
        availableGuests: 3,
        maxCapacity: 100,
      });
    }
  });

  it('rejects counter underflow and malformed counters', () => {
    expect(() => applyCapacityDelta(2, -3, 10)).toThrow(BookingCounterIntegrityError);
    expect(() => applyCapacityDelta('broken', 1, 10)).toThrow(BookingCounterIntegrityError);
  });

  it('computes cutoff time in India Standard Time', () => {
    expect(bookingStartInstant('2026-08-20', '16:30:00').toISOString()).toBe(
      '2026-08-20T11:00:00.000Z'
    );
    expect(hasBookingCutoffPassed(
      '2026-08-20',
      '16:30:00',
      new Date('2026-08-20T09:59:59.999Z')
    )).toBe(false);
    expect(hasBookingCutoffPassed(
      '2026-08-20',
      '16:30:00',
      new Date('2026-08-20T10:00:00.000Z')
    )).toBe(true);
  });

  it('evaluates past visit dates using the India calendar day', () => {
    const justAfterMidnightInIndia = new Date('2026-08-19T18:31:00.000Z');
    expect(indiaCalendarDate(justAfterMidnightInIndia)).toBe('2026-08-20');
    expect(isPastBookingDate('2026-08-19', justAfterMidnightInIndia)).toBe(true);
    expect(isPastBookingDate('2026-08-20', justAfterMidnightInIndia)).toBe(false);
  });
});
