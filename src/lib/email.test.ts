// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Booking } from './db/schema';

const mocks = vi.hoisted(() => ({
  sendMail: vi.fn(), verify: vi.fn(), createTransport: vi.fn(),
}));
vi.mock('nodemailer', () => ({ default: { createTransport: mocks.createTransport } }));
vi.mock('@react-email/render', () => ({ render: vi.fn().mockResolvedValue('<p>Booking</p>') }));

import {
  sendBookingConfirmation, sendBookingReminder, sendBookingCancellation,
  sendRescheduleNotification, sendVipWelcomeEmail, sendAdminVerificationCode,
  testEmailConnection,
} from './email';

const booking = {
  id: 'test-booking', bookingNumber: 23, visitorName: 'Test Visitor',
  email: ' visitor@example.com ', bookingDate: '2026-11-01', bookingTime: '16:30:00',
  adults: 2, children: 1, numberOfGuests: 3,
} as Booking;

const senders = [
  ['confirmation', sendBookingConfirmation],
  ['reminder', sendBookingReminder],
  ['cancellation', sendBookingCancellation],
  ['reschedule', (value: Booking) => sendRescheduleNotification(value, {
    bookingDate: '2026-10-31', bookingTime: '16:30:00',
  })],
  ['VIP', sendVipWelcomeEmail],
] as const;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('GMAIL_USER', 'sender@example.com');
  vi.stubEnv('GMAIL_PASS', 'test-not-a-real-secret');
  vi.stubEnv('EMAIL_CC', '');
  mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail, verify: mocks.verify });
  mocks.sendMail.mockResolvedValue({ messageId: 'mock-message' });
  mocks.verify.mockResolvedValue(true);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe.each(senders)('%s email', (_name, send) => {
  it('sends to one normalized mailbox with restricted content access', async () => {
    expect(await send(booking)).toEqual({ success: true, messageId: 'mock-message' });
    expect(mocks.createTransport).toHaveBeenCalledWith(expect.objectContaining({
      service: 'gmail', disableFileAccess: true, disableUrlAccess: true,
    }));
    expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: { address: 'visitor@example.com', name: '' }, html: '<p>Booking</p>',
    }));
  });
  it.each([
    'visitor@example.com\r\nBcc: attacker@example.com',
    'visitor@example.com,attacker@example.com',
    'Name <visitor@example.com>', 'not-an-email', 'a'.repeat(255) + '@example.com',
  ])('rejects malformed or injected recipients before SMTP', async (email) => {
    expect(await send({ ...booking, email })).toEqual({ success: false, error: 'Invalid email recipient' });
    expect(mocks.createTransport).not.toHaveBeenCalled();
    expect(mocks.sendMail).not.toHaveBeenCalled();
  });
  it('handles missing recipients and SMTP failures without throwing', async () => {
    expect((await send({ ...booking, email: null })).success).toBe(false);
    mocks.sendMail.mockRejectedValue(new Error('SMTP unavailable'));
    expect(await send(booking)).toEqual({ success: false, error: 'SMTP unavailable' });
  });
});

it('validates configured CC mailboxes', async () => {
  vi.stubEnv('EMAIL_CC', 'first@example.com, second@example.com');
  await sendBookingConfirmation(booking);
  expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({
    cc: ['first@example.com', 'second@example.com'],
  }));
  mocks.sendMail.mockClear();
  vi.stubEnv('EMAIL_CC', 'first@example.com\r\nBcc: attacker@example.com');
  expect((await sendBookingConfirmation(booking)).success).toBe(false);
  expect(mocks.sendMail).not.toHaveBeenCalled();
});

it('fails safely when SMTP credentials are missing', async () => {
  vi.stubEnv('GMAIL_PASS', '');
  expect((await sendBookingConfirmation(booking)).success).toBe(false);
  expect(mocks.createTransport).not.toHaveBeenCalled();
});

it('validates the legacy verification email and its code', async () => {
  expect(await sendAdminVerificationCode('admin@example.com', '123456')).toEqual({ success: true });
  mocks.sendMail.mockClear();
  expect((await sendAdminVerificationCode('admin@example.com', '<script>')).success).toBe(false);
  expect((await sendAdminVerificationCode('bad-address', '123456')).success).toBe(false);
  expect(mocks.sendMail).not.toHaveBeenCalled();
});

it('preserves connection verification behavior', async () => {
  expect(await testEmailConnection()).toBe(true);
  mocks.verify.mockRejectedValue(new Error('SMTP unavailable'));
  expect(await testEmailConnection()).toBe(false);
});
