// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ db: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('./admin', () => ({ getAdminDb: mocks.db }));
import { getFirestoreCalendarSetting, upsertFirestoreCalendarSetting, upsertFirestoreCalendarSettings } from './calendar-settings';

const documents = new Map<string, Record<string, unknown>>();
const writes: Array<{ id: string; data: Record<string, unknown>; options: { merge: boolean } }> = [];
function reference(id: string) {
  const ref = { id, get: vi.fn(), set: vi.fn() };
  ref.get.mockImplementation(async () => ({ id, ref, exists: documents.has(id), data: () => documents.get(id) }));
  ref.set.mockImplementation(async (data: Record<string, unknown>, options: { merge: boolean }) => {
    writes.push({ id, data, options });
    documents.set(id, { ...documents.get(id), ...data });
  });
  return ref;
}

beforeEach(() => {
  documents.clear(); writes.length = 0;
  const query = { where: vi.fn(), limit: vi.fn(), get: vi.fn() };
  query.where.mockReturnValue(query); query.limit.mockReturnValue(query);
  query.get.mockImplementation(async () => ({ size: documents.size, docs: [...documents].map(([id, data]) => ({
    id, ref: reference(id), data: () => data,
  })) }));
  mocks.db.mockReturnValue({
    collection: () => ({ ...query, doc: reference }),
    batch: () => ({
      set: (ref: ReturnType<typeof reference>, data: Record<string, unknown>, options: { merge: boolean }) => writes.push({ id: ref.id, data, options }),
      commit: async () => { for (const write of writes) documents.set(write.id, { ...documents.get(write.id), ...write.data }); },
    }),
  });
});

describe('calendar selected-field merge writes', () => {
  it.each([{ maxCapacity: 0 }, { startTime: '15:00:00' }, { isOpen: false }])('single-date update preserves unselected fields: %j', async changes => {
    const original = { date: '2026-10-16', maxCapacity: 120, startTime: '18:00:00', isOpen: false };
    documents.set('2026-10-16', original);
    await upsertFirestoreCalendarSetting('2026-10-16', changes, 'admin');
    expect(documents.get('2026-10-16')).toMatchObject({ ...original, ...changes });
    expect(writes[0].data).toEqual(expect.objectContaining(changes));
    expect(Object.keys(writes[0].data).sort()).toEqual(['date', 'updatedAt', 'updatedBy', ...Object.keys(changes)].sort());
    expect(writes[0].options).toEqual({ merge: true });
  });
  it('preserves different per-day settings, creates missing dates and leaves other dates untouched', async () => {
    documents.set('2026-10-16', { date: '2026-10-16', maxCapacity: 100, startTime: '15:00:00', isOpen: false });
    documents.set('2026-10-17', { date: '2026-10-17', maxCapacity: 150, startTime: '18:00:00', isOpen: true });
    const outside = { date: '2026-10-20', maxCapacity: 120, isOpen: false };
    documents.set('2026-10-20', outside);
    expect(await upsertFirestoreCalendarSettings(['2026-10-16', '2026-10-17', '2026-10-18'], { maxCapacity: 80 }, 'admin')).toBe(3);
    expect(documents.get('2026-10-16')).toMatchObject({ maxCapacity: 80, startTime: '15:00:00', isOpen: false });
    expect(documents.get('2026-10-17')).toMatchObject({ maxCapacity: 80, startTime: '18:00:00', isOpen: true });
    expect(documents.get('2026-10-20')).toEqual(outside);
    for (const write of writes) {
      expect(write.data).not.toHaveProperty('startTime');
      expect(write.data).not.toHaveProperty('isOpen');
    }
    expect(await getFirestoreCalendarSetting('2026-10-18')).toMatchObject({ maxCapacity: 80, startTime: '16:30:00', isOpen: true });
  });
  it('does not rewrite stale unselected values read before a concurrent change', async () => {
    const original = { date: '2026-10-16', maxCapacity: 100, startTime: '15:00:00', isOpen: true };
    documents.set('2026-10-16', original);
    const db = mocks.db();
    const originalBatch = db.batch;
    db.batch = () => {
      documents.set('2026-10-16', { ...original, startTime: '19:00:00', isOpen: false });
      return originalBatch();
    };
    await upsertFirestoreCalendarSettings(['2026-10-16'], { maxCapacity: 80 }, 'admin');
    expect(documents.get('2026-10-16')).toMatchObject({ maxCapacity: 80, startTime: '19:00:00', isOpen: false });
  });
});
