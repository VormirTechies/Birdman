import { describe, expect, it } from 'vitest';
import { calculateBookingReconciliation } from './booking-reconciliation';

describe('booking counter reconciliation', () => {
  it('sums only confirmed guests and repairs stale day counters', () => {
    const result = calculateBookingReconciliation(
      [
        { id: 'one', data: { bookingNumber: 7, status: 'confirmed', bookingDate: '2026-08-20', adults: 2, children: 1 } },
        { id: 'two', data: { bookingNumber: 8, status: 'confirmed', bookingDate: '2026-08-20', numberOfGuests: 4, adults: 2, children: 2 } },
        { id: 'three', data: { bookingNumber: 9, status: 'cancelled', bookingDate: '2026-08-20', numberOfGuests: 10, adults: 10, children: 0 } },
      ],
      new Map([['2026-08-20', 3], ['2026-08-21', 5]]),
      6
    );

    expect(result.differences).toEqual([
      { date: '2026-08-20', before: 3, after: 7 },
      { date: '2026-08-21', before: 5, after: 0 },
    ]);
    expect(result.desiredCounter).toBe(9);
    expect(result.bookingCodeDifferences).toEqual([
      { id: 'one', before: null, after: '#000007' },
      { id: 'two', before: null, after: '#000008' },
      { id: 'three', before: null, after: '#000009' },
    ]);
  });

  it('repairs a malformed booking code without changing a correct code', () => {
    const result = calculateBookingReconciliation(
      [
        { id: 'correct', data: { bookingNumber: 23, bookingCode: '#000023', status: 'cancelled' } },
        { id: 'wrong', data: { bookingNumber: 24, bookingCode: '#24', status: 'cancelled' } },
      ],
      new Map(),
      24
    );

    expect(result.bookingCodeDifferences).toEqual([
      { id: 'wrong', before: '#24', after: '#000024' },
    ]);
  });

  it('never lowers a booking-number counter after deletions', () => {
    const result = calculateBookingReconciliation([], new Map(), 42);
    expect(result.desiredCounter).toBe(42);
  });

  it('rejects malformed guest counters instead of silently repairing them', () => {
    expect(() => calculateBookingReconciliation(
      [{ id: 'bad', data: { bookingNumber: 1, status: 'confirmed', bookingDate: '2026-08-20', numberOfGuests: -1 } }],
      new Map(),
      0
    )).toThrow('non-negative integer');
  });
});
