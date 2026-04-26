export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getBookingStats } from '@/lib/db/queries';

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/bookings/stats — Get Aggregated Booking Statistics
// Returns only count numbers (not full booking data) for dashboard stat cards
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // For now, this endpoint is unprotected (Sprint 1)
    // const session = await getServerSession();
    // if (!session || !session.user.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Fetch aggregated stats using efficient SQL queries
    const stats = await getBookingStats();

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
