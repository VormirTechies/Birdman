// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { makeAdminBooking } from '../fixtures/booking';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), collection: vi.fn(), where: vi.fn(), orderBy: vi.fn(),
  offset: vi.fn(), limit: vi.fn(), get: vi.fn(), count: vi.fn(), countGet: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/require-admin', () => ({ requireAdmin: mocks.auth }));
vi.mock('@/lib/firebase/admin', () => ({ getAdminDb: () => ({ collection: mocks.collection }) }));
vi.mock('@/lib/firebase/bookings', () => ({ createFirestoreBooking: vi.fn() }));
vi.mock('@/lib/firebase/booking-attempt-limit', () => ({ limitBookingAttempts: vi.fn() }));
import { GET } from '@/app/api/bookings/route';

function get(params: Record<string, string> = {}) {
  return GET(new NextRequest(`http://localhost/api/bookings?${new URLSearchParams(params)}`));
}
function rows(bookings: ReturnType<typeof makeAdminBooking>[]) {
  mocks.get.mockResolvedValue({ size: bookings.length, docs: bookings.map(booking => ({ id: booking.id, data: () => booking })) });
  mocks.countGet.mockResolvedValue({ data: () => ({ count: bookings.length }) });
}
const invalidParams: Record<string, string>[] = [
  { limit: '0' }, { limit: '101' }, { limit: 'invalid' }, { offset: '-1' }, { page: '0' },
  { status: 'pending' }, { date: '28-04-2099' }, { date: 'tomorrow' }, { visited: 'invalid' },
];
beforeEach(() => {
  vi.resetAllMocks(); mocks.auth.mockResolvedValue({ user: { uid: 'admin-1' } });
  const query = { where: mocks.where, orderBy: mocks.orderBy, offset: mocks.offset, limit: mocks.limit, get: mocks.get, count: mocks.count };
  for (const method of [mocks.collection, mocks.where, mocks.orderBy, mocks.offset, mocks.limit]) method.mockReturnValue(query);
  mocks.count.mockReturnValue({ get: mocks.countGet }); rows([]);
});

describe('GET /api/bookings — Firestore checklist', () => {
  it('returns typed bookings and current pagination metadata', async () => {
    rows([makeAdminBooking(), makeAdminBooking({ id: 'booking-2' })]);
    const response = await get({ sort: 'checklist', date: '2099-04-28', status: 'confirmed', limit: '20', offset: '0' });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, total: 2,
      pagination: { limit: 20, offset: 0, page: 1, count: 2 }, bookings: [{ adults: 2, children: 0 }, { id: 'booking-2' }] });
  });
  it('uses Firestore filters and checklist sorting/search before slicing', async () => {
    rows([makeAdminBooking({ id: 'visited', visited: true }), makeAdminBooking({ id: 'unvisited' }),
      makeAdminBooking({ id: 'other', visitorName: 'Other Visitor', email: 'other@example.com' })]);
    const result = await (await get({ sort: 'checklist', date: '2099-04-28', status: 'confirmed', search: 'ARJUN', limit: '1', offset: '1' })).json();
    expect(mocks.collection).toHaveBeenCalledWith('bookings');
    expect(mocks.where).toHaveBeenCalledWith('status', '==', 'confirmed');
    expect(mocks.where).toHaveBeenCalledWith('bookingDate', '==', '2099-04-28');
    expect(result.total).toBe(2); expect(result.bookings.map((row: { id: string }) => row.id)).toEqual(['visited']);
    expect(mocks.offset).not.toHaveBeenCalled(); expect(mocks.count).not.toHaveBeenCalled();
  });
  it('returns empty results', async () => {
    expect(await (await get({ sort: 'checklist' })).json()).toMatchObject({ success: true, bookings: [], total: 0, pagination: { count: 0 } });
  });
  it('uses aggregation and database pagination for the default ordering', async () => {
    mocks.countGet.mockResolvedValue({ data: () => ({ count: 50 }) });
    const data = await (await get({ limit: '5', page: '3' })).json();
    expect(mocks.orderBy).toHaveBeenCalledWith('createdAt', 'desc'); expect(mocks.offset).toHaveBeenCalledWith(10);
    expect(mocks.limit).toHaveBeenCalledWith(5); expect(data).toMatchObject({ total: 50, pagination: { offset: 10, page: 3, limit: 5 } });
  });
  it('defaults to 50 records and offset zero', async () => {
    await get(); expect(mocks.limit).toHaveBeenCalledWith(50); expect(mocks.offset).toHaveBeenCalledWith(0);
  });
  it('serializes Firestore timestamps in list responses', async () => {
    const timestamp = Timestamp.fromDate(new Date('2099-04-01T00:00:00Z'));
    mocks.get.mockResolvedValue({ size: 1, docs: [{ id: 'booking-1', data: () => ({ ...makeAdminBooking(), createdAt: timestamp }) }] });
    expect((await (await get()).json()).bookings[0].createdAt).toBe('2099-04-01T00:00:00.000Z');
  });
  it.each(invalidParams)('rejects invalid params %j before reading Firestore', async params => {
    expect((await get(params)).status).toBe(400); expect(mocks.collection).not.toHaveBeenCalled();
  });
  it.each(['1', '100'])('accepts boundary limit %s', async limit => { expect((await get({ limit })).status).toBe(200); });
  it.each([401, 403])('rejects unauthorized checklist access (%i)', async status => {
    mocks.auth.mockResolvedValue({ user: null, response: NextResponse.json({ success: false }, { status }) });
    expect((await get()).status).toBe(status); expect(mocks.collection).not.toHaveBeenCalled();
  });
  it('returns the safe error contract when Firestore fails', async () => {
    mocks.get.mockRejectedValue(new Error('Private database error'));
    const response = await get({ sort: 'checklist' }); expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ success: false, error: 'Failed to fetch bookings', code: 'BOOKINGS_FETCH_ERROR' });
  });
});
