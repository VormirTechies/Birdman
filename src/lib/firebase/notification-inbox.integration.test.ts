// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { NOTIFICATION_COLLECTIONS as C } from '@/models/firestore/notification';
vi.mock('server-only', () => ({}));
vi.mock('./admin', () => ({ getAdminDb: vi.fn() }));
import { listNotificationInbox, updateNotificationStates, notificationStateId, notificationListSchema } from './notification-inbox';
const enabled = process.env.RUN_NOTIFICATION_EMULATOR_TESTS === 'true';
let app: App; let db: Firestore; let now: Timestamp;
beforeEach(async () => {
  if (!enabled) return;
  vi.stubEnv('FIRESTORE_EMULATOR_HOST', '127.0.0.1:7003');
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  // Imported default emulator data can appear in new projects: use an isolated named test database.
  app = initializeApp({ projectId: `demo-birdman-inbox-${unique}` }, `inbox-${unique}`); db = getFirestore(app, `inbox-${unique}`); now = Timestamp.now();
  await Promise.all(['a', 'b'].map(uid => db.collection('adminUsers').doc(uid).set({ role: 'admin' })));
});
afterEach(async () => { if (enabled) { await deleteApp(app); vi.unstubAllEnvs(); } });
const id = (number: number) => number.toString(16).padStart(64, '0');
async function event(number: number, extra: Record<string, unknown> = {}) {
  await db.collection(C.history).doc(id(number)).set({ eventKey: `test:${number}`, type: 'booking_confirmed', bookingId: 'booking-1',
    bookingDate: '2099-11-01', title: 'Booking confirmed', body: 'A booking was confirmed.', url: '/admin',
    createdAt: now, expiresAt: Timestamp.fromMillis(now.toMillis() + 90 * 86400000), email: 'private@example.com', ...extra });
}
const list = (uid = 'a', input: Record<string, unknown> = {}) => listNotificationInbox(uid, notificationListSchema.parse(input), db, now);
it.skipIf(!enabled)('paginates timestamp ties without duplicate rows and omits internal/private fields', async () => {
  await Promise.all([1, 2, 3].map(number => event(number)));
  await db.collection('bookings').doc('booking-1').set({ email: 'private@example.com' });
  const first = await list('a', { limit: 2 });
  expect(first.notifications.map(item => item.id)).toEqual([id(3), id(2)]);
  expect(first.notifications.every(item => item.bookingExists)).toBe(true);
  expect(JSON.stringify(first)).not.toMatch(/private@example|eventKey|bookingId|expiresAt|token/);
  const next = await list('a', { limit: 2, cursor: first.pagination.nextCursor });
  expect(next.notifications.map(item => item.id)).toEqual([id(1)]); expect(next.pagination.hasMore).toBe(false);
  expect(first.unreadCount).toBe(3);
});
it.skipIf(!enabled)('persists independent read/dismiss state without extending expiry or overwriting timestamps', async () => {
  await event(1); const input = { ids: [id(1)], action: 'read' };
  await updateNotificationStates('a', input, db, now);
  await updateNotificationStates('a', input, db, Timestamp.fromMillis(now.toMillis() + 5000));
  expect((await list()).notifications[0].read).toBe(true); expect((await list()).unreadCount).toBe(0);
  expect((await list('b')).notifications[0].read).toBe(false); expect((await list('b')).unreadCount).toBe(1);
  const state = (await db.collection(C.states).doc(notificationStateId('a', id(1))).get()).data()!;
  expect(state.readAt.toMillis()).toBe(now.toMillis()); expect(state.expiresAt.toMillis()).toBe(now.toMillis() + 90 * 86400000);
  await updateNotificationStates('a', { ids: [id(1)], action: 'dismiss' }, db, now);
  expect((await list()).notifications).toEqual([]); expect((await list('b')).notifications).toHaveLength(1);
  await updateNotificationStates('a', input, db, now); expect((await list()).notifications).toEqual([]);
  expect((await db.collection(C.history).doc(id(1)).get()).exists).toBe(true);
});
it.skipIf(!enabled)('excludes expired history immediately and tolerates a deleted booking', async () => {
  await event(1); await event(2, { expiresAt: Timestamp.fromMillis(now.toMillis() - 1) });
  const page = await list(); expect(page.notifications).toHaveLength(1); expect(page.unreadCount).toBe(1);
  expect(page.notifications[0].bookingExists).toBe(false);
  await expect(updateNotificationStates('a', { ids: [id(2)], action: 'read' }, db, now)).rejects.toThrow();
});
it.skipIf(!enabled)('rechecks roles and rejects nonexistent events atomically', async () => {
  await event(1);
  await expect(updateNotificationStates('ordinary', { ids: [id(1)], action: 'read' }, db, now)).rejects.toThrow();
  await expect(updateNotificationStates('a', { ids: [id(1), id(2)], action: 'read' }, db, now)).rejects.toThrow();
  expect((await db.collection(C.states).get()).empty).toBe(true);
});
it.skipIf(!enabled)('bounds scanning of dismissed rows and returns a usable empty-page continuation', async () => {
  await Promise.all(Array.from({ length: 102 }, (_, i) => event(i + 1)));
  for (let start = 3; start <= 102; start += 20)
    await updateNotificationStates('a', { ids: Array.from({ length: 20 }, (_, i) => id(start + i)), action: 'dismiss' }, db, now);
  const first = await list(); expect(first.notifications).toHaveLength(0); expect(first.pagination.hasMore).toBe(true);
  const next = await list('a', { cursor: first.pagination.nextCursor });
  expect(next.notifications.map(item => item.id)).toEqual([id(2), id(1)]);
});
