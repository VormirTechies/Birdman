import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getMonth } from '@/app/api/calendar/month/route';
import { GET as getDay } from '@/app/api/calendar/day/[date]/route';
import { GET as getSettings, POST as postSettings } from '@/app/api/calendar/settings/route';

// Mock database queries
vi.mock('@/lib/db/queries', () => ({
  getMonthlyBookingStats: vi.fn(),
  getDayDetails: vi.fn(),
  getCalendarSettings: vi.fn(),
  upsertCalendarSettings: vi.fn(),
}));

describe('Calendar API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/calendar/month', () => {
    it('returns monthly booking stats for valid year and month', async () => {
      const { getMonthlyBookingStats } = await import('@/lib/db/queries');
      
      (getMonthlyBookingStats as any).mockResolvedValue([
        {
          date: '2026-04-01',
          bookingCount: 10,
          maxCapacity: 100,
          percentage: 10,
          isOpen: true,
          startTime: '16:30:00',
        },
      ]);

      const request = new NextRequest('http://localhost/api/calendar/month?year=2026&month=4');
      const response = await getMonth(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.year).toBe(2026);
      expect(data.month).toBe(4);
      expect(data.days).toHaveLength(1);
      expect(getMonthlyBookingStats).toHaveBeenCalledWith(2026, 4);
    });

    it('returns 400 for missing year parameter', async () => {
      const request = new NextRequest('http://localhost/api/calendar/month?month=4');
      const response = await getMonth(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('year');
    });

    it('returns 400 for missing month parameter', async () => {
      const request = new NextRequest('http://localhost/api/calendar/month?year=2026');
      const response = await getMonth(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('month');
    });

    it('returns 400 for year out of range', async () => {
      const request = new NextRequest('http://localhost/api/calendar/month?year=1999&month=4');
      const response = await getMonth(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('2000');
    });

    it('returns 400 for invalid month', async () => {
      const request = new NextRequest('http://localhost/api/calendar/month?year=2026&month=13');
      const response = await getMonth(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('month');
    });

    it('handles database errors gracefully', async () => {
      const { getMonthlyBookingStats } = await import('@/lib/db/queries');
      (getMonthlyBookingStats as any).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost/api/calendar/month?year=2026&month=4');
      const response = await getMonth(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('GET /api/calendar/day/[date]', () => {
    it('returns day details for valid date', async () => {
      const { getDayDetails } = await import('@/lib/db/queries');
      
      (getDayDetails as any).mockResolvedValue({
        date: '2026-04-21',
        settings: {
          maxCapacity: 100,
          startTime: '16:30:00',
          isOpen: true,
        },
        stats: {
          totalBooked: 45,
          available: 55,
          percentage: 45,
        },
        bookings: [],
      });

      const params = Promise.resolve({ date: '2026-04-21' });
      const request = new NextRequest('http://localhost/api/calendar/day/2026-04-21');
      const response = await getDay(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.date).toBe('2026-04-21');
      expect(getDayDetails).toHaveBeenCalledWith('2026-04-21');
    });

    it('returns 400 for invalid date format', async () => {
      const params = Promise.resolve({ date: '04-21-2026' });
      const request = new NextRequest('http://localhost/api/calendar/day/04-21-2026');
      const response = await getDay(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid date format');
    });

    it('returns 400 for invalid date value', async () => {
      const params = Promise.resolve({ date: '2026-13-45' });
      const request = new NextRequest('http://localhost/api/calendar/day/2026-13-45');
      const response = await getDay(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid date');
    });

    it('handles database errors gracefully', async () => {
      const { getDayDetails } = await import('@/lib/db/queries');
      (getDayDetails as any).mockRejectedValue(new Error('Database error'));

      const params = Promise.resolve({ date: '2026-04-21' });
      const request = new NextRequest('http://localhost/api/calendar/day/2026-04-21');
      const response = await getDay(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('GET /api/calendar/settings', () => {
    it('returns calendar settings for valid date', async () => {
      const { getCalendarSettings } = await import('@/lib/db/queries');
      
      (getCalendarSettings as any).mockResolvedValue({
        maxCapacity: 100,
        startTime: '16:30:00',
        isOpen: true,
      });

      const request = new NextRequest('http://localhost/api/calendar/settings?date=2026-04-21');
      const response = await getSettings(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.settings.maxCapacity).toBe(100);
      expect(getCalendarSettings).toHaveBeenCalledWith('2026-04-21');
    });

    it('returns 400 for missing date parameter', async () => {
      const request = new NextRequest('http://localhost/api/calendar/settings');
      const response = await getSettings(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('date');
    });
  });

  describe('POST /api/calendar/settings', () => {
    it('saves calendar settings with valid data', async () => {
      const { upsertCalendarSettings } = await import('@/lib/db/queries');
      (upsertCalendarSettings as any).mockResolvedValue({ id: '123' });

      const body = {
        date: '2026-04-21',
        maxCapacity: 150,
        startTime: '17:00:00',
        isOpen: true,
      };

      const request = new NextRequest('http://localhost/api/calendar/settings', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await postSettings(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(upsertCalendarSettings).toHaveBeenCalledWith({
        date: '2026-04-21',
        maxCapacity: 150,
        startTime: '17:00:00',
        isOpen: true,
      });
    });

    it('returns 400 for missing date', async () => {
      const body = {
        maxCapacity: 150,
        startTime: '17:00:00',
        isOpen: true,
      };

      const request = new NextRequest('http://localhost/api/calendar/settings', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await postSettings(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('date');
    });

    it('returns 400 for invalid capacity', async () => {
      const body = {
        date: '2026-04-21',
        maxCapacity: -10,
        startTime: '17:00:00',
        isOpen: true,
      };

      const request = new NextRequest('http://localhost/api/calendar/settings', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await postSettings(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('maxCapacity');
    });

    it('normalizes time format to HH:MM:SS', async () => {
      const { upsertCalendarSettings } = await import('@/lib/db/queries');
      (upsertCalendarSettings as any).mockResolvedValue({ id: '123' });

      const body = {
        date: '2026-04-21',
        maxCapacity: 100,
        startTime: '17:00', // Missing seconds
        isOpen: true,
      };

      const request = new NextRequest('http://localhost/api/calendar/settings', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await postSettings(request);
      
      expect(response.status).toBe(200);
      expect(upsertCalendarSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: '17:00:00', // Normalized
        })
      );
    });
  });
});
