import { describe, expect, it } from 'vitest';
import { availablePartySizeForSelfService } from './booking-self-service';

describe('self-service booking availability', () => {
  it('adds the current reservation back for same-day guest edits', () => {
    expect(availablePartySizeForSelfService({
      calendarRemaining: 3,
      currentBookingDate: '2026-08-20',
      draftDate: '2026-08-20',
      currentGuests: 5,
      status: 'confirmed',
    })).toBe(8);
  });

  it('uses only remaining capacity when rescheduling to another date', () => {
    expect(availablePartySizeForSelfService({
      calendarRemaining: 3,
      currentBookingDate: '2026-08-20',
      draftDate: '2026-08-21',
      currentGuests: 5,
      status: 'confirmed',
    })).toBe(3);
  });
});
