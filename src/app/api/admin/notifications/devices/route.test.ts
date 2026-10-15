// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), register: vi.fn(), unregister: vi.fn(), config: vi.fn() }));
vi.mock('@/lib/require-admin', () => ({ requireAdmin: mocks.auth }));
vi.mock('@/lib/firebase/notification-config', () => ({ resolveNotificationConfig: mocks.config }));
vi.mock('@/lib/firebase/notification-devices', () => ({
  registerNotificationDevice: mocks.register, unregisterNotificationDevice: mocks.unregister,
  NotificationDeviceOwnershipError: class extends Error {}, NotificationAdminRequiredError: class extends Error {},
}));
import { GET, POST, DELETE } from './route';
import { NotificationDeviceOwnershipError } from '@/lib/firebase/notification-devices';
const token = 'mock:11111111-1111-1111-1111-111111111111';
const request = (data: unknown, method = 'POST') => new Request('http://localhost/api/admin/notifications/devices', {
  method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
});
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ user: { uid: 'server-uid' } });
  mocks.config.mockReturnValue({ mode: 'mock', configured: true, vapidKey: null });
  mocks.register.mockResolvedValue({ id: 'safe-device-id' });
});
it.each([GET, POST, DELETE])('rejects missing/invalid/revoked/non-admin authorization before data operations', async route => {
  for (const status of [401, 403]) {
    mocks.auth.mockResolvedValue({ user: null, response: NextResponse.json({ success: false }, { status }) });
    expect((await route(request({ token }))).status).toBe(status);
    expect(mocks.register).not.toHaveBeenCalled(); expect(mocks.unregister).not.toHaveBeenCalled();
  }
  expect(mocks.auth).toHaveBeenCalledWith(expect.any(Request), { checkRevoked: true });
});
it('returns environment configuration only, never device tokens', async () => {
  expect(await (await GET(new Request('http://localhost'))).json()).toEqual({ success: true, mode: 'mock', configured: true, vapidKey: null });
});
it('derives ownership from the verified token and returns a safe registration response', async () => {
  const response = await POST(request({ token }));
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ success: true, id: 'safe-device-id' });
  expect(mocks.register).toHaveBeenCalledWith('server-uid', { token });
  expect(response.headers.get('Cache-Control')).toBe('no-store');
});
it.each([{ token, uid: 'attacker' }, { token, expiresAt: 0 }, { token: '' }, { token: 'x'.repeat(4097) }])(
  'rejects unknown/manipulated/invalid payload fields %j', async data => {
    expect((await POST(request(data))).status).toBe(400); expect(mocks.register).not.toHaveBeenCalled();
  },
);
it('rejects oversized and malformed request bodies', async () => {
  expect((await POST(request({ token: 'x'.repeat(9000) }))).status).toBe(413);
  expect((await POST(new Request('http://localhost', { method: 'POST', body: '{' }))).status).toBe(400);
});
it('rejects cross-account registration and hides backend errors', async () => {
  mocks.register.mockRejectedValue(new NotificationDeviceOwnershipError());
  expect((await POST(request({ token }))).status).toBe(409);
  mocks.register.mockRejectedValue(new Error('private database details'));
  const response = await POST(request({ token }));
  expect(response.status).toBe(503); expect(JSON.stringify(await response.json())).not.toContain('private');
});
it('unregisters only the authenticated owner', async () => {
  expect((await DELETE(request({ token }, 'DELETE'))).status).toBe(200);
  expect(mocks.unregister).toHaveBeenCalledWith('server-uid', { token });
});
it('does not register mock tokens in production or real tokens in mock mode', async () => {
  expect((await POST(request({ token: 'real-token-that-is-long-enough' }))).status).toBe(400);
  mocks.config.mockReturnValue({ mode: 'fcm', configured: true });
  expect((await POST(request({ token }))).status).toBe(400);
});
