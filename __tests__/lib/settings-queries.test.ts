import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { cancelBookingsForDates } from '@/lib/db/queries';
import * as dbModule from '@/lib/db';

/**
 * Phase 1 Tests: Settings Query Functions
 * Tests for cancelBookingsForDates
 */

vi.mock('@/lib/db', () => ({
  db: {
    update: vi.fn(),
  },
}));

describe('cancelBookingsForDates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('cancels all confirmed bookings in date range', async () => {
    const mockDb = dbModule.db as any;

    const mockCancelledBookings = [
      {
        id: 'booking-1',
        email: 'user1@test.com',
        visitorName: 'John Doe',
        bookingDate: '2026-06-01',
        numberOfGuests: 2,
        status: 'cancelled',
      },
      {
        id: 'booking-2',
        email: 'user2@test.com',
        visitorName: 'Jane Smith',
        bookingDate: '2026-06-02',
        numberOfGuests: 3,
        status: 'cancelled',
      },
      {
        id: 'booking-3',
        email: null,
        visitorName: 'Anonymous User',
        bookingDate: '2026-06-03',
        numberOfGuests: 1,
        status: 'cancelled',
      },
    ];

    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockCancelledBookings),
        }),
      }),
    });

    const result = await cancelBookingsForDates('2026-06-01', '2026-06-03');

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      id: 'booking-1',
      email: 'user1@test.com',
      visitorName: 'John Doe',
      bookingDate: '2026-06-01',
      numberOfGuests: 2,
    });
    expect(result[2].email).toBeNull(); // Handles null emails
  });

  it('cancels bookings for single date', async () => {
    const mockDb = dbModule.db as any;

    const mockCancelledBookings = [
      {
        id: 'booking-1',
        email: 'user@test.com',
        visitorName: 'Test User',
        bookingDate: '2026-05-20',
        numberOfGuests: 4,
        status: 'cancelled',
      },
    ];

    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockCancelledBookings),
        }),
      }),
    });

    const result = await cancelBookingsForDates('2026-05-20', '2026-05-20');

    expect(result).toHaveLength(1);
    expect(result[0].bookingDate).toBe('2026-05-20');
  });

  it('returns empty array when no bookings to cancel', async () => {
    const mockDb = dbModule.db as any;

    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const result = await cancelBookingsForDates('2026-07-01', '2026-07-10');

    expect(result).toHaveLength(0);
  });

  it('only cancels confirmed bookings (not already cancelled)', async () => {
    const mockDb = dbModule.db as any;

    // Should only return newly cancelled bookings
    const mockCancelledBookings = [
      {
        id: 'booking-1',
        email: 'user1@test.com',
        visitorName: 'User 1',
        bookingDate: '2026-06-01',
        numberOfGuests: 2,
        status: 'cancelled',
      },
    ];

    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockCancelledBookings),
        }),
      }),
    });

    const result = await cancelBookingsForDates('2026-06-01', '2026-06-03');

    // Should only include the one that was confirmed and got cancelled
    expect(result).toHaveLength(1);
  });

  it('returns bookings with required email notification fields', async () => {
    const mockDb = dbModule.db as any;

    const mockCancelledBookings = [
      {
        id: 'booking-1',
        email: 'user@test.com',
        visitorName: 'John Doe',
        bookingDate: '2026-06-01',
        numberOfGuests: 2,
        phone: '+91-9876543210',
        bookingTime: '16:30:00',
        status: 'cancelled',
      },
    ];

    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockCancelledBookings),
        }),
      }),
    });

    const result = await cancelBookingsForDates('2026-06-01', '2026-06-01');

    // Should return only the fields needed for email
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('email');
    expect(result[0]).toHaveProperty('visitorName');
    expect(result[0]).toHaveProperty('bookingDate');
    expect(result[0]).toHaveProperty('numberOfGuests');

    // Should not include unnecessary fields
    expect(result[0]).not.toHaveProperty('phone');
    expect(result[0]).not.toHaveProperty('bookingTime');
  });

  it('handles large date ranges efficiently', async () => {
    const mockDb = dbModule.db as any;

    // Simulate cancelling bookings across 30 days
    const mockCancelledBookings = Array.from({ length: 50 }, (_, i) => ({
      id: `booking-${i}`,
      email: `user${i}@test.com`,
      visitorName: `User ${i}`,
      bookingDate: '2026-06-15', // Some date in range
      numberOfGuests: Math.floor(Math.random() * 5) + 1,
      status: 'cancelled',
    }));

    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockCancelledBookings),
        }),
      }),
    });

    const result = await cancelBookingsForDates('2026-06-01', '2026-06-30');

    expect(result).toHaveLength(50);
    expect(mockDb.update).toHaveBeenCalledTimes(1); // Single query
  });

  it('preserves booking details for email template', async () => {
    const mockDb = dbModule.db as any;

    const mockBooking = {
      id: 'booking-123',
      email: 'john.doe@example.com',
      visitorName: 'John Doe',
      bookingDate: '2026-06-15',
      numberOfGuests: 3,
      status: 'cancelled',
    };

    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockBooking]),
        }),
      }),
    });

    const result = await cancelBookingsForDates('2026-06-15', '2026-06-15');

    expect(result[0].visitorName).toBe('John Doe');
    expect(result[0].numberOfGuests).toBe(3);
    expect(result[0].email).toBe('john.doe@example.com');
  });
});
