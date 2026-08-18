import 'server-only';

import { getAdminDb } from '@/lib/firebase/admin';
import { cancelFirestoreBooking } from '@/lib/firebase/bookings';

interface CancellationBooking {
  id: string;
  bookingNumber: number;
  email: string | null;
  visitorName: string;
  bookingDate: string;
  adults: number;
  children: number;
  numberOfGuests: number;
}

function field(
  data: Record<string, unknown>,
  camelCase: string,
  snakeCase: string
) {
  return data[camelCase] ?? data[snakeCase];
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getConfirmedBookingCounts(dates: Set<string>) {
  const counts = new Map<string, number>();
  const sortedDates = [...dates].sort();

  if (sortedDates.length === 0) return counts;

  // Replaced full bookings scan with a confirmed-bookings date range query.
  const snapshot = await getAdminDb()
    .collection('bookings')
    .where('status', '==', 'confirmed')
    .where('bookingDate', '>=', sortedDates[0])
    .where('bookingDate', '<=', sortedDates[sortedDates.length - 1])
    .get();
  console.log('[FIRESTORE READ]', 'getConfirmedBookingCounts', 'docs:', snapshot.size);

  for (const document of snapshot.docs) {
    const data = document.data() as Record<string, unknown>;
    const bookingDate = String(field(data, 'bookingDate', 'booking_date') ?? '');
    if (!dates.has(bookingDate)) continue;
    counts.set(bookingDate, (counts.get(bookingDate) ?? 0) + 1);
  }

  return counts;
}

export async function cancelFirestoreBookingsForDates(
  startDate: string,
  endDate: string,
  actorUid: string
): Promise<CancellationBooking[]> {
  const database = getAdminDb();
  // Replaced full bookings scan with a confirmed-bookings date range query.
  const snapshot = await database
    .collection('bookings')
    .where('status', '==', 'confirmed')
    .where('bookingDate', '>=', startDate)
    .where('bookingDate', '<=', endDate)
    .get();
  console.log('[FIRESTORE READ]', 'cancelFirestoreBookingsForDates', 'docs:', snapshot.size);
  const matches = snapshot.docs;

  // Run sequentially because bookings on the same date intentionally contend
  // on one bookingDays document. Each transaction releases its own capacity.
  for (const document of matches) {
    await cancelFirestoreBooking(document.id, {
      actorUid,
      requireConfirmed: true,
    });
  }

  return matches.map((document) => {
    const data = document.data() as Record<string, unknown>;
    const adults = numberValue(data.adults);
    const children = numberValue(data.children);

    return {
      id: document.id,
      bookingNumber: numberValue(
        field(data, 'bookingNumber', 'booking_number')
      ),
      email: data.email ? String(data.email) : null,
      visitorName: String(field(data, 'visitorName', 'visitor_name') ?? ''),
      bookingDate: String(field(data, 'bookingDate', 'booking_date') ?? ''),
      adults,
      children,
      numberOfGuests: numberValue(
        field(data, 'numberOfGuests', 'number_of_guests'),
        adults + children
      ),
    };
  });
}
