export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyBookingStats } from '@/lib/db/queries';

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/calendar?month=YYYY-MM
// Returns per-day availability for the booking calendar
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');

    // Validate month param (YYYY-MM format)
    if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
      return NextResponse.json(
        { error: 'Invalid month parameter. Use YYYY-MM format.' },
        { status: 400 }
      );
    }

    const [yearStr, monthStr] = monthParam.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Month must be between 1 and 12.' },
        { status: 400 }
      );
    }

    const stats = await getMonthlyBookingStats(year, month);

    // Enrich each day with remaining capacity
    const enriched = stats.map((day) => ({
      ...day,
      remaining: Math.max(0, day.maxCapacity - day.bookingCount),
    }));

    return NextResponse.json(enriched, { status: 200 });
  } catch (error) {
    console.error('[API /calendar] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar data.' },
      { status: 500 }
    );
  }
}
