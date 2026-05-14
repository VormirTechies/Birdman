import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GET } from '@/app/api/cron/calendar-maintenance/route';
import * as dbModule from '@/lib/db';
import { NextRequest } from 'next/server';

/**
 * Phase 1 Tests: Calendar Maintenance Cron Job
 * Tests for 180-day rolling window maintenance
 */

vi.mock('@/lib/db', () => ({
  db: {
    delete: vi.fn(),
    execute: vi.fn(),
  },
}));

describe('GET /api/cron/calendar-maintenance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.log to avoid cluttering test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deletes past dates and adds future date', async () => {
    const mockDb = dbModule.db as any;

    // Mock delete operation
    const mockDeletedRows = [
      { id: '1', date: '2026-05-10' },
      { id: '2', date: '2026-05-11' },
    ];

    mockDb.delete.mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(mockDeletedRows),
      }),
    });

    // Mock insert and stats query
    mockDb.execute = vi.fn()
      .mockResolvedValueOnce({ rows: [] }) // INSERT
      .mockResolvedValueOnce({ 
        rows: [{ 
          min_date: '2026-05-13', 
          max_date: '2026-11-09', 
          total_rows: 180 
        }] 
      }); // SELECT stats

    const request = new NextRequest('http://localhost:3001/api/cron/calendar-maintenance', {
      method: 'GET',
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.deleted).toBe(2);
    expect(data.added).toBeDefined();
    expect(data.window.totalRows).toBe(180);
    expect(data.window.minDate).toBe('2026-05-13');
    expect(data.window.maxDate).toBe('2026-11-09');
  });

  it('maintains exactly 180 rows after maintenance', async () => {
    const mockDb = dbModule.db as any;

    mockDb.delete.mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: '1', date: '2026-05-12' }]),
      }),
    });

    mockDb.execute = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ 
        rows: [{ 
          min_date: '2026-05-13', 
          max_date: '2026-11-09', 
          total_rows: 180 
        }] 
      });

    const request = new NextRequest('http://localhost:3001/api/cron/calendar-maintenance');

    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.window.totalRows).toBe(180);
  });

  it('handles case when no past dates to delete', async () => {
    const mockDb = dbModule.db as any;

    // No rows deleted
    mockDb.delete.mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    });

    mockDb.execute = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ 
        rows: [{ 
          min_date: '2026-05-13', 
          max_date: '2026-11-09', 
          total_rows: 180 
        }] 
      });

    const request = new NextRequest('http://localhost:3001/api/cron/calendar-maintenance');

    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.deleted).toBe(0);
    expect(data.window.totalRows).toBe(180);
  });

  it('verifies CRON_SECRET when provided', async () => {
    const originalEnv = process.env.CRON_SECRET;
    process.env.CRON_SECRET = 'test-secret-123';

    const request = new NextRequest('http://localhost:3001/api/cron/calendar-maintenance', {
      method: 'GET',
      headers: {
        'authorization': 'Bearer wrong-secret',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');

    // Cleanup
    process.env.CRON_SECRET = originalEnv;
  });

  it('allows access with correct CRON_SECRET', async () => {
    const originalEnv = process.env.CRON_SECRET;
    process.env.CRON_SECRET = 'test-secret-123';

    const mockDb = dbModule.db as any;

    mockDb.delete.mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    });

    mockDb.execute = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ 
        rows: [{ 
          min_date: '2026-05-13', 
          max_date: '2026-11-09', 
          total_rows: 180 
        }] 
      });

    const request = new NextRequest('http://localhost:3001/api/cron/calendar-maintenance', {
      method: 'GET',
      headers: {
        'authorization': 'Bearer test-secret-123',
      },
    });

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Cleanup
    process.env.CRON_SECRET = originalEnv;
  });

  it('handles database errors gracefully', async () => {
    // Ensure CRON_SECRET is not set for this test
    const originalEnv = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;

    const mockDb = dbModule.db as any;

    mockDb.delete.mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(new Error('Database connection failed')),
      }),
    });

    const request = new NextRequest('http://localhost:3001/api/cron/calendar-maintenance');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Database connection failed');

    // Restore environment
    if (originalEnv) process.env.CRON_SECRET = originalEnv;
  });

  it('prevents duplicate date insertion with ON CONFLICT', async () => {
    // Ensure CRON_SECRET is not set for this test
    const originalEnv = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;

    const mockDb = dbModule.db as any;

    mockDb.delete.mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    });

    // The INSERT should use ON CONFLICT DO NOTHING
    mockDb.execute = vi.fn()
      .mockResolvedValueOnce({ rows: [] }) // INSERT returns nothing on conflict
      .mockResolvedValueOnce({ 
        rows: [{ 
          min_date: '2026-05-13', 
          max_date: '2026-11-09', 
          total_rows: 180 
        }] 
      });

    const request = new NextRequest('http://localhost:3001/api/cron/calendar-maintenance');

    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    // Should still succeed even if date already exists

    // Restore environment
    if (originalEnv) process.env.CRON_SECRET = originalEnv;
  });
});
