import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CalendarCell } from '@/app/admin/calendar/_components/CalendarCell';

describe('CalendarCell', () => {
  const mockOnClick = vi.fn();
  const baseProps = {
    date: new Date(2026, 3, 15), // April 15, 2026
    bookingCount: 0,
    maxCapacity: 100,
    percentage: 0,
    isOpen: true,
    isCurrentMonth: true,
    isToday: false,
    isPast: false,
    onClick: mockOnClick,
  };

  it('renders date number correctly', () => {
    render(<CalendarCell {...baseProps} />);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('applies white background when no bookings', () => {
    const { container } = render(<CalendarCell {...baseProps} />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-white');
  });

  it('applies light green background for 1-70% capacity', () => {
    const { container } = render(
      <CalendarCell {...baseProps} bookingCount={50} percentage={50} />
    );
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-green-100');
  });

  it('applies dark green background for 71-100% capacity', () => {
    const { container } = render(
      <CalendarCell {...baseProps} bookingCount={80} percentage={80} />
    );
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-green-700');
  });

  it('applies gray background when disabled (past or closed)', () => {
    const { container } = render(
      <CalendarCell {...baseProps} isPast={true} />
    );
    const button = container.querySelector('button');
    expect(button?.className).toContain('bg-gray-300');
  });

  it('shows booking count with Feather icon when bookings > 0', () => {
    render(<CalendarCell {...baseProps} bookingCount={25} percentage={25} />);
    expect(screen.getByText('25')).toBeInTheDocument();
    
    // Check for Feather icon (lucide-react renders svg)
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('does not show booking count when 0 bookings', () => {
    const { container } = render(<CalendarCell {...baseProps} />);
    
    // Should not have booking count div
    const bookingDisplay = container.querySelector('.flex.items-center.gap-1');
    expect(bookingDisplay).not.toBeInTheDocument();
  });

  it('shows capacity when percentage >= 90%', () => {
    render(<CalendarCell {...baseProps} bookingCount={95} percentage={95} />);
    expect(screen.getByText('95/100')).toBeInTheDocument();
  });

  it('does not show capacity when percentage < 90%', () => {
    render(<CalendarCell {...baseProps} bookingCount={70} percentage={70} />);
    expect(screen.queryByText('70/100')).not.toBeInTheDocument();
  });

  it('shows disabled overlay for disabled dates', () => {
    const { container } = render(<CalendarCell {...baseProps} isPast={true} />);
    // Check for Ban icon (lucide-react renders as svg)
    const svgIcon = container.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();
  });

  it('shows disabled overlay when isOpen is false', () => {
    const { container } = render(<CalendarCell {...baseProps} isOpen={false} />);
    // Check for Ban icon (lucide-react renders as svg)
    const svgIcon = container.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    render(<CalendarCell {...baseProps} />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('disables click for dates not in current month', () => {
    render(<CalendarCell {...baseProps} isCurrentMonth={false} />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders correctly when isToday is true', () => {
    const { container } = render(<CalendarCell {...baseProps} isToday={true} />);
    const button = container.querySelector('button');
    // Just verify the component renders without errors for today's date
    expect(button).toBeInTheDocument();
  });

  it('applies opacity for non-current month dates', () => {
    const { container } = render(<CalendarCell {...baseProps} isCurrentMonth={false} />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('opacity-40');
  });

  it('applies correct text color for dark green background', () => {
    const { container } = render(
      <CalendarCell {...baseProps} bookingCount={95} percentage={95} />
    );
    
    const dateNumber = screen.getByText('15');
    expect(dateNumber.className).toContain('text-white');
  });

  it('applies correct text color for light backgrounds', () => {
    const { container } = render(
      <CalendarCell {...baseProps} bookingCount={30} percentage={30} />
    );
    
    const dateNumber = screen.getByText('15');
    expect(dateNumber.className).toContain('text-gray-900');
  });

  it('applies hover shadow effect', () => {
    const { container } = render(<CalendarCell {...baseProps} />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('hover:shadow-md');
  });

  it('has correct responsive heights', () => {
    const { container } = render(<CalendarCell {...baseProps} />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('h-24');
    expect(button?.className).toContain('md:h-28');
    expect(button?.className).toContain('lg:h-32');
  });
});
