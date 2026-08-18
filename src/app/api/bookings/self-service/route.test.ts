import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingCapacityExceededError } from '@/lib/firebase/booking-capacity';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  updateFirestoreBooking: vi.fn(),
  cancelFirestoreBooking: vi.fn(),
  sendRescheduleNotification: vi.fn(),
  sendBookingCancellation: vi.fn(),
}));

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: () => ({
    collection: () => {
      const query = {
        where: () => query,
        limit: () => query,
        get: mocks.get,
      };
      return query;
    },
  }),
}));
vi.mock('@/lib/firebase/bookings', () => ({
  updateFirestoreBooking: mocks.updateFirestoreBooking,
  cancelFirestoreBooking: mocks.cancelFirestoreBooking,
}));
vi.mock('@/lib/email', () => ({
  sendRescheduleNotification: mocks.sendRescheduleNotification,
  sendBookingCancellation: mocks.sendBookingCancellation,
}));

import { DELETE, PATCH, POST } from './route';

const storedBooking = {
  bookingNumber: 101,
  visitorId: null,
  visitorName: 'Ananya Rao',
  phone: '9876543210',
  email: 'visitor@example.com',
  adults: 2,
  children: 1,
  numberOfGuests: 3,
  bookingDate: '2099-08-20',
  bookingTime: '16:30:00',
  confirmationSent: true,
  reminderSent: false,
  reminderSentAt: null,
  status: 'confirmed',
  visited: false,
  createdAt: new Date('2099-08-01T00:00:00.000Z'),
  updatedAt: new Date('2099-08-01T00:00:00.000Z'),
};

const repositoryBooking = {
  id: 'booking-1',
  ...storedBooking,
  bookingDate: '2099-08-21',
  adults: 3,
  children: 1,
  numberOfGuests: 4,
  source: 'public',
  reminderSentAt: null,
  createdAt: '2099-08-01T00:00:00.000Z',
  updatedAt: '2099-08-02T00:00:00.000Z',
  createdBy: null,
  updatedBy: null,
  cancelledAt: null,
  cancelledBy: null,
};

function request(method: string, body: unknown) {
  return new Request('http://localhost/api/bookings/self-service', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function verifiedLookup() {
  mocks.get.mockResolvedValue({
    docs: [{ id: 'booking-1', data: () => storedBooking }],
  });
}

describe('/api/bookings/self-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifiedLookup();
    mocks.updateFirestoreBooking.mockResolvedValue(repositoryBooking);
    mocks.cancelFirestoreBooking.mockResolvedValue({
      ...repositoryBooking,
      status: 'cancelled',
    });
    mocks.sendRescheduleNotification.mockResolvedValue({ success: true });
    mocks.sendBookingCancellation.mockResolvedValue({ success: true });
  });

  it('returns a masked booking only after contact verification', async () => {
    const response = await POST(request('POST', {
      bookingCode: '#000101',
      contact: 'visitor@example.com',
    }) as never);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      booking: {
        bookingCode: '#000101',
        phone: '******3210',
        email: 'vi***@example.com',
      },
    });
  });

  it('does not reveal a booking for an incorrect contact value', async () => {
    const response = await POST(request('POST', {
      bookingCode: '#000101',
      contact: 'wrong@example.com',
    }) as never);

    expect(response.status).toBe(404);
    expect(mocks.updateFirestoreBooking).not.toHaveBeenCalled();
  });

  it('reschedules and changes guests through the atomic repository', async () => {
    const response = await PATCH(request('PATCH', {
      bookingCode: '#000101',
      contact: '9876543210',
      bookingDate: '2099-08-21',
      adults: 3,
      children: 1,
    }) as never);

    expect(response.status).toBe(200);
    expect(mocks.updateFirestoreBooking).toHaveBeenCalledWith(
      'booking-1',
      { bookingDate: '2099-08-21', adults: 3, children: 1 },
      {
        enforceCutoff: true,
        requireConfirmed: true,
        requireEditableVisit: true,
      }
    );
    expect(mocks.sendRescheduleNotification).toHaveBeenCalledOnce();
  });

  it('returns the maximum same-day party size after a capacity conflict', async () => {
    mocks.updateFirestoreBooking.mockRejectedValue(
      new BookingCapacityExceededError(7, 3, 100)
    );

    const response = await PATCH(request('PATCH', {
      bookingCode: '#000101',
      contact: '9876543210',
      bookingDate: '2099-08-20',
      adults: 10,
      children: 0,
    }) as never);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'BOOKING_CAPACITY_EXCEEDED',
      available: 6,
      requested: 10,
    });
    expect(mocks.sendRescheduleNotification).not.toHaveBeenCalled();
  });

  it('cancels through the transaction repository before sending email', async () => {
    const response = await DELETE(request('DELETE', {
      bookingCode: '#000101',
      contact: '9876543210',
    }) as never);

    expect(response.status).toBe(200);
    expect(mocks.cancelFirestoreBooking).toHaveBeenCalledWith('booking-1', {
      requireConfirmed: true,
      requireNonPastVisit: true,
    });
    expect(mocks.sendBookingCancellation).toHaveBeenCalledOnce();
  });
});
