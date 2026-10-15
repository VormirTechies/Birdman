// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import type { NormalizedCalendarSetting } from '@/lib/firebase/calendar-settings';
import { makeAdminBooking } from '../fixtures/booking';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  counts: vi.fn<typeof import('@/lib/firebase/calendar-admin').getConfirmedBookingCounts>(),
  cancel: vi.fn<typeof import('@/lib/firebase/calendar-admin').cancelFirestoreBookingsForDates>(),
  settings: vi.fn<typeof import('@/lib/firebase/calendar-settings').getFirestoreCalendarSettings>(),
  references: vi.fn<typeof import('@/lib/firebase/calendar-settings').getFutureCalendarSettingReferences>(),
  update: vi.fn<typeof import('@/lib/firebase/calendar-settings').updateFirestoreCalendarSettings>(),
  upsert: vi.fn<typeof import('@/lib/firebase/calendar-settings').upsertFirestoreCalendarSetting>(),
  upsertMany: vi.fn<typeof import('@/lib/firebase/calendar-settings').upsertFirestoreCalendarSettings>(),
  emails: vi.fn<typeof import('@/lib/email').sendCancellationEmails>(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/require-admin', () => ({ requireAdmin: mocks.auth }));
vi.mock('@/lib/firebase/calendar-admin', () => ({ getConfirmedBookingCounts: mocks.counts, cancelFirestoreBookingsForDates: mocks.cancel }));
vi.mock('@/lib/firebase/calendar-settings', () => ({ getFirestoreCalendarSettings: mocks.settings,
  getFutureCalendarSettingReferences: mocks.references, updateFirestoreCalendarSettings: mocks.update,
  upsertFirestoreCalendarSetting: mocks.upsert, upsertFirestoreCalendarSettings: mocks.upsertMany }));
vi.mock('@/lib/email', () => ({ sendCancellationEmails: mocks.emails }));
import { POST as preview } from '@/app/api/admin/settings/preview/route';
import { POST as bulkUpdate } from '@/app/api/admin/settings/bulk-update/route';

const setting = (date: string): NormalizedCalendarSetting => ({ id: date, date, maxCapacity: 100,
  isOpen: true, startTime: '16:30:00', updatedBy: null, createdAt: null, updatedAt: null });
const cancellations: Awaited<ReturnType<typeof import('@/lib/firebase/calendar-admin').cancelFirestoreBookingsForDates>> =
  [makeAdminBooking({ id: 'b1', bookingNumber: 23, bookingDate: '2099-05-20' }), makeAdminBooking({ id: 'b2', bookingNumber: 24, bookingDate: '2099-05-20' })]
  .map(({ id, bookingNumber, email, visitorName, bookingDate, adults, children, numberOfGuests }) =>
    ({ id, bookingNumber, email, visitorName, bookingDate, adults, children, numberOfGuests }));
const request = (body: unknown) => new NextRequest('http://localhost/api/admin/settings', { method: 'POST', body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date('2099-05-14T06:00:00Z'));
  mocks.auth.mockResolvedValue({ user: { uid: 'verified-admin' } });
  mocks.counts.mockResolvedValue(new Map()); mocks.cancel.mockResolvedValue([]); mocks.settings.mockResolvedValue([]);
  mocks.references.mockResolvedValue([]); mocks.update.mockResolvedValue(2); mocks.upsert.mockResolvedValue(setting('2099-05-20'));
  mocks.upsertMany.mockImplementation(async (dates) => dates.length); mocks.emails.mockResolvedValue({ sent: 0, failed: 0, errors: [] });
});
afterEach(() => vi.useRealTimers());

