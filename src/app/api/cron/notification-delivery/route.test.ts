// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock('@/lib/firebase/notification-delivery', () => ({ runNotificationDeliveryWorker: mocks.run }));
import { POST } from './route';
const secret = 'notification-test-secret-with-32-characters';
const request = (authorization?: string) => new Request('http://localhost/api/cron/notification-delivery', {
  method: 'POST', headers: authorization ? { Authorization: authorization } : {},
});
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv('NOTIFICATIONS_WORKER_SECRET', secret); });
afterEach(() => vi.unstubAllEnvs());
it.each([undefined, '', 'Bearer wrong', 'Bearer', 'Basic anything'])(
  'rejects unauthorized worker calls %j', async header => {
    expect((await POST(request(header))).status).toBe(401); expect(mocks.run).not.toHaveBeenCalled();
  },
);
it.each(['', '   ', 'too-short'])('fails closed with invalid secret configuration', async value => {
  vi.stubEnv('NOTIFICATIONS_WORKER_SECRET', value);
  expect((await POST(request(`Bearer ${value}`))).status).toBe(401); expect(mocks.run).not.toHaveBeenCalled();
});
it('runs only with the exact secret and returns counts without job data', async () => {
  mocks.run.mockResolvedValue({ claimed: 1, sent: 2, completed: 1 });
  const response = await POST(request(`Bearer ${secret}`));
  expect(response.status).toBe(200); expect(await response.json()).toEqual({ success: true, claimed: 1, sent: 2, completed: 1 });
  expect(response.headers.get('Cache-Control')).toBe('no-store');
});
it('hides internal database/delivery errors', async () => {
  mocks.run.mockRejectedValue(new Error('private token'));
  const response = await POST(request(`Bearer ${secret}`));
  expect(response.status).toBe(503); expect(JSON.stringify(await response.json())).not.toContain('private');
});
