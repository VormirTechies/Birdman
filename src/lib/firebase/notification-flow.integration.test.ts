// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
const holder = vi.hoisted(() => ({ db: null as unknown as Firestore, auth: null as unknown as Auth }));
vi.mock('server-only', () => ({}));
vi.mock('./admin', () => ({ getAdminDb: () => holder.db, getAdminAuth: () => holder.auth,
  getAdminMessaging: () => { throw new Error('Real FCM must never run in emulator tests'); } }));
import { createFirestoreBooking, updateFirestoreBooking, cancelFirestoreBooking } from './bookings';
import { GET as list, PATCH as mutate } from '@/app/api/admin/notifications/route';
import { POST as register, DELETE as unregister } from '@/app/api/admin/notifications/devices/route';
import { POST as deliver } from '@/app/api/cron/notification-delivery/route';
import { NOTIFICATION_COLLECTIONS as C } from '@/models/firestore/notification';
const enabled = process.env.RUN_NOTIFICATION_EMULATOR_TESTS === 'true';
const secret = 'local-integration-only-not-a-production-secret';
let app: App; let token: string; let uid: string; let unique: string;
beforeEach(async () => {
  if (!enabled) return;
  vi.stubEnv('FIRESTORE_EMULATOR_HOST', '127.0.0.1:7003'); vi.stubEnv('FIREBASE_AUTH_EMULATOR_HOST', '127.0.0.1:7002');
  vi.stubEnv('NOTIFICATIONS_DELIVERY_MODE', 'mock'); vi.stubEnv('FIREBASE_USE_LIVE', 'false'); vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('NOTIFICATIONS_WORKER_SECRET', secret);
  unique = `demo-notifications-flow-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  app = initializeApp({ projectId: unique }, unique); holder.db = getFirestore(app, unique); holder.auth = getAuth(app);
  const user = await holder.auth.createUser({ email: `admin@${unique}.local`, password: 'TestOnlyPassword42!' }); uid = user.uid;
  await holder.db.collection('adminUsers').doc(uid).set({ role: 'admin' });
  const response = await fetch(`http://127.0.0.1:7002/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${unique}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ email: user.email, password: 'TestOnlyPassword42!', returnSecureToken: true, targetProjectId: unique }),
  });
  const data = await response.json();
  expect(data.error?.message ?? response.status).toBe(200); token = data.idToken;
});
afterEach(async () => { if (enabled) { await deleteApp(app); vi.unstubAllEnvs(); } });
function request(method = 'GET', body?: unknown, credential = token) {
  return new Request('http://localhost/api/admin/notifications', { method,
    headers: { Authorization: `Bearer ${credential}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
function worker(credential = secret) { return deliver(new Request('http://localhost/api/cron/notification-delivery', { method: 'POST', headers: { Authorization: `Bearer ${credential}` } })); }
const device = () => ({ token: `mock:${unique}` });
it.skipIf(!enabled)('runs real Auth → booking transaction → history/job → mock delivery → inbox → read/dismiss → logout removal', async () => {
  expect((await register(request('POST', device()))).status).toBe(201);
  const date = '2099-11-01';
  await holder.db.collection('calendar_settings').doc(date).set({ date, maxCapacity: 2, isOpen: true, startTime: '16:30:00' });
  const booking = await createFirestoreBooking({ visitorName: 'Private Person', phone: '9876543210', email: 'private@example.com',
    bookingDate: date, bookingTime: '16:30:00', adults: 2, children: 0 }, { source: 'admin', actorUid: uid, enforceCutoff: false });
  await updateFirestoreBooking(booking.id, { adults: 1 }, { enforceCutoff: false }); await cancelFirestoreBooking(booking.id);
  expect((await holder.db.collection(C.history).get()).size).toBe(4);
  const delivery = await worker(); expect(delivery.status).toBe(200);
  expect(await delivery.json()).toMatchObject({ sent: 4, completed: 4 });
  const repeated = await worker(); expect(await repeated.json()).toMatchObject({ sent: 0, claimed: 0 });
  expect((await holder.db.collection(C.receipts).get()).size).toBe(4);
  const response = await list(request()); expect(response.status).toBe(200);
  const inbox = await response.json(); expect(inbox.unreadCount).toBe(4);
  expect(inbox.notifications.map((item: { type: string }) => item.type).sort()).toEqual(['booking_cancelled', 'booking_changed', 'booking_confirmed', 'capacity_full']);
  expect(JSON.stringify(inbox)).not.toMatch(/private@example|Private Person|9876543210|mock:|leaseId/);
  const id = inbox.notifications[0].id;
  expect((await mutate(request('PATCH', { ids: [id], action: 'read' }))).status).toBe(200);
  expect((await (await list(request())).json()).unreadCount).toBe(3);
  expect((await mutate(request('PATCH', { ids: [id], action: 'dismiss' }))).status).toBe(200);
  expect((await (await list(request())).json()).notifications).toHaveLength(3);
  expect((await unregister(request('DELETE', device()))).status).toBe(200);
  expect((await holder.db.collection(C.devices).get()).empty).toBe(true);
});
it.skipIf(!enabled)('rejects missing, malformed, expired, disabled and non-admin identity at every notification endpoint', async () => {
  const endpoints = [list, mutate, register, unregister];
  for (const endpoint of endpoints) expect((await endpoint(new Request('http://localhost', { method: 'PATCH' }))).status).toBe(401);
  for (const endpoint of endpoints) expect((await endpoint(request('PATCH', {}, 'invalid-token'))).status).toBe(401);
  const parts = token.split('.'); const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  const expired = [parts[0], Buffer.from(JSON.stringify({ ...payload, exp: 1 })).toString('base64url'), parts[2]].join('.');
  for (const endpoint of endpoints) expect((await endpoint(request('PATCH', {}, expired))).status).toBe(401);
  await holder.auth.updateUser(uid, { disabled: true });
  for (const endpoint of endpoints) expect((await endpoint(request('PATCH', {}))).status).toBe(401);
  await holder.auth.updateUser(uid, { disabled: false }); await holder.db.collection('adminUsers').doc(uid).delete();
  for (const endpoint of endpoints) expect((await endpoint(request('PATCH', {}))).status).toBe(403);
  expect((await worker(token)).status).toBe(401);
});
it.skipIf(!enabled)('rejects revoked tokens and caller-supplied role claims do not bypass the Firestore allowlist', async () => {
  const parts = token.split('.'); const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  await holder.auth.revokeRefreshTokens(uid);
  // Emulator tokens are unsigned. Simulate an older auth_time rather than sleeping for a clock boundary.
  const revoked = [parts[0], Buffer.from(JSON.stringify({ ...payload, auth_time: payload.auth_time - 60 })).toString('base64url'), parts[2]].join('.');
  expect((await list(request('GET', undefined, revoked))).status).toBe(401);
  await holder.db.collection('adminUsers').doc(uid).set({ role: 'user' });
  const claimed = [parts[0], Buffer.from(JSON.stringify({ ...payload, role: 'admin', admin: true })).toString('base64url'), parts[2]].join('.');
  expect((await list(request('GET', undefined, claimed))).status).toBe(403);
});
