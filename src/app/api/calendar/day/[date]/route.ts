import { NextRequest, NextResponse } from 'next/server';
import { getDayDetails } from '@/lib/db/queries';

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic';

/**
 * GET /api/calendar/day/2026-05-15
 * 
 * Returns detailed information for a specific date including:
 * - Calendar settings (capacity, hours, open status)
 * - All bookings for that day
 * - Statistics (total booked, available, percentage)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const date = params.date;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    // Validate date is valid
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date value.' },
        { status: 400 }
      );
    }

    // Fetch day details
    const details = await getDayDetails(date);

    return NextResponse.json({
      success: true,
      ...details,
    });
  } catch (error) {
    console.error('[Calendar API] Error fetching day details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
