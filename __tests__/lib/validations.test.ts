import { describe, it, expect } from 'vitest';
import { createBookingSchema, createFeedbackSchema } from '@/lib/validations';

describe('createBookingSchema', () => {
  it('should validate correct booking data', () => {
    const validData = {
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      visitorName: 'John Doe',
      phone: '+91-9876543210',
      email: 'john@example.com',
      locale: 'en' as const,
      numberOfVisitors: 2,
      rulesAccepted: true,
    };

    expect(() => createBookingSchema.parse(validData)).not.toThrow();
  });

  it('should accept Tamil locale', () => {
    const tamilData = {
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      visitorName: 'ஜான் டோ',
      phone: '9876543210',
      email: 'john@example.com',
      locale: 'ta' as const,
      numberOfVisitors: 1,
      rulesAccepted: true,
    };

    expect(() => createBookingSchema.parse(tamilData)).not.toThrow();
  });

  it('should reject invalid phone format', () => {
    const invalidData = {
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      visitorName: 'John Doe',
      phone: 'abc123xyz', // Invalid characters
      email: 'john@example.com',
      locale: 'en' as const,
      numberOfVisitors: 2,
      rulesAccepted: true,
    };

    expect(() => createBookingSchema.parse(invalidData)).toThrow();
  });

  it('should reject invalid session ID', () => {
    const invalidData = {
      sessionId: 'not-a-uuid',
      visitorName: 'John Doe',
      phone: '+91-9876543210',
      email: 'john@example.com',
      locale: 'en' as const,
      numberOfVisitors: 2,
      rulesAccepted: true,
    };

    expect(() => createBookingSchema.parse(invalidData)).toThrow(/Invalid session ID/);
  });

  it('should limit guests to 1-10', () => {
    const tooManyGuests = {
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      visitorName: 'John Doe',
      phone: '+91-9876543210',
      email: 'john@example.com',
      locale: 'en' as const,
      numberOfVisitors: 11, // Exceeds maximum
      rulesAccepted: true,
    };

    expect(() => createBookingSchema.parse(tooManyGuests)).toThrow(/Maximum 10 visitors/);

    const zeroGuests = {
      ...tooManyGuests,
      numberOfVisitors: 0,
    };

    expect(() => createBookingSchema.parse(zeroGuests)).toThrow(/At least 1 visitor/);
  });

  it('should require rulesAccepted to be true', () => {
    const rulesNotAccepted = {
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      visitorName: 'John Doe',
      phone: '+91-9876543210',
      email: 'john@example.com',
      locale: 'en' as const,
      numberOfVisitors: 2,
      rulesAccepted: false, // Critical: Silence Policy not accepted
    };

    expect(() => createBookingSchema.parse(rulesNotAccepted)).toThrow(
      /You must accept the sanctuary rules/
    );
  });

  it('should accept optional email as empty string', () => {
    const noEmail = {
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      visitorName: 'John Doe',
      phone: '+91-9876543210',
      email: '',
      locale: 'en' as const,
      numberOfVisitors: 2,
      rulesAccepted: true,
    };

    expect(() => createBookingSchema.parse(noEmail)).not.toThrow();
  });

  it('should reject invalid email format', () => {
    const invalidEmail = {
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      visitorName: 'John Doe',
      phone: '+91-9876543210',
      email: 'not-an-email',
      locale: 'en' as const,
      numberOfVisitors: 2,
      rulesAccepted: true,
    };

    expect(() => createBookingSchema.parse(invalidEmail)).toThrow(/Invalid email/);
  });

  it('should reject names that are too short', () => {
    const shortName = {
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      visitorName: 'J',
      phone: '+91-9876543210',
      email: 'john@example.com',
      locale: 'en' as const,
      numberOfVisitors: 2,
      rulesAccepted: true,
    };

    expect(() => createBookingSchema.parse(shortName)).toThrow(/at least 2 characters/);
  });
});

describe('createFeedbackSchema', () => {
  it('should validate correct feedback data', () => {
    const validFeedback = {
      bookingId: '550e8400-e29b-41d4-a716-446655440000',
      rating: 5,
      comment: 'Amazing experience!',
    };

    expect(() => createFeedbackSchema.parse(validFeedback)).not.toThrow();
  });

  it('should accept feedback without comment', () => {
    const noComment = {
      bookingId: '550e8400-e29b-41d4-a716-446655440000',
      rating: 4,
    };

    expect(() => createFeedbackSchema.parse(noComment)).not.toThrow();
  });

  it('should reject rating outside 1-5 range', () => {
    const invalidRating = {
      bookingId: '550e8400-e29b-41d4-a716-446655440000',
      rating: 6,
      comment: 'Great!',
    };

    expect(() => createFeedbackSchema.parse(invalidRating)).toThrow(/at most 5/);
  });

  it('should reject invalid booking ID', () => {
    const invalidBookingId = {
      bookingId: 'not-a-uuid',
      rating: 5,
    };

    expect(() => createFeedbackSchema.parse(invalidBookingId)).toThrow(/Invalid booking ID/);
  });

  it('should reject comment longer than 1000 characters', () => {
    const longComment = {
      bookingId: '550e8400-e29b-41d4-a716-446655440000',
      rating: 5,
      comment: 'A'.repeat(1001),
    };

    expect(() => createFeedbackSchema.parse(longComment)).toThrow(/less than 1000 characters/);
  });
});
