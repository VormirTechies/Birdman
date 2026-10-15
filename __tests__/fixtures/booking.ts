import type { AdminBooking } from '@/models/firestore/booking';

/** API DTO fixture: keep every required Firestore booking field type-checked. */
export function makeAdminBooking(overrides: Partial<AdminBooking> = {}): AdminBooking {
  return {
    id: 'booking-1', bookingNumber: 23, bookingCode: '#000023', visitorId: null,
    visitorName: 'Arjun Krishnan', phone: '9876543210', email: 'arjun@example.com',
    adults: 2, children: 0, numberOfGuests: 2, bookingDate: '2099-04-28', bookingTime: '16:30:00',
    status: 'confirmed', visited: false, source: 'admin', confirmationSent: false,
    reminderSent: false, reminderSentAt: null, createdAt: '2099-04-01T00:00:00.000Z',
    updatedAt: '2099-04-01T00:00:00.000Z', createdBy: 'admin-1', updatedBy: 'admin-1',
    cancelledAt: null, cancelledBy: null, ...overrides,
  };
}
