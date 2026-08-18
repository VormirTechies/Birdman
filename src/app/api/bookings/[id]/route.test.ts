import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getBooking: vi.fn(),
  updateFirestoreBooking: vi.fn(),
  deleteFirestoreBooking: vi.fn(),
  sendRescheduleNotification: vi.fn(),
}));

vi.mock('@/lib/require-admin', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: () => ({
    collection: () => ({ doc: () => ({ get: mocks.getBooking }) }),
  }),
}));
vi.mock('@/lib/firebase/bookings', () => ({
  updateFirestoreBooking: mocks.updateFirestoreBooking,
  deleteFirestoreBooking: mocks.deleteFirestoreBooking,
}));
vi.mock('@/lib/email', () => ({
  sendRescheduleNotification: mocks.sendRescheduleNotification,
}));

import { DELETE, PATCH } from './route';

const stored = {
  bookingNumber: 101,
  visitorId: null,
  visitorName: 'Admin Guest',
  phone: '9876543210',
  email: null,
  adults: 2,
  children: 1,
  numberOfGuests: 3,
  bookingDate: '2099-08-20',
  bookingTime: '16:30:00',
  confirmationSent: false,
  reminderSent: false,
  reminderSentAt: null,
  status: 'confirmed',
  visited: false,
  createdAt: new Date('2099-08-01T00:00:00.000Z'),
  updatedAt: new Date('2099-08-01T00:00:00.000Z'),
};

const updated = {
  id: 'booking-1',
  ...stored,
  visited: true,
  source: 'admin',
  reminderSentAt: null,
  createdAt: '2099-08-01T00:00:00.000Z',
  updatedAt: '2099-08-02T00:00:00.000Z',
  createdBy: 'admin-1',
  updatedBy: 'admin-1',
  cancelledAt: null,
  cancelledBy: null,
};

const context = { params: Promise.resolve({ id: 'booking-1' }) };

describe('/api/bookings/[id] administrator compatibility route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      user: { uid: 'admin-1' },
      admin: { role: 'admin' },
      response: null,
    });
    mocks.getBooking.mockResolvedValue({
      id: 'booking-1',
      exists: true,
      data: () => stored,
    });
    mocks.updateFirestoreBooking.mockResolvedValue(updated);
    mocks.deleteFirestoreBooking.mockResolvedValue({ id: 'booking-1' });
  });

  it('updates checklist status through the atomic repository', async () => {
    const response = await PATCH(
      new Request('http://localhost/api/bookings/booking-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visited: true }),
      }) as never,
      context
    );

    expect(response.status).toBe(200);
    expect(mocks.updateFirestoreBooking).toHaveBeenCalledWith(
      'booking-1',
      { visited: true },
      {
        actorUid: 'admin-1',
        enforceCutoff: false,
        requireNonPastTarget: false,
      }
    );
  });

  it('deletes through the capacity-safe repository', async () => {
    const response = await DELETE(
      new Request('http://localhost/api/bookings/booking-1', { method: 'DELETE' }) as never,
      context
    );
    expect(response.status).toBe(200);
    expect(mocks.deleteFirestoreBooking).toHaveBeenCalledWith('booking-1', {
      actorUid: 'admin-1',
    });
  });
});
