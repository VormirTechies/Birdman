import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addDays, format, isSameMonth } from 'date-fns';
import { BookingClient } from './BookingClient';
import { disableKey, type QAWindow } from '@/lib/local-analytics-qa';

vi.mock('@/components/organisms/Header', () => ({ Header: () => null }));
vi.mock('@/components/organisms/Footer', () => ({ Footer: () => null }));

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('BookingClient availability calendar', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows live capacity details for the selected date and caps guest controls', async () => {
    const today = new Date();
    const targetDate = addDays(today, 1);
    const targetDateString = format(targetDate, 'yyyy-MM-dd');
    const targetMonth = format(targetDate, 'yyyy-MM');
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const month = new URL(String(input), 'http://localhost').searchParams.get('month');
      return jsonResponse(month === targetMonth ? [{
        date: targetDateString,
        bookingCount: 93,
        maxCapacity: 100,
        isOpen: true,
        startTime: '16:30:00',
        percentage: 93,
        remaining: 7,
      }] : []);
    }));

    const user = userEvent.setup();
    render(<BookingClient />);

    for (const label of ['Available', 'Filling up', 'Full', 'Not opened']) {
      expect(screen.getByText(label, { exact: true })).toBeInTheDocument();
    }

    if (!isSameMonth(today, targetDate)) {
      await user.click(screen.getByRole('button', { name: 'Next month' }));
    }

    const dateButton = await screen.findByRole('button', {
      name: `${format(targetDate, 'EEEE, d MMMM')}, 7 seats available`,
    });
    await user.click(dateButton);

    const availability = screen.getByRole('status');
    expect(availability).toHaveTextContent(format(targetDate, 'EEEE, d MMMM'));
    expect(availability).toHaveTextContent('Availability7 seats');
    expect(screen.getByText(/Across bookings, you may book up to 25 guests per date/)).toBeInTheDocument();
    expect(availability).toHaveTextContent('93 reserved');
    expect(availability).toHaveTextContent('100 total seats');
    expect(availability).toHaveTextContent('Your group needs 1 seat');
    expect(availability).toHaveTextContent('6 seats would remain after your booking');
    expect(screen.getByRole('progressbar', {
      name: '93 of 100 seats reserved',
    })).toHaveAttribute('aria-valuenow', '93');

    const increaseChildren = screen.getByRole('button', { name: 'Increase child count' });
    for (let count = 0; count < 6; count += 1) {
      await user.click(increaseChildren);
    }

    expect(increaseChildren).toBeDisabled();
    expect(availability).toHaveTextContent('Your group needs 7 seats');
    expect(availability).toHaveTextContent('0 seats would remain after your booking');
  });

  it('disables a date whose confirmed guests exceed capacity', async () => {
    const targetDate = addDays(new Date(), 1);
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse([{
      date: format(targetDate, 'yyyy-MM-dd'), bookingCount: 104,
      maxCapacity: 100, isOpen: true, startTime: '16:30:00',
      percentage: 104, remaining: 0,
    }])));
    const user = userEvent.setup();
    render(<BookingClient />);
    if (!isSameMonth(new Date(), targetDate)) {
      await user.click(screen.getByRole('button', { name: 'Next month' }));
    }
    expect(await screen.findByRole('button', {
      name: `${format(targetDate, 'EEEE, d MMMM')}, no seats available`,
    })).toBeDisabled();
  });

  it('shows a retry state instead of presenting unknown dates as available', async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ error: 'Unavailable' }, 500));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    render(<BookingClient />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Live availability could not be loaded');

    const unknownDateValue = addDays(new Date(), 1);
    if (!isSameMonth(new Date(), unknownDateValue)) {
      await user.click(screen.getByRole('button', { name: 'Next month' }));
    }
    const unknownDate = screen.getByRole('button', {
      name: `${format(unknownDateValue, 'EEEE, d MMMM')}, availability unavailable`,
    });
    expect(unknownDate).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Retry availability' }));
    expect(fetchMock).toHaveBeenCalledTimes(
      isSameMonth(new Date(), unknownDateValue) ? 2 : 3
    );
  });
});

describe('BookingClient local QA funnel', () => {
  afterEach(() => {
    const browser: QAWindow = window;
    delete browser.birdmanQaData;
    delete browser[disableKey];
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    history.replaceState(null, '', '/');
  });

  it.each([
    [201, { success: true, booking: { id: 'private-booking-id' } }, 'booking_confirmed', undefined],
    [429, { success: false, error: 'Private server message' }, 'booking_confirm_failed', 'rate_limit'],
    [409, { success: false, code: 'BOOKING_CAPACITY_EXCEEDED', available: 0, error: 'No seats are available for this date.' }, 'booking_confirm_failed', 'capacity'],
  ])('tracks one safe outcome for HTTP %i', async (status, body, outcome, category) => {
    const browser: QAWindow = window;
    browser.birdmanQaData = [];
    browser[disableKey] = false;
    vi.stubEnv('NEXT_PUBLIC_GA4_LOCAL_QA', 'true');
    history.replaceState(null, '', '/book?email=synthetic%40example.com');

    const target = addDays(new Date(), 1);
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => init?.method === 'POST'
      ? jsonResponse(body, status)
      : jsonResponse([{
        date: format(target, 'yyyy-MM-dd'), bookingCount: 0, maxCapacity: 100, isOpen: true,
        startTime: '16:30:00', percentage: 0, remaining: 100,
      }]));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();
    render(<BookingClient />);
    const step = document.querySelector<HTMLDivElement>('.container-wide.max-w-6xl');
    if (step) step.scrollIntoView = vi.fn();
    if (!isSameMonth(new Date(), target)) await user.click(screen.getByRole('button', { name: 'Next month' }));
    await user.click(await screen.findByRole('button', { name: `${format(target, 'EEEE, d MMMM')}, 100 seats available` }));
    await user.type(screen.getByPlaceholderText('e.g. Priya Sharma'), 'Synthetic Visitor');
    await user.type(screen.getByPlaceholderText('98765 43210'), '9876543210');
    await user.click(screen.getByRole('button', { name: 'Review Booking' }));
    await user.click(await screen.findByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Confirm Booking' }));

    const events = () => browser.birdmanQaData?.map(event => Array.from(event));
    await waitFor(() => expect(events()?.map(event => event[1])).toEqual([
      'booking_review_view', 'booking_confirm_attempt', outcome,
    ]));
    expect(fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')).toHaveLength(1);
    expect(events()?.[2]?.[2]).toEqual({
      page_location: location.origin + '/book', page_title: 'Book a Visit',
      send_to: 'G-6CGCY64H6C', debug_mode: true, ...(category && { failure_category: category }),
    });
    expect(JSON.stringify(events())).not.toMatch(/9876543210|Synthetic|synthetic|private-booking-id|Private server message/);
    if (status === 409) {
      expect(await screen.findByRole('heading', { name: 'Plan Your Visit' })).toBeVisible();
      expect(screen.getByRole('alert')).toHaveTextContent('No seats are available for this date.');
      expect(screen.getByPlaceholderText('e.g. Priya Sharma')).toHaveValue('Synthetic Visitor');
      await user.clear(screen.getByPlaceholderText('e.g. Priya Sharma'));
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(JSON.stringify(events())).not.toContain('No seats are available');
    }
  });
});
