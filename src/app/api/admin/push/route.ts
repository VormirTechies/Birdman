import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { requireAdmin } from '@/lib/require-admin';

function configureWebPush() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    ?.replace(/['"]/g, '')
    .trim();
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY
    ?.replace(/['"]/g, '')
    .trim();

  if (!vapidPublicKey || !vapidPrivateKey) return false;
  webpush.setVapidDetails(
    'mailto:admin@parrotsudarson.org',
    vapidPublicKey,
    vapidPrivateKey
  );
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { subscription, notification } = await request.json();

    if (
      !subscription
      || typeof subscription.endpoint !== 'string'
      || !notification
      || typeof notification.title !== 'string'
      || typeof notification.body !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Missing subscription or notification data' },
        { status: 400 }
      );
    }

    if (!configureWebPush()) {
      return NextResponse.json(
        { error: 'Push notifications not configured on server' },
        { status: 500 }
      );
    }

    // Send the push notification
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      url: notification.url || '/admin',
      tag: notification.tag || 'admin-notification',
    });

    await webpush.sendNotification(subscription, payload);

    console.log('[Push API] Notification sent successfully');
    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    console.error('[Push API] Error:', error);

    const pushError = error as { statusCode?: number; message?: string };
    if (pushError.statusCode === 410 || pushError.statusCode === 404) {
      return NextResponse.json(
        { error: 'Push subscription expired', expired: true },
        { status: 410 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to send push notification',
        details: pushError.message ?? 'Unknown push delivery error',
      },
      { status: 500 }
    );
  }
}
