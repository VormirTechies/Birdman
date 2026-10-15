import { z } from 'zod';
import type { Timestamp } from 'firebase-admin/firestore';

export const NOTIFICATION_COLLECTIONS = {
  history: 'adminNotifications',
  states: 'adminNotificationStates',
  devices: 'adminNotificationDevices',
  jobs: 'notificationDeliveryJobs',
  receipts: 'notificationDeliveryReceipts',
} as const;

export const notificationEventSchema = z.object({
  // Stable server-generated event identity; never accepted from public requests.
  eventKey: z.string().min(1).max(256),
  type: z.enum(['booking_confirmed', 'capacity_full', 'booking_changed', 'booking_cancelled']),
  bookingId: z.string().min(1).max(128).regex(/^[^/]+$/).nullable(),
  bookingDate: z.iso.date(),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(500),
  url: z.literal('/admin'),
}).strict();
export type NotificationEvent = z.infer<typeof notificationEventSchema>;
export interface NotificationDocument extends NotificationEvent {
  createdAt: Timestamp;
  expiresAt: Timestamp;
}
export interface NotificationStateDocument {
  read: boolean;
  uid: string;
  notificationId: string;
  readAt: Timestamp | null;
  dismissedAt: Timestamp | null;
  expiresAt: Timestamp;
}
export interface NotificationDeviceDocument {
  uid: string;
  token: string;
  createdAt: Timestamp;
  lastSeenAt: Timestamp;
  expiresAt: Timestamp;
}
export interface NotificationDeliveryJob {
  leaseId?: string | null;
  deviceCursor?: string | null;
  notificationId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  nextAttemptAt: Timestamp;
  leaseUntil: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp | null;
  lastErrorCode: string | null;
}

export interface NotificationDeliveryReceipt {
  notificationId: string;
  deviceId: string;
  status: 'sent' | 'skipped';
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export const notificationDeviceInputSchema = z.object({
  token: z.string().trim().min(20).max(4096).regex(/^[A-Za-z0-9_:\-]+$/),
}).strict();

export const notificationStateInputSchema = z.object({
  ids: z.array(z.string().regex(/^[a-f0-9]{64}$/)).min(1).max(20),
  action: z.enum(['read', 'dismiss']),
}).strict();

export interface NotificationInboxItem {
  id: string;
  type: NotificationEvent['type'];
  title: string;
  body: string;
  bookingDate: string;
  bookingExists: boolean;
  createdAt: string;
  read: boolean;
  url: '/admin';
}
export interface NotificationInboxPage {
  notifications: NotificationInboxItem[];
  unreadCount: number;
  pagination: { limit: number; hasMore: boolean; nextCursor: string | null };
}
