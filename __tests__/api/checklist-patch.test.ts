import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/bookings/[id]/route';

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('@/lib/db/queries', () => ({
  getBookingById: vi.fn(),
  toggleVisited: vi.fn(),
  updateBooking: vi.fn(),
}));

vi.mock('@/lib/email', () => ({
  sendRescheduleNotification: vi.fn(),
}));

import { getBookingById, toggleVisited } from '@/lib/db/queries';

// ── Helpers ──────────────────────────────────────────────────────────────────

const VALID_UUID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

function makeBooking(overrides = {}) {
  return {
    id: VALID_UUID,
    visitorName: 'Meiyazhagan Sudarson',
    phone: '+919876543210',
    email: 'meiya@example.com',
    numberOfGuests: 3,
    bookingDate: '2026-04-28',
    bookingTime: '10:00',
    status: 'confirmed',
    visited: false,
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-01'),
    ...overrides,
  };
}

function patch(id: string, body: unknown) {
  const url = new URL(`http://localhost/api/bookings/${id}`);
  return PATCH(new NextRequest(url, { method: 'PATCH', body: JSON.stringify(body) }), {
    params: Promise.resolve({ id }),
  });
}

// ── PATCH /api/bookings/[id] — Visited Toggle ─────────────────────────────

describe('PATCH /api/bookings/[id] – visited toggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful toggle', () => {
    it('marks visited as true and returns updated booking', async () => {
      const existing = makeBooking({ visited: false });
      const updated = makeBooking({ visited: true });

      vi.mocked(getBookingById).mockResolvedValue(existing);
      vi.mocked(toggleVisited).mockResolvedValue(updated);

      const res = await patch(VALID_UUID, { visited: true });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.booking.visited).toBe(true);
    });

    it('marks visited as false and returns updated booking', async () => {
      const existing = makeBooking({ visited: true });
      const updated = makeBooking({ visited: false });

      vi.mocked(getBookingById).mockResolvedValue(existing);
      vi.mocked(toggleVisited).mockResolvedValue(updated);

      const res = await patch(VALID_UUID, { visited: false });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.booking.visited).toBe(false);
    });

    it('calls toggleVisited with the correct id and value', async () => {
      vi.mocked(getBookingById).mockResolvedValue(makeBooking());
      vi.mocked(toggleVisited).mockResolvedValue(makeBooking({ visited: true }));

      await patch(VALID_UUID, { visited: true });

      expect(toggleVisited).toHaveBeenCalledOnce();
      expect(toggleVisited).toHaveBeenCalledWith(VALID_UUID, true);
    });

    it('calls getBookingById to verify booking exists before toggling', async () => {
      vi.mocked(getBookingById).mockResolvedValue(makeBooking());
      vi.mocked(toggleVisited).mockResolvedValue(makeBooking({ visited: true }));

      await patch(VALID_UUID, { visited: true });

      expect(getBookingById).toHaveBeenCalledWith(VALID_UUID);
    });
  });

  describe('validation errors', () => {
    it('returns 400 for an invalid UUID format', async () => {
      const res = await patch('not-a-uuid', { visited: true });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/invalid booking id/i);
    });

    it('does not call getBookingById for invalid UUID', async () => {
      await patch('bad-id', { visited: true });
      expect(getBookingById).not.toHaveBeenCalled();
    });

    it('does not call toggleVisited for invalid UUID', async () => {
      await patch('bad-id', { visited: true });
      expect(toggleVisited).not.toHaveBeenCalled();
    });
  });

  describe('not found', () => {
    it('returns 404 when booking does not exist', async () => {
      vi.mocked(getBookingById).mockResolvedValue(null);

      const res = await patch(VALID_UUID, { visited: true });
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toMatch(/not found/i);
    });

    it('does not call toggleVisited when booking is not found', async () => {
      vi.mocked(getBookingById).mockResolvedValue(null);
      await patch(VALID_UUID, { visited: true });
      expect(toggleVisited).not.toHaveBeenCalled();
    });
  });

  describe('routing to visited-toggle path', () => {
    it('does NOT route to toggleVisited when body has extra keys', async () => {
      // Body with extra keys should fall through to reschedule path (not toggleVisited)
      vi.mocked(getBookingById).mockResolvedValue(makeBooking());
      // toggleVisited should not be called
      await patch(VALID_UUID, { visited: true, bookingDate: '2026-05-01' });
      expect(toggleVisited).not.toHaveBeenCalled();
    });

    it('routes to toggleVisited when body has exactly one key: visited', async () => {
      vi.mocked(getBookingById).mockResolvedValue(makeBooking());
      vi.mocked(toggleVisited).mockResolvedValue(makeBooking({ visited: true }));

      await patch(VALID_UUID, { visited: true });
      expect(toggleVisited).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('returns 500 when getBookingById throws', async () => {
      vi.mocked(getBookingById).mockRejectedValue(new Error('DB error'));
      const res = await patch(VALID_UUID, { visited: true });
      expect(res.status).toBe(500);
    });

    it('returns 500 when toggleVisited throws', async () => {
      vi.mocked(getBookingById).mockResolvedValue(makeBooking());
      vi.mocked(toggleVisited).mockRejectedValue(new Error('DB write error'));
      const res = await patch(VALID_UUID, { visited: true });
      expect(res.status).toBe(500);
    });
  });
});
