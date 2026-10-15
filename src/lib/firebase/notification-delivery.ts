import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { FieldPath, Timestamp, type DocumentReference, type Firestore } from 'firebase-admin/firestore';
import type { Message } from 'firebase-admin/messaging';
import { getAdminAuth, getAdminDb, getAdminMessaging } from './admin';
import { resolveNotificationConfig } from './notification-config';
import { terminalJobRetention } from './notification-retention';
import { NOTIFICATION_COLLECTIONS as C, notificationDeviceInputSchema, type NotificationEvent } from '@/models/firestore/notification';
import { DELIVERY_LEASE_MS, DELIVERY_MAX_AGE_MS, DELIVERY_MAX_ATTEMPTS, retryDelayMs,
  classifyDeliveryError, buildAdminPushMessage } from './notification-delivery-policy';

export interface NotificationWorkerDependencies {
  db: Firestore;
  mode: 'mock' | 'fcm';
  getUser: (uid: string) => Promise<{ disabled: boolean }>;
  send: (message: Message) => Promise<unknown>;
  clock?: () => number;
}

function defaults(): NotificationWorkerDependencies {
  const config = resolveNotificationConfig();
  if (!config.configured) throw new Error('Notification delivery is not configured');
  if (config.mode === 'mock' && !/^(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(process.env.FIREBASE_AUTH_EMULATOR_HOST || '')) {
    throw new Error('Mock delivery requires the local Auth emulator');
  }
  return { db: getAdminDb(), mode: config.mode,
    getUser: uid => getAdminAuth().getUser(uid),
    send: config.mode === 'mock' ? async () => 'mock-delivery' : message => getAdminMessaging().send(message) };
}

type Claim = { ref: DocumentReference; id: string; leaseId: string; attempts: number; cursor: string | null; type: NotificationEvent['type']; expiresAt: Timestamp };
const validTypes = new Set(['booking_confirmed', 'capacity_full', 'booking_changed', 'booking_cancelled']);

export async function runNotificationDeliveryWorker(deps = defaults()) {
  const clock = deps.clock ?? Date.now;
  const started = clock();
  const timestamp = () => Timestamp.fromMillis(clock());
  const result = { claimed: 0, sent: 0, skipped: 0, retried: 0, completed: 0, failed: 0 };
  const due = await deps.db.collection(C.jobs).where('status', 'in', ['pending', 'processing'])
    .where('nextAttemptAt', '<=', timestamp()).orderBy('nextAttemptAt').limit(5).get();

  for (const candidate of due.docs) {
    if (clock() - started > 35_000) break;
    const claim = await deps.db.runTransaction(async tx => {
      const job = await tx.get(candidate.ref); const data = job.data();
      if (!data || !['pending', 'processing'].includes(data.status) || data.nextAttemptAt?.toMillis() > clock()) return null;
      if (data.status === 'processing' && data.leaseUntil?.toMillis() > clock()) return null;
      const attempts = Number(data.attempts ?? 0);
      const old = !data.createdAt?.toMillis || clock() - data.createdAt.toMillis() > DELIVERY_MAX_AGE_MS;
      if (old || !Number.isInteger(attempts) || attempts < 0 || attempts >= DELIVERY_MAX_ATTEMPTS || data.notificationId !== job.id) {
        tx.update(job.ref, { ...terminalJobRetention('failed', timestamp()), lastErrorCode: 'delivery/job-expired-or-exhausted', leaseId: null });
        return { failed: true as const };
      }
      const event = await tx.get(deps.db.collection(C.history).doc(job.id));
      const history = event.data();
      if (!history || !validTypes.has(history.type) || !history.expiresAt?.toMillis || history.expiresAt.toMillis() <= clock()) {
        tx.update(job.ref, { ...terminalJobRetention('failed', timestamp()), lastErrorCode: 'delivery/event-unavailable', leaseId: null });
        return { failed: true as const };
      }
      const leaseId = randomUUID(); const leaseUntil = Timestamp.fromMillis(clock() + DELIVERY_LEASE_MS);
      tx.update(job.ref, { status: 'processing', leaseId, leaseUntil, nextAttemptAt: leaseUntil,
        attempts: attempts + 1, updatedAt: timestamp() });
      return { ref: job.ref, id: job.id, leaseId, attempts: attempts + 1,
        cursor: typeof data.deviceCursor === 'string' ? data.deviceCursor : null,
        type: history.type, expiresAt: history.expiresAt } as Claim;
    });
    if (!claim) continue;
    if ('failed' in claim) { result.failed++; continue; }
    result.claimed++;
    let query = deps.db.collection(C.devices).orderBy(FieldPath.documentId()).limit(20);
    if (claim.cursor) query = query.startAfter(claim.cursor);
    const devices = await query.get();
    let retryCode: string | null = null; let fatal = false; let interrupted = false;

    for (const device of devices.docs) {
      if (clock() - started > 35_000) { interrupted = true; break; }
      const receiptRef = deps.db.collection(C.receipts).doc(createHash('sha256').update(`${claim.id}:${device.id}`).digest('hex'));
      // Re-read ownership, role, expiry and receipt under the current fenced lease.
      const recipient = await deps.db.runTransaction(async tx => {
        const [job, currentDevice, receipt] = await Promise.all([tx.get(claim.ref), tx.get(device.ref), tx.get(receiptRef)]);
        if (job.data()?.leaseId !== claim.leaseId || job.data()?.status !== 'processing' || job.data()?.leaseUntil?.toMillis() <= clock()) return null;
        if (receipt.exists || !currentDevice.exists) return null;
        const data = currentDevice.data()!;
        const uid = typeof data.uid === 'string' && data.uid.length <= 128 && !data.uid.includes('/') ? data.uid : null;
        const role = uid ? await tx.get(deps.db.collection('adminUsers').doc(uid)) : null;
        const parsed = notificationDeviceInputSchema.safeParse({ token: data.token });
        const eligible = uid && role?.data()?.role === 'admin' && parsed.success && data.expiresAt?.toMillis?.() > clock()
          && (deps.mode === 'mock') === data.token.startsWith('mock:');
        const leaseUntil = Timestamp.fromMillis(clock() + DELIVERY_LEASE_MS);
        tx.update(claim.ref, { leaseUntil, nextAttemptAt: leaseUntil });
        if (!eligible) {
          tx.set(receiptRef, { notificationId: claim.id, deviceId: device.id, status: 'skipped', createdAt: timestamp(), expiresAt: claim.expiresAt });
          return { skipped: true as const };
        }
        return { uid: uid!, token: parsed.data!.token };
      });
      if (!recipient) continue;
      if ('skipped' in recipient) { result.skipped++; continue; }
      let prune = false; let sent = false;
      try {
        const user = await deps.getUser(recipient.uid);
        // Recheck Firestore membership/device after the external Auth lookup.
        const [role, current, liveJob] = await Promise.all([
          deps.db.collection('adminUsers').doc(recipient.uid).get(), device.ref.get(), claim.ref.get(),
        ]);
        if (liveJob.data()?.leaseId !== claim.leaseId || liveJob.data()?.leaseUntil?.toMillis() <= clock()) {
          interrupted = true; break;
        }
        if (user.disabled || role.data()?.role !== 'admin' || current.data()?.uid !== recipient.uid
          || current.data()?.token !== recipient.token || current.data()?.expiresAt?.toMillis?.() <= clock()) {
          prune = user.disabled || role.data()?.role !== 'admin';
        } else {
          if (clock() - started > 35_000) { interrupted = true; break; }
          const renewed = await deps.db.runTransaction(async tx => {
            const job = await tx.get(claim.ref);
            if (job.data()?.leaseId !== claim.leaseId || job.data()?.leaseUntil?.toMillis() <= clock()) return false;
            const leaseUntil = Timestamp.fromMillis(clock() + DELIVERY_LEASE_MS);
            tx.update(claim.ref, { leaseUntil, nextAttemptAt: leaseUntil });
            return true;
          });
          if (!renewed) { interrupted = true; break; }
          await deps.send(buildAdminPushMessage(claim.id, claim.type, recipient.token));
          sent = true; result.sent++;
        }
      } catch (error) {
        if ((error as { code?: string })?.code === 'auth/user-not-found') prune = true;
        else {
          const failure = classifyDeliveryError(error);
          if (failure.kind === 'invalid-token') prune = true;
          else { retryCode = failure.code; fatal = failure.kind === 'permanent'; if (fatal) break; continue; }
        }
      }
      // No token/error message is persisted or exposed in a receipt.
      await deps.db.runTransaction(async tx => {
        const [current, previousReceipt] = await Promise.all([tx.get(device.ref), tx.get(receiptRef)]);
        if (prune && current.data()?.uid === recipient.uid && current.data()?.token === recipient.token) tx.delete(device.ref);
        if (previousReceipt.data()?.status !== 'sent') tx.set(receiptRef, { notificationId: claim.id, deviceId: device.id, status: sent ? 'sent' : 'skipped', createdAt: timestamp(), expiresAt: claim.expiresAt });
      });
      if (!sent) result.skipped++;
    }

    const outcome = await deps.db.runTransaction(async tx => {
      const job = await tx.get(claim.ref);
      if (job.data()?.leaseId !== claim.leaseId || job.data()?.status !== 'processing' || job.data()?.leaseUntil?.toMillis() <= clock()) return 'lost';
      if (fatal || retryCode && claim.attempts >= DELIVERY_MAX_ATTEMPTS) {
        tx.update(claim.ref, { ...terminalJobRetention('failed', timestamp()), leaseId: null, lastErrorCode: retryCode }); return 'failed';
      }
      if (retryCode || interrupted || devices.size === 20) {
        const advance = !retryCode && !interrupted;
        tx.update(claim.ref, { status: 'pending', leaseId: null, leaseUntil: null, updatedAt: timestamp(),
          deviceCursor: advance ? devices.docs.at(-1)!.id : claim.cursor,
          attempts: retryCode ? claim.attempts : 0,
          nextAttemptAt: Timestamp.fromMillis(clock() + (retryCode ? retryDelayMs(claim.attempts) : 1000)), lastErrorCode: retryCode }); return 'retried';
      }
      tx.update(claim.ref, { ...terminalJobRetention('completed', timestamp()), leaseId: null, lastErrorCode: null }); return 'completed';
    });
    if (outcome !== 'lost') result[outcome]++;
  }
  return result;
}
