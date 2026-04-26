import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';

// Configure VAPID keys for web push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:admin@birdmanofchennai.com',
    vapidPublicKey,
    vapidPrivateKey
  );
} else {
  console.warn('[Push API] VAPID keys not configured. Push notifications will not work.');
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const { subscription, notification } = await request.json();

    if (!subscription || !notification) {
      return NextResponse.json(
        { error: 'Missing subscription or notification data' },
        { status: 400 }
      );
    }

    // Validate VAPID keys are configured
    if (!vapidPublicKey || !vapidPrivateKey) {
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

  } catch (error: any) {
    console.error('[Push API] Error:', error);

    // Handle specific web-push errors
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription has expired or is no longer valid
      return NextResponse.json(
        { error: 'Push subscription expired', expired: true },
        { status: 410 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send push notification', details: error.message },
      { status: 500 }
    );
  }
}
