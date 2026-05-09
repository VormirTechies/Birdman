import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyBookingStats } from '@/lib/db/queries';

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic';

/**
 * GET /api/calendar/month?year=2026&month=5
 * 
 * Returns booking statistics for all days in the specified month
 * Used by the calendar grid to show capacity and booking counts
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    // Validate required parameters
    if (!yearParam || !monthParam) {
      return NextResponse.json(
        { error: 'Missing required parameters: year and month' },
        { status: 400 }
      );
    }

    const year = parseInt(yearParam, 10);
    const month = parseInt(monthParam, 10);

    // Validate year and month ranges
    if (isNaN(year) || year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: 'Invalid year. Must be between 2000 and 2100.' },
        { status: 400 }
      );
    }

    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Invalid month. Must be between 1 and 12.' },
        { status: 400 }
      );
    }

    // Fetch monthly statistics
    const stats = await getMonthlyBookingStats(year, month);

    return NextResponse.json({
      success: true,
      year,
      month,
      days: stats,
    });
  } catch (error) {
    console.error('[Calendar API] Error fetching monthly stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
