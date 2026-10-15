// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), list: vi.fn(), update: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/require-admin', () => ({ requireAdmin: mocks.auth }));
vi.mock('@/lib/firebase/admin', () => ({ getAdminDb: vi.fn() }));
vi.mock('@/lib/firebase/notification-inbox', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/firebase/notification-inbox')>(), listNotificationInbox: mocks.list, updateNotificationStates: mocks.update,
}));
import { GET, PATCH } from './route';
import { NotificationInboxAccessError, NotificationInboxMissingError } from '@/lib/firebase/notification-inbox';
const id = 'a'.repeat(64);
const request = (input: unknown) => new Request('http://localhost/api/admin/notifications', { method: 'PATCH', body: JSON.stringify(input) });
beforeEach(() => { vi.resetAllMocks(); mocks.auth.mockResolvedValue({ user: { uid: 'verified-admin' } });
  mocks.list.mockResolvedValue({ notifications: [], unreadCount: 0, pagination: { limit: 20, hasMore: false, nextCursor: null } }); });
it.each([401, 403])('rejects unauthorized calls (%i) before repository access', async status => {
  mocks.auth.mockResolvedValue({ response: NextResponse.json({}, { status }) });
  expect((await GET(new Request('http://localhost'))).status).toBe(status); expect((await PATCH(request({ ids: [id], action: 'read' }))).status).toBe(status);
  expect(mocks.list).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.auth).toHaveBeenCalledWith(expect.any(Request), { checkRevoked: true });
});
it('uses a verified uid, default size 20 and no-store responses', async () => {
  const response = await GET(new Request('http://localhost')); expect(response.status).toBe(200);
  expect(mocks.list).toHaveBeenCalledWith('verified-admin', { limit: 20 }); expect(response.headers.get('Cache-Control')).toBe('no-store');
  expect((await PATCH(request({ ids: [id], action: 'dismiss' }))).status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith('verified-admin', { ids: [id], action: 'dismiss' });
});
it.each(['?limit=21', '?limit=0', '?limit=1.5', '?uid=other', '?cursor=invalid', '?limit=1&limit=2'])('rejects invalid query %s', async query => {
  expect((await GET(new Request(`http://localhost/${query}`))).status).toBe(400); expect(mocks.list).not.toHaveBeenCalled();
});
it.each([{ ids: [id], action: 'read', uid: 'other' }, { ids: [id], action: 'read', readAt: 0 }, { ids: ['../other'], action: 'dismiss' },
  { ids: [], action: 'read' }, { ids: Array(21).fill(id), action: 'read' }, { ids: [id], action: 'delete' }])('rejects manipulated state %j', async input => {
  expect((await PATCH(request(input))).status).toBe(400); expect(mocks.update).not.toHaveBeenCalled();
});
it('limits streamed body size and hides database failures', async () => {
  expect((await PATCH(request({ extra: 'x'.repeat(5000) }))).status).toBe(413);
  mocks.list.mockRejectedValue(new Error('private token/database')); const result = await GET(new Request('http://localhost'));
  expect(result.status).toBe(503); expect(JSON.stringify(await result.json())).not.toContain('private');
});
it.each([[NotificationInboxAccessError, 403], [NotificationInboxMissingError, 404], [Error, 503]] as const)('maps mutation failures safely', async (ErrorType, status) => {
  mocks.update.mockRejectedValue(new ErrorType('private')); const result = await PATCH(request({ ids: [id], action: 'read' }));
  expect(result.status).toBe(status); expect(JSON.stringify(await result.json())).not.toContain('private');
});
