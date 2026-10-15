// @vitest-environment node
import { beforeAll, afterAll, expect, it, vi } from 'vitest';
import { initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
const holder = vi.hoisted(() => ({ db: null as unknown as Firestore }));
vi.mock('server-only', () => ({}));
vi.mock('./admin', () => ({ getAdminDb: () => holder.db }));
import { registerNotificationDevice, unregisterNotificationDevice, notificationDeviceId } from './notification-devices';
const enabled = process.env.RUN_NOTIFICATION_EMULATOR_TESTS === 'true';
let app: App;
beforeAll(async () => {
  if (!enabled) return;
  vi.stubEnv('FIRESTORE_EMULATOR_HOST', '127.0.0.1:7003');
  app = initializeApp({ projectId: `demo-birdman-devices-${Date.now()}` }, `devices-${Date.now()}`);
  holder.db = getFirestore(app, app.name);
  await holder.db.collection('adminUsers').doc('admin-a').set({ role: 'admin' });
  await holder.db.collection('adminUsers').doc('admin-b').set({ role: 'admin' });
});
afterAll(async () => { if (enabled) { await deleteApp(app); vi.unstubAllEnvs(); } });
it.skipIf(!enabled)('registers multiple devices, refreshes retention and enforces ownership on registration/deletion', async () => {
  const token = 'mock:11111111-1111-1111-1111-111111111111';
  const second = 'mock:22222222-2222-2222-2222-222222222222';
  await registerNotificationDevice('admin-a', { token });
  await registerNotificationDevice('admin-a', { token: second });
  const ref = holder.db.collection('adminNotificationDevices').doc(notificationDeviceId(token));
  const original = (await ref.get()).data()!;
  await registerNotificationDevice('admin-a', { token });
  const refreshed = (await ref.get()).data()!;
  expect(refreshed.createdAt).toEqual(original.createdAt);
  expect(refreshed.expiresAt.toMillis()).toBeGreaterThanOrEqual(original.expiresAt.toMillis());
  expect((await holder.db.collection('adminNotificationDevices').get()).size).toBe(2);
  await expect(registerNotificationDevice('admin-b', { token })).rejects.toThrow();
  await expect(unregisterNotificationDevice('admin-b', { token })).rejects.toThrow();
  expect((await ref.get()).data()?.uid).toBe('admin-a');
  await unregisterNotificationDevice('admin-a', { token });
  await unregisterNotificationDevice('admin-a', { token });
  expect((await ref.get()).exists).toBe(false);
  expect((await holder.db.collection('adminNotificationDevices').doc(notificationDeviceId(second)).get()).exists).toBe(true);
});
it.skipIf(!enabled)('rejects a removed role and serializes concurrent token ownership', async () => {
  const token = 'mock:33333333-3333-3333-3333-333333333333';
  const results = await Promise.allSettled([
    registerNotificationDevice('admin-a', { token }), registerNotificationDevice('admin-b', { token }),
  ]);
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  await holder.db.collection('adminUsers').doc('admin-a').delete();
  await expect(registerNotificationDevice('admin-a', { token: 'mock:44444444-4444-4444-4444-444444444444' })).rejects.toThrow();
});
