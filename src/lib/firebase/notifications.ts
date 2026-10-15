import 'server-only';
import { createHash } from 'node:crypto';
import { Timestamp, type Firestore, type Transaction } from 'firebase-admin/firestore';
import { getAdminDb } from './admin';
import {
  NOTIFICATION_COLLECTIONS, notificationEventSchema,
  type NotificationEvent, type NotificationDeliveryJob,
} from '@/models/firestore/notification';
import { notificationExpiry } from './notification-retention';
export { cleanupExpiredNotifications } from './notification-cleanup';

export function notificationEventId(eventKey: string) {
  return createHash('sha256').update(eventKey).digest('hex');
}

// All existence reads finish before any event writes (Firestore transaction rule).
// Call after all booking/capacity reads and before any booking/capacity writes.
export async function stageNotificationEvents(
  transaction: Transaction, db: Firestore, inputs: NotificationEvent[], now = Timestamp.now(),
) {
  const events = inputs.map(input => notificationEventSchema.parse(input));
  const references = events.map(event => db.collection(NOTIFICATION_COLLECTIONS.history).doc(notificationEventId(event.eventKey)));
  if (new Set(references.map(ref => ref.id)).size !== references.length) throw new Error('Duplicate notification event keys');
  const snapshots = await Promise.all(references.map(ref => transaction.get(ref)));
  // Validate every existing event before queuing writes.
  snapshots.forEach((snapshot, index) => {
    if (snapshot.exists && Object.entries(events[index]).some(([key, value]) => snapshot.data()?.[key] !== value)) {
      throw new Error('Notification event identity collision');
    }
  });
  return events.map((event, index) => {
    const history = references[index];
    if (snapshots[index].exists) return { id: history.id, created: false };
    const job: NotificationDeliveryJob = {
      leaseId: null, deviceCursor: null,
      notificationId: history.id, status: 'pending', attempts: 0,
      nextAttemptAt: now, leaseUntil: null, createdAt: now, updatedAt: now,
      // Pending work must not be silently removed; Step 5 terminalizes exhausted jobs.
      expiresAt: null, lastErrorCode: null,
    };
    transaction.create(history, { ...event, createdAt: now, expiresAt: notificationExpiry('history', now) });
    transaction.create(db.collection(NOTIFICATION_COLLECTIONS.jobs).doc(history.id), job);
    return { id: history.id, created: true };
  });
}

export async function stageNotificationEvent(transaction: Transaction, db: Firestore, input: NotificationEvent, now = Timestamp.now()) {
  return (await stageNotificationEvents(transaction, db, [input], now))[0];
}

export async function createNotificationEvent(input: NotificationEvent) {
  const db = getAdminDb();
  return db.runTransaction(transaction => stageNotificationEvent(transaction, db, input));
}

