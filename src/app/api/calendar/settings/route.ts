import { NextRequest, NextResponse } from 'next/server';
import { getCalendarSettings, upsertCalendarSettings } from '@/lib/db/queries';

// Force dynamic rendering (no caching)
export const dynamic = 'force-dynamic';

/**
 * GET /api/calendar/settings?date=2026-05-15
 * 
 * Returns calendar settings for a specific date (with defaults if not set)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Missing required parameter: date' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    // Fetch settings
    const settings = await getCalendarSettings(date);

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('[Calendar API] Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar/settings
 * 
 * Creates or updates calendar settings for a specific date
 * Request body: { date, maxCapacity, startTime, isOpen }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, maxCapacity, startTime, isOpen } = body;

    // Validate required fields
    if (!date || maxCapacity === undefined || !startTime || isOpen === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: date, maxCapacity, startTime, isOpen' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    // Validate maxCapacity (0-200)
    const capacity = parseInt(maxCapacity, 10);
    if (isNaN(capacity) || capacity < 0 || capacity > 200) {
      return NextResponse.json(
        { error: 'Invalid maxCapacity. Must be between 0 and 200.' },
        { status: 400 }
      );
    }

    // Validate startTime format (HH:MM:SS or HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
    if (!timeRegex.test(startTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Expected HH:MM or HH:MM:SS.' },
        { status: 400 }
      );
    }

    // Normalize time to HH:MM:SS format
    const normalizedTime = startTime.length === 5 ? `${startTime}:00` : startTime;

    // Validate isOpen is boolean
    if (typeof isOpen !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid isOpen. Must be a boolean.' },
        { status: 400 }
      );
    }

    // Upsert settings
    const settings = await upsertCalendarSettings({
      date,
      maxCapacity: capacity,
      startTime: normalizedTime,
      isOpen,
    });

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('[Calendar API] Error saving settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
