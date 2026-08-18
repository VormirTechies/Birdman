import { formatBookingNumber } from '@/lib/booking-number';

export interface ReconciliationBooking {
  id: string;
  data: Record<string, unknown>;
}

export interface BookingDayDifference {
  date: string;
  before: number;
  after: number;
}

export interface BookingCodeDifference {
  id: string;
  before: string | null;
  after: string;
}

export function reconciliationInteger(value: unknown, label: string) {
  const parsed = Number(value ?? 0);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return parsed;
}

export function calculateBookingReconciliation(
  bookings: ReconciliationBooking[],
  existingDays: Map<string, number>,
  currentCounter: number
) {
  const desiredDays = new Map<string, number>();
  const bookingCodeDifferences: BookingCodeDifference[] = [];
  let maxBookingNumber = 0;

  for (const booking of bookings) {
    const data = booking.data;
    const bookingNumber = reconciliationInteger(
      data.bookingNumber ?? data.booking_number,
      `Booking number for ${booking.id}`
    );
    maxBookingNumber = Math.max(maxBookingNumber, bookingNumber);
    const desiredBookingCode = formatBookingNumber(bookingNumber);
    const existingBookingCode = typeof data.bookingCode === 'string'
      ? data.bookingCode
      : null;
    if (existingBookingCode !== desiredBookingCode) {
      bookingCodeDifferences.push({
        id: booking.id,
        before: existingBookingCode,
        after: desiredBookingCode,
      });
    }
    if (data.status !== 'confirmed') continue;

    const date = String(data.bookingDate ?? data.booking_date ?? '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Booking ${booking.id} has invalid bookingDate: ${date}`);
    }
    const adults = reconciliationInteger(data.adults, `Adults for ${booking.id}`);
    const children = reconciliationInteger(data.children, `Children for ${booking.id}`);
    const guests = reconciliationInteger(
      data.numberOfGuests ?? data.number_of_guests ?? adults + children,
      `Guest count for ${booking.id}`
    );
    desiredDays.set(date, (desiredDays.get(date) ?? 0) + guests);
  }

  const allDates = new Set([...desiredDays.keys(), ...existingDays.keys()]);
  const differences: BookingDayDifference[] = [...allDates]
    .sort()
    .filter((date) => (existingDays.get(date) ?? 0) !== (desiredDays.get(date) ?? 0))
    .map((date) => ({
      date,
      before: existingDays.get(date) ?? 0,
      after: desiredDays.get(date) ?? 0,
    }));

  return {
    desiredDays,
    differences,
    bookingCodeDifferences,
    maxBookingNumber,
    desiredCounter: Math.max(currentCounter, maxBookingNumber),
  };
}
