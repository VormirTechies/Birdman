export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getAvailabilityRange, getDateAvailability } from '@/lib/db/queries';

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/availability — Public endpoint for booking page
// Query: ?date=2026-04-19 (single date) OR ?startDate=...&endDate=... (range)
// Returns slot time, capacity, booked count, remaining, blocked status
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Single date
    if (date) {
      const availability = await getDateAvailability(date);
      return NextResponse.json({ success: true, availability });
    }

    // Range (for 30-day calendar view on booking page)
    if (startDate && endDate) {
      const range = await getAvailabilityRange(startDate, endDate);
      return NextResponse.json({ success: true, availability: range });
    }

    return NextResponse.json(
      { success: false, error: 'Provide ?date= or ?startDate=&endDate=' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API] Availability GET failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch availability' }, { status: 500 });
  }
}
