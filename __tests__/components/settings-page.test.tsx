import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from '@/app/admin/settings/page';

vi.mock('@/firebase', () => ({
  auth: {},
  firebaseConfigError: null,
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, callback: (user: { uid: string } | null) => void) => {
    callback({ uid: 'admin-123' });
    return vi.fn();
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

function jsonResponse(data: unknown, ok = true) {
  return {
    ok,
    json: async () => data,
  } as Response;
}

describe('Settings Page UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('/api/calendar/day/')) {
        return jsonResponse({
          success: true,
          settings: {
            maxCapacity: 100,
            startTime: '16:30:00',
            isOpen: true,
          },
        });
      }

      if (url.includes('/api/admin/settings/preview')) {
        return jsonResponse({
          success: true,
          affectedDatesCount: 5,
          affectedDates: ['2026-06-20', '2026-06-21'],
          existingBookingsCount: 0,
          bookingsByDate: [],
          sampleCurrentSettings: [],
          willBlock: false,
        });
      }

      return jsonResponse({ success: true });
    }) as typeof fetch;
  });

  it('renders settings page with all main sections', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Calendar Settings')).toBeInTheDocument();
    expect(screen.getByText((_, element) =>
      element?.textContent === 'Configure capacity, timings, and availability'
    )).toBeInTheDocument();
    expect(screen.getByText('Select Date Range')).toBeInTheDocument();
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Preview Changes/i })).toBeInTheDocument();
  });

  it('shows all three apply mode options', () => {
    render(<SettingsPage />);

    expect(screen.getByText('All Days')).toBeInTheDocument();
    expect(screen.getByText('One Day')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();
  });

  it('switches between apply modes', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(screen.getByText('One Day'));
    expect(screen.getByText('Select Date')).toBeInTheDocument();

    await user.click(screen.getByText('Date Range'));
    expect(screen.getByText('Start Date')).toBeInTheDocument();
    expect(screen.getByText('End Date')).toBeInTheDocument();
  });

  it('displays configuration controls', () => {
    render(<SettingsPage />);

    expect(screen.getByText('Open for Bookings')).toBeInTheDocument();
    expect(screen.getByText('Visiting Hour')).toBeInTheDocument();
    expect(screen.getByText('Maximum Capacity')).toBeInTheDocument();
    expect(screen.getByText('100 visitors')).toBeInTheDocument();
  });

  it('updates visiting hour from the custom time picker', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(screen.getByRole('button', { name: /4:30 PM/i }));
    await user.click(screen.getByRole('button', { name: /5:00 PM/i }));

    expect(screen.getByRole('button', { name: /5:00 PM/i })).toBeInTheDocument();
  });

  it('shows warning when blocking dates', async () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole('switch'));

    expect(
      screen.getByText(/Existing bookings for blocked dates will be automatically cancelled/i)
    ).toBeInTheDocument();
  });

  it('loads preview data on preview click', async () => {
    render(<SettingsPage />);

    fireEvent.click(screen.getByRole('button', { name: /Preview Changes/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/settings/preview',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
