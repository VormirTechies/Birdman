import webpush from 'web-push';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';

// Configure VAPID
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@birdmanofchennai.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function sendPushToAllAdmins(payload: { title: string; body: string; url?: string }) {
  console.log('[PUSH] Sending alerts to all registered admins...');

  try {
    const subscriptions = await db.query.pushSubscriptions.findMany();
    
    if (subscriptions.length === 0) {
        console.warn('[PUSH] No active subscriptions found in database.');
        return;
    }

    const promises = subscriptions.map(sub => {
      const pushConfig = JSON.parse(sub.subscription);
      return webpush.sendNotification(pushConfig, JSON.stringify(payload))
        .catch(err => {
            console.error('[PUSH] Failed for subscription:', sub.id, err);
            // Optional: delete invalid subscription from DB
        });
    });

    await Promise.all(promises);
    console.log(`[PUSH] Dispatched to ${subscriptions.length} devices.`);
  } catch (error) {
    console.error('[PUSH] Global send error:', error);
  }
}
