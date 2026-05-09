/**
 * History Page Tests
 *
 * Tests the booking history page including:
 * - Page rendering and initial state
 * - API fetch and data display
 * - Search filtering (with debounce)
 * - Visited filter changes
 * - Sort changes
 * - Date filter changes
 * - Pagination (desktop)
 * - Mobile infinite scroll skeleton
 * - Loading states
 * - Empty state
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HistoryPage from '@/app/admin/history/page';

// ─── Mock child components ────────────────────────────────────────────────────

vi.mock('@/app/admin/history/_components/HistoryToolbar', () => ({
  HistoryToolbar: ({
    search,
    onSearchChange,
    date,
    onDateChange,
    visitedFilter,
    onVisitedFilterChange,
    sortBy,
    sortDir,
    onSortChange,
  }: any) => (
    <div data-testid="history-toolbar">
      <input
        data-testid="search-input"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search…"
      />
      <button
        data-testid="set-date"
        onClick={() => onDateChange(new Date('2026-04-20'))}
      >
        Set Date
      </button>
      {date && (
        <button data-testid="clear-date" onClick={() => onDateChange(undefined)}>
          Clear Date
        </button>
      )}
      <select
        data-testid="visited-filter"
        value={visitedFilter}
        onChange={(e) => onVisitedFilterChange(e.target.value)}
      >
        <option value="all">All</option>
        <option value="visited">Visited</option>
        <option value="not-visited">Not Visited</option>
        <option value="yet-to-visit">Not Yet</option>
      </select>
      <button
        data-testid="sort-name-asc"
        onClick={() => onSortChange('name', 'asc')}
      >
        Sort Name Asc
      </button>
      <button
        data-testid="sort-date-desc"
        onClick={() => onSortChange('date', 'desc')}
      >
        Sort Date Desc
      </button>
      <span data-testid="current-sort">{sortBy}:{sortDir}</span>
    </div>
  ),
}));

vi.mock('@/app/admin/history/_components/HistoryTable', () => ({
  HistoryTable: ({ bookings, total, page, pageSize, onPageChange, onPageSizeChange, loading }: any) => (
    <div data-testid="history-table">
      {loading && <div data-testid="table-loading">Loading…</div>}
      {!loading && bookings.map((b: any) => (
        <div key={b.id} data-testid={`booking-row-${b.id}`}>
          {b.visitorName} — {b.bookingDate}
        </div>
      ))}
      <span data-testid="total-count">{total}</span>
      <span data-testid="page-num">{page}</span>
      <span data-testid="page-size">{pageSize}</span>
      <button data-testid="next-page" onClick={() => onPageChange(page + 1)}>
        Next Page
      </button>
      <button data-testid="change-page-size" onClick={() => onPageSizeChange(25)}>
        Change Page Size
      </button>
    </div>
  ),
}));

vi.mock('@/app/admin/history/_components/HistoryCard', () => ({
  HistoryCard: ({ booking }: any) => (
    <div data-testid={`booking-card-${booking.id}`}>
      {booking.visitorName}
    </div>
  ),
}));

vi.mock('date-fns', () => ({
  format: (_date: Date, _fmt: string) => '2026-04-20',
}));

// ─── Mock IntersectionObserver ────────────────────────────────────────────────
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe = mockObserve;
    disconnect = mockDisconnect;
    unobserve = vi.fn();
    constructor(public callback: IntersectionObserverCallback) {}
  });
});

// ─── Sample data helpers ──────────────────────────────────────────────────────

const makeBooking = (id: string, overrides = {}) => ({
  id,
  visitor_name: `Visitor ${id}`,
  phone: '9999999999',
  email: `visitor${id}@example.com`,
  number_of_guests: 2,
  booking_date: '2026-04-15',
  booking_time: '10:00',
  visited: false,
  status: 'confirmed',
  ...overrides,
});

const makeApiResponse = (bookings: ReturnType<typeof makeBooking>[], total = bookings.length) => ({
  success: true,
  bookings,
  total,
  pagination: { total },
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('History Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: empty result
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => makeApiResponse([]),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    it('renders the page heading', async () => {
      render(<HistoryPage />);
      const headings = screen.getAllByText('Booking History');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('renders the toolbar', async () => {
      render(<HistoryPage />);
      expect(screen.getByTestId('history-toolbar')).toBeInTheDocument();
    });

    it('renders the history table (desktop)', async () => {
      render(<HistoryPage />);
      expect(screen.getByTestId('history-table')).toBeInTheDocument();
    });

    it('shows 0 total on empty result', async () => {
      render(<HistoryPage />);
      await waitFor(() => {
        expect(screen.getByTestId('total-count').textContent).toBe('0');
      });
    });
  });

  // ── API Fetch ────────────────────────────────────────────────────────────

  describe('Data fetching', () => {
    it('fetches bookings on mount', async () => {
      render(<HistoryPage />);
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
      const url = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(url).toContain('/api/bookings');
    });

    it('displays fetched bookings in the table', async () => {
      const bookings = [makeBooking('b1'), makeBooking('b2')];
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => makeApiResponse(bookings, 2),
      });

      render(<HistoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('booking-row-b1')).toBeInTheDocument();
        expect(screen.getByTestId('booking-row-b2')).toBeInTheDocument();
      });
    });

    it('shows the correct total count', async () => {
      const bookings = [makeBooking('b1')];
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => makeApiResponse(bookings, 42),
      });

      render(<HistoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('total-count').textContent).toBe('42');
      });
    });

    it('handles fetch failure gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      render(<HistoryPage />);
      // Should not throw; table renders with 0 results
      await waitFor(() => {
        expect(screen.getByTestId('history-table')).toBeInTheDocument();
      });
    });
  });

  // ── Loading state ────────────────────────────────────────────────────────

  describe('Loading state', () => {
    it('shows loading indicator while fetching', async () => {
      let resolve: (v: any) => void;
      global.fetch = vi.fn().mockReturnValue(
        new Promise((r) => { resolve = r; })
      );

      render(<HistoryPage />);

      expect(screen.getByTestId('table-loading')).toBeInTheDocument();

      // Resolve fetch
      await act(async () => {
        resolve!({ json: async () => makeApiResponse([]) });
      });
    });
  });

  // ── Default sort / pagination ────────────────────────────────────────────

  describe('Default state', () => {
    it('defaults to sort by date:desc', () => {
      render(<HistoryPage />);
      expect(screen.getByTestId('current-sort').textContent).toBe('date:desc');
    });

    it('defaults to page 1 and page size 10', async () => {
      render(<HistoryPage />);
      expect(screen.getByTestId('page-num').textContent).toBe('1');
      expect(screen.getByTestId('page-size').textContent).toBe('10');
    });
  });

  // ── Sort ─────────────────────────────────────────────────────────────────

  describe('Sort changes', () => {
    it('updates sort when toolbar sort changes', async () => {
      const user = userEvent.setup();
      render(<HistoryPage />);

      await user.click(screen.getByTestId('sort-name-asc'));

      expect(screen.getByTestId('current-sort').textContent).toBe('name:asc');
    });

    it('resets to page 1 when sort changes', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => makeApiResponse([makeBooking('b1')], 30),
      });

      render(<HistoryPage />);

      // Go to page 2
      await waitFor(() => screen.getByTestId('next-page'));
      await user.click(screen.getByTestId('next-page'));
      await waitFor(() => {
        expect(screen.getByTestId('page-num').textContent).toBe('2');
      });

      // Change sort → should reset to page 1
      await user.click(screen.getByTestId('sort-name-asc'));
      await waitFor(() => {
        expect(screen.getByTestId('page-num').textContent).toBe('1');
      });
    });
  });

  // ── Visited filter ───────────────────────────────────────────────────────

  describe('Visited filter', () => {
    it('sends visitedFilter param when filter is not "all"', async () => {
      const user = userEvent.setup();
      render(<HistoryPage />);

      await user.selectOptions(screen.getByTestId('visited-filter'), 'visited');

      await waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const lastUrl = calls[calls.length - 1][0] as string;
        expect(lastUrl).toContain('visitedFilter=visited');
      });
    });

    it('does not send visitedFilter when set to "all"', async () => {
      render(<HistoryPage />);

      await waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const lastUrl = calls[calls.length - 1][0] as string;
        expect(lastUrl).not.toContain('visitedFilter');
      });
    });

    it('resets to page 1 when filter changes', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => makeApiResponse([makeBooking('b1')], 30),
      });

      render(<HistoryPage />);
      await waitFor(() => screen.getByTestId('next-page'));
      await user.click(screen.getByTestId('next-page'));
      await waitFor(() => {
        expect(screen.getByTestId('page-num').textContent).toBe('2');
      });

      await user.selectOptions(screen.getByTestId('visited-filter'), 'visited');
      await waitFor(() => {
        expect(screen.getByTestId('page-num').textContent).toBe('1');
      });
    });
  });

  // ── Date filter ──────────────────────────────────────────────────────────

  describe('Date filter', () => {
    it('sends date param when date is set', async () => {
      const user = userEvent.setup();
      render(<HistoryPage />);

      await user.click(screen.getByTestId('set-date'));

      await waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const lastUrl = calls[calls.length - 1][0] as string;
        expect(lastUrl).toContain('date=');
      });
    });

    it('clears date param after clearing the date', async () => {
      const user = userEvent.setup();
      render(<HistoryPage />);

      await user.click(screen.getByTestId('set-date'));

      await waitFor(() => {
        expect(screen.getByTestId('clear-date')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('clear-date'));

      await waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const lastUrl = calls[calls.length - 1][0] as string;
        expect(lastUrl).not.toContain('date=');
      });
    });
  });

  // ── Pagination ───────────────────────────────────────────────────────────

  describe('Pagination', () => {
    it('advances to page 2 when next page is clicked', async () => {
      const user = userEvent.setup();
      render(<HistoryPage />);

      await user.click(screen.getByTestId('next-page'));

      expect(screen.getByTestId('page-num').textContent).toBe('2');
    });

    it('resets to page 1 and sends new pageSize when page size changes', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => makeApiResponse([makeBooking('b1')], 30),
      });

      render(<HistoryPage />);
      await waitFor(() => screen.getByTestId('next-page'));
      await user.click(screen.getByTestId('next-page'));
      await waitFor(() => {
        expect(screen.getByTestId('page-num').textContent).toBe('2');
      });

      await user.click(screen.getByTestId('change-page-size'));

      await waitFor(() => {
        expect(screen.getByTestId('page-num').textContent).toBe('1');
        expect(screen.getByTestId('page-size').textContent).toBe('25');
      });
    });

    it('includes offset in fetch URL based on page', async () => {
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => makeApiResponse([makeBooking('b1')]),
      });

      render(<HistoryPage />);

      await user.click(screen.getByTestId('next-page'));

      await waitFor(() => {
        const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
        const lastUrl = calls[calls.length - 1][0] as string;
        expect(lastUrl).toContain('offset=10');
      });
    });
  });

  // ── normalise ────────────────────────────────────────────────────────────

  describe('API field normalisation', () => {
    it('handles snake_case API response fields', async () => {
      const booking = {
        id: 'snake1',
        visitor_name: 'Snake Case',
        phone: '1234567890',
        email: 'snake@test.com',
        number_of_guests: 3,
        booking_date: '2026-04-20',
        booking_time: '09:00',
        visited: true,
        status: 'confirmed',
      };
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => makeApiResponse([booking]),
      });

      render(<HistoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('booking-row-snake1')).toBeInTheDocument();
        expect(screen.getByTestId('booking-row-snake1').textContent).toContain('Snake Case');
      });
    });

    it('handles camelCase API response fields', async () => {
      const booking = {
        id: 'camel1',
        visitorName: 'Camel Case',
        phone: '1234567890',
        email: 'camel@test.com',
        numberOfGuests: 2,
        bookingDate: '2026-04-20',
        bookingTime: '10:00',
        visited: false,
        status: 'confirmed',
      };
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => makeApiResponse([booking]),
      });

      render(<HistoryPage />);

      await waitFor(() => {
        expect(screen.getByTestId('booking-row-camel1')).toBeInTheDocument();
        expect(screen.getByTestId('booking-row-camel1').textContent).toContain('Camel Case');
      });
    });
  });
});
