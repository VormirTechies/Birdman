import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  auth: { currentUser: { uid: 'admin-a' } as { uid: string } | null },
  fetch: vi.fn(), getToken: vi.fn(), deleteToken: vi.fn(), supported: vi.fn(), signOut: vi.fn(),
  permission: vi.fn(), register: vi.fn(), update: vi.fn(),
}));
vi.mock('@/firebase', () => ({ auth: mocks.auth }));
vi.mock('./authenticated-fetch', () => ({ authenticatedFetch: mocks.fetch }));
vi.mock('firebase/app', () => ({ getApp: () => ({}) }));
vi.mock('firebase/auth', () => ({ signOut: mocks.signOut }));
vi.mock('firebase/messaging', () => ({ getMessaging: () => ({}),
  getToken: mocks.getToken, deleteToken: mocks.deleteToken, isSupported: mocks.supported }));
const fcm = { mode: 'fcm' as const, vapidKey: 'A'.repeat(87), configured: true };
const mock = { mode: 'mock' as const, vapidKey: null, configured: true };
beforeEach(() => {
  vi.resetModules(); vi.resetAllMocks(); localStorage.clear(); sessionStorage.clear();
  mocks.auth.currentUser = { uid: 'admin-a' };
  mocks.fetch.mockResolvedValue(new Response('{}', { status: 201 }));
  mocks.getToken.mockResolvedValue('valid-fcm-registration-token'); mocks.deleteToken.mockResolvedValue(true);
  mocks.supported.mockResolvedValue(true);
  mocks.permission.mockResolvedValue('granted'); mocks.update.mockResolvedValue(undefined);
  vi.stubGlobal('MessageChannel', class {
    port1 = { onmessage: null as null | ((event: { data: { ready: boolean } }) => void), close: () => {} };
    port2 = { close: () => {}, parent: this };
  });
  const registration = { update: mocks.update, active: { postMessage: (_data: unknown, ports: { parent: { port1: { onmessage: (event: unknown) => void } } }[]) => {
    ports[0].parent.port1.onmessage({ data: { ready: true } });
  } } };
  mocks.register.mockResolvedValue(registration);
  vi.stubGlobal('Notification', { permission: 'default', requestPermission: mocks.permission });
  vi.stubGlobal('isSecureContext', true);
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true,
    value: { register: mocks.register, ready: Promise.resolve(registration) } });
});
afterEach(() => { vi.unstubAllGlobals(); });

it('creates a mock device without calling browser permission or FCM', async () => {
  const client = await import('./notification-client');
  expect(await client.enableAdminNotifications(mock)).toBe(true);
  expect(mocks.permission).not.toHaveBeenCalled(); expect(mocks.getToken).not.toHaveBeenCalled();
  expect(mocks.fetch).toHaveBeenCalledWith('/api/admin/notifications/devices', expect.objectContaining({ method: 'POST' }));
  const body = JSON.parse(mocks.fetch.mock.calls[0][1].body);
  expect(body.token).toMatch(/^mock:/); expect(body.uid).toBeUndefined();
  await client.signOutAdmin(); expect(mocks.signOut).toHaveBeenCalledOnce();
  expect(JSON.parse(mocks.fetch.mock.calls[1][1].body)).toEqual(body);
  expect(localStorage.getItem('birdman-notification-owner')).toBeNull();
});
it('requests permission and registers FCM using the existing PWA worker', async () => {
  const client = await import('./notification-client');
  await client.enableAdminNotifications(fcm);
  expect(mocks.permission).toHaveBeenCalledOnce();
  expect(mocks.register).toHaveBeenCalledWith('/sw.js', { updateViaCache: 'none' });
  expect(mocks.getToken).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ vapidKey: fcm.vapidKey }));
  await client.signOutAdmin();
  expect(mocks.deleteToken).toHaveBeenCalledOnce();
  expect(mocks.fetch.mock.calls[1][1].method).toBe('DELETE');
  expect(mocks.deleteToken.mock.invocationCallOrder[0]).toBeLessThan(mocks.signOut.mock.invocationCallOrder[0]);
});
it('does not silently opt in when restoring without consent', async () => {
  const client = await import('./notification-client');
  expect(await client.enableAdminNotifications(fcm, false)).toBe(false);
  expect(mocks.getToken).not.toHaveBeenCalled(); expect(mocks.permission).not.toHaveBeenCalled();
});
it('refreshes registrations without showing another permission prompt', async () => {
  const client = await import('./notification-client');
  localStorage.setItem('birdman-notification-owner', 'admin-a');
  vi.stubGlobal('Notification', { permission: 'granted', requestPermission: mocks.permission });
  await client.enableAdminNotifications(fcm, false);
  expect(mocks.permission).not.toHaveBeenCalled(); expect(mocks.getToken).toHaveBeenCalledOnce();
});
it('rejects denied permission, unsupported browsers and missing setup', async () => {
  const client = await import('./notification-client');
  mocks.permission.mockResolvedValue('denied');
  await expect(client.enableAdminNotifications(fcm)).rejects.toThrow('blocked');
  mocks.permission.mockResolvedValue('granted');
  mocks.supported.mockResolvedValue(false);
  await expect(client.enableAdminNotifications(fcm)).rejects.toThrow('not supported');
  await expect(client.enableAdminNotifications({ ...fcm, configured: false })).rejects.toThrow('not configured');
  expect(mocks.fetch).not.toHaveBeenCalled();
});
it('revokes a token if server registration fails without leaking it in errors', async () => {
  const client = await import('./notification-client');
  mocks.fetch.mockResolvedValue(new Response('{}', { status: 409 }));
  await expect(client.enableAdminNotifications(fcm)).rejects.toThrow('another account');
  expect(mocks.deleteToken).toHaveBeenCalledOnce(); expect(localStorage.length).toBe(0);
});
it('blocks logout when server removal AND FCM revocation fail', async () => {
  const client = await import('./notification-client'); await client.enableAdminNotifications(fcm);
  mocks.fetch.mockRejectedValue(new Error('offline')); mocks.deleteToken.mockRejectedValue(new Error('offline'));
  await expect(client.signOutAdmin()).rejects.toThrow('Unable to disable');
  expect(mocks.signOut).not.toHaveBeenCalled();
});
it('allows logout after token revocation even when server cleanup is unavailable', async () => {
  const client = await import('./notification-client'); await client.enableAdminNotifications(fcm);
  mocks.fetch.mockRejectedValue(new Error('offline'));
  await client.signOutAdmin(); expect(mocks.signOut).toHaveBeenCalledOnce();
});
