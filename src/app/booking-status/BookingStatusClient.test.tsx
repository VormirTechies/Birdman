import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingStatusClient } from './BookingStatusClient';

const booking = {
  bookingCode: '#000023',
  visitorName: 'Ananya Rao',
  phone: '******3210',
  email: 'a***@example.com',
  bookingDate: '2099-08-20',
  bookingTime: '16:30:00',
  adults: 2,
  children: 1,
  numberOfGuests: 3,
  status: 'confirmed',
  createdAt: '2099-08-01T00:00:00.000Z',
};

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function mockApi() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith('/api/calendar')) {
      return jsonResponse([{
        date: '2099-08-20',
        bookingCount: 3,
        maxCapacity: 100,
        isOpen: true,
        startTime: '16:30:00',
        percentage: 3,
        remaining: 97,
      }]);
    }
    if (url === '/api/bookings/self-service' && init?.method === 'DELETE') {
      return jsonResponse({
        success: true,
        booking: { ...booking, status: 'cancelled' },
      });
    }
    if (url === '/api/bookings/self-service' && init?.method === 'PATCH') {
      return jsonResponse({ success: true, booking });
    }
    if (url === '/api/bookings/self-service' && init?.method === 'POST') {
      return jsonResponse({ success: true, booking });
    }
    throw new Error(`Unexpected request: ${init?.method ?? 'GET'} ${url}`);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function findBooking(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Booking Reference'), '#000023');
  await user.type(screen.getByLabelText('Phone or Email'), '9876543210');
  await user.click(screen.getByRole('button', { name: 'Find Booking' }));
  await screen.findByText('Ananya Rao');
}

describe('BookingStatusClient actions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the reschedule UI and submits it through PATCH', async () => {
    const fetchMock = mockApi();
    const user = userEvent.setup();
    render(<BookingStatusClient />);
    await findBooking(user);

    await user.click(screen.getByRole('button', { name: 'Reschedule Booking' }));
    expect(screen.getByText('Reschedule your visit')).toBeInTheDocument();
    expect(screen.getByLabelText('New Date')).toHaveValue('2099-08-20');

    await user.click(screen.getByRole('button', { name: 'Confirm Reschedule' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/bookings/self-service',
        expect.objectContaining({ method: 'PATCH' })
      );
    });
    expect(await screen.findByText('Booking updated successfully.')).toBeInTheDocument();
  });

  it('requires confirmation and cancels through DELETE', async () => {
    const fetchMock = mockApi();
    const user = userEvent.setup();
    render(<BookingStatusClient />);
    await findBooking(user);

    await user.click(screen.getByRole('button', { name: 'Cancel Booking' }));
    expect(screen.getByRole('region', { name: 'Cancel this booking?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Yes, Cancel Booking' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/bookings/self-service',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
    expect(await screen.findByText('Booking cancelled successfully.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reschedule Booking' })).toBeDisabled();
    expect(screen.getByText('This booking has already been cancelled.')).toBeInTheDocument();
  });
});
