import { Timestamp } from 'firebase-admin/firestore';

export const NOTIFICATION_RETENTION_DAYS = {
  history: 90, states: 90, devices: 30, completed: 7, failed: 30,
} as const;

export function notificationExpiry(kind: keyof typeof NOTIFICATION_RETENTION_DAYS, now = Timestamp.now()) {
  return Timestamp.fromMillis(now.toMillis() + NOTIFICATION_RETENTION_DAYS[kind] * 86_400_000);
}

export function terminalJobRetention(status: 'completed' | 'failed', now = Timestamp.now()) {
  return { status, updatedAt: now, expiresAt: notificationExpiry(status, now), leaseUntil: null };
}
