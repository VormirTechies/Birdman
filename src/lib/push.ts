import { broadcastPush, type PushPayload } from '@/lib/push/server';

/**
 * Compatibility entry point used by booking and feedback flows.
 * Subscriptions are stored in Firestore by /api/admin/push/subscribe.
 */
export async function sendPushToAllAdmins(payload: PushPayload) {
  return broadcastPush(payload);
}
