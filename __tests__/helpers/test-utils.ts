/**
 * Test Utilities and Helpers
 * Reusable functions for testing
 */

import { vi } from 'vitest';
import type { ReactElement } from 'react';
import { render as rtlRender } from '@testing-library/react';

// ─── Mock Data Generators ────────────────────────────────────────────────────

export const mockSession = (overrides = {}) => ({
  id: 'session-test-' + Math.random().toString(36).substring(7),
  date: '2026-04-01',
  time: '10:00',
  capacity: 10,
  bookedCount: 0,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const mockBooking = (overrides = {}) => ({
  id: 'booking-test-' + Math.random().toString(36).substring(7),
  sessionId: 'session-1',
  visitorName: 'Test User',
  phone: '+91-9876543210',
  email: 'test@example.com',
  locale: 'en' as const,
  numberOfVisitors: 2,
  rulesAccepted: true,
  status: 'confirmed',
  createdAt: new Date(),
  ...overrides,
});

export const mockFeedback = (overrides = {}) => ({
  id: 'feedback-test-' + Math.random().toString(36).substring(7),
  bookingId: 'booking-1',
  rating: 5,
  comment: 'Great experience!',
  isPublic: true,
  createdAt: new Date(),
  ...overrides,
});

// ─── Date Utilities ──────────────────────────────────────────────────────────

/**
 * Get a future date for testing
 */
export const getFutureDate = (daysFromNow = 7): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

/**
 * Get a past date for testing
 */
export const getPastDate = (daysAgo = 7): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

// ─── Mock Services ───────────────────────────────────────────────────────────

/**
 * Mock email service
 */
export const mockEmailService = () => ({
  sendBookingConfirmation: vi.fn().mockResolvedValue({ success: true }),
  sendCancellationEmail: vi.fn().mockResolvedValue({ success: true }),
  sendReminderEmail: vi.fn().mockResolvedValue({ success: true }),
});

/**
 * Mock database client
 */
export const mockDbClient = () => ({
  query: vi.fn(),
  transaction: vi.fn(),
  insert: vi.fn().mockResolvedValue({ id: 'mock-id' }),
  update: vi.fn().mockResolvedValue({ success: true }),
  delete: vi.fn().mockResolvedValue({ success: true }),
  select: vi.fn().mockResolvedValue([]),
});

// ─── Component Test Helpers ──────────────────────────────────────────────────

/**
 * Custom render function that includes providers
 * Extend this as needed when providers are added (e.g., IntlProvider)
 */
export function render(ui: ReactElement, options = {}) {
  return rtlRender(ui, {
    ...options,
  });
}

/**
 * Wait for async operations
 */
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

// ─── Test Data Sets ──────────────────────────────────────────────────────────

/**
 * Valid phone numbers for testing
 */
export const validPhoneNumbers = [
  '+91-9876543210',
  '9876543210',
  '+91 9876543210',
  '(91) 9876543210',
];

/**
 * Invalid phone numbers for testing
 */
export const invalidPhoneNumbers = [
  'abc123',
  '123',
  '++++++',
  'not-a-phone',
];

/**
 * Valid email addresses
 */
export const validEmails = [
  'user@example.com',
  'test.user@example.co.in',
  'admin+test@birdman.com',
];

/**
 * Invalid email addresses
 */
export const invalidEmails = [
  'not-an-email',
  '@example.com',
  'user@',
  'user..name@example.com',
];

/**
 * Tamil text samples for i18n testing
 */
export const tamilText = {
  name: 'ஜான் டோ',
  greeting: 'வணக்கம்',
  thankYou: 'நன்றி',
  booking: 'முன்பதிவு',
};

// ─── Assertion Helpers ───────────────────────────────────────────────────────

/**
 * Check if a date string is in ISO format
 */
export const isISODate = (dateString: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
};

/**
 * Check if a time string is in 24-hour format
 */
export const is24HourTime = (timeString: string): boolean => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeString);
};

/**
 * Check if a string is a valid UUID
 */
export const isUUID = (uuid: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

// ─── Performance Helpers ─────────────────────────────────────────────────────

/**
 * Measure execution time
 */
export const measureTime = async (fn: () => Promise<any>) => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

/**
 * Check if operation completes within time limit
 */
export const completesWithin = async (
  fn: () => Promise<any>,
  maxMs: number
): Promise<boolean> => {
  const time = await measureTime(fn);
  return time <= maxMs;
};

// ─── Re-export everything from testing library ──────────────────────────────

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
