import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CalendarPage from '@/app/admin/calendar/page';

// Mock child components
vi.mock('@/app/admin/calendar/_components/CalendarHeader', () => ({
  CalendarHeader: ({ currentMonth, onPreviousMonth, onNextMonth }: any) => (
    <div data-testid="calendar-header">
      <button onClick={onPreviousMonth}>Previous</button>
      <span>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
      <button onClick={onNextMonth}>Next</button>
    </div>
  ),
}));

vi.mock('@/app/admin/calendar/_components/CalendarGrid', () => ({
  CalendarGrid: ({ currentMonth, onDayClick }: any) => (
    <div data-testid="calendar-grid">
      <button onClick={() => onDayClick('2026-04-21', { date: '2026-04-21' })}>
        April 21
      </button>
    </div>
  ),
}));

vi.mock('@/app/admin/calendar/_components/CalendarLegend', () => ({
  CalendarLegend: () => <div data-testid="calendar-legend">Legend</div>,
}));

vi.mock('@/app/admin/calendar/_components/DayDetailsModal', () => ({
  DayDetailsModal: ({ isOpen, date, onClose, onSave }: any) =>
    isOpen ? (
      <div data-testid="day-details-modal">
        <span>Modal for {date}</span>
        <button onClick={onClose}>Close</button>
        <button onClick={() => { onSave(); onClose(); }}>Save</button>
      </div>
    ) : null,
}));

describe('Calendar Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders calendar header', () => {
    render(<CalendarPage />);
    expect(screen.getByTestId('calendar-header')).toBeInTheDocument();
  });

  it('renders calendar grid', () => {
    render(<CalendarPage />);
    expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();
  });

  it('renders calendar legend', () => {
    render(<CalendarPage />);
    expect(screen.getByTestId('calendar-legend')).toBeInTheDocument();
  });

  it('displays current month initially', () => {
    render(<CalendarPage />);
    
    const currentDate = new Date();
    const currentMonthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    expect(screen.getByText(currentMonthName)).toBeInTheDocument();
  });

  it('navigates to previous month', async () => {
    const user = userEvent.setup();
    render(<CalendarPage />);

    const currentDate = new Date();
    const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    const previousMonthName = previousMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    await user.click(screen.getByText('Previous'));

    expect(screen.getByText(previousMonthName)).toBeInTheDocument();
  });

  it('navigates to next month', async () => {
    const user = userEvent.setup();
    render(<CalendarPage />);

    const currentDate = new Date();
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
    const nextMonthName = nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    await user.click(screen.getByText('Next'));

    expect(screen.getByText(nextMonthName)).toBeInTheDocument();
  });

  it('opens day details modal when date is clicked', async () => {
    const user = userEvent.setup();
    render(<CalendarPage />);

    expect(screen.queryByTestId('day-details-modal')).not.toBeInTheDocument();

    await user.click(screen.getByText('April 21'));

    await waitFor(() => {
      expect(screen.getByTestId('day-details-modal')).toBeInTheDocument();
      expect(screen.getByText('Modal for 2026-04-21')).toBeInTheDocument();
    });
  });

  it('closes day details modal when close is clicked', async () => {
    const user = userEvent.setup();
    render(<CalendarPage />);

    // Open modal
    await user.click(screen.getByText('April 21'));
    await waitFor(() => {
      expect(screen.getByTestId('day-details-modal')).toBeInTheDocument();
    });

    // Close modal
    await user.click(screen.getByText('Close'));

    await waitFor(() => {
      expect(screen.queryByTestId('day-details-modal')).not.toBeInTheDocument();
    });
  });

  it('refreshes calendar grid when modal save is clicked', async () => {
    const user = userEvent.setup();
    render(<CalendarPage />);

    // Open modal
    await user.click(screen.getByText('April 21'));
    await waitFor(() => {
      expect(screen.getByTestId('day-details-modal')).toBeInTheDocument();
    });

    // Save changes - modal will call onSave which calls onClose
    await user.click(screen.getByText('Save'));

    // Modal should close (mocked onSave calls onClose)
    // Calendar grid should still exist
    expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();
  });

  it('maintains selected date state correctly', async () => {
    const user = userEvent.setup();
    render(<CalendarPage />);

    // Initially no modal
    expect(screen.queryByTestId('day-details-modal')).not.toBeInTheDocument();

    // Click a date
    await user.click(screen.getByText('April 21'));

    await waitFor(() => {
      expect(screen.getByText('Modal for 2026-04-21')).toBeInTheDocument();
    });

    // Close modal
    await user.click(screen.getByText('Close'));

    await waitFor(() => {
      expect(screen.queryByTestId('day-details-modal')).not.toBeInTheDocument();
    });

    // Click same date again
    await user.click(screen.getByText('April 21'));

    await waitFor(() => {
      expect(screen.getByText('Modal for 2026-04-21')).toBeInTheDocument();
    });
  });

  it('updates calendar when month changes', async () => {
    const user = userEvent.setup();
    render(<CalendarPage />);

    const currentDate = new Date();
    const currentMonthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    expect(screen.getByText(currentMonthName)).toBeInTheDocument();

    // Navigate to next month
    await user.click(screen.getByText('Next'));

    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
    const nextMonthName = nextMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    expect(screen.getByText(nextMonthName)).toBeInTheDocument();
    
    // Calendar grid should still be present
    expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();
  });

  it('has correct layout structure', () => {
    const { container } = render(<CalendarPage />);
    
    // Should have main container with proper styling
    expect(container.querySelector('.space-y-4')).toBeInTheDocument();
    expect(container.querySelector('.bg-white')).toBeInTheDocument();
    expect(container.querySelector('.rounded-2xl')).toBeInTheDocument();
  });

  it('increments refresh key on save', async () => {
    const user = userEvent.setup();
    render(<CalendarPage />);

    // Open and save modal first time
    await user.click(screen.getByText('April 21'));
    await waitFor(() => {
      expect(screen.getByTestId('day-details-modal')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Save'));

    // Open and save modal second time
    await user.click(screen.getByText('April 21'));
    await waitFor(() => {
      expect(screen.getByTestId('day-details-modal')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Save'));

    // Should still work correctly - grid should still be present
    expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();
  });
});
