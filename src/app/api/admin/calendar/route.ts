export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getCalendarMonth } from '@/lib/db/queries';

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/admin/calendar — Monthly calendar data with booking counts
// Query: ?year=2026&month=4
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    if (month < 1 || month > 12) {
      return NextResponse.json({ success: false, error: 'Month must be 1-12' }, { status: 400 });
    }

    const calendarData = await getCalendarMonth(year, month);

    return NextResponse.json({
      success: true,
      year,
      month,
      days: calendarData,
    });
  } catch (error) {
    console.error('[API] Calendar GET failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch calendar data' }, { status: 500 });
  }
}
