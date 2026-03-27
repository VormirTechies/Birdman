import { describe, it, expect } from 'vitest';
import {
  mockSession,
  mockBooking,
  mockFeedback,
  getFutureDate,
  getPastDate,
  validPhoneNumbers,
  invalidPhoneNumbers,
  validEmails,
  invalidEmails,
  isISODate,
  is24HourTime,
  isUUID,
} from './test-utils';

describe('Test Utilities', () => {
  describe('Mock Generators', () => {
    it('generates valid session mock', () => {
      const session = mockSession();

      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('date');
      expect(session).toHaveProperty('time');
      expect(session).toHaveProperty('capacity');
      expect(session.capacity).toBe(10);
    });

    it('allows overriding session properties', () => {
      const session = mockSession({ capacity: 20, isActive: false });

      expect(session.capacity).toBe(20);
      expect(session.isActive).toBe(false);
    });

    it('generates valid booking mock', () => {
      const booking = mockBooking();

      expect(booking).toHaveProperty('id');
      expect(booking).toHaveProperty('visitorName');
      expect(booking).toHaveProperty('phone');
      expect(booking.rulesAccepted).toBe(true);
    });

    it('generates valid feedback mock', () => {
      const feedback = mockFeedback();

      expect(feedback).toHaveProperty('id');
      expect(feedback).toHaveProperty('rating');
      expect(feedback.rating).toBeGreaterThanOrEqual(1);
      expect(feedback.rating).toBeLessThanOrEqual(5);
    });
  });

  describe('Date Utilities', () => {
    it('generates future date', () => {
      const future = getFutureDate(7);

      expect(isISODate(future)).toBe(true);

      const futureDate = new Date(future);
      const today = new Date();
      expect(futureDate > today).toBe(true);
    });

    it('generates past date', () => {
      const past = getPastDate(7);

      expect(isISODate(past)).toBe(true);

      const pastDate = new Date(past);
      const today = new Date();
      expect(pastDate < today).toBe(true);
    });
  });

  describe('Validation Test Data', () => {
    it('provides valid phone numbers', () => {
      expect(validPhoneNumbers).toHaveLength(4);
      expect(validPhoneNumbers[0]).toMatch(/\+91/);
    });

    it('provides invalid phone numbers', () => {
      expect(invalidPhoneNumbers).toHaveLength(4);
      expect(invalidPhoneNumbers).toContain('abc123');
    });

    it('provides valid emails', () => {
      expect(validEmails).toHaveLength(3);
      validEmails.forEach((email) => {
        expect(email).toContain('@');
      });
    });

    it('provides invalid emails', () => {
      expect(invalidEmails).toHaveLength(4);
    });
  });

  describe('Assertion Helpers', () => {
    it('validates ISO date format', () => {
      expect(isISODate('2026-04-01')).toBe(true);
      expect(isISODate('2026-4-1')).toBe(false);
      expect(isISODate('01/04/2026')).toBe(false);
    });

    it('validates 24-hour time format', () => {
      expect(is24HourTime('14:00')).toBe(true);
      expect(is24HourTime('23:59')).toBe(true);
      expect(is24HourTime('24:00')).toBe(false);
      expect(is24HourTime('2:00 PM')).toBe(false);
    });

    it('validates UUID format', () => {
      expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isUUID('not-a-uuid')).toBe(false);
      expect(isUUID('123')).toBe(false);
    });
  });
});
