// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { NOTIFICATION_COLLECTIONS as C } from '@/models/firestore/notification';
import { DELIVERY_MAX_ATTEMPTS, DELIVERY_MAX_AGE_MS } from './notification-delivery-policy';
vi.mock('server-only', () => ({}));
vi.mock('./admin', () => ({ getAdminDb: vi.fn(), getAdminAuth: vi.fn(), getAdminMessaging: vi.fn() }));
import { stageNotificationEvent } from './notifications';
import { runNotificationDeliveryWorker, type NotificationWorkerDependencies } from './notification-delivery';

const enabled = process.env.RUN_NOTIFICATION_EMULATOR_TESTS === 'true';
let app: App; let db: Firestore; let now: number;
const send = vi.fn(); const getUser = vi.fn();
const deps = (): NotificationWorkerDependencies => ({ db, mode: 'mock', send, getUser, clock: () => now });
beforeEach(async () => {
  if (!enabled) return;
  vi.clearAllMocks(); now = Date.now();
  send.mockResolvedValue('mock-message-id'); getUser.mockResolvedValue({ disabled: false });
  vi.stubEnv('FIRESTORE_EMULATOR_HOST', '127.0.0.1:7003');
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  app = initializeApp({ projectId: `demo-birdman-delivery-${unique}` }, `delivery-${unique}`);
  db = getFirestore(app, app.name);
  await db.collection('adminUsers').doc('admin-a').set({ role: 'admin' });
});
afterEach(async () => { if (enabled) { await deleteApp(app); vi.unstubAllEnvs(); } });
async function event() {
  const staged = await db.runTransaction(tx => stageNotificationEvent(tx, db, {
    eventKey: 'test-booking:confirmed:1', type: 'booking_confirmed', bookingId: 'booking-1',
    bookingDate: '2099-11-01', title: 'Confirmed', body: 'Private body must not be copied to push.', url: '/admin',
  }, Timestamp.fromMillis(now)));
  return db.collection(C.jobs).doc(staged.id);
}
async function device(id: string, overrides: Record<string, unknown> = {}) {
  const ref = db.collection(C.devices).doc(id);
  await ref.set({ uid: 'admin-a', token: `mock:${id}-${'a'.repeat(30)}`, createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(now + 30 * 86_400_000), ...overrides });
  return ref;
}

it.skipIf(!enabled)('concurrent workers share a fenced lease and do not both send the same device event', async () => {
  await event(); await device('a');
  const results = await Promise.all([runNotificationDeliveryWorker(deps()), runNotificationDeliveryWorker(deps())]);
  expect(results.reduce((total, result) => total + result.sent, 0)).toBe(1);
  expect(send).toHaveBeenCalledOnce(); expect((await db.collection(C.receipts).get()).size).toBe(1);
});

it.skipIf(!enabled)('sends eligible admins only and completes with persisted outcomes and seven-day expiry', async () => {
  const job = await event(); await device('a'); await device('b');
  await device('expired', { expiresAt: Timestamp.fromMillis(now - 1) });
  await device('non-admin', { uid: 'ordinary-user' });
  await db.collection('adminUsers').doc('disabled-admin').set({ role: 'admin' });
  await device('disabled', { uid: 'disabled-admin' });
  getUser.mockImplementation(async uid => ({ disabled: uid === 'disabled-admin' }));
  const result = await runNotificationDeliveryWorker(deps());
  expect(result).toMatchObject({ sent: 2, skipped: 3, completed: 1 });
  const stored = (await job.get()).data()!;
  expect(stored.status).toBe('completed'); expect(stored.expiresAt.toMillis()).toBe(now + 7 * 86_400_000);
  expect((await db.collection(C.receipts).get()).size).toBe(5);
  expect((await db.collection(C.devices).doc('disabled').get()).exists).toBe(false);
  for (const call of send.mock.calls) expect(call[0].notification.body).not.toContain('Private body');
});

it.skipIf(!enabled)('retries a transient partial failure without resending to a successful device', async () => {
  const job = await event(); await device('a'); await device('b');
  send.mockImplementation(async message => {
    if (message.token.startsWith('mock:b')) throw { code: 'messaging/quota-exceeded' };
    return 'mock-id';
  });
  expect(await runNotificationDeliveryWorker(deps())).toMatchObject({ sent: 1, retried: 1 });
  const stored = (await job.get()).data()!;
  expect(stored.lastErrorCode).toBe('messaging/quota-exceeded');
  expect(stored.nextAttemptAt.toMillis()).toBeGreaterThanOrEqual(now + 60_000);
  now = stored.nextAttemptAt.toMillis() + 1; send.mockResolvedValue('mock-id'); send.mockClear();
  expect(await runNotificationDeliveryWorker(deps())).toMatchObject({ sent: 1, completed: 1 });
  expect(send).toHaveBeenCalledOnce(); expect(send.mock.calls[0][0].token).toMatch(/^mock:b/);
});

