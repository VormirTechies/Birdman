import { Timestamp, type Firestore } from 'firebase-admin/firestore';
import { NOTIFICATION_COLLECTIONS } from '@/models/firestore/notification';

// Inject a server Admin SDK database; no client endpoint exposes this operation.
// Production uses TTL. This bounded fallback defaults to a read-only dry-run.
export async function cleanupExpiredNotifications(db: Firestore, limit = 100, now = Timestamp.now(), apply = false) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 500) throw new Error('Cleanup limit must be 1–500');
  const result: Record<string, number> = {};
  for (const collection of Object.values(NOTIFICATION_COLLECTIONS)) {
    const snapshot = await db.collection(collection).where('expiresAt', '<=', now)
      .orderBy('expiresAt').limit(limit).get();
    if (!apply) { result[collection] = snapshot.size; continue; }
    let deleted = 0;
    for (const candidate of snapshot.docs) {
      const removed = await db.runTransaction(async transaction => {
        const current = await transaction.get(candidate.ref);
        const expiry = current.data()?.expiresAt;
        if (!current.exists || !(expiry instanceof Timestamp) || expiry.toMillis() > now.toMillis()) return false;
        transaction.delete(candidate.ref);
        return true;
      });
      if (removed) deleted++;
    }
    result[collection] = deleted;
  }
  return result;
}
