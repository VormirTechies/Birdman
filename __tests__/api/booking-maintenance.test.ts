import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ create: vi.fn(), rateLimit: vi.fn() }));
vi.mock('@/lib/db/queries', () => ({ createBooking: mocks.create, getBookings: vi.fn(), markConfirmationSent: vi.fn() }));
vi.mock('@upstash/ratelimit', () => ({ Ratelimit: mocks.rateLimit }));
vi.mock('@upstash/redis', () => ({ Redis: {} }));
vi.mock('@/components/organisms/BookingClient', () => ({ BookingClient: () => null }));
vi.mock('@/app/maintenance/page', () => ({ default: () => null }));
import { proxy } from '@/proxy';
import { POST } from '@/app/api/bookings/route';
import BookPage from '@/app/book/page';
import MaintenancePage from '@/app/maintenance/page';
import { BookingClient } from '@/components/organisms/BookingClient';

beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('MAINTENANCE_MODE', 'true'); });
afterEach(() => vi.unstubAllEnvs());
it('allows the homepage and other public pages', async () => {
  for (const path of ['/', '/story', '/gallery', '/feedback', '/booking-status']) {
    const response = await proxy(new NextRequest(`https://example.com${path}`));
    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
    expect(response.headers.get('x-middleware-next')).toBe('1');
  }
});
it('rewrites direct book navigation to maintenance without caching', async () => {
  const response = await proxy(new NextRequest('https://example.com/book?source=home'));
  expect(response.headers.get('x-middleware-rewrite')).toBe('https://example.com/maintenance?source=home');
  expect(response.headers.get('cache-control')).toBe('no-store');
});
it('blocks public submissions before rate limiting', async () => {
  const response = await proxy(new NextRequest('https://example.com/api/bookings', { method: 'POST' }));
  expect(response.status).toBe(503);
  expect((await response.json()).code).toBe('BOOKING_MAINTENANCE');
  expect(mocks.rateLimit).not.toHaveBeenCalled();
});
it('blocks the route handler even without proxy execution', async () => {
  const request = new NextRequest('https://example.com/api/bookings', { method: 'POST' });
  const response = await POST(request);
  expect(response.status).toBe(503);
  expect(mocks.create).not.toHaveBeenCalled();
});
it('does not block booking reads or admin routes', async () => {
  for (const path of ['/api/bookings', '/api/admin/bookings']) {
    const response = await proxy(new NextRequest(`https://example.com${path}`));
    expect(response.headers.get('x-middleware-next')).toBe('1');
  }
});
it('renders maintenance by default and restores booking when explicitly disabled', async () => {
  vi.stubEnv('MAINTENANCE_MODE', '');
  expect(BookPage().type).toBe(MaintenancePage);
  vi.stubEnv('MAINTENANCE_MODE', 'false');
  expect(BookPage().type).toBe(BookingClient);
  expect((await proxy(new NextRequest('https://example.com/book'))).headers.get('x-middleware-rewrite')).toBeNull();
});
it('restores submission validation when maintenance is disabled', async () => {
  vi.stubEnv('MAINTENANCE_MODE', 'false');
  const response = await POST(new NextRequest('https://example.com/api/bookings', { method: 'POST', body: '{}' }));
  expect(response.status).toBe(400);
  expect((await response.json()).error).toBe('Validation failed');
});
