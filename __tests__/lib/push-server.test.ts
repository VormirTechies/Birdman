import { beforeEach, describe, expect, it, vi } from 'vitest';
import webpush from 'web-push';
import { getAdminDb } from '@/lib/firebase/admin';

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}));

vi.mock('@/lib/firebase/admin', () => ({
  getAdminDb: vi.fn(),
}));

describe('Firestore push broadcaster', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'public-key');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'private-key');
  });

  it('loads subscriptions from Firestore and broadcasts to each device', async () => {
    const collection = vi.fn(() => ({
      get: vi.fn().mockResolvedValue({
        docs: [
          {
            id: 'admin-1_endpoint-1',
            ref: { delete: vi.fn() },
            data: () => ({ subscription: { endpoint: 'https://push.example/1' } }),
          },
          {
            id: 'admin-2_endpoint-2',
            ref: { delete: vi.fn() },
            data: () => ({ subscription: { endpoint: 'https://push.example/2' } }),
          },
        ],
      }),
    }));
    vi.mocked(getAdminDb).mockReturnValue({ collection } as never);
    vi.mocked(webpush.sendNotification).mockResolvedValue({} as never);

    const { broadcastPush } = await import('@/lib/push/server');
    const payload = {
      title: 'New booking',
      body: 'A new visit was booked',
      url: '/admin',
    };
    const result = await broadcastPush(payload);

    expect(collection).toHaveBeenCalledWith('admin_push_subscriptions');
    expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
    expect(webpush.sendNotification).toHaveBeenNthCalledWith(
      1,
      { endpoint: 'https://push.example/1' },
      JSON.stringify(payload)
    );
    expect(result).toEqual({ success: true, count: 2, failedCount: 0 });
  });

  it.each([404, 410])('deletes a stale Firestore subscription after HTTP %s', async (statusCode) => {
    const deleteSubscription = vi.fn().mockResolvedValue(undefined);
    const collection = vi.fn(() => ({
      get: vi.fn().mockResolvedValue({
        docs: [
          {
            id: 'stale-subscription',
            ref: { delete: deleteSubscription },
            data: () => ({ subscription: { endpoint: 'https://push.example/stale' } }),
          },
        ],
      }),
    }));
    vi.mocked(getAdminDb).mockReturnValue({ collection } as never);
    vi.mocked(webpush.sendNotification).mockRejectedValue({
      statusCode,
      message: 'Subscription expired',
    });

    const { broadcastPush } = await import('@/lib/push/server');
    const result = await broadcastPush({ title: 'Test', body: 'Test body' });

    expect(deleteSubscription).toHaveBeenCalledOnce();
    expect(result).toEqual({ success: true, count: 0, failedCount: 1 });
  });

  it('uses Firestore when the compatibility sender is called', async () => {
    const collection = vi.fn(() => ({
      get: vi.fn().mockResolvedValue({ docs: [] }),
    }));
    vi.mocked(getAdminDb).mockReturnValue({ collection } as never);

    const { sendPushToAllAdmins } = await import('@/lib/push');
    const result = await sendPushToAllAdmins({ title: 'Test', body: 'No devices' });

    expect(collection).toHaveBeenCalledWith('admin_push_subscriptions');
    expect(result).toEqual({ success: true, count: 0 });
  });
});
