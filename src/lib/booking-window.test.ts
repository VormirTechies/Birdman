import { describe, expect, it } from 'vitest';
import { isWithinPublicBookingWindow, publicBookingWindow } from './booking-window';

describe('45-day public booking window', () => {
  const now = new Date('2026-10-23T10:00:00Z');
  it('includes today and day 45, crossing month and year boundaries', () => {
    expect(publicBookingWindow(now)).toEqual({ today: '2026-10-23', maxDate: '2026-12-07' });
    for (const date of ['2026-10-23', '2026-11-23', '2026-12-07']) {
      expect(isWithinPublicBookingWindow(date, now)).toBe(true);
    }
    expect(publicBookingWindow(new Date('2026-12-20T10:00:00Z')).maxDate).toBe('2027-02-03');
  });
  it('rejects yesterday and day 46', () => {
    expect(isWithinPublicBookingWindow('2026-10-22', now)).toBe(false);
    expect(isWithinPublicBookingWindow('2026-12-08', now)).toBe(false);
  });
  it('rolls over at midnight in India rather than UTC', () => {
    expect(publicBookingWindow(new Date('2026-10-23T18:29:59Z')).today).toBe('2026-10-23');
    expect(publicBookingWindow(new Date('2026-10-23T18:30:00Z')).today).toBe('2026-10-24');
  });
});
