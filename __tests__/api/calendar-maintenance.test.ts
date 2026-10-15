import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  deletePast: vi.fn(),
  getSettings: vi.fn(),
  upsert: vi.fn(),
}));
vi.mock('@/lib/firebase/calendar-settings', () => ({
  deletePastCalendarSettings: mocks.deletePast,
  getFirestoreCalendarSettings: mocks.getSettings,
  upsertFirestoreCalendarSetting: mocks.upsert,
}));
import { GET } from '@/app/api/cron/calendar-maintenance/route';

function request(authorization?: string) {
  return new NextRequest('https://example.com/api/cron/calendar-maintenance', {
    headers: authorization ? { authorization } : {},
  });
}

describe('calendar maintenance authorization and Firestore operations', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-14T06:00:00Z'));
    vi.stubEnv('CRON_SECRET', 'test-secret');
    mocks.deletePast.mockResolvedValue(2);
    mocks.getSettings
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ date: '2026-10-14' }, { date: '2027-04-12' }]);
    mocks.upsert.mockResolvedValue({});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each([
    ['unset secret', undefined, undefined],
    ['unset secret with guessed bearer', undefined, 'Bearer undefined'],
    ['empty secret', '', 'Bearer '],
    ['whitespace secret', '   ', 'Bearer'],
    ['missing authorization', 'test-secret', undefined],
    ['incorrect token', 'test-secret', 'Bearer incorrect'],
    ['incorrect authorization scheme', 'test-secret', 'Basic test-secret'],
  ])('denies %s before any database access', async (_label, secret, authorization) => {
    vi.stubEnv('CRON_SECRET', secret);
    const response = await GET(request(authorization));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
    expect(mocks.deletePast).not.toHaveBeenCalled();
    expect(mocks.getSettings).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('permits the configured bearer token and maintains Firestore settings', async () => {
    const response = await GET(request('Bearer test-secret'));
    expect(response.status).toBe(200);
    expect(mocks.deletePast).toHaveBeenCalledWith('2026-10-14');
    expect(mocks.getSettings).toHaveBeenNthCalledWith(1, '2027-04-12', '2027-04-12');
    expect(mocks.upsert).toHaveBeenCalledWith('2027-04-12', {
      maxCapacity: 100, startTime: '16:30:00', isOpen: true,
    }, null);
    expect(await response.json()).toEqual({
      success: true, deleted: 2, added: '2027-04-12',
      window: { minDate: '2026-10-14', maxDate: '2027-04-12', totalRows: 2 },
    });
  });

  it('does not overwrite an existing future setting', async () => {
    mocks.getSettings.mockReset()
      .mockResolvedValueOnce([{ date: '2027-04-12' }])
      .mockResolvedValueOnce([{ date: '2027-04-12' }]);
    expect((await GET(request('Bearer test-secret'))).status).toBe(200);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('returns a server error for an authorized database failure', async () => {
    mocks.deletePast.mockRejectedValue(new Error('Database unavailable'));
    expect((await GET(request('Bearer test-secret'))).status).toBe(500);
    expect(mocks.getSettings).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});
