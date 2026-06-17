import webpush from 'web-push';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';

let vapidConfigured = false;
let vapidConfigFailed = false;

function configureVapid() {
  if (vapidConfigured) return true;
  if (vapidConfigFailed) return false;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    console.warn('[PUSH] VAPID keys are missing; skipping push notifications.');
    vapidConfigFailed = true;
    return false;
  }

  try {
    webpush.setVapidDetails(
      'mailto:admin@parrotsudarson.org',
      publicKey,
      privateKey
    );
    vapidConfigured = true;
    return true;
  } catch (error) {
    console.error('[PUSH] Invalid VAPID configuration; skipping push notifications:', error);
    vapidConfigFailed = true;
    return false;
  }
}

export async function sendPushToAllAdmins(payload: { title: string; body: string; url?: string; visitorName?: string; bookingDate?: string }) {
  console.log('[PUSH] Sending alerts to all registered admins...');

  try {
    if (!configureVapid()) return;

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
