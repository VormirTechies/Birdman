import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingCapacityExceededError } from '@/lib/firebase/booking-capacity';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  createFirestoreBooking: vi.fn(),
  updateBooking: vi.fn(),
  sendPushToAllAdmins: vi.fn(),
  sendBookingConfirmation: vi.fn(),
  listGet: vi.fn(),
  countGet: vi.fn(),
}));

vi.mock('@/lib/require-admin', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('@/lib/firebase/bookings', () => ({
  createFirestoreBooking: mocks.createFirestoreBooking,
}));
vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: () => {
    const query = {
      where: () => query,
      orderBy: () => query,
      offset: () => query,
      limit: () => query,
      get: mocks.listGet,
      count: () => ({ get: mocks.countGet }),
      doc: () => ({ update: mocks.updateBooking }),
    };
    return { collection: () => query };
  },
}));
vi.mock('@/lib/push', () => ({ sendPushToAllAdmins: mocks.sendPushToAllAdmins }));
vi.mock('@/lib/email', () => ({ sendBookingConfirmation: mocks.sendBookingConfirmation }));

import { GET, POST } from './route';

const requestBody = {
  visitorName: 'Admin Guest',
  phone: '9876543210',
  email: '',
  adults: 2,
  children: 1,
  bookingDate: '2099-08-20',
  bookingTime: '16:30:00',
};

const createdBooking = {
  id: 'booking-1',
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
  status: 'confirmed',
  visited: false,
  source: 'admin',
  confirmationSent: false,
  reminderSent: false,
  reminderSentAt: null,
  createdAt: '2099-08-01T00:00:00.000Z',
  updatedAt: '2099-08-01T00:00:00.000Z',
  createdBy: 'admin-1',
  updatedBy: 'admin-1',
  cancelledAt: null,
  cancelledBy: null,
};

function request(body: unknown) {
  return new Request('http://localhost/api/admin/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      user: { uid: 'admin-1' },
      admin: { role: 'admin' },
      response: null,
    });
    mocks.createFirestoreBooking.mockResolvedValue(createdBooking);
    mocks.sendPushToAllAdmins.mockResolvedValue(undefined);
    mocks.countGet.mockResolvedValue({ data: () => ({ count: 1 }) });
    mocks.listGet.mockResolvedValue({
      size: 1,
      docs: [{
        id: 'booking-1',
        data: () => ({
          bookingNumber: 101,
          visitorName: 'Admin Guest',
          phone: '9876543210',
          email: null,
          adults: 2,
          children: 1,
          numberOfGuests: 3,
          bookingDate: '2099-08-20',
          bookingTime: '16:30:00',
          status: 'confirmed',
          visited: false,
          createdAt: new Date('2099-08-01T00:00:00.000Z'),
        }),
      }],
    });
  });

  it('creates an admin booking atomically with administrator metadata', async () => {
    const response = await POST(request(requestBody) as never);

    expect(response.status).toBe(201);
    expect(mocks.createFirestoreBooking).toHaveBeenCalledWith(
      expect.objectContaining({ adults: 2, children: 1 }),
      expect.objectContaining({
        source: 'admin',
        actorUid: 'admin-1',
        enforceCutoff: false,
        requireNonPastVisit: true,
      })
    );
  });

  it('returns authorization failures without creating a booking', async () => {
    mocks.requireAdmin.mockResolvedValue({
      user: null,
      response: Response.json({ error: 'Forbidden' }, { status: 403 }),
    });

    const response = await POST(request(requestBody) as never);
    expect(response.status).toBe(403);
    expect(mocks.createFirestoreBooking).not.toHaveBeenCalled();
  });

  it('returns exact remaining capacity without running side effects', async () => {
    mocks.createFirestoreBooking.mockRejectedValue(
      new BookingCapacityExceededError(5, 2, 100)
    );

    const response = await POST(request(requestBody) as never);
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'BOOKING_CAPACITY_EXCEEDED',
      available: 2,
    });
    expect(mocks.sendPushToAllAdmins).not.toHaveBeenCalled();
  });

  it('rejects server-owned status fields', async () => {
    const response = await POST(request({ ...requestBody, status: 'completed' }) as never);
    expect(response.status).toBe(400);
    expect(mocks.createFirestoreBooking).not.toHaveBeenCalled();
  });

  it('preserves the authenticated paginated admin list contract', async () => {
    const response = await GET(
      new Request('http://localhost/api/admin/bookings?date=2099-08-20&page=1&limit=10') as never
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      total: 1,
      bookings: [{
        id: 'booking-1',
        visitorName: 'Admin Guest',
        visitor_name: 'Admin Guest',
        numberOfGuests: 3,
        number_of_guests: 3,
      }],
    });
  });
});
