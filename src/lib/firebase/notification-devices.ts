import 'server-only';
import { createHash } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from './admin';
import { NOTIFICATION_COLLECTIONS, notificationDeviceInputSchema } from '@/models/firestore/notification';
import { notificationExpiry } from './notification-retention';

export class NotificationDeviceOwnershipError extends Error {}
export class NotificationAdminRequiredError extends Error {}
export function notificationDeviceId(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function registerNotificationDevice(uid: string, input: unknown) {
  const { token } = notificationDeviceInputSchema.parse(input);
  const db = getAdminDb();
  const ref = db.collection(NOTIFICATION_COLLECTIONS.devices).doc(notificationDeviceId(token));
  await db.runTransaction(async tx => {
    const [role, device] = await Promise.all([
      tx.get(db.collection('adminUsers').doc(uid)), tx.get(ref),
    ]);
    if (role.data()?.role !== 'admin') throw new NotificationAdminRequiredError();
    const previous = device.data();
    if (device.exists && previous?.uid !== uid) throw new NotificationDeviceOwnershipError();
    const now = Timestamp.now();
    tx.set(ref, { uid, token, createdAt: previous?.createdAt ?? now,
      lastSeenAt: now, expiresAt: notificationExpiry('devices', now) });
  });
  return { id: ref.id };
}

export async function unregisterNotificationDevice(uid: string, input: unknown) {
  const { token } = notificationDeviceInputSchema.parse(input);
  const db = getAdminDb();
  const ref = db.collection(NOTIFICATION_COLLECTIONS.devices).doc(notificationDeviceId(token));
  await db.runTransaction(async tx => {
    const snapshot = await tx.get(ref);
    if (!snapshot.exists) return;
    if (snapshot.data()?.uid !== uid) throw new NotificationDeviceOwnershipError();
    tx.delete(ref);
  });
}
