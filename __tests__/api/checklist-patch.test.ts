// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { BookingNotFoundError } from '@/lib/firebase/booking-capacity';
import { makeAdminBooking } from '../fixtures/booking';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), collection: vi.fn(), doc: vi.fn(), get: vi.fn(),
  update: vi.fn<typeof import('@/lib/firebase/bookings').updateFirestoreBooking>(), email: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/require-admin', () => ({ requireAdmin: mocks.auth }));
vi.mock('@/lib/firebase/admin', () => ({ getAdminDb: () => ({ collection: mocks.collection }) }));
vi.mock('@/lib/firebase/bookings', () => ({ updateFirestoreBooking: mocks.update, deleteFirestoreBooking: vi.fn() }));
vi.mock('@/lib/email', () => ({ sendRescheduleNotification: mocks.email }));
import { PATCH } from '@/app/api/bookings/[id]/route';
function patch(body: unknown, id = 'booking-1') {
  return PATCH(new NextRequest(`http://localhost/api/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(body) }), { params: Promise.resolve({ id }) });
}
beforeEach(() => {
  vi.resetAllMocks(); mocks.auth.mockResolvedValue({ user: { uid: 'admin-1' } });
  mocks.collection.mockReturnValue({ doc: mocks.doc }); mocks.doc.mockReturnValue({ get: mocks.get });
  mocks.get.mockResolvedValue({ exists: true, data: () => makeAdminBooking() });
  mocks.update.mockResolvedValue(makeAdminBooking({ visited: true })); mocks.email.mockResolvedValue({ success: true });
});
describe('PATCH /api/bookings/[id] — Firestore checklist', () => {
  it.each([true, false])('sets visited=%s through the atomic repository', async visited => {
    mocks.update.mockResolvedValue(makeAdminBooking({ visited }));
    const response = await patch({ visited }); expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, booking: { visited, adults: 2, children: 0 }, emailSent: false });
    expect(mocks.doc).toHaveBeenCalledWith('booking-1');
    expect(mocks.update).toHaveBeenCalledExactlyOnceWith('booking-1', { visited }, { actorUid: 'admin-1', enforceCutoff: false, requireNonPastTarget: false });
    expect(mocks.email).not.toHaveBeenCalled();
  });
  it('accepts Firestore-generated IDs rather than requiring legacy UUIDs', async () => {
    expect((await patch({ visited: true }, 'RLk1RoAWI5ORc8GT4WX8')).status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith('RLk1RoAWI5ORc8GT4WX8', { visited: true }, expect.anything());
  });
  it.each([{}, { visited: 'true' }, { visited: true, unexpected: 1 }])('rejects invalid mutations %j', async body => {
    expect((await patch(body)).status).toBe(400); expect(mocks.update).not.toHaveBeenCalled();
  });
  it('returns 404 without updating a missing snapshot', async () => {
    mocks.get.mockResolvedValue({ exists: false, data: () => undefined });
    const response = await patch({ visited: true }); expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ success: false, error: 'Booking not found' }); expect(mocks.update).not.toHaveBeenCalled();
  });
  it('handles a booking deleted between lookup and the transaction', async () => {
    mocks.update.mockRejectedValue(new BookingNotFoundError('booking-1')); expect((await patch({ visited: true })).status).toBe(404);
  });
  it('passes mixed updates to the repository and emails only when rescheduling', async () => {
    mocks.update.mockResolvedValue(makeAdminBooking({ visited: true, bookingDate: '2099-05-01' }));
    const response = await patch({ visited: true, bookingDate: '2099-05-01' });
    expect(await response.json()).toMatchObject({ success: true, emailSent: true });
    expect(mocks.update).toHaveBeenCalledWith('booking-1', { visited: true, bookingDate: '2099-05-01' },
      { actorUid: 'admin-1', enforceCutoff: false, requireNonPastTarget: true });
    expect(mocks.email).toHaveBeenCalledWith(expect.objectContaining({ visited: true, bookingDate: '2099-05-01' }),
      { bookingDate: '2099-04-28', bookingTime: '16:30:00' });
  });
  it.each([401, 403])('denies unauthorized changes (%i) before reading Firestore', async status => {
    mocks.auth.mockResolvedValue({ user: null, response: NextResponse.json({ success: false }, { status }) });
    expect((await patch({ visited: true })).status).toBe(status); expect(mocks.collection).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled();
  });
  it.each(['lookup', 'update'])('returns 500 when the %s fails', async stage => {
    if (stage === 'lookup') mocks.get.mockRejectedValue(new Error('Database read failed'));
    else mocks.update.mockRejectedValue(new Error('Database write failed'));
    const response = await patch({ visited: true }); expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ success: false, error: 'Failed to update booking', code: 'BOOKING_UPDATE_ERROR' });
  });
});
