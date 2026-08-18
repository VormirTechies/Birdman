import { describe, expect, it } from 'vitest';
import {
  adminBookingCreationSchema,
  publicBookingSubmissionSchema,
} from './booking';

const validBooking = {
  visitorName: '  Ananya Rao  ',
  phone: '+91 98765 43210',
  email: ' Visitor@Example.com ',
  adults: 2,
  children: 1,
  bookingDate: '2026-08-20',
  bookingTime: '16:30',
};

describe('Firestore booking schemas', () => {
  it('normalizes a valid public booking submission', () => {
    expect(publicBookingSubmissionSchema.parse(validBooking)).toEqual({
      visitorName: 'Ananya Rao',
      phone: '919876543210',
      email: 'visitor@example.com',
      adults: 2,
      children: 1,
      bookingDate: '2026-08-20',
      bookingTime: '16:30:00',
    });
  });

  it('accepts an omitted or blank optional email', () => {
    expect(adminBookingCreationSchema.parse({ ...validBooking, email: '' }).email).toBeUndefined();
    const withoutEmail = {
      visitorName: validBooking.visitorName,
      phone: validBooking.phone,
      adults: validBooking.adults,
      children: validBooking.children,
      bookingDate: validBooking.bookingDate,
      bookingTime: validBooking.bookingTime,
    };
    expect(adminBookingCreationSchema.parse(withoutEmail).email).toBeUndefined();
  });

  it('rejects more than ten total guests', () => {
    expect(() =>
      publicBookingSubmissionSchema.parse({ ...validBooking, adults: 7, children: 4 })
    ).toThrow('Total guests cannot exceed 10');
  });

  it('rejects invalid calendar dates and times', () => {
    expect(() =>
      publicBookingSubmissionSchema.parse({ ...validBooking, bookingDate: '2026-02-31' })
    ).toThrow('Enter a valid calendar date');
    expect(() =>
      publicBookingSubmissionSchema.parse({ ...validBooking, bookingTime: '25:90' })
    ).toThrow('Time must be in HH:mm or HH:mm:ss format');
  });

  it('rejects unknown client-controlled fields', () => {
    expect(() =>
      publicBookingSubmissionSchema.parse({ ...validBooking, status: 'completed' })
    ).toThrow();
  });
});
