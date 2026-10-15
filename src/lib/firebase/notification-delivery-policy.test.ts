// @vitest-environment node
import { expect, it } from 'vitest';
import { retryDelayMs, classifyDeliveryError, buildAdminPushMessage } from './notification-delivery-policy';

it('uses exponential backoff, a one-minute minimum, jitter and a capped base', () => {
  expect(retryDelayMs(1, 0)).toBe(60_000);
  expect(retryDelayMs(2, 0)).toBe(120_000);
  expect(retryDelayMs(2, 1)).toBe(150_000);
  expect(retryDelayMs(100, 0)).toBe(30 * 60_000);
});
it('prunes only known invalid tokens and treats service errors as retryable', () => {
  expect(classifyDeliveryError({ code: 'messaging/registration-token-not-registered' }).kind).toBe('invalid-token');
  expect(classifyDeliveryError({ code: 'messaging/invalid-argument' }).kind).toBe('permanent');
  expect(classifyDeliveryError({ code: 'messaging/quota-exceeded' }).kind).toBe('transient');
  expect(classifyDeliveryError(new Error('private token and SMTP secrets'))).toEqual({ code: 'delivery/temporary-error', kind: 'transient' });
});
it('builds generic lock-screen messages with stable event identity and no booking contact data', () => {
  const message = buildAdminPushMessage('event-id', 'booking_confirmed', 'device-token');
  expect(message.data).toEqual({ notificationId: 'event-id', type: 'booking_confirmed', url: '/admin' });
  expect(message.notification?.body).toBe('Open the admin dashboard for details.');
  expect(message.webpush?.notification?.tag).toBe('event-id');
});
