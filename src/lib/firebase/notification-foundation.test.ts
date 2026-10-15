// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { Timestamp, type Firestore, type Transaction } from 'firebase-admin/firestore';
import { notificationEventSchema, notificationDeviceInputSchema } from '@/models/firestore/notification';
import { resolveNotificationConfig } from './notification-config';
import { notificationExpiry, terminalJobRetention } from './notification-retention';

vi.mock('server-only', () => ({}));
vi.mock('./admin', () => ({ getAdminDb: vi.fn() }));
import { stageNotificationEvent, stageNotificationEvents, notificationEventId, cleanupExpiredNotifications } from './notifications';

const event = {
  eventKey: 'booking:123:confirmed:1', type: 'booking_confirmed' as const,
  bookingId: '123', bookingDate: '2026-11-01', title: 'New booking',
  body: 'A booking was confirmed. Open the dashboard for details.', url: '/admin' as const,
};
const now = Timestamp.fromMillis(1_800_000_000_000);

describe('notification configuration', () => {
  it('defaults local development to mock and production to FCM', () => {
    expect(resolveNotificationConfig({ NODE_ENV: 'development' }).mode).toBe('mock');
    expect(resolveNotificationConfig({ NODE_ENV: 'production' })).toMatchObject({ mode: 'fcm', configured: false });
    expect(resolveNotificationConfig({ NODE_ENV: 'production', NEXT_PUBLIC_FIREBASE_FCM_VAPID_KEY: 'A'.repeat(87) }).configured).toBe(true);
  });
  it.each([
    { NODE_ENV: 'production', NOTIFICATIONS_DELIVERY_MODE: 'mock' },
    { NODE_ENV: 'production', FIRESTORE_EMULATOR_HOST: '127.0.0.1:7003' },
    { NODE_ENV: 'development', FIREBASE_USE_LIVE: 'true', NOTIFICATIONS_DELIVERY_MODE: 'mock' },
    { NODE_ENV: 'development', NOTIFICATIONS_DELIVERY_MODE: 'fcm' },
    { NOTIFICATIONS_DELIVERY_MODE: 'unknown' },
    { NEXT_PUBLIC_FIREBASE_FCM_VAPID_KEY: 'invalid' },
  ])('rejects unsafe/malformed configuration %j', environment => {
    expect(() => resolveNotificationConfig(environment)).toThrow();
  });
});

describe('notification validation and retention', () => {
  it('accepts only bounded, known fields and internal navigation', () => {
    expect(notificationEventSchema.parse(event)).toEqual(event);
    for (const extra of [{ email: 'private@example.com' }, { uid: 'attacker' }, { expiresAt: 0 }]) {
      expect(notificationEventSchema.safeParse({ ...event, ...extra }).success).toBe(false);
    }
    expect(notificationEventSchema.safeParse({ ...event, url: 'https://attacker.test' }).success).toBe(false);
    expect(notificationEventSchema.safeParse({ ...event, bookingDate: '2026-02-31' }).success).toBe(false);
    expect(notificationEventSchema.safeParse({ ...event, body: 'x'.repeat(501) }).success).toBe(false);
    expect(notificationDeviceInputSchema.safeParse({ token: 'a'.repeat(4097) }).success).toBe(false);
    expect(notificationDeviceInputSchema.safeParse({ token: 'a'.repeat(30), uid: 'attacker' }).success).toBe(false);
  });
  it.each([['history', 90], ['states', 90], ['devices', 30], ['completed', 7], ['failed', 30]] as const)(
    'retains %s for %i days', (kind, days) => {
      expect(notificationExpiry(kind, now).toMillis() - now.toMillis()).toBe(days * 86_400_000);
    },
  );
  it('starts terminal job retention at completion/failure', () => {
    expect(terminalJobRetention('completed', now).expiresAt).toEqual(notificationExpiry('completed', now));
    expect(terminalJobRetention('failed', now).expiresAt).toEqual(notificationExpiry('failed', now));
  });
});

