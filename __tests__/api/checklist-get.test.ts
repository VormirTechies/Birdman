import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/bookings/route';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/db/queries', () => ({
  getBookings: vi.fn(),
  createBooking: vi.fn(),
  markConfirmationSent: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  sendBookingConfirmation: vi.fn(),
  sendRescheduleNotification: vi.fn(),
}));

vi.mock('@/lib/push', () => ({
  sendPushToAllAdmins: vi.fn(),
}));

import { getBookings } from '@/lib/db/queries';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeBooking(overrides = {}) {
  return {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    visitorName: 'Arjun Krishnan',
    phone: '+919876543210',
    email: 'arjun@example.com',
    numberOfGuests: 2,
    bookingDate: '2026-04-28',
    bookingTime: '10:00',
    status: 'confirmed',
    visited: false,
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-01'),
    ...overrides,
  };
}

function get(path: string, params: Record<string, string> = {}) {
  const url = new URL(`http://localhost${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return GET(new NextRequest(url));
}

// ── GET /api/bookings — Checklist Scenarios ───────────────────────────────

describe('GET /api/bookings – checklist query', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getBookings).mockResolvedValue({ bookings: [], total: 0 });
  });

  describe('successful requests', () => {
    it('returns bookings with pagination metadata', async () => {
      const bookings = [makeBooking(), makeBooking({ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d480' })];
      vi.mocked(getBookings).mockResolvedValue({ bookings, total: 2 });

      const res = await get('/api/bookings', {
        sort: 'checklist',
        date: '2026-04-28',
        status: 'confirmed',
        limit: '20',
        offset: '0',
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.bookings).toHaveLength(2);
      expect(data.total).toBe(2);
      expect(data.pagination).toEqual({ limit: 20, offset: 0, count: 2 });
    });

    it('passes all checklist params to getBookings', async () => {
      await get('/api/bookings', {
        sort: 'checklist',
        date: '2026-04-28',
        status: 'confirmed',
        limit: '20',
        offset: '40',
        search: 'arjun',
      });

      expect(getBookings).toHaveBeenCalledWith({
        sort: 'checklist',
        date: '2026-04-28',
        status: 'confirmed',
        limit: 20,
        offset: 40,
        search: 'arjun',
        minDate: undefined,
      });
    });

    it('returns empty bookings array when no matches', async () => {
      vi.mocked(getBookings).mockResolvedValue({ bookings: [], total: 0 });

      const res = await get('/api/bookings', {
        sort: 'checklist',
        date: '2026-04-28',
        status: 'confirmed',
      });
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.bookings).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('returns pagination count equal to bookings array length', async () => {
      const bookings = Array.from({ length: 5 }, (_, i) =>
        makeBooking({ id: `f47ac10b-58cc-4372-a567-0e02b2c3d4${70 + i}` }),
      );
      vi.mocked(getBookings).mockResolvedValue({ bookings, total: 50 });

      const res = await get('/api/bookings', {
        sort: 'checklist',
        date: '2026-04-28',
        limit: '5',
        offset: '0',
      });
      const data = await res.json();

      expect(data.pagination.count).toBe(5);
      expect(data.pagination.limit).toBe(5);
      expect(data.pagination.offset).toBe(0);
    });

    it('uses default limit of 50 when not provided', async () => {
      await get('/api/bookings', { date: '2026-04-28' });
      expect(getBookings).toHaveBeenCalledWith(expect.objectContaining({ limit: 50, offset: 0 }));
    });
  });

  describe('validation errors', () => {
    it('returns 400 when limit is below 1', async () => {
      const res = await get('/api/bookings', { limit: '0' });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/limit/i);
    });

    it('returns 400 when limit exceeds 100', async () => {
      const res = await get('/api/bookings', { limit: '101' });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('returns 400 when offset is negative', async () => {
      const res = await get('/api/bookings', { offset: '-1' });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/offset/i);
    });

    it('returns 400 for invalid status value', async () => {
      const res = await get('/api/bookings', { status: 'pending' });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/status/i);
    });

    it('returns 400 for malformed date', async () => {
      const res = await get('/api/bookings', { date: '28-04-2026' });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/date/i);
    });

    it('returns 400 for non-numeric date', async () => {
      const res = await get('/api/bookings', { date: 'tomorrow' });
      expect(res.status).toBe(400);
    });
  });

  describe('boundary values', () => {
    it('accepts limit of 1', async () => {
      const res = await get('/api/bookings', { limit: '1' });
      expect(res.status).toBe(200);
    });

    it('accepts limit of 100', async () => {
      const res = await get('/api/bookings', { limit: '100' });
      expect(res.status).toBe(200);
    });

    it('accepts offset of 0', async () => {
      const res = await get('/api/bookings', { offset: '0' });
      expect(res.status).toBe(200);
    });

    it('accepts valid date format YYYY-MM-DD', async () => {
      const res = await get('/api/bookings', { date: '2026-04-28' });
      expect(res.status).toBe(200);
    });
  });

  describe('error handling', () => {
    it('returns 500 when getBookings throws', async () => {
      vi.mocked(getBookings).mockRejectedValue(new Error('DB connection failed'));
      const res = await get('/api/bookings');
      expect(res.status).toBe(500);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('BOOKINGS_FETCH_ERROR');
    });
  });
});