describe('POST /api/admin/settings/preview — Firestore', () => {
  it('previews the current 181-day all-days horizon without modifying data', async () => {
    const response = await preview(request({ applyMode: 'all_days', settings: { isOpen: false } }));
    expect(response.status).toBe(200); const data = await response.json();
    expect(data).toMatchObject({ success: true, affectedDatesCount: 181, totalAffectedDates: 181, willBlock: true });
    expect(data.affectedDates).toHaveLength(10);
    const dates = mocks.counts.mock.calls[0][0]; expect(dates.size).toBe(181); expect(dates.has('2099-05-14')).toBe(true);
    expect(mocks.settings).toHaveBeenCalledWith('2099-05-14', [...dates].at(-1));
    expect(mocks.cancel).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled();
  });
  it('previews one date and its existing bookings', async () => {
    mocks.counts.mockResolvedValue(new Map([['2099-05-20', 4]])); mocks.settings.mockResolvedValue([setting('2099-05-20')]);
    const response = await preview(request({ applyMode: 'one_day', date: '2099-05-20', settings: { maxCapacity: 80 } }));
    expect(await response.json()).toMatchObject({ success: true, affectedDatesCount: 1, existingBookingsCount: 4,
      bookingsByDate: [{ date: '2099-05-20', count: 4 }], sampleCurrentSettings: [{ date: '2099-05-20', maxCapacity: 100 }], willBlock: false });
  });
  it('counts only the selected range and caps sample settings at five', async () => {
    mocks.counts.mockResolvedValue(new Map([['2099-06-01', 5], ['2099-06-03', 3], ['2099-06-10', 99]]));
    mocks.settings.mockResolvedValue(Array.from({ length: 7 }, (_, i) => setting(`2099-06-0${i + 1}`)));
    const response = await preview(request({ applyMode: 'date_range', startDate: '2099-06-01', endDate: '2099-06-07', settings: { isOpen: false } }));
    const data = await response.json();
    expect(data).toMatchObject({ affectedDatesCount: 7, existingBookingsCount: 8, willBlock: true });
    expect(mocks.counts).toHaveBeenCalledWith(new Set(Array.from({ length: 7 }, (_, i) => `2099-06-0${i + 1}`)));
    expect(data.sampleCurrentSettings).toHaveLength(5);
  });
  it.each([{}, { applyMode: 'one_day', settings: {} }, { applyMode: 'date_range', settings: {}, startDate: '2099-06-01' },
    { applyMode: 'invalid', settings: {} }])('rejects missing/invalid mode inputs %j', async body => {
    expect((await preview(request(body))).status).toBe(400); expect(mocks.counts).not.toHaveBeenCalled();
  });
  it('returns 500 if the booking count service fails', async () => {
    mocks.counts.mockRejectedValue(new Error('Service unavailable'));
    expect((await preview(request({ applyMode: 'one_day', date: '2099-05-20', settings: { isOpen: true } }))).status).toBe(500);
  });
});

