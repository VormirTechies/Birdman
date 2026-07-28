import webpush from 'web-push';
import { getAdminDb } from '@/lib/firebase/admin';

// --- CONFIGURATION ---
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.replace(/['"]/g, '').trim();
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY?.replace(/['"]/g, '').trim();

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@parrotsudarson.org',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

// --- CORE UTILITIES ---

export interface PushPayload {
    title: string;
    body: string;
    url?: string;
    icon?: string;
    badge?: string;
    visitorName?: string;
    bookingDate?: string;
}

/**
 * Dispatches a high-fidelity notification to all registered admins.
 * Automatically prunes "stale" (invalid) subscriptions from the database.
 */
export async function broadcastPush(payload: PushPayload) {
  console.log(`[PUSH] Broadcasting: "${payload.title}"`);

  try {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      throw new Error('Push notifications are not configured: VAPID keys are missing');
    }

    const snapshot = await getAdminDb().collection('admin_push_subscriptions').get();
    const subscriptions = snapshot.docs.map((document) => ({
      id: document.id,
      reference: document.ref,
      subscription: document.data().subscription,
    }));
    
    if (subscriptions.length === 0) {
        console.warn('[PUSH] No active subscriptions found.');
        return { success: true, count: 0 };
    }

    const results = await Promise.all(
        subscriptions.map(async (row) => {
            try {
                await webpush.sendNotification(row.subscription, JSON.stringify(payload));
                return { id: row.id, success: true };
            } catch (error: unknown) {
                const pushError = error as { statusCode?: number; message?: string };
                // Remove stale subscriptions (410 Gone or 404 Not Found)
                if (pushError.statusCode === 410 || pushError.statusCode === 404) {
                    console.warn(`[PUSH] Pruning stale subscription: ${row.id}`);
                    await row.reference.delete();
                } else {
                    console.error(
                      `[PUSH] Delivery failed for ${row.id}:`,
                      pushError.message ?? 'Unknown push delivery error'
                    );
                }
                return { id: row.id, success: false };
            }
        })
    );

    const successCount = results.filter(r => r.success).length;
    const failedCount = subscriptions.length - successCount;
    console.log(`[PUSH] Dispatch Complete. Sent: ${successCount}, Failed or pruned: ${failedCount}`);
    
    return { success: true, count: successCount, failedCount };
  } catch (error) {
    console.error('[PUSH] Global Broadcast Error:', error);
    throw error;
  }
}
