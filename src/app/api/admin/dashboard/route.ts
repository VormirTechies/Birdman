export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import {
  AggregateField,
  Timestamp,
  type Query,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/require-admin';

const RECENT_BOOKING_LIMIT = 5;
const COUNTED_STATUSES = ['confirmed', 'completed'];

function dateString(date: Date) {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

async function sumGuests(query: Query) {
  const snapshot = await query
    .aggregate({ total: AggregateField.sum('numberOfGuests') })
    .get();
  return Number(snapshot.data().total ?? 0);
}

function serializeTimestamp(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value ?? null;
}

function bookingSummary(document: QueryDocumentSnapshot) {
  const data = document.data();
  const visitorName = String(data.visitorName ?? data.visitor_name ?? '');
  const bookingDate = String(data.bookingDate ?? data.booking_date ?? '');
  const bookingTime = String(data.bookingTime ?? data.booking_time ?? '');
  const numberOfGuests = Number(
    data.numberOfGuests ?? data.number_of_guests ?? Number(data.adults ?? 1) + Number(data.children ?? 0)
  );

  return {
    id: document.id,
    bookingNumber: data.bookingNumber ?? data.booking_number ?? null,
    visitorId: data.visitorId ?? data.visitor_id ?? null,
    visitorName,
    visitor_name: visitorName,
    phone: String(data.phone ?? ''),
    email: data.email ?? null,
    adults: Number(data.adults ?? numberOfGuests),
    children: Number(data.children ?? 0),
    numberOfGuests,
    number_of_guests: numberOfGuests,
    bookingDate,
    booking_date: bookingDate,
    bookingTime,
    booking_time: bookingTime,
    status: String(data.status ?? 'confirmed'),
    visited: data.visited === true,
    isVip: data.isVip === true,
    createdAt: serializeTimestamp(data.createdAt ?? data.created_at),
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const today = dateString(new Date());
    const next30 = dateString(addDays(new Date(), 30));
    const last30 = dateString(addDays(new Date(), -30));
    const bookings = getAdminDb().collection('bookings');
    const countedBookings = bookings.where('status', 'in', COUNTED_STATUSES);

    const [
      todayVisitors,
      next30Days,
      last30Days,
      totalVisitors,
      recentSnapshot,
    ] = await Promise.all([
      sumGuests(countedBookings.where('bookingDate', '==', today)),
      sumGuests(
        countedBookings
          .where('bookingDate', '>=', today)
          .where('bookingDate', '<=', next30)
      ),
      sumGuests(
        countedBookings
          .where('bookingDate', '>=', last30)
          .where('bookingDate', '<', today)
      ),
      sumGuests(countedBookings),
      bookings.orderBy('createdAt', 'desc').limit(RECENT_BOOKING_LIMIT).get(),
    ]);

    return NextResponse.json(
      {
        success: true,
        stats: { todayVisitors, next30Days, last30Days, totalVisitors },
        recentBookings: recentSnapshot.docs.map(bookingSummary),
      },
      {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('[API] GET /api/admin/dashboard failed:', error);
    const errorMessage = error instanceof Error ? error.message : '';
    const missingIndex =
      errorMessage.includes('requires an index') ||
      errorMessage.includes('FAILED_PRECONDITION');

    return NextResponse.json(
      {
        success: false,
        error: missingIndex
          ? 'Dashboard Firestore indexes are not deployed'
          : 'Failed to load dashboard',
        code: missingIndex ? 'FIRESTORE_INDEX_REQUIRED' : 'DASHBOARD_FETCH_ERROR',
        ...(process.env.NODE_ENV === 'development' && errorMessage
          ? { details: errorMessage }
          : {}),
      },
      { status: 500 }
    );
  }
}
