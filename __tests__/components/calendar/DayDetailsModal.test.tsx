import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DayDetailsModal } from '@/app/admin/calendar/_components/DayDetailsModal';

// Mock custom components
vi.mock('@/app/admin/_components/Toggle', () => ({
  Toggle: ({ checked, onChange, label }: any) => (
    <button onClick={() => onChange(!checked)} data-testid="toggle">
      {label}: {checked ? 'ON' : 'OFF'}
    </button>
  ),
}));

vi.mock('@/app/admin/_components/RangeSlider', () => ({
  RangeSlider: ({ value, onChange, label }: any) => (
    <div>
      <label>{label}</label>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        data-testid="range-slider"
      />
    </div>
  ),
}));

vi.mock('@/app/admin/_components/TimePicker', () => ({
  TimePicker: ({ value, onChange, label }: any) => (
    <div>
      <label>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid="time-picker"
      />
    </div>
  ),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('DayDetailsModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();
  const testDate = '2026-04-21';

  const mockDayDetails = {
    success: true,
    date: testDate,
    settings: {
      maxCapacity: 100,
      startTime: '16:30:00',
      isOpen: true,
    },
    stats: {
      totalBooked: 45,
      available: 55,
      percentage: 45,
    },
    bookings: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = 'unset';
    
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/calendar/day/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockDayDetails),
        });
      }
      if (url.includes('/api/calendar/settings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    }) as any;
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <DayDetailsModal
        isOpen={false}
        onClose={mockOnClose}
        date={testDate}
        onSave={mockOnSave}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('disables body scroll when modal opens', () => {
    render(
      <DayDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        date={testDate}
        onSave={mockOnSave}
      />
    );

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when modal closes', () => {
    const { rerender } = render(
      <DayDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        date={testDate}
        onSave={mockOnSave}
      />
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <DayDetailsModal
        isOpen={false}
        onClose={mockOnClose}
        date={testDate}
        onSave={mockOnSave}
      />
    );

    expect(document.body.style.overflow).toBe('unset');
  });

  it('fetches day details when modal opens', async () => {
    render(
      <DayDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        date={testDate}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(`/api/calendar/day/${testDate}`);
    });
  });

  it('displays formatted date in header', async () => {
    render(
      <DayDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        date={testDate}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      // Format: "Monday, Apr 21" or similar
      expect(screen.getByText(/Apr 21/)).toBeInTheDocument();
    });
  });

  it('displays booking statistics', async () => {
    render(
      <DayDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        date={testDate}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('45 / 100')).toBeInTheDocument();
      expect(screen.getByText('Current Status')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });
  });

  it('renders toggle for open/closed status', async () => {
    render(
      <DayDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        date={testDate}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('toggle')).toBeInTheDocument();
    });
  });

  it('renders time picker for operating hours', async () => {
    render(
      <DayDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        date={testDate}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('time-picker')).toBeInTheDocument();
    });
  });

  it('renders range slider for capacity', async () => {
    render(
      <DayDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        date={testDate}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('range-slider')).toBeInTheDocument();
    });
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <DayDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        date={testDate}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('closes modal when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <DayDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        date={testDate}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(container.querySelector('.bg-black\\/50')).toBeInTheDocument();
    });

    const backdrop = container.querySelector('.bg-black\\/50')!;
    await user.click(backdrop);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('saves settings when save button is clicked', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    
    render(
      <DayDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        date={testDate}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/calendar/settings',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining(testDate),
        })
      );
    });

    expect(toast.success).toHaveBeenCalledWith('Calendar settings updated');
    expect(mockOnSave).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles save error gracefully', async () => {
    const user = userEvent.setup();
    const { toast } = await import('sonner');
    
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Save failed' }),
      })
    ) as any;

    render(
      <DayDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        date={testDate}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save settings');
    });
  });

  it('displays loading skeleton while fetching data', () => {
    render(
      <DayDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        date={testDate}
        onSave={mockOnSave}
      />
    );

    // Should show loading state initially
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeTruthy();
  });

  it('handles fetch error gracefully', async () => {
    const { toast } = await import('sonner');
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error'))) as any;

    render(
      <DayDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        date={testDate}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load day details');
    });
  });

  it('calculates updated percentage when capacity changes', async () => {
    const user = userEvent.setup();
    
    render(
      <DayDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        date={testDate}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    // Change capacity via slider - using fireEvent for range inputs
    const slider = screen.getByTestId('range-slider');
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(slider, { target: { value: '50' } });

    await waitFor(() => {
      // 45 booked out of 50 = 90%
      expect(screen.getByText('90%')).toBeInTheDocument();
    });
  });

  it('shows red status card when fully booked', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          ...mockDayDetails,
          stats: {
            totalBooked: 100,
            available: 0,
            percentage: 100,
          },
        }),
      })
    ) as any;

    const { container } = render(
      <DayDetailsModal
        isOpen={true}
        onClose={mockOnClose}
        date={testDate}
        onSave={mockOnSave}
      />
    );

    await waitFor(() => {
      const statusCard = container.querySelector('.bg-red-100');
      expect(statusCard).toBeInTheDocument();
    });
  });
});
