export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { AggregateField, type Query, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/require-admin';

// GET /api/bookings/stats - Get aggregated booking statistics.
// Returns only count numbers, not full booking data, for dashboard stat cards.

async function sumVisitors(query: Query, label: string) {
  const snapshot = await query
    .aggregate({
      totalGuests: AggregateField.sum('numberOfGuests'),
      count: AggregateField.count(),
    })
    .get();
  const data = snapshot.data();
  console.log('[FIRESTORE READ] /api/bookings/stats', label, 'docs:', data.count);
  return Number(data.totalGuests ?? 0);
}

function isCountedStatus(status: unknown) {
  return status === 'confirmed' || status === 'completed';
}

function numberValue(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function guestCount(data: Record<string, unknown>) {
  const storedTotal = data.numberOfGuests ?? data.number_of_guests;
  if (storedTotal !== undefined && storedTotal !== null) {
    return numberValue(storedTotal);
  }

  return numberValue(data.adults) + numberValue(data.children);
}

function sumBookingDocuments(documents: QueryDocumentSnapshot[]) {
  return documents.reduce((total, document) => {
    const data = document.data() as Record<string, unknown>;
    if (!isCountedStatus(data.status)) return total;
    return total + guestCount(data);
  }, 0);
}

async function sumTotalVisitors(bookings: Query) {
  try {
    const [confirmedVisitors, completedVisitors] = await Promise.all([
      sumVisitors(bookings.where('status', '==', 'confirmed'), 'totalVisitors:confirmed'),
      sumVisitors(bookings.where('status', '==', 'completed'), 'totalVisitors:completed'),
    ]);

    return confirmedVisitors + completedVisitors;
  } catch (aggregateError) {
    console.warn(
      '[API] Booking stats aggregate total failed; falling back to filtered reads',
      aggregateError
    );

    const [confirmedSnapshot, completedSnapshot] = await Promise.all([
      bookings.where('status', '==', 'confirmed').get(),
      bookings.where('status', '==', 'completed').get(),
    ]);

    console.log(
      '[FIRESTORE READ] /api/bookings/stats totalVisitors:fallback docs:',
      confirmedSnapshot.size + completedSnapshot.size
    );

    return sumBookingDocuments([
      ...confirmedSnapshot.docs,
      ...completedSnapshot.docs,
    ]);
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.user) return authResult.response;

    const today = new Date().toISOString().split('T')[0];
    const next30 = new Date();
    next30.setDate(next30.getDate() + 30);
    const next30Str = next30.toISOString().split('T')[0];
    const last30 = new Date();
    last30.setDate(last30.getDate() - 30);
    const last30Str = last30.toISOString().split('T')[0];

    const bookings = getAdminDb().collection('bookings');

    const [windowSnapshot, totalVisitors] = await Promise.all([
      bookings
        .where('bookingDate', '>=', last30Str)
        .where('bookingDate', '<=', next30Str)
        .get(),
      sumTotalVisitors(bookings),
    ]);
    console.log('[FIRESTORE READ] /api/bookings/stats dateWindow docs:', windowSnapshot.size);

    const stats = windowSnapshot.docs.reduce(
      (totals, document) => {
        const data = document.data() as Record<string, unknown>;
        if (!isCountedStatus(data.status)) return totals;

        const bookingDate = String(data.bookingDate ?? data.booking_date ?? '');
        const guests = guestCount(data);

        if (bookingDate === today) totals.todayVisitors += guests;
        if (bookingDate >= today && bookingDate <= next30Str) totals.next30Days += guests;
        if (bookingDate >= last30Str && bookingDate < today) totals.last30Days += guests;

        return totals;
      },
      {
        todayVisitors: 0,
        next30Days: 0,
        last30Days: 0,
        totalVisitors,
      }
    );

    return NextResponse.json(
      {
        success: true,
        stats,
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('[API] Failed to fetch booking stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch booking stats',
        code: 'STATS_FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}
