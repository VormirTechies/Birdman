import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { POST as previewPost } from '@/app/api/admin/settings/preview/route';
import { POST as bulkUpdatePost } from '@/app/api/admin/settings/bulk-update/route';
import * as dbModule from '@/lib/db';
import * as queriesModule from '@/lib/db/queries';
import * as emailModule from '@/lib/email';
import { NextRequest } from 'next/server';

/**
 * Phase 1 Tests: Admin Settings API
 * Tests for Preview and Bulk Update endpoints
 */

// Mock modules
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
    execute: vi.fn(),
  },
}));

vi.mock('@/lib/db/queries', () => ({
  cancelBookingsForDates: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  sendCancellationEmails: vi.fn(),
}));

describe('POST /api/admin/settings/preview', () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = dbModule.db as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns affected dates for all_days mode', async () => {
    const mockDates = [
      { date: '2026-05-14' },
      { date: '2026-05-15' },
      { date: '2026-05-16' },
    ];

    let selectCallCount = 0;
    mockDb.select.mockImplementation(() => {
      selectCallCount++;
      // Call 1: Get affected dates (orderBy)
      // Call 2: Get booking counts (groupBy)
      // Call 3: Get sample settings (orderBy)
      
      if (selectCallCount === 1 || selectCallCount === 3) {
        // Calendar settings queries use orderBy
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockDates),
            }),
          }),
        };
      } else {
        // Bookings query uses groupBy
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        };
      }
    });

    const request = new NextRequest('http://localhost:3001/api/admin/settings/preview', {
      method: 'POST',
      body: JSON.stringify({
        applyMode: 'all_days',
        settings: { isOpen: false },
      }),
    });

    const response = await previewPost(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.affectedDatesCount).toBe(3);
    expect(data.willBlock).toBe(true);
  });

  it('returns affected dates for one_day mode', async () => {
    // one_day mode doesn't query calendar settings, just uses the date directly
    // But still queries bookings and sample settings
    let selectCallCount = 0;
    mockDb.select.mockImplementation(() => {
      selectCallCount++;
      // Call 1: Get booking counts (groupBy)
      // Call 2: Get sample settings (orderBy)
      
      if (selectCallCount === 1) {
        // Bookings query uses groupBy
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        };
      } else {
        // Sample settings uses orderBy
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([{ date: '2026-05-20', maxCapacity: 50, startTime: '16:30:00', isOpen: true }]),
            }),
          }),
        };
      }
    });

    const request = new NextRequest('http://localhost:3001/api/admin/settings/preview', {
      method: 'POST',
      body: JSON.stringify({
        applyMode: 'one_day',
        date: '2026-05-20',
        settings: { maxCapacity: 50 },
      }),
    });

    const response = await previewPost(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.affectedDatesCount).toBe(1);
    expect(data.willBlock).toBe(false);
  });

  it('returns affected dates and booking counts for date_range mode', async () => {
    const mockDates = [
      { date: '2026-06-01' },
      { date: '2026-06-02' },
      { date: '2026-06-03' },
    ];

    const mockBookingCounts = [
      { bookingDate: '2026-06-01', count: 5 },
      { bookingDate: '2026-06-02', count: 3 },
    ];

    const mockSampleSettings = [
      { date: '2026-06-01', maxCapacity: 100, startTime: '16:30:00', isOpen: true },
      { date: '2026-06-02', maxCapacity: 100, startTime: '16:30:00', isOpen: true },
    ];

    let selectCallCount = 0;
    mockDb.select.mockImplementation(() => {
      selectCallCount++;
      // Call 1: Get affected dates (orderBy)
      // Call 2: Get booking counts (groupBy)
      // Call 3: Get sample settings (orderBy)
      
      if (selectCallCount === 1) {
        // Affected dates query
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockDates),
            }),
          }),
        };
      } else if (selectCallCount === 2) {
        // Bookings query uses groupBy
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockResolvedValue(mockBookingCounts),
            }),
          }),
        };
      } else {
        // Sample settings query
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue(mockSampleSettings),
            }),
          }),
        };
      }
    });

    const request = new NextRequest('http://localhost:3001/api/admin/settings/preview', {
      method: 'POST',
      body: JSON.stringify({
        applyMode: 'date_range',
        startDate: '2026-06-01',
        endDate: '2026-06-03',
        settings: { isOpen: false },
      }),
    });

    const response = await previewPost(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.affectedDatesCount).toBe(3);
    expect(data.existingBookingsCount).toBe(8); // 5 + 3
    expect(data.willBlock).toBe(true);
  });

  it('returns 400 for missing required fields', async () => {
    const request = new NextRequest('http://localhost:3001/api/admin/settings/preview', {
      method: 'POST',
      body: JSON.stringify({
        applyMode: 'one_day',
        // Missing 'date' field
        settings: { isOpen: false },
      }),
    });

    const response = await previewPost(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});

describe('POST /api/admin/settings/bulk-update', () => {
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = dbModule.db as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates all days and tracks admin', async () => {
    const mockUpdatedRows = [
      { id: '1', date: '2026-05-14', isOpen: true, updatedBy: 'admin-1' },
      { id: '2', date: '2026-05-15', isOpen: true, updatedBy: 'admin-1' },
    ];

    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockUpdatedRows),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3001/api/admin/settings/bulk-update', {
      method: 'POST',
      body: JSON.stringify({
        applyMode: 'all_days',
        settings: { maxCapacity: 80 },
        adminId: 'admin-1',
      }),
    });

    const response = await bulkUpdatePost(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.affectedCount).toBe(2);
    expect(data.cancelledBookingsCount).toBe(0);
  });

  it('blocks date and cancels bookings', async () => {
    const mockUpdatedRows = [{ id: '1', date: '2026-05-20', isOpen: false }];

    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockUpdatedRows),
        }),
      }),
    });

    const mockCancelledBookings = [
      { id: 'b1', email: 'user1@test.com', visitorName: 'User 1', bookingDate: '2026-05-20', numberOfGuests: 2 },
      { id: 'b2', email: 'user2@test.com', visitorName: 'User 2', bookingDate: '2026-05-20', numberOfGuests: 3 },
    ];

    vi.mocked(queriesModule.cancelBookingsForDates).mockResolvedValue(mockCancelledBookings);

    vi.mocked(emailModule.sendCancellationEmails).mockResolvedValue({
      sent: 2,
      failed: 0,
      errors: [],
    });

    const request = new NextRequest('http://localhost:3001/api/admin/settings/bulk-update', {
      method: 'POST',
      body: JSON.stringify({
        applyMode: 'one_day',
        date: '2026-05-20',
        settings: { isOpen: false },
        adminId: 'admin-1',
      }),
    });

    const response = await bulkUpdatePost(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.affectedCount).toBe(1);
    expect(data.cancelledBookingsCount).toBe(2);
    expect(data.emailsSent).toBe(2);
    expect(data.emailsFailed).toBe(0);

    expect(queriesModule.cancelBookingsForDates).toHaveBeenCalledWith('2026-05-20', '2026-05-20');
    expect(emailModule.sendCancellationEmails).toHaveBeenCalledWith(mockCancelledBookings);
  });

  it('updates date range', async () => {
    const mockUpdatedRows = [
      { id: '1', date: '2026-06-01', startTime: '15:00:00' },
      { id: '2', date: '2026-06-02', startTime: '15:00:00' },
      { id: '3', date: '2026-06-03', startTime: '15:00:00' },
    ];

    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(mockUpdatedRows),
        }),
      }),
    });

    const request = new NextRequest('http://localhost:3001/api/admin/settings/bulk-update', {
      method: 'POST',
      body: JSON.stringify({
        applyMode: 'date_range',
        startDate: '2026-06-01',
        endDate: '2026-06-03',
        settings: { startTime: '15:00:00' },
        adminId: 'admin-1',
      }),
    });

    const response = await bulkUpdatePost(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.affectedCount).toBe(3);
  });

  it('returns 400 for missing adminId', async () => {
    const request = new NextRequest('http://localhost:3001/api/admin/settings/bulk-update', {
      method: 'POST',
      body: JSON.stringify({
        applyMode: 'all_days',
        settings: { maxCapacity: 80 },
        // Missing adminId
      }),
    });

    const response = await bulkUpdatePost(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('required');
  });

  it('returns 400 for invalid applyMode', async () => {
    const request = new NextRequest('http://localhost:3001/api/admin/settings/bulk-update', {
      method: 'POST',
      body: JSON.stringify({
        applyMode: 'invalid_mode',
        settings: { isOpen: true },
        adminId: 'admin-1',
      }),
    });

    const response = await bulkUpdatePost(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('handles partial email failures gracefully', async () => {
    mockDb.update.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: '1', date: '2026-05-20', isOpen: false }]),
        }),
      }),
    });

    const mockCancelledBookings = [
      { id: 'b1', email: 'user1@test.com', visitorName: 'User 1', bookingDate: '2026-05-20', numberOfGuests: 2 },
      { id: 'b2', email: 'user2@test.com', visitorName: 'User 2', bookingDate: '2026-05-20', numberOfGuests: 3 },
    ];

    vi.mocked(queriesModule.cancelBookingsForDates).mockResolvedValue(mockCancelledBookings);

    vi.mocked(emailModule.sendCancellationEmails).mockResolvedValue({
      sent: 1,
      failed: 1,
      errors: ['b2: SMTP connection failed'],
    });

    const request = new NextRequest('http://localhost:3001/api/admin/settings/bulk-update', {
      method: 'POST',
      body: JSON.stringify({
        applyMode: 'one_day',
        date: '2026-05-20',
        settings: { isOpen: false },
        adminId: 'admin-1',
      }),
    });

    const response = await bulkUpdatePost(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.emailsSent).toBe(1);
    expect(data.emailsFailed).toBe(1);
    expect(data.emailErrors).toHaveLength(1);
  });
});
