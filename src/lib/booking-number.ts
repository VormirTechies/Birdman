import type { Booking } from './db/schema';

type BookingCodeSource = Pick<Booking, 'id' | 'bookingNumber'>;

export function formatBookingNumber(value: number): string {
  return `#${String(value).padStart(6, '0')}`;
}

export function getPublicBookingCode(booking: BookingCodeSource): string {
  if (typeof booking.bookingNumber === 'number') {
    return formatBookingNumber(booking.bookingNumber);
  }

  return `#${booking.id.slice(-8).toUpperCase()}`;
}

export function parsePublicBookingNumber(code: string): number | null {
  const normalized = code.replace(/^#/, '').trim();
  if (!/^\d{1,8}$/.test(normalized)) return null;

  const number = Number.parseInt(normalized, 10);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}
