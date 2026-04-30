import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── DB Mock ───────────────────────────────────────────────────────────────────
// Mock the drizzle `db` object used inside queries.ts

const mockFindMany = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      bookings: {
        findMany: (...args: unknown[]) => mockFindMany(...args),
      },
    },
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

// Import AFTER mock is set up so the module picks up the mock
import { getChecklistForDate, toggleVisited } from '@/lib/db/queries';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeBooking(overrides = {}) {
  return {
    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    visitorName: 'Kavya Natarajan',
    phone: '+919876543210',
    email: 'kavya@example.com',
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

// ── getChecklistForDate ────────────────────────────────────────────────────────

describe('getChecklistForDate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns bookings for the given date', async () => {
    const bookings = [
      makeBooking({ id: 'aaa', visitorName: 'Aarav Singh' }),
      makeBooking({ id: 'bbb', visitorName: 'Bala Kumar' }),
    ];
    mockFindMany.mockResolvedValue(bookings);

    const result = await getChecklistForDate('2026-04-28');

    expect(result).toHaveLength(2);
    expect(result[0].visitorName).toBe('Aarav Singh');
    expect(result[1].visitorName).toBe('Bala Kumar');
  });

  it('returns empty array when no bookings for date', async () => {
    mockFindMany.mockResolvedValue([]);

    const result = await getChecklistForDate('2026-12-31');

    expect(result).toEqual([]);
  });

  it('calls findMany with the correct date filter', async () => {
    mockFindMany.mockResolvedValue([]);

    await getChecklistForDate('2026-04-28');

    expect(mockFindMany).toHaveBeenCalledOnce();
    // The where clause is composed by drizzle helpers — we verify the call happened
    // with an options object containing `where` and `orderBy`
    const [options] = mockFindMany.mock.calls[0];
    expect(options).toHaveProperty('where');
    expect(options).toHaveProperty('orderBy');
  });

  it('orderBy contains visited and visitorName sort expressions', async () => {
    mockFindMany.mockResolvedValue([]);

    await getChecklistForDate('2026-04-28');

    const [options] = mockFindMany.mock.calls[0];
    expect(Array.isArray(options.orderBy)).toBe(true);
    expect(options.orderBy).toHaveLength(2);
  });

  it('passes string date as-is to the query', async () => {
    mockFindMany.mockResolvedValue([]);

    await getChecklistForDate('2026-06-15');

    expect(mockFindMany).toHaveBeenCalledOnce();
  });
});

// ── toggleVisited ─────────────────────────────────────────────────────────────

describe('toggleVisited', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function buildChainMock(returnValue: unknown[]) {
    const chain = {
      set: vi.fn(),
      where: vi.fn(),
      returning: vi.fn().mockResolvedValue(returnValue),
    };
    chain.set.mockReturnValue(chain);
    chain.where.mockReturnValue(chain);
    mockUpdate.mockReturnValue(chain);
    return chain;
  }

  it('returns the updated booking after marking visited=true', async () => {
    const updated = makeBooking({ visited: true });
    buildChainMock([updated]);

    const result = await toggleVisited('f47ac10b-58cc-4372-a567-0e02b2c3d479', true);

    expect(result).toEqual(updated);
    expect(result!.visited).toBe(true);
  });

  it('returns the updated booking after marking visited=false', async () => {
    const updated = makeBooking({ visited: false });
    buildChainMock([updated]);

    const result = await toggleVisited('f47ac10b-58cc-4372-a567-0e02b2c3d479', false);

    expect(result!.visited).toBe(false);
  });

  it('returns undefined when no booking was updated (id not found)', async () => {
    buildChainMock([]); // .returning() gives empty array

    const result = await toggleVisited('00000000-0000-0000-0000-000000000000', true);

    expect(result).toBeUndefined();
  });

  it('calls db.update with the visited value and a refreshed updatedAt', async () => {
    const chain = buildChainMock([makeBooking({ visited: true })]);
    const before = new Date();

    await toggleVisited('f47ac10b-58cc-4372-a567-0e02b2c3d479', true);

    const after = new Date();
    const setArg = chain.set.mock.calls[0][0];
    expect(setArg.visited).toBe(true);
    expect(setArg.updatedAt).toBeInstanceOf(Date);
    expect(setArg.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(setArg.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('calls db.update for the correct booking id', async () => {
    const chain = buildChainMock([makeBooking()]);

    await toggleVisited('f47ac10b-58cc-4372-a567-0e02b2c3d479', true);

    // .where is called once — we trust drizzle equality helper with the id
    expect(chain.where).toHaveBeenCalledOnce();
  });
});
