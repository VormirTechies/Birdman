import 'server-only';
import { createHash } from 'node:crypto';
import { FieldPath, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { getAdminDb } from './admin';
import { NOTIFICATION_COLLECTIONS as C, notificationStateInputSchema,
  type NotificationDocument, type NotificationInboxPage } from '@/models/firestore/notification';

export class NotificationInboxAccessError extends Error {}
export class NotificationInboxMissingError extends Error {}
export function notificationStateId(uid: string, id: string) {
  return createHash('sha256').update(JSON.stringify([uid, id])).digest('hex');
}
const cursorSchema = z.object({ seconds: z.number().int().nonnegative().max(253402300799),
  nanoseconds: z.number().int().min(0).max(999999999), id: z.string().regex(/^[a-f0-9]{64}$/) }).strict();
export function decodeNotificationCursor(value: string) {
  if (value.length > 512 || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('INVALID_CURSOR');
  try { return cursorSchema.parse(JSON.parse(Buffer.from(value, 'base64url').toString('utf8'))); }
  catch { throw new Error('INVALID_CURSOR'); }
}
export const notificationListSchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(20),
  cursor: z.string().max(512).optional().transform(value => value ? decodeNotificationCursor(value) : undefined),
}).strict();

export async function listNotificationInbox(uid: string, input: z.infer<typeof notificationListSchema>,
  db: Firestore = getAdminDb(), now = Timestamp.now()): Promise<NotificationInboxPage> {
  // Bound scanning even when many events have been dismissed. Empty pages may have a continuation.
  let query = db.collection(C.history).where('createdAt', '>=', Timestamp.fromMillis(now.toMillis() - 90 * 86400000))
    .orderBy('createdAt', 'desc').orderBy(FieldPath.documentId(), 'desc');
  if (input.cursor) query = query.startAfter(new Timestamp(input.cursor.seconds, input.cursor.nanoseconds), input.cursor.id);
  const snapshot = await query.limit(101).get();
  const scanned = snapshot.docs.slice(0, 100);
  const states = scanned.length ? await db.getAll(...scanned.map(doc => db.collection(C.states).doc(notificationStateId(uid, doc.id)))) : [];
  const selected: { id: string; data: NotificationDocument; read: boolean }[] = [];
  let last: (typeof scanned)[number] | undefined;
  for (let i = 0; i < scanned.length; i++) {
    const doc = scanned[i]; last = doc;
    const data = doc.data() as NotificationDocument; const state = states[i].data();
    if (data.expiresAt.toMillis() <= now.toMillis() || state?.dismissedAt) continue;
    selected.push({ id: doc.id, data, read: Boolean(state?.readAt) });
    if (selected.length === input.limit) break;
  }
  const bookings = selected.filter(item => item.data.bookingId);
  const bookingSnapshots = bookings.length ? await db.getAll(...bookings.map(item => db.collection('bookings').doc(item.data.bookingId!))) : [];
  const exists = new Set(bookingSnapshots.filter(doc => doc.exists).map(doc => doc.id));
  const [total, read] = await Promise.all([
    db.collection(C.history).where('expiresAt', '>', now).count().get(),
    db.collection(C.states).where('uid', '==', uid).where('read', '==', true).where('expiresAt', '>', now).count().get(),
  ]);
  const hasMore = Boolean(last && snapshot.docs.indexOf(last) < snapshot.docs.length - 1);
  const timestamp = last?.get('createdAt') as Timestamp | undefined;
  return { notifications: selected.map(({ id, data, read }) => ({ id, type: data.type, title: data.title,
    body: data.body, bookingDate: data.bookingDate, bookingExists: Boolean(data.bookingId && exists.has(data.bookingId)),
    createdAt: data.createdAt.toDate().toISOString(), read, url: '/admin' })),
    unreadCount: Math.max(0, total.data().count - read.data().count),
    pagination: { limit: input.limit, hasMore, nextCursor: hasMore && timestamp && last
      ? Buffer.from(JSON.stringify({ seconds: timestamp.seconds, nanoseconds: timestamp.nanoseconds, id: last.id })).toString('base64url') : null } };
}

export async function updateNotificationStates(uid: string, input: unknown, db: Firestore = getAdminDb(), now = Timestamp.now()) {
  const { ids, action } = notificationStateInputSchema.parse(input);
  const unique = [...new Set(ids)];
  await db.runTransaction(async tx => {
    const role = await tx.get(db.collection('adminUsers').doc(uid));
    if (role.data()?.role !== 'admin') throw new NotificationInboxAccessError();
    const events = await Promise.all(unique.map(id => tx.get(db.collection(C.history).doc(id))));
    const refs = unique.map(id => db.collection(C.states).doc(notificationStateId(uid, id)));
    const states = await Promise.all(refs.map(ref => tx.get(ref)));
    if (events.some(event => !event.exists || event.get('expiresAt').toMillis() <= now.toMillis())) throw new NotificationInboxMissingError();
    refs.forEach((ref, index) => tx.set(ref, { uid, notificationId: unique[index], read: true,
      readAt: states[index].get('readAt') ?? now,
      dismissedAt: action === 'dismiss' ? states[index].get('dismissedAt') ?? now : states[index].get('dismissedAt') ?? null,
      expiresAt: events[index].get('expiresAt') }));
  });
}
