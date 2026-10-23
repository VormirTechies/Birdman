import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addDays, format, isSameMonth } from 'date-fns';
import { BookingClient } from './BookingClient';

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
