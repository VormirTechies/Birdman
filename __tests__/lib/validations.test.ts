import { describe, it, expect } from 'vitest';
import { createBookingSchema, createFeedbackSchema } from '@/lib/validations';

const validBookingData = {
  visitorName: 'John Doe',
  phone: '+91-9876543210',
  email: 'john@example.com',
  adults: 2,
  children: 0,
  bookingDate: '2026-07-01',
  bookingTime: '16:30',
};

describe('createBookingSchema', () => {
  it('should validate correct booking data', () => {
    expect(() => createBookingSchema.parse(validBookingData)).not.toThrow();
  });

  it('should accept Tamil names', () => {
    const tamilData = {
      ...validBookingData,
      visitorName: 'Tamil Visitor',
      phone: '9876543210',
      adults: 1,
    };

    expect(() => createBookingSchema.parse(tamilData)).not.toThrow();
  });

  it('should reject invalid phone format', () => {
    const invalidData = {
      ...validBookingData,
      phone: 'abc123xyz',
    };

    expect(() => createBookingSchema.parse(invalidData)).toThrow();
  });

  it('should reject invalid booking date format', () => {
    const invalidData = {
      ...validBookingData,
      bookingDate: '07-01-2026',
    };

    expect(() => createBookingSchema.parse(invalidData)).toThrow(/YYYY-MM-DD/);
  });

  it('should limit guests to 1-10', () => {
    const tooManyGuests = {
      ...validBookingData,
      adults: 10,
      children: 1,
    };

    expect(() => createBookingSchema.parse(tooManyGuests)).toThrow(/Total number of guests/);

    const zeroAdults = {
      ...validBookingData,
      adults: 0,
      children: 0,
    };

    expect(() => createBookingSchema.parse(zeroAdults)).toThrow(/At least 1 adult/);
  });

  it('should require booking time', () => {
    const { bookingTime: _bookingTime, ...missingTime } = validBookingData;
    expect(() => createBookingSchema.parse(missingTime)).toThrow();
  });

  it('should accept optional email as empty string', () => {
    const noEmail = {
      ...validBookingData,
      email: '',
    };

    expect(() => createBookingSchema.parse(noEmail)).not.toThrow();
  });

  it('should reject invalid email format', () => {
    const invalidEmail = {
      ...validBookingData,
      email: 'not-an-email',
    };

    expect(() => createBookingSchema.parse(invalidEmail)).toThrow(/Invalid email/);
  });

  it('should reject names that are too short', () => {
    const shortName = {
      ...validBookingData,
      visitorName: 'J',
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
