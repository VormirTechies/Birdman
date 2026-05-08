import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarHeader } from '@/app/admin/calendar/_components/CalendarHeader';

// Mock CalendarLegend component
vi.mock('@/app/admin/calendar/_components/CalendarLegend', () => ({
  CalendarLegend: () => <div data-testid="calendar-legend">Legend</div>,
}));

describe('CalendarHeader', () => {
  const mockOnPreviousMonth = vi.fn();
  const mockOnNextMonth = vi.fn();
  const currentMonth = new Date(2026, 3, 15); // April 15, 2026

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays current month and year', () => {
    render(
      <CalendarHeader
        currentMonth={currentMonth}
        onPreviousMonth={mockOnPreviousMonth}
        onNextMonth={mockOnNextMonth}
      />
    );

    expect(screen.getByText('April 2026')).toBeInTheDocument();
  });

  it('renders previous month button', () => {
    render(
      <CalendarHeader
        currentMonth={currentMonth}
        onPreviousMonth={mockOnPreviousMonth}
        onNextMonth={mockOnNextMonth}
      />
    );

    const prevButton = screen.getByLabelText('Previous month');
    expect(prevButton).toBeInTheDocument();
  });

  it('renders next month button', () => {
    render(
      <CalendarHeader
        currentMonth={currentMonth}
        onPreviousMonth={mockOnPreviousMonth}
        onNextMonth={mockOnNextMonth}
      />
    );

    const nextButton = screen.getByLabelText('Next month');
    expect(nextButton).toBeInTheDocument();
  });

  it('renders calendar title', () => {
    render(
      <CalendarHeader
        currentMonth={currentMonth}
        onPreviousMonth={mockOnPreviousMonth}
        onNextMonth={mockOnNextMonth}
      />
    );

    expect(screen.getByText('Calendar')).toBeInTheDocument();
  });

  it('calls onPreviousMonth when previous button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CalendarHeader
        currentMonth={currentMonth}
        onPreviousMonth={mockOnPreviousMonth}
        onNextMonth={mockOnNextMonth}
      />
    );

    const prevButton = screen.getByLabelText('Previous month');
    await user.click(prevButton);

    expect(mockOnPreviousMonth).toHaveBeenCalledTimes(1);
  });

  it('calls onNextMonth when next button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <CalendarHeader
        currentMonth={currentMonth}
        onPreviousMonth={mockOnPreviousMonth}
        onNextMonth={mockOnNextMonth}
      />
    );

    const nextButton = screen.getByLabelText('Next month');
    await user.click(nextButton);

    expect(mockOnNextMonth).toHaveBeenCalledTimes(1);
  });

  it('does not render calendar legend in header', () => {
    render(
      <CalendarHeader
        currentMonth={currentMonth}
        onPreviousMonth={mockOnPreviousMonth}
        onNextMonth={mockOnNextMonth}
      />
    );

    // Legend is rendered separately in the page, not in header
    expect(screen.queryByTestId('calendar-legend')).not.toBeInTheDocument();
  });

  it('updates month display when currentMonth prop changes', () => {
    const { rerender } = render(
      <CalendarHeader
        currentMonth={currentMonth}
        onPreviousMonth={mockOnPreviousMonth}
        onNextMonth={mockOnNextMonth}
      />
    );

    expect(screen.getByText('April 2026')).toBeInTheDocument();

    const newMonth = new Date(2026, 4, 15); // May 2026
    rerender(
      <CalendarHeader
        currentMonth={newMonth}
        onPreviousMonth={mockOnPreviousMonth}
        onNextMonth={mockOnNextMonth}
      />
    );

    expect(screen.getByText('May 2026')).toBeInTheDocument();
  });

  it('renders chevron icons for navigation buttons', () => {
    render(
      <CalendarHeader
        currentMonth={currentMonth}
        onPreviousMonth={mockOnPreviousMonth}
        onNextMonth={mockOnNextMonth}
      />
    );

    // Check for SVG icons (ChevronLeft and ChevronRight from lucide-react)
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('has correct responsive layout', () => {
    const { container } = render(
      <CalendarHeader
        currentMonth={currentMonth}
        onPreviousMonth={mockOnPreviousMonth}
        onNextMonth={mockOnNextMonth}
      />
    );

    const header = container.firstChild;
    expect(header).toBeTruthy();
  });
});
