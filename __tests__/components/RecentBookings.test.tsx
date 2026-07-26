import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecentBookings, type RecentBooking } from '@/app/admin/_components/RecentBookings';

const bookings: RecentBooking[] = Array.from({ length: 7 }, (_, index) => ({
  id: `booking-${index + 1}`,
  visitorName: `Visitor ${index + 1}`,
  numberOfGuests: index + 1,
  bookingDate: '2026-07-25',
  bookingTime: '16:30:00',
  status: index === 1 ? 'completed' : 'confirmed',
  isVip: index === 0,
}));

describe('RecentBookings', () => {
  it('renders at most five read-only bookings without making requests', () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    render(<RecentBookings bookings={bookings} />);

    expect(screen.getByText('Visitor 1')).toBeInTheDocument();
    expect(screen.getByText('Visitor 5')).toBeInTheDocument();
    expect(screen.queryByText('Visitor 6')).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('links to booking history', () => {
    render(<RecentBookings bookings={bookings} />);

    expect(screen.getByRole('link', { name: /view more bookings/i })).toHaveAttribute(
      'href',
      '/admin/history'
    );
  });

  it('shows an empty state', () => {
    render(<RecentBookings bookings={[]} />);

    expect(screen.getByText('No recent bookings')).toBeInTheDocument();
  });

  it('shows a five-row loading skeleton', () => {
    render(<RecentBookings bookings={[]} isLoading />);

    expect(screen.getByLabelText('Loading recent bookings').children).toHaveLength(5);
  });
});