describe('POST /api/admin/settings/bulk-update — Firestore', () => {
  it('applies exactly the previewed window using the verified administrator, even across IST midnight', async () => {
    const previewResponse = await preview(request({ applyMode: 'all_days', settings: { maxCapacity: 80 } }));
    const { scope } = await previewResponse.json();
    const reviewedDates = [...mocks.counts.mock.calls[0][0]];
    vi.setSystemTime(new Date('2099-05-14T19:00:00Z'));
    const response = await bulkUpdate(request({ applyMode: 'all_days', scope, settings: { maxCapacity: 80 }, adminId: 'untrusted-id' }));
    expect(await response.json()).toMatchObject({ success: true, affectedCount: 181, scope, cancelledBookingsCount: 0 });
    expect(mocks.references).not.toHaveBeenCalled();
    expect(mocks.upsertMany).toHaveBeenCalledWith(reviewedDates, { maxCapacity: 80 }, 'verified-admin');
    expect(mocks.cancel).not.toHaveBeenCalled(); expect(mocks.emails).not.toHaveBeenCalled();
  });
  it('blocks a date, cancels its bookings and sends typed cancellation emails', async () => {
    mocks.cancel.mockResolvedValue(cancellations); mocks.emails.mockResolvedValue({ sent: 2, failed: 0, errors: [] });
    const response = await bulkUpdate(request({ applyMode: 'one_day', date: '2099-05-20', settings: { isOpen: false }, adminId: 'ignored' }));
    expect(await response.json()).toMatchObject({ success: true, affectedCount: 1, cancelledBookingsCount: 2, emailsSent: 2, emailsFailed: 0 });
    expect(mocks.upsertMany).toHaveBeenCalledWith(['2099-05-20'], { isOpen: false }, 'verified-admin');
    expect(mocks.cancel).toHaveBeenCalledWith('2099-05-20', '2099-05-20', 'verified-admin');
    expect(mocks.emails).toHaveBeenCalledWith(cancellations);
  });
  it('updates every date in an inclusive range', async () => {
    const response = await bulkUpdate(request({ applyMode: 'date_range', startDate: '2099-06-01', endDate: '2099-06-03', settings: { startTime: '15:00:00' }, adminId: 'ignored' }));
    expect(await response.json()).toMatchObject({ success: true, affectedCount: 3 });
    expect(mocks.upsertMany).toHaveBeenCalledWith(['2099-06-01', '2099-06-02', '2099-06-03'], { startTime: '15:00:00' }, 'verified-admin');
  });
  it('limits cancellations to the exact previewed window, not the last future record', async () => {
    const { scope } = await (await preview(request({ applyMode: 'all_days', settings: { isOpen: false } }))).json();
    await bulkUpdate(request({ applyMode: 'all_days', scope, settings: { isOpen: false } }));
    expect(mocks.cancel).toHaveBeenCalledWith(scope.startDate, scope.endDate, 'verified-admin');
  });
  it('rejects applying all days without a previewed scope', async () => {
    expect((await bulkUpdate(request({ applyMode: 'all_days', settings: { maxCapacity: 80 } }))).status).toBe(400);
    expect(mocks.upsertMany).not.toHaveBeenCalled();
  });
  it.each([
    { applyMode: 'one_day', date: '2099-05-20', scope: { startDate: '2099-05-20', endDate: '2099-05-21' } },
    { applyMode: 'all_days', scope: { startDate: '2099-05-14', endDate: '2099-12-31' } },
  ])('rejects a mismatched scope before writes %j', async (body) => {
    expect((await bulkUpdate(request({ ...body, settings: { isOpen: false } }))).status).toBe(400);
    expect(mocks.upsertMany).not.toHaveBeenCalled();
    expect(mocks.cancel).not.toHaveBeenCalled();
  });
  it('cancels a blocked range and skips email for bookings without an address', async () => {
    mocks.cancel.mockResolvedValue([cancellations[0], { ...cancellations[1], email: null }]);
    await bulkUpdate(request({ applyMode: 'date_range', startDate: '2099-06-01', endDate: '2099-06-03', settings: { isOpen: false }, adminId: 'ignored' }));
    expect(mocks.cancel).toHaveBeenCalledWith('2099-06-01', '2099-06-03', 'verified-admin');
    expect(mocks.emails).toHaveBeenCalledWith([cancellations[0]]);
  });
  it('retains successful updates when individual emails fail', async () => {
    mocks.cancel.mockResolvedValue(cancellations); mocks.emails.mockResolvedValue({ sent: 1, failed: 1, errors: ['b2: SMTP failed'] });
    const response = await bulkUpdate(request({ applyMode: 'one_day', date: '2099-05-20', settings: { isOpen: false }, adminId: 'ignored' }));
    expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ success: true, emailsSent: 1, emailsFailed: 1, emailErrors: ['b2: SMTP failed'] });
  });
  it.each([{ applyMode: 'all_days', settings: {} }, { applyMode: 'invalid', settings: {}, adminId: 'admin' },
    { applyMode: 'one_day', settings: {}, adminId: 'admin' },
    { applyMode: 'date_range', settings: {}, adminId: 'admin', startDate: '2099-06-01' }])('rejects invalid bulk requests %j', async body => {
    expect((await bulkUpdate(request(body))).status).toBe(400); expect(mocks.update).not.toHaveBeenCalled(); expect(mocks.cancel).not.toHaveBeenCalled();
  });
  it('returns 500 without sending emails when cancellation fails', async () => {
    mocks.cancel.mockRejectedValue(new Error('Transaction failed'));
    expect((await bulkUpdate(request({ applyMode: 'one_day', date: '2099-05-20', settings: { isOpen: false }, adminId: 'ignored' }))).status).toBe(500);
    expect(mocks.emails).not.toHaveBeenCalled();
  });
});

describe.each([['preview', preview], ['bulk update', bulkUpdate]] as const)('%s authorization', (_name, handler) => {
  it.each([401, 403])('rejects unauthorized requests (%i) before service calls', async status => {
    mocks.auth.mockResolvedValue({ user: null, response: NextResponse.json({ success: false }, { status }) });
    expect((await handler(request({}))).status).toBe(status);
    expect(mocks.counts).not.toHaveBeenCalled(); expect(mocks.references).not.toHaveBeenCalled(); expect(mocks.upsert).not.toHaveBeenCalled();
    expect(mocks.cancel).not.toHaveBeenCalled(); expect(mocks.emails).not.toHaveBeenCalled();
  });
});
