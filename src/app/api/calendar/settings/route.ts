import { NextRequest, NextResponse } from 'next/server';
import {
  getFirestoreCalendarSetting,
  upsertFirestoreCalendarSetting,
} from '@/lib/firebase/calendar-settings';
import { requireAdmin } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Missing required parameter: date' },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    const settings = await getFirestoreCalendarSetting(date);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('[Calendar API] Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.user) return authResult.response;

    const body = await request.json();
    const { date, maxCapacity, startTime, isOpen } = body;

    if (!date || maxCapacity === undefined || !startTime || isOpen === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: date, maxCapacity, startTime, isOpen' },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    const capacity = Number.parseInt(maxCapacity, 10);
    if (!Number.isFinite(capacity) || capacity < 0 || capacity > 200) {
      return NextResponse.json(
        { error: 'Invalid maxCapacity. Must be between 0 and 200.' },
        { status: 400 }
      );
    }

    if (!/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(startTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Expected HH:MM or HH:MM:SS.' },
        { status: 400 }
      );
    }

    if (typeof isOpen !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid isOpen. Must be a boolean.' },
        { status: 400 }
      );
    }

    const settings = await upsertFirestoreCalendarSetting(
      date,
      {
        maxCapacity: capacity,
        startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
        isOpen,
      },
      authResult.user.uid
    );

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('[Calendar API] Error saving settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
