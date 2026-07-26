import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/admin/push/route';
import { requireAdmin } from '@/lib/require-admin';
import webpush from 'web-push';

vi.mock('@/lib/require-admin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn(),
  },
}));

describe('/api/admin/push', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'public-key');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'private-key');
    vi.mocked(requireAdmin).mockResolvedValue({
      user: { uid: 'admin-1' } as never,
      response: null,
    });
  });

  function request(body: unknown) {
    return new NextRequest('http://localhost/api/admin/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('sends a push notification for an authenticated admin', async () => {
    vi.mocked(webpush.sendNotification).mockResolvedValue({} as never);
    const subscription = {
      endpoint: 'https://push.example.com/subscription',
      keys: { auth: 'auth', p256dh: 'key' },
    };

    const response = await POST(
      request({
        subscription,
        notification: {
          title: 'Booking received',
          body: 'A visitor made a booking',
        },
      })
    );

    expect(response.status).toBe(200);
    expect(webpush.setVapidDetails).toHaveBeenCalledWith(
      'mailto:admin@parrotsudarson.org',
      'public-key',
      'private-key'
    );
    expect(webpush.sendNotification).toHaveBeenCalledWith(
      subscription,
      JSON.stringify({
        title: 'Booking received',
        body: 'A visitor made a booking',
        url: '/admin',
        tag: 'admin-notification',
      })
    );
    expect(await response.json()).toEqual({ success: true });
  });

  it('rejects incomplete push data', async () => {
    const response = await POST(request({ subscription: {} }));

    expect(response.status).toBe(400);
    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });

  it('returns an error when VAPID is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', '');
    vi.stubEnv('VAPID_PRIVATE_KEY', '');

    const response = await POST(
      request({
        subscription: { endpoint: 'https://push.example.com/subscription' },
        notification: { title: 'Title', body: 'Body' },
      })
    );

    expect(response.status).toBe(500);
    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });

  it.each([404, 410])(
    'marks an expired subscription when web push returns %s',
    async (statusCode) => {
      vi.mocked(webpush.sendNotification).mockRejectedValue({
        statusCode,
        message: 'Expired',
      });

      const response = await POST(
        request({
          subscription: { endpoint: 'https://push.example.com/subscription' },
          notification: { title: 'Title', body: 'Body' },
        })
      );

      expect(response.status).toBe(410);
      expect(await response.json()).toEqual({
        error: 'Push subscription expired',
        expired: true,
      });
    }
  );

  it('returns the Firebase authorization response', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({
      user: null,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    });

    const response = await POST(request({}));

    expect(response.status).toBe(403);
    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });
});
