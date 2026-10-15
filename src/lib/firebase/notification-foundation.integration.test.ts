// @vitest-environment node
import { beforeAll, afterAll, expect, it, vi } from 'vitest';
import { initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { NOTIFICATION_COLLECTIONS } from '@/models/firestore/notification';
import { notificationExpiry, terminalJobRetention } from './notification-retention';

vi.mock('server-only', () => ({}));
vi.mock('./admin', () => ({ getAdminDb: vi.fn() }));
import { stageNotificationEvent, cleanupExpiredNotifications } from './notifications';

const enabled = process.env.RUN_NOTIFICATION_EMULATOR_TESTS === 'true';
let app: App;
let db: Firestore;
beforeAll(() => {
  if (!enabled) return;
  vi.stubEnv('FIRESTORE_EMULATOR_HOST', '127.0.0.1:7003');
  app = initializeApp({ projectId: `demo-birdman-notifications-${Date.now()}` }, `notifications-${Date.now()}`);
  db = getFirestore(app, app.name);
});
afterAll(async () => { if (enabled) { await deleteApp(app); vi.unstubAllEnvs(); } });

it.skipIf(!enabled)('persists history and pending job atomically, deduplicates concurrency and rolls back', async () => {
  const event = { eventKey: 'booking:test:confirmed:1', type: 'booking_confirmed' as const,
    bookingId: 'test', bookingDate: '2026-11-01', title: 'New booking', body: 'Open the admin dashboard.', url: '/admin' as const };
  const results = await Promise.all([1, 2].map(() => db.runTransaction(tx => stageNotificationEvent(tx, db, event))));
  expect(results.filter(result => result.created)).toHaveLength(1);
  expect((await db.collection(NOTIFICATION_COLLECTIONS.history).get()).size).toBe(1);
  expect((await db.collection(NOTIFICATION_COLLECTIONS.jobs).doc(results[0].id).get()).data())
    .toMatchObject({ status: 'pending', expiresAt: null });
  await expect(db.runTransaction(async tx => {
    await stageNotificationEvent(tx, db, { ...event, eventKey: 'rollback' });
    throw new Error('Simulated booking failure');
  })).rejects.toThrow('Simulated booking failure');
  expect((await db.collection(NOTIFICATION_COLLECTIONS.history).get()).size).toBe(1);
}, 20_000);

it.skipIf(!enabled)('cleans expired history/state/devices/terminal jobs but retains live and pending work', async () => {
  const now = Timestamp.now();
  const expired = Timestamp.fromMillis(now.toMillis() - 1000);
  for (const collection of Object.values(NOTIFICATION_COLLECTIONS)) {
    await db.collection(collection).doc('expired').set({ expiresAt: expired });
    await db.collection(collection).doc('live').set({ expiresAt: notificationExpiry('history', now) });
  }
  const pending = db.collection(NOTIFICATION_COLLECTIONS.jobs).doc('pending');
  await pending.set({ status: 'pending', expiresAt: null });
  const completed = db.collection(NOTIFICATION_COLLECTIONS.jobs).doc('completed');
  await completed.set(terminalJobRetention('completed', now));
  expect(Object.values(await cleanupExpiredNotifications(db, 100, now))).toEqual([1, 1, 1, 1, 1]);
  expect((await db.collection(NOTIFICATION_COLLECTIONS.history).doc('expired').get()).exists).toBe(true);
  expect(Object.values(await cleanupExpiredNotifications(db, 100, now, true))).toEqual([1, 1, 1, 1, 1]);
  expect((await pending.get()).exists).toBe(true);
  expect((await completed.get()).exists).toBe(true);
  expect(Object.values(await cleanupExpiredNotifications(db, 100, now, true))).toEqual([0, 0, 0, 0, 0]);
});
