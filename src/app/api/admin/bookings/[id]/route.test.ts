import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BookingCapacityExceededError, BookingNotFoundError } from '@/lib/firebase/booking-capacity';

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  updateFirestoreBooking: vi.fn(),
  deleteFirestoreBooking: vi.fn(),
}));

vi.mock('@/lib/require-admin', () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock('@/lib/firebase/bookings', () => ({
  updateFirestoreBooking: mocks.updateFirestoreBooking,
  deleteFirestoreBooking: mocks.deleteFirestoreBooking,
}));

import { DELETE, PATCH } from './route';

const updatedBooking = {
  id: 'booking-1',
  visitorId: null,
  isVip: true,
  vipNotes: 'Frequent visitor',
};

function request(method: string, body?: unknown) {
  return new Request('http://localhost/api/admin/bookings/booking-1', {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

const context = { params: Promise.resolve({ id: 'booking-1' }) };

describe('/api/admin/bookings/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      user: { uid: 'admin-1' },
      admin: { role: 'admin' },
      response: null,
    });
    mocks.updateFirestoreBooking.mockResolvedValue(updatedBooking);
    mocks.deleteFirestoreBooking.mockResolvedValue({ id: 'booking-1' });
  });

  it('updates VIP metadata through the repository', async () => {
    const response = await PATCH(
      request('PATCH', { isVip: true, vipNotes: 'Frequent visitor' }) as never,
      context
    );

    expect(response.status).toBe(200);
    expect(mocks.updateFirestoreBooking).toHaveBeenCalledWith(
      'booking-1',
      { isVip: true, vipNotes: 'Frequent visitor' },
      {
        actorUid: 'admin-1',
        enforceCutoff: false,
        requireNonPastTarget: false,
      }
    );
  });

  it('returns capacity conflicts from transactional edits', async () => {
    mocks.updateFirestoreBooking.mockRejectedValue(
      new BookingCapacityExceededError(5, 2, 100)
    );
    const response = await PATCH(
      request('PATCH', { adults: 5, children: 0 }) as never,
      context
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ available: 2 });
  });

  it('deletes through the capacity-safe repository', async () => {
    const response = await DELETE(request('DELETE') as never, context);
    expect(response.status).toBe(200);
    expect(mocks.deleteFirestoreBooking).toHaveBeenCalledWith('booking-1', {
      actorUid: 'admin-1',
    });
  });

  it('returns 404 for a missing booking', async () => {
    mocks.deleteFirestoreBooking.mockRejectedValue(new BookingNotFoundError('missing'));
    const response = await DELETE(
      request('DELETE') as never,
      { params: Promise.resolve({ id: 'missing' }) }
    );
    expect(response.status).toBe(404);
  });
});
