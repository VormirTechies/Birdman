/**
 * Dashboard Page Tests
 *
 * Tests the main admin dashboard page functionality including:
 * - Page rendering and layout
 * - Stats fetching and display
 * - Manual refresh functionality
 * - Navigation to new booking page
 * - Error handling
 * - Component integration (StatCard, RecentBookings)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import AdminPage from '@/app/admin/page';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock StatCard component
vi.mock('@/app/admin/_components/StatCard', () => ({
  StatCard: ({ label, value, trend }: any) => (
    <div data-testid={`stat-card-${label.toLowerCase().replace(/['\s]/g, '-')}`}>
      <div data-testid="stat-label">{label}</div>
      <div data-testid="stat-value">{value}</div>
      <div data-testid="stat-trend">{trend}</div>
    </div>
  ),
}));

// Mock RecentBookings component
vi.mock('@/app/admin/_components/RecentBookings', () => ({
  RecentBookings: ({ refreshKey }: any) => (
    <div data-testid="recent-bookings">
      Recent Bookings (refreshKey: {refreshKey})
    </div>
  ),
}));

describe('Dashboard Page', () => {
  const mockPush = vi.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);

    // Mock successful API response by default
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        stats: {
          todayVisitors: 25,
          next30Days: 450,
          last30Days: 380,
          totalVisitors: 5200,
        },
      }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders the page with header', async () => {
      render(<AdminPage />);

      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(
        screen.getByText("Here's what's happening at your property today.")
      ).toBeInTheDocument();
    });

    it('renders all stat cards', async () => {
      render(<AdminPage />);

      await waitFor(() => {
        // Check all 4 stat cards are rendered
        const statCards = screen.getAllByTestId(/^stat-card-/);
        expect(statCards.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('renders refresh button', () => {
      render(<AdminPage />);

      const refreshButton = screen.getByTitle('Refresh data');
      expect(refreshButton).toBeInTheDocument();
    });

    it('renders new booking button', () => {
      render(<AdminPage />);

      const newBookingButton = screen.getByText('New Booking');
      expect(newBookingButton).toBeInTheDocument();
    });

    it('renders recent bookings section', async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByTestId('recent-bookings')).toBeInTheDocument();
      });
    });
  });

  describe('Stats Fetching', () => {
    it('fetches stats on mount', async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/bookings/stats',
          expect.objectContaining({
            cache: 'no-cache',
          })
        );
      });
    });

    it('displays fetched stats in stat cards', async () => {
      render(<AdminPage />);

      await waitFor(() => {
        // Check if stat values are displayed
        const statValues = screen.getAllByTestId('stat-value');
        expect(statValues).toHaveLength(4);
        
        // Values should be rendered (25, 450, 380, 5.2K)
        const values = statValues.map(el => el.textContent);
        expect(values).toContain('25');
        expect(values).toContain('450');
        expect(values).toContain('380');
      });
    });

    it('handles fetch error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      render(<AdminPage />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          '[Dashboard] Error fetching stats:',
          expect.any(Error)
        );
      });

      // Should still render with default values (0)
      await waitFor(() => {
        const statValues = screen.getAllByTestId('stat-value');
        expect(statValues).toHaveLength(4);
      });

      consoleErrorSpy.mockRestore();
    });

    it('handles invalid API response', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: false,
        }),
      });

      render(<AdminPage />);

      await waitFor(() => {
        // Should render with default values when API returns invalid data
        const statValues = screen.getAllByTestId('stat-value');
        expect(statValues).toHaveLength(4);
      });
    });
  });

  describe('Manual Refresh', () => {
    it('refetches stats when refresh button is clicked', async () => {
      const user = userEvent.setup();
      render(<AdminPage />);

      // Wait for initial fetch
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });

      // Click refresh button
      const refreshButton = screen.getByTitle('Refresh data');
      await user.click(refreshButton);

      // Should fetch again
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });

    it('shows success toast on refresh', async () => {
      const user = userEvent.setup();
      render(<AdminPage />);

      const refreshButton = screen.getByTitle('Refresh data');
      await user.click(refreshButton);

      expect(toast.success).toHaveBeenCalledWith('Refreshing data...');
    });

    it('increments refreshKey for RecentBookings', async () => {
      const user = userEvent.setup();
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByText(/refreshKey: 0/)).toBeInTheDocument();
      });

      const refreshButton = screen.getByTitle('Refresh data');
      await user.click(refreshButton);

      await waitFor(() => {
        expect(screen.getByText(/refreshKey: 1/)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to new booking page when button clicked', async () => {
      const user = userEvent.setup();
      render(<AdminPage />);

      const newBookingButton = screen.getByText('New Booking');
      await user.click(newBookingButton);

      expect(mockPush).toHaveBeenCalledWith('/admin/bookings/new');
    });
  });

  describe('Responsive Layout', () => {
    it('renders header with proper structure', () => {
      render(<AdminPage />);

      const heading = screen.getByText('Overview');
      expect(heading).toHaveClass('text-2xl', 'lg:text-3xl', 'font-bold');
    });

    it('renders stat cards in responsive grid', async () => {
      const { container } = render(<AdminPage />);

      await waitFor(() => {
        const statsGrid = container.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4');
        expect(statsGrid).toBeInTheDocument();
      });
    });
  });

  describe('Integration', () => {
    it('passes refreshKey to RecentBookings component', async () => {
      render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByTestId('recent-bookings')).toBeInTheDocument();
      });

      // RecentBookings should receive refreshKey prop
      expect(screen.getByText(/refreshKey: 0/)).toBeInTheDocument();
    });

    it('maintains state between renders', async () => {
      const { rerender } = render(<AdminPage />);

      await waitFor(() => {
        expect(screen.getByTestId('recent-bookings')).toBeInTheDocument();
      });

      rerender(<AdminPage />);

      // Should maintain fetched data
      await waitFor(() => {
        const statValues = screen.getAllByTestId('stat-value');
        expect(statValues).toHaveLength(4);
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles zero stats gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          stats: {
            todayVisitors: 0,
            next30Days: 0,
            last30Days: 0,
            totalVisitors: 0,
          },
        }),
      });

      render(<AdminPage />);

      await waitFor(() => {
        const trends = screen.getAllByTestId('stat-trend');
        expect(trends[0]).toHaveTextContent('0');
        expect(trends[1]).toHaveTextContent('0');
      });
    });

    it('handles large numbers formatting', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          stats: {
            todayVisitors: 50,
            next30Days: 1200,
            last30Days: 980,
            totalVisitors: 15000,
          },
        }),
      });

      render(<AdminPage />);

      await waitFor(() => {
        const statValues = screen.getAllByTestId('stat-value');
        expect(statValues).toHaveLength(4);
        // StatCard component should handle formatting
      });
    });
  });
});
