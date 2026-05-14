import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from '@/app/admin/settings/page';
import { vi } from 'vitest';

/**
 * Phase 2 Tests: Settings Page UI
 * Tests for UI interactions and component behavior
 */

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { email: 'admin@test.com' } },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: 'admin-123' },
        error: null,
      }),
    })),
  })),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('Settings Page UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders settings page with all components', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Calendar Settings')).toBeInTheDocument();
    expect(screen.getByText('Configure capacity, timings, and availability')).toBeInTheDocument();
    expect(screen.getByText('Select Date Range')).toBeInTheDocument();
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByText('Preview Changes')).toBeInTheDocument();
  });

  it('shows all three apply mode options', () => {
    render(<SettingsPage />);

    expect(screen.getByText('All Days')).toBeInTheDocument();
    expect(screen.getByText('One Day')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();
  });

  it('switches between apply modes', async () => {
    render(<SettingsPage />);

    const oneDayButton = screen.getByText('One Day').closest('button');
    const dateRangeButton = screen.getByText('Date Range').closest('button');

    // Switch to One Day mode
    fireEvent.click(oneDayButton!);
    await waitFor(() => {
      expect(screen.getByLabelText('Select Date')).toBeInTheDocument();
    });

    // Switch to Date Range mode
    fireEvent.click(dateRangeButton!);
    await waitFor(() => {
      expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
      expect(screen.getByLabelText('End Date')).toBeInTheDocument();
    });
  });

  it('displays configuration options', () => {
    render(<SettingsPage />);

    expect(screen.getByLabelText('Maximum Capacity')).toBeInTheDocument();
    expect(screen.getByLabelText('Session Start Time')).toBeInTheDocument();
    expect(screen.getByText('Open for Bookings')).toBeInTheDocument();
  });

  it('updates max capacity input', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const capacityInput = screen.getByLabelText('Maximum Capacity') as HTMLInputElement;
    await user.clear(capacityInput);
    await user.type(capacityInput, '150');

    expect(capacityInput.value).toBe('150');
  });

  it('updates start time input', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const timeInput = screen.getByLabelText('Session Start Time') as HTMLInputElement;
    await user.clear(timeInput);
    await user.type(timeInput, '15:00');

    // Time input displays with seconds appended by the component
    expect(timeInput.value).toBe('15:00:00');
  });

  it('shows warning when blocking dates', async () => {
    render(<SettingsPage />);

    const switchButton = screen.getByRole('switch');
    fireEvent.click(switchButton);

    await waitFor(() => {
      // Check for the red warning banner by looking for text unique to it
      const warningDiv = screen.getByText((content, element) => {
        return element?.classList.contains('text-[#ba1a1a]') &&
               content.includes('Existing bookings for blocked dates');
      });
      expect(warningDiv).toBeInTheDocument();
    });
  });

  it('validates one_day mode requires date', async () => {
    const { toast } = await import('sonner');
    render(<SettingsPage />);

    // Switch to One Day mode
    const oneDayButton = screen.getByText('One Day').closest('button');
    fireEvent.click(oneDayButton!);

    // Click Preview without selecting date
    const previewButton = screen.getByText('Preview Changes');
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please select a date');
    });
  });

  it('validates date_range mode requires both dates', async () => {
    const { toast } = await import('sonner');
    render(<SettingsPage />);

    // Switch to Date Range mode
    const dateRangeButton = screen.getByText('Date Range').closest('button');
    fireEvent.click(dateRangeButton!);

    // Click Preview without selecting dates
    const previewButton = screen.getByText('Preview Changes');
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Please select start and end dates');
    });
  });

  it('validates start date before end date', async () => {
    const { toast } = await import('sonner');
    const user = userEvent.setup();
    render(<SettingsPage />);

    // Switch to Date Range mode
    const dateRangeButton = screen.getByText('Date Range').closest('button');
    fireEvent.click(dateRangeButton!);

    // Set end date before start date
    const startDateInput = screen.getByLabelText('Start Date');
    const endDateInput = screen.getByLabelText('End Date');
    
    await user.type(startDateInput, '2026-06-20');
    await user.type(endDateInput, '2026-06-10');

    // Click Preview
    const previewButton = screen.getByText('Preview Changes');
    fireEvent.click(previewButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Start date must be before end date');
    });
  });

  it('loads preview data on preview click', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        affectedDatesCount: 5,
        affectedDates: ['2026-05-20', '2026-05-21', '2026-05-22'],
        existingBookingsCount: 0,
        bookingsByDate: [],
        sampleCurrentSettings: [],
        willBlock: false,
      }),
    });

    const user = userEvent.setup();
    render(<SettingsPage />);

    // Configure settings
    const capacityInput = screen.getByLabelText('Maximum Capacity');
    await user.clear(capacityInput);
    await user.type(capacityInput, '80');

    // Click Preview button (use getByRole to be specific)
    const previewButton = screen.getByRole('button', { name: /Preview Changes/i });
    fireEvent.click(previewButton);

    // Wait for modal to open and show affected dates count
    await waitFor(() => {
      expect(screen.getByText('5 Dates')).toBeInTheDocument();
      expect(screen.getByText('Apply Mode')).toBeInTheDocument();
    });
  });

  it('clears all settings when clear button clicked', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    // Set some values
    const capacityInput = screen.getByLabelText('Maximum Capacity') as HTMLInputElement;
    await user.clear(capacityInput);
    await user.type(capacityInput, '150');

    // Click Clear all settings
    const clearButton = screen.getByText('Clear all settings');
    fireEvent.click(clearButton);

    // Check that input is cleared
    expect(capacityInput.value).toBe('');
  });
});
