import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  getAdminDb: vi.fn(),
  cancelBooking: vi.fn(),
}));

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: mocks.getAdminDb,
}));

vi.mock('@/lib/firebase/bookings', () => ({
  cancelFirestoreBooking: mocks.cancelBooking,
}));

import { cancelFirestoreBookingsForDates } from '@/lib/firebase/calendar-admin';

describe('calendar bulk cancellation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cancelBooking.mockResolvedValue({});
  });

  it('cancels every confirmed booking through the transactional repository path', async () => {
    const documents = [
      {
        id: 'booking-1',
        data: () => ({
          bookingNumber: 1001,
          visitorName: 'Ananya',
          email: 'ananya@example.com',
          bookingDate: '2026-08-20',
          adults: 2,
          children: 1,
          numberOfGuests: 3,
        }),
      },
      {
        id: 'booking-2',
        data: () => ({
          bookingNumber: 1002,
          visitorName: 'Arjun',
          email: null,
          bookingDate: '2026-08-21',
          adults: 1,
          children: 0,
          numberOfGuests: 1,
        }),
      },
    ];
    const query = {
      where: vi.fn(),
      get: vi.fn().mockResolvedValue({ docs: documents, size: documents.length }),
    };
    query.where.mockReturnValue(query);
    mocks.getAdminDb.mockReturnValue({
      collection: vi.fn(() => query),
    });

    const cancelled = await cancelFirestoreBookingsForDates(
      '2026-08-20',
      '2026-08-21',
      'admin-uid'
    );

    expect(mocks.cancelBooking).toHaveBeenNthCalledWith(1, 'booking-1', {
      actorUid: 'admin-uid',
      requireConfirmed: true,
    });
    expect(mocks.cancelBooking).toHaveBeenNthCalledWith(2, 'booking-2', {
      actorUid: 'admin-uid',
      requireConfirmed: true,
    });
    expect(cancelled).toEqual([
      expect.objectContaining({ id: 'booking-1', numberOfGuests: 3 }),
      expect.objectContaining({ id: 'booking-2', numberOfGuests: 1 }),
    ]);
  });
});
