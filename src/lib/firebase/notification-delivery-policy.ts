import type { Message } from 'firebase-admin/messaging';
import type { NotificationEvent } from '@/models/firestore/notification';

export const DELIVERY_MAX_ATTEMPTS = 5;
export const DELIVERY_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const DELIVERY_LEASE_MS = 120_000;

export function retryDelayMs(attempt: number, random = Math.random()) {
  const base = Math.min(30 * 60_000, 60_000 * 2 ** Math.max(0, attempt - 1));
  return Math.ceil(base * (1 + Math.min(1, Math.max(0, random)) * 0.25));
}

export function classifyDeliveryError(error: unknown) {
  const code = (error as { code?: unknown })?.code;
  const invalid = ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'];
  const permanent = ['messaging/invalid-argument', 'messaging/mismatched-credential', 'messaging/authentication-error', 'messaging/third-party-auth-error'];
  if (typeof code === 'string' && invalid.includes(code)) return { code, kind: 'invalid-token' as const };
  if (typeof code === 'string' && permanent.includes(code)) return { code, kind: 'permanent' as const };
  const safeCodes = ['messaging/internal-error', 'messaging/server-unavailable', 'messaging/quota-exceeded', 'messaging/unknown-error'];
  return { code: typeof code === 'string' && safeCodes.includes(code) ? code : 'delivery/temporary-error', kind: 'transient' as const };
}

export function buildAdminPushMessage(id: string, type: NotificationEvent['type'], token: string): Message {
  const titles = { booking_confirmed: 'Booking confirmed', capacity_full: 'Allocated seats are full',
    booking_changed: 'Booking changed', booking_cancelled: 'Booking cancelled' };
  return {
    token, notification: { title: titles[type], body: 'Open the admin dashboard for details.' },
    data: { notificationId: id, type, url: '/admin' },
    webpush: {
      headers: { TTL: '86400' },
      notification: { tag: id, icon: '/images/parrot_logo.png' },
      fcmOptions: { link: 'https://birdman-web--birdman-7e745.asia-southeast1.hosted.app/admin' },
    },
  };
}
