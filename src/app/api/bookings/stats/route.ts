export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/require-admin';

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/bookings/stats — Get Aggregated Booking Statistics
// Returns only count numbers (not full booking data) for dashboard stat cards
// ═══════════════════════════════════════════════════════════════════════════

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

    const snapshot = await getAdminDb().collection('bookings').get();
    const bookings = snapshot.docs.map((document) => document.data());

    const bookingDate = (booking: Record<string, unknown>) =>
      String(booking.bookingDate ?? booking.booking_date ?? '');
    const guestCount = (booking: Record<string, unknown>) => {
      const storedTotal = booking.numberOfGuests ?? booking.number_of_guests;
      if (storedTotal !== undefined && storedTotal !== null) {
        const total = Number(storedTotal);
        return Number.isFinite(total) ? total : 0;
      }

      const adults = Number(booking.adults ?? 0);
      const children = Number(booking.children ?? 0);
      return (Number.isFinite(adults) ? adults : 0) +
        (Number.isFinite(children) ? children : 0);
    };

    const stats = bookings.reduce(
      (totals, booking) => {
        const date = bookingDate(booking);
        const guests = guestCount(booking);
        const status = String(booking.status ?? 'confirmed');

        if (status === 'cancelled') {
          return totals;
        }

        if (date === today) {
          totals.todayVisitors += guests;
        }
        if (date >= today && date <= next30Str) {
          totals.next30Days += guests;
        }
        if (date >= last30Str && date < today) {
          totals.last30Days += guests;
        }
        totals.totalVisitors += guests;

        return totals;
      },
      {
        todayVisitors: 0,
        next30Days: 0,
        last30Days: 0,
        totalVisitors: 0,
      }
    );

    // Return stats with cache control headers to prevent stale data
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
