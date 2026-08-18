import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  getAdminDb: vi.fn(),
  getCalendarSetting: vi.fn(),
  getCalendarSettings: vi.fn(),
}));

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: mocks.getAdminDb,
}));

vi.mock('@/lib/firebase/calendar-settings', () => ({
  DEFAULT_CALENDAR_CAPACITY: 100,
  DEFAULT_CALENDAR_START_TIME: '10:00',
  getFirestoreCalendarSetting: mocks.getCalendarSetting,
  getFirestoreCalendarSettings: mocks.getCalendarSettings,
}));

import {
  getFirestoreDayDetails,
  getFirestoreMonthlyBookingStats,
} from '@/lib/firebase/calendar';

function queryWithDocuments(
  documents: Array<{ id: string; data: () => Record<string, unknown> }>
) {
  const query = {
    where: vi.fn(),
    get: vi.fn().mockResolvedValue({ docs: documents, size: documents.length }),
  };
  query.where.mockReturnValue(query);
  return query;
}

describe('Firestore calendar capacity reads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('builds monthly totals from bookingDays confirmed guest counters', async () => {
    const bookingDays = queryWithDocuments([
      {
        id: '2026-08-20',
        data: () => ({ confirmedGuests: 97 }),
      },
    ]);
    const collection = vi.fn((name: string) => {
      expect(name).toBe('bookingDays');
      return bookingDays;
    });
    mocks.getAdminDb.mockReturnValue({ collection });
    mocks.getCalendarSettings.mockResolvedValue([
      {
        date: '2026-08-20',
        isOpen: true,
        maxCapacity: 100,
        startTime: '10:00',
      },
    ]);

    const days = await getFirestoreMonthlyBookingStats(2026, 8);
    const august20 = days.find((day) => day.date === '2026-08-20');

    expect(august20).toMatchObject({
      bookingCount: 97,
      maxCapacity: 100,
      percentage: 97,
    });
    expect(collection).not.toHaveBeenCalledWith('bookings');
  });

  it('uses the authoritative day counter while returning confirmed bookings', async () => {
    const bookings = queryWithDocuments([
      {
        id: 'booking-1',
        data: () => ({
          visitorName: 'Vicky',
          bookingDate: '2026-08-20',
          bookingTime: '10:30',
          adults: 2,
          children: 1,
          numberOfGuests: 3,
          status: 'confirmed',
        }),
      },
    ]);
    const dayCounterGet = vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({ confirmedGuests: 7 }),
    });
    const collection = vi.fn((name: string) => {
      if (name === 'bookings') return bookings;
      if (name === 'bookingDays') {
        return { doc: vi.fn(() => ({ get: dayCounterGet })) };
      }
      throw new Error(`Unexpected collection: ${name}`);
    });
    mocks.getAdminDb.mockReturnValue({ collection });
    mocks.getCalendarSetting.mockResolvedValue({
      date: '2026-08-20',
      isOpen: true,
      maxCapacity: 10,
      startTime: '10:00',
    });

    const details = await getFirestoreDayDetails('2026-08-20');

    expect(details.bookings).toHaveLength(1);
    expect(details.stats).toEqual({
      totalBooked: 7,
      available: 3,
      percentage: 70,
    });
  });

  it('falls back to confirmed booking totals when a legacy day counter is absent', async () => {
    const bookings = queryWithDocuments([
      {
        id: 'booking-1',
        data: () => ({
          visitorName: 'Vicky',
          bookingDate: '2026-08-20',
          bookingTime: '10:30',
          adults: 2,
          children: 1,
          status: 'confirmed',
        }),
      },
    ]);
    const collection = vi.fn((name: string) => {
      if (name === 'bookings') return bookings;
      if (name === 'bookingDays') {
        return {
          doc: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({ exists: false, data: () => undefined }),
          })),
        };
      }
      throw new Error(`Unexpected collection: ${name}`);
    });
    mocks.getAdminDb.mockReturnValue({ collection });
    mocks.getCalendarSetting.mockResolvedValue({
      date: '2026-08-20',
      isOpen: true,
      maxCapacity: 100,
      startTime: '10:00',
    });

    const details = await getFirestoreDayDetails('2026-08-20');

    expect(details.stats.totalBooked).toBe(3);
    expect(details.stats.available).toBe(97);
  });
});
