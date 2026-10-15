// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { runInNewContext } from 'node:vm';
import { GET } from './route';
afterEach(() => vi.unstubAllEnvs());
it('returns no FCM initialization in local mock mode', async () => {
  vi.stubEnv('NODE_ENV', 'development'); vi.stubEnv('FIREBASE_USE_LIVE', 'false');
  vi.stubEnv('NOTIFICATIONS_DELIVERY_MODE', 'mock');
  expect(await GET().text()).not.toContain('importScripts');
});
it('generates valid worker JavaScript with only public Firebase configuration', async () => {
  vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('FIRESTORE_EMULATOR_HOST', '');
  vi.stubEnv('NOTIFICATIONS_DELIVERY_MODE', 'fcm');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_FCM_VAPID_KEY', 'A'.repeat(87));
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'birdman-7e745');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_API_KEY', 'public-web-api-key');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_APP_ID', 'public-app-id');
  vi.stubEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', '123456');
  vi.stubEnv('GMAIL_PASS', 'do-not-expose-test-secret');
  const response = GET(); const script = await response.text();
  expect(response.status).toBe(200); expect(script).not.toContain('do-not-expose');
  let receive: (payload: unknown) => Promise<void> = async () => {};
  const postMessage = vi.fn();
  const initializeApp = vi.fn(); const messaging = vi.fn(() => ({ onBackgroundMessage: (callback: typeof receive) => { receive = callback; } }));
  const self = { location: { origin: 'https://birdman.example' }, clients: { matchAll: async () => [
    { url: 'https://birdman.example/admin/history', postMessage },
    { url: 'https://evil.example/admin', postMessage: vi.fn(() => { throw new Error('wrong origin'); }) },
    { url: 'https://birdman.example/book', postMessage: vi.fn(() => { throw new Error('public page'); }) },
  ] } };
  runInNewContext(script, { URL, self, importScripts: vi.fn(), firebase: { initializeApp, messaging } });
  expect(initializeApp).toHaveBeenCalledWith(expect.objectContaining({ projectId: 'birdman-7e745' }));
  expect(messaging).toHaveBeenCalledOnce();
  const payload = { notification: { title: 'Generic alert' }, data: { notificationId: 'a'.repeat(64) } };
  await receive(payload); await receive(payload); await receive({ data: { notificationId: '../invalid' } });
  expect(postMessage).toHaveBeenCalledOnce();
  expect(postMessage).toHaveBeenCalledWith({ type: 'BIRDMAN_NOTIFICATION', notificationId: 'a'.repeat(64) });
  expect(script).not.toContain('showNotification');
});