describe('notification transaction staging', () => {
  const db = { collection: vi.fn((collection: string) => ({ doc: (id: string) => ({ collection, id }) })) } as unknown as Firestore;
  it('reads both event identities before queuing any writes', async () => {
    const transaction = {
      get: vi.fn().mockResolvedValue({ exists: false }),
      create: vi.fn(() => expect(transaction.get).toHaveBeenCalledTimes(2)),
    };
    await stageNotificationEvents(transaction as unknown as Transaction, db,
      [event, { ...event, eventKey: 'capacity:full:1', type: 'capacity_full' }], now);
    expect(transaction.create).toHaveBeenCalledTimes(4);
  });
  it('stages history and pending work atomically without expiring undelivered work', async () => {
    const transaction = { get: vi.fn().mockResolvedValue({ exists: false }), create: vi.fn() };
    expect(await stageNotificationEvent(transaction as unknown as Transaction, db, event, now))
      .toEqual({ id: notificationEventId(event.eventKey), created: true });
    expect(transaction.create).toHaveBeenCalledTimes(2);
    expect(transaction.create.mock.calls[0][1]).toMatchObject({ createdAt: now, expiresAt: notificationExpiry('history', now) });
    expect(transaction.create.mock.calls[1][1]).toMatchObject({ status: 'pending', attempts: 0, expiresAt: null });
  });
  it('does not recreate or extend retention on a repeated event', async () => {
    const transaction = { get: vi.fn().mockResolvedValue({ exists: true, data: () => event }), create: vi.fn() };
    expect((await stageNotificationEvent(transaction as unknown as Transaction, db, event, now)).created).toBe(false);
    expect(transaction.create).not.toHaveBeenCalled();
  });
  it('rejects reuse of an event key for a different event', async () => {
    const transaction = { get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ ...event, type: 'booking_cancelled' }) }), create: vi.fn() };
    await expect(stageNotificationEvent(transaction as unknown as Transaction, db, event)).rejects.toThrow('collision');
    expect(transaction.create).not.toHaveBeenCalled();
  });
});

describe('bounded cleanup', () => {
  it('defaults to dry-run without deletion', async () => {
    const query = { where: vi.fn().mockReturnThis(), orderBy: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), get: vi.fn().mockResolvedValue({ size: 2, docs: [] }) };
    const db = { collection: () => query, runTransaction: vi.fn() } as unknown as Firestore;
    expect(Object.values(await cleanupExpiredNotifications(db))).toEqual([2, 2, 2, 2, 2]);
    expect(db.runTransaction).not.toHaveBeenCalled();
  });
  it('rechecks expiry and skips a refreshed device', async () => {
    const transaction = { get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ expiresAt: notificationExpiry('devices', now) }) }), delete: vi.fn() };
    const query = { where: vi.fn().mockReturnThis(), orderBy: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), get: vi.fn().mockResolvedValue({ docs: [{ ref: {} }] }) };
    const db = { collection: () => query, runTransaction: (fn: (tx: unknown) => unknown) => fn(transaction) } as unknown as Firestore;
    expect(Object.values(await cleanupExpiredNotifications(db, 10, now, true))).toEqual([0, 0, 0, 0, 0]);
    expect(transaction.delete).not.toHaveBeenCalled();
  });
  it('deletes expired documents when explicitly applied', async () => {
    const transaction = { get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ expiresAt: now }) }), delete: vi.fn() };
    const query = { where: vi.fn().mockReturnThis(), orderBy: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), get: vi.fn().mockResolvedValue({ docs: [{ ref: {} }] }) };
    const db = { collection: () => query, runTransaction: (fn: (tx: unknown) => unknown) => fn(transaction) } as unknown as Firestore;
    expect(Object.values(await cleanupExpiredNotifications(db, 10, now, true))).toEqual([1, 1, 1, 1, 1]);
    expect(transaction.delete).toHaveBeenCalledTimes(5);
  });
  it.each([0, 501, 1.5])('rejects unbounded cleanup size %i', async limit => {
    await expect(cleanupExpiredNotifications({} as Firestore, limit)).rejects.toThrow();
  });
});