it.skipIf(!enabled)('prunes invalid tokens but retains registrations when payload/credential errors are permanent', async () => {
  const job = await event(); const a = await device('a'); const b = await device('b');
  send.mockImplementation(async message => { throw { code: message.token.startsWith('mock:a')
    ? 'messaging/registration-token-not-registered' : 'messaging/invalid-argument' }; });
  expect(await runNotificationDeliveryWorker(deps())).toMatchObject({ skipped: 1, failed: 1 });
  expect((await a.get()).exists).toBe(false); expect((await b.get()).exists).toBe(true);
  expect((await job.get()).data()?.expiresAt.toMillis()).toBe(now + 30 * 86_400_000);
});

it.skipIf(!enabled)('dead-letters exhausted retries and old work rather than leaving pending jobs forever', async () => {
  const job = await event(); await device('a'); send.mockRejectedValue({ code: 'messaging/server-unavailable' });
  for (let attempt = 1; attempt <= DELIVERY_MAX_ATTEMPTS; attempt++) {
    await runNotificationDeliveryWorker(deps());
    const stored = (await job.get()).data()!;
    if (attempt < DELIVERY_MAX_ATTEMPTS) { expect(stored.status).toBe('pending'); now = stored.nextAttemptAt.toMillis() + 1; }
  }
  expect((await job.get()).data()?.status).toBe('failed');
  await job.update({ status: 'pending', attempts: 0, createdAt: Timestamp.fromMillis(now - DELIVERY_MAX_AGE_MS - 1), nextAttemptAt: Timestamp.fromMillis(now) });
  send.mockClear(); expect(await runNotificationDeliveryWorker(deps())).toMatchObject({ failed: 1 });
  expect(send).not.toHaveBeenCalled();
}, 20_000);

it.skipIf(!enabled)('only one concurrent worker sends a claimed event', async () => {
  await event(); await device('a');
  const results = await Promise.all([runNotificationDeliveryWorker(deps()), runNotificationDeliveryWorker(deps())]);
  expect(results.reduce((total, result) => total + result.completed, 0)).toBe(1);
  expect(send).toHaveBeenCalledOnce();
});

it.skipIf(!enabled)('recovers an abandoned lease and does not send after losing a lease', async () => {
  const job = await event(); await device('a');
  await job.update({ status: 'processing', leaseId: 'abandoned', leaseUntil: Timestamp.fromMillis(now - 1), nextAttemptAt: Timestamp.fromMillis(now - 1), attempts: 1 });
  expect(await runNotificationDeliveryWorker(deps())).toMatchObject({ completed: 1, sent: 1 });
  // A fresh event delivery loses its lease during the external Auth check.
  await db.recursiveDelete(db.collection(C.receipts));
  await job.update({ status: 'pending', nextAttemptAt: Timestamp.fromMillis(now), attempts: 0 });
  getUser.mockImplementationOnce(async () => {
    await job.update({ leaseId: 'another-worker' }); return { disabled: false };
  });
  send.mockClear(); await runNotificationDeliveryWorker(deps()); expect(send).not.toHaveBeenCalled();
});

it.skipIf(!enabled)('handles more than twenty devices with cursor continuation and no duplicated sends', async () => {
  const job = await event();
  await Promise.all(Array.from({ length: 21 }, (_, index) => device(String(index).padStart(2, '0'))));
  expect(await runNotificationDeliveryWorker(deps())).toMatchObject({ sent: 20, retried: 1 });
  const stored = (await job.get()).data()!; expect(stored.deviceCursor).toBe('19');
  now = stored.nextAttemptAt.toMillis() + 1;
  expect(await runNotificationDeliveryWorker(deps())).toMatchObject({ sent: 1, completed: 1 });
  expect(send).toHaveBeenCalledTimes(21);
}, 20_000);

it.skipIf(!enabled)('rechecks role/logout after the Auth lookup and fails expired events without sending', async () => {
  const job = await event(); const a = await device('a');
  getUser.mockImplementationOnce(async () => {
    await db.collection('adminUsers').doc('admin-a').delete(); return { disabled: false };
  });
  expect(await runNotificationDeliveryWorker(deps())).toMatchObject({ skipped: 1, completed: 1 });
  expect(send).not.toHaveBeenCalled(); expect((await a.get()).exists).toBe(false);
  await job.update({ status: 'pending', nextAttemptAt: Timestamp.fromMillis(now), attempts: 0 });
  await db.collection(C.history).doc(job.id).update({ expiresAt: Timestamp.fromMillis(now - 1) });
  expect(await runNotificationDeliveryWorker(deps())).toMatchObject({ failed: 1 });
});
