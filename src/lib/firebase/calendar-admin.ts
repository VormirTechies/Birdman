import 'server-only';

import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';

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
  const snapshot = await getAdminDb().collection('bookings').get();
  const counts = new Map<string, number>();

  for (const document of snapshot.docs) {
    const data = document.data() as Record<string, unknown>;
    const status = String(data.status ?? 'confirmed').toLowerCase();
    const bookingDate = String(field(data, 'bookingDate', 'booking_date') ?? '');
    if (status !== 'confirmed' || !dates.has(bookingDate)) continue;
    counts.set(bookingDate, (counts.get(bookingDate) ?? 0) + 1);
  }

  return counts;
}

export async function cancelFirestoreBookingsForDates(
  startDate: string,
  endDate: string
): Promise<CancellationBooking[]> {
  const database = getAdminDb();
  const snapshot = await database.collection('bookings').get();
  const matches = snapshot.docs.filter((document) => {
    const data = document.data() as Record<string, unknown>;
    const status = String(data.status ?? 'confirmed').toLowerCase();
    const bookingDate = String(field(data, 'bookingDate', 'booking_date') ?? '');
    return status === 'confirmed'
      && bookingDate >= startDate
      && bookingDate <= endDate;
  });

  for (let offset = 0; offset < matches.length; offset += 500) {
    const batch = database.batch();
    for (const document of matches.slice(offset, offset + 500)) {
      batch.update(document.ref, {
        status: 'cancelled',
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
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
