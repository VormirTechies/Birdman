import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarGrid } from '@/app/admin/calendar/_components/CalendarGrid';

// Mock the child components
vi.mock('@/app/admin/calendar/_components/CalendarCell', () => ({
  CalendarCell: ({ date, bookingCount, onClick }: any) => {
    const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
    return (
      <button
        data-testid={`cell-${dateStr}`}
        onClick={onClick}
      >
        {date instanceof Date ? date.getDate() : new Date(date).getDate()} - {bookingCount} bookings
      </button>
    );
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('CalendarGrid', () => {
  const mockOnDayClick = vi.fn();
  const currentMonth = new Date(2026, 3, 1); // April 2026

  const mockApiResponse = {
    success: true,
    year: 2026,
    month: 4,
    days: [
      {
        date: '2026-04-01',
        bookingCount: 5,
        maxCapacity: 100,
        percentage: 5,
        isOpen: true,
        startTime: '16:30:00',
      },
      {
        date: '2026-04-15',
        bookingCount: 70,
        maxCapacity: 100,
        percentage: 70,
        isOpen: true,
        startTime: '16:30:00',
      },
      {
        date: '2026-04-21',
        bookingCount: 95,
        maxCapacity: 100,
        percentage: 95,
        isOpen: true,
        startTime: '16:30:00',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      })
    ) as any;
  });

  it('renders loading skeleton initially', () => {
    render(<CalendarGrid currentMonth={currentMonth} onDayClick={mockOnDayClick} />);
    
    // Should show loading state
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeTruthy();
  });

  it('fetches monthly data on mount', async () => {
    render(<CalendarGrid currentMonth={currentMonth} onDayClick={mockOnDayClick} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/calendar/month?year=2026&month=4');
    });
  });

  it('renders weekday headers', async () => {
    render(<CalendarGrid currentMonth={currentMonth} onDayClick={mockOnDayClick} />);

    await waitFor(() => {
      expect(screen.getByText('SUN')).toBeInTheDocument();
      expect(screen.getByText('MON')).toBeInTheDocument();
      expect(screen.getByText('TUE')).toBeInTheDocument();
      expect(screen.getByText('WED')).toBeInTheDocument();
      expect(screen.getByText('THU')).toBeInTheDocument();
      expect(screen.getByText('FRI')).toBeInTheDocument();
      expect(screen.getByText('SAT')).toBeInTheDocument();
    });
  });

  it('renders calendar cells with correct data', async () => {
    render(<CalendarGrid currentMonth={currentMonth} onDayClick={mockOnDayClick} />);

    await waitFor(() => {
      expect(screen.getByText('1 - 5 bookings')).toBeInTheDocument();
      expect(screen.getByText('15 - 70 bookings')).toBeInTheDocument();
      expect(screen.getByText('21 - 95 bookings')).toBeInTheDocument();
    });
  });

  it('handles cell click correctly', async () => {
    const user = userEvent.setup();    render(<CalendarGrid currentMonth={currentMonth} onDayClick={mockOnDayClick} />);

    // Wait for data to load
    await waitFor(() => {
      // Cell should exist and have booking data
      const cells = screen.getAllByRole('button');
      expect(cells.length).toBeGreaterThan(0);
    });

    // Find and click a cell with bookings that's in the current month
    // The mock renders buttons with text like "15 - 70 bookings"
    const cellWithBookings = screen.getByText('15 - 70 bookings').closest('button');
    if (cellWithBookings) {
      await user.click(cellWithBookings);

      // Verify onDayClick was called
      expect(mockOnDayClick).toHaveBeenCalled();
      expect(mockOnDayClick).toHaveBeenCalledWith(expect.stringMatching(/^2026-04-/), expect.any(Object));
    }
  });

  it('refetches data when month changes', async () => {
    const { rerender } = render(
      <CalendarGrid currentMonth={currentMonth} onDayClick={mockOnDayClick} />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/calendar/month?year=2026&month=4');
    });

    const newMonth = new Date(2026, 4, 1); // May 2026
    rerender(<CalendarGrid currentMonth={newMonth} onDayClick={mockOnDayClick} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/calendar/month?year=2026&month=5');
    });
  });

  it('handles API error gracefully', async () => {
    const { toast } = await import('sonner');
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Server error' }),
      })
    ) as any;

    render(<CalendarGrid currentMonth={currentMonth} onDayClick={mockOnDayClick} />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load calendar data');
    });
  });

  it('generates 42 cells for complete calendar grid (6 weeks)', async () => {
    render(<CalendarGrid currentMonth={currentMonth} onDayClick={mockOnDayClick} />);

    await waitFor(() => {
      const cells = screen.getAllByRole('button');
      expect(cells.length).toBe(42); // 6 weeks * 7 days
    });
  });

  it('displays default values for dates without data', async () => {
    render(<CalendarGrid currentMonth={currentMonth} onDayClick={mockOnDayClick} />);

    await waitFor(() => {
      // Date without data should show 0 bookings
      const cell = screen.getByTestId('cell-2026-04-02');
      expect(cell).toHaveTextContent('0 bookings');
    });
  });
});
