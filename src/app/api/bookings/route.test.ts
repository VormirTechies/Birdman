import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingCapacityExceededError } from '@/lib/firebase/booking-capacity';

const mocks = vi.hoisted(() => ({
  createFirestoreBooking: vi.fn(),
  updateBooking: vi.fn(),
  sendPushToAllAdmins: vi.fn(),
  sendBookingConfirmation: vi.fn(),
}));

vi.mock('@/lib/firebase/bookings', () => ({
  createFirestoreBooking: mocks.createFirestoreBooking,
}));
vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: () => ({
    collection: () => ({ doc: () => ({ update: mocks.updateBooking }) }),
  }),
}));
vi.mock('@/lib/push', () => ({
  sendPushToAllAdmins: mocks.sendPushToAllAdmins,
}));
vi.mock('@/lib/email', () => ({
  sendBookingConfirmation: mocks.sendBookingConfirmation,
}));

import { POST } from './route';

const validRequest = {
  visitorName: 'Ananya Rao',
  phone: '9876543210',
  email: '',
  adults: 2,
  children: 1,
  numberOfGuests: 3,
  bookingDate: '2099-08-20',
  bookingTime: '16:30:00',
};

const createdBooking = {
  id: 'booking-1',
  bookingNumber: 101,
  bookingCode: '#000101',
  visitorId: null,
  visitorName: 'Ananya Rao',
  phone: '9876543210',
  email: null,
  adults: 2,
  children: 1,
  numberOfGuests: 3,
  bookingDate: '2099-08-20',
  bookingTime: '16:30:00',
  status: 'confirmed',
  visited: false,
  source: 'public',
  confirmationSent: false,
  reminderSent: false,
  reminderSentAt: null,
  createdAt: '2099-08-01T00:00:00.000Z',
  updatedAt: '2099-08-01T00:00:00.000Z',
  createdBy: null,
  updatedBy: null,
  cancelledAt: null,
  cancelledBy: null,
};

function request(body: unknown) {
  return new Request('http://localhost/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/bookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createFirestoreBooking.mockResolvedValue(createdBooking);
    mocks.sendPushToAllAdmins.mockResolvedValue(undefined);
  });

  it('creates through the atomic repository and returns a safe public DTO', async () => {
    const response = await POST(request(validRequest) as never);

    expect(response.status).toBe(201);
    expect(mocks.createFirestoreBooking).toHaveBeenCalledWith(
      {
        visitorName: 'Ananya Rao',
        phone: '9876543210',
        email: undefined,
        adults: 2,
        children: 1,
        bookingDate: '2099-08-20',
        bookingTime: '16:30:00',
      },
      expect.objectContaining({ source: 'public', enforceCutoff: true })
    );
    const body = await response.json();
    expect(body.booking).toMatchObject({
      id: 'booking-1',
      bookingNumber: 101,
      bookingCode: '#000101',
      numberOfGuests: 3,
    });
    expect(body.booking).not.toHaveProperty('phone');
    expect(body.booking).not.toHaveProperty('email');
  });

  it('does not trust a forged legacy numberOfGuests field', async () => {
    await POST(request({
      ...validRequest,
      adults: 10,
      children: 0,
      numberOfGuests: 3,
    }) as never);

    expect(mocks.createFirestoreBooking).toHaveBeenCalledWith(
      expect.objectContaining({ adults: 10, children: 0 }),
      expect.any(Object)
    );
    expect(mocks.createFirestoreBooking.mock.calls[0][0]).not.toHaveProperty(
      'numberOfGuests'
    );
  });

  it('returns the remaining seats when the transaction rejects overbooking', async () => {
    mocks.createFirestoreBooking.mockRejectedValue(
      new BookingCapacityExceededError(10, 3, 100)
    );

    const response = await POST(request({
      ...validRequest,
      adults: 10,
      children: 0,
    }) as never);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      success: false,
      code: 'BOOKING_CAPACITY_EXCEEDED',
      error: 'Only 3 seats are available for this date.',
      available: 3,
      requested: 10,
      maxCapacity: 100,
    });
    expect(mocks.sendPushToAllAdmins).not.toHaveBeenCalled();
    expect(mocks.sendBookingConfirmation).not.toHaveBeenCalled();
  });

  it('rejects client-controlled booking status', async () => {
    const response = await POST(request({
      ...validRequest,
      status: 'completed',
    }) as never);

    expect(response.status).toBe(400);
    expect(mocks.createFirestoreBooking).not.toHaveBeenCalled();
  });
});
