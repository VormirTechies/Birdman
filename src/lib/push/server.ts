import webpush from 'web-push';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// --- CONFIGURATION ---
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.replace(/['"]/g, '').trim();
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY?.replace(/['"]/g, '').trim();

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@birdmanofchennai.com',
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
}

/**
 * Dispatches a high-fidelity notification to all registered admins.
 * Automatically prunes "stale" (invalid) subscriptions from the database.
 */
export async function broadcastPush(payload: PushPayload) {
  console.log(`[PUSH] Broadcasting: "${payload.title}"`);

  try {
    const subscriptions = await db.query.pushSubscriptions.findMany();
    
    if (subscriptions.length === 0) {
        console.warn('[PUSH] No active subscriptions found.');
        return { success: true, count: 0 };
    }

    const results = await Promise.all(
        subscriptions.map(async (row) => {
            try {
                const subscription = JSON.parse(row.subscription);
                await webpush.sendNotification(subscription, JSON.stringify(payload));
                return { id: row.id, success: true };
            } catch (error: any) {
                // Remove stale subscriptions (410 Gone or 404 Not Found)
                if (error.statusCode === 410 || error.statusCode === 404) {
                    console.warn(`[PUSH] Pruning stale subscription: ${row.id}`);
                    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, row.id));
                } else {
                    console.error(`[PUSH] Delivery failed for ${row.id}:`, error.message);
                }
                return { id: row.id, success: false };
            }
        })
    );

    const successCount = results.filter(r => r.success).length;
    console.log(`[PUSH] Dispatch Complete. Sent: ${successCount}, Pruned: ${subscriptions.length - successCount}`);
    
    return { success: true, count: successCount };
  } catch (error) {
    console.error('[PUSH] Global Broadcast Error:', error);
    throw error;
  }
}
