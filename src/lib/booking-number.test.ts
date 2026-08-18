import { describe, expect, it } from 'vitest';
import { formatBookingNumber, parsePublicBookingNumber } from '@/lib/booking-number';

describe('public booking references', () => {
  it('formats the numeric counter as a six-digit public code', () => {
    expect(formatBookingNumber(23)).toBe('#000023');
    expect(formatBookingNumber(100001)).toBe('#100001');
  });

  it('accepts formatted and unformatted booking codes for lookup', () => {
    expect(parsePublicBookingNumber('#000023')).toBe(23);
    expect(parsePublicBookingNumber('000023')).toBe(23);
    expect(parsePublicBookingNumber('23')).toBe(23);
  });

  it('rejects malformed booking codes', () => {
    expect(parsePublicBookingNumber('#ABC023')).toBeNull();
    expect(parsePublicBookingNumber('#000000')).toBeNull();
    expect(parsePublicBookingNumber('')).toBeNull();
  });
});
