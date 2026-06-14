import 'server-only';

import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import {
  DEFAULT_CALENDAR_CAPACITY,
  DEFAULT_CALENDAR_START_TIME,
  getFirestoreCalendarSetting,
  getFirestoreCalendarSettings,
} from '@/lib/firebase/calendar-settings';

const DEFAULT_CAPACITY = DEFAULT_CALENDAR_CAPACITY;
const DEFAULT_START_TIME = DEFAULT_CALENDAR_START_TIME;

type FirestoreBooking = Record<string, unknown>;

function field(data: FirestoreBooking, camelCase: string, snakeCase: string): unknown {
  return data[camelCase] ?? data[snakeCase];
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function guestCount(data: FirestoreBooking): number {
  const storedTotal = numberValue(field(data, 'numberOfGuests', 'number_of_guests'));
  if (storedTotal !== null) return Math.max(0, storedTotal);

  return Math.max(
    0,
    (numberValue(data.adults) ?? 0) + (numberValue(data.children) ?? 0)
  );
}

function serializeValue(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, serializeValue(nestedValue)])
    );
  }
  return value;
}

function normalizeBooking(id: string, data: FirestoreBooking) {
  const visitorName = field(data, 'visitorName', 'visitor_name') ?? '';
  const numberOfGuests = guestCount(data);
  const bookingDate = field(data, 'bookingDate', 'booking_date') ?? '';
  const bookingTime = field(data, 'bookingTime', 'booking_time') ?? '';
  const createdAt = field(data, 'createdAt', 'created_at') ?? null;
  const updatedAt = field(data, 'updatedAt', 'updated_at') ?? null;

  return serializeValue({
    ...data,
    id,
    visitorName,
    numberOfGuests,
    bookingDate,
    bookingTime,
    createdAt,
    updatedAt,
    adults: numberValue(data.adults) ?? 0,
    children: numberValue(data.children) ?? 0,
    status: String(data.status ?? 'confirmed'),
    visited: data.visited === true,
  }) as Record<string, unknown>;
}

async function getFirestoreBookings() {
  const snapshot = await getAdminDb().collection('bookings').get();
  return snapshot.docs.map((document) => ({
    id: document.id,
    data: document.data() as FirestoreBooking,
  }));
}

export async function getFirestoreMonthlyBookingStats(year: number, month: number) {
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDate = new Date(year, month, 0).getDate();
  const lastDay = `${year}-${String(month).padStart(2, '0')}-${String(lastDate).padStart(2, '0')}`;

  const [bookings, settings] = await Promise.all([
    getFirestoreBookings(),
    getFirestoreCalendarSettings(firstDay, lastDay),
  ]);

  const guestsByDate = new Map<string, number>();
  for (const booking of bookings) {
    const status = String(booking.data.status ?? 'confirmed').toLowerCase();
    const date = String(field(booking.data, 'bookingDate', 'booking_date') ?? '');

    if (status !== 'confirmed' || date < firstDay || date > lastDay) continue;
    guestsByDate.set(date, (guestsByDate.get(date) ?? 0) + guestCount(booking.data));
  }

  const settingsByDate = new Map(settings.map((setting) => [setting.date, setting]));

  return Array.from({ length: lastDate }, (_, index) => {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`;
    const daySettings = settingsByDate.get(date);
    const bookingCount = guestsByDate.get(date) ?? 0;
    const maxCapacity = daySettings?.maxCapacity ?? DEFAULT_CAPACITY;

    return {
      date,
      bookingCount,
      maxCapacity,
      isOpen: daySettings?.isOpen ?? true,
      startTime: daySettings?.startTime ?? DEFAULT_START_TIME,
      percentage: maxCapacity > 0
        ? Math.round((bookingCount / maxCapacity) * 100)
        : 0,
    };
  });
}

export async function getFirestoreDayDetails(date: string) {
  const [bookings, settings] = await Promise.all([
    getFirestoreBookings(),
    getFirestoreCalendarSetting(date),
  ]);

  const dayBookings = bookings
    .filter(({ data }) => {
      const status = String(data.status ?? 'confirmed').toLowerCase();
      return status === 'confirmed'
        && String(field(data, 'bookingDate', 'booking_date') ?? '') === date;
    })
    .map(({ id, data }) => normalizeBooking(id, data))
    .sort((left, right) =>
      String(right.bookingTime ?? '').localeCompare(String(left.bookingTime ?? ''))
    );

  const maxCapacity = settings.maxCapacity ?? DEFAULT_CAPACITY;
  const totalBooked = dayBookings.reduce(
    (total, booking) => total + (numberValue(booking.numberOfGuests) ?? 0),
    0
  );

  return {
    date,
    settings: serializeValue(settings),
    bookings: dayBookings,
    stats: {
      totalBooked,
      available: Math.max(0, maxCapacity - totalBooked),
      percentage: maxCapacity > 0
        ? Math.round((totalBooked / maxCapacity) * 100)
        : 0,
    },
  };
}
