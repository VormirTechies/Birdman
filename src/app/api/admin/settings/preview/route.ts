import { NextRequest, NextResponse } from 'next/server';
import { getConfirmedBookingCounts } from '@/lib/firebase/calendar-admin';
import { getFirestoreCalendarSettings } from '@/lib/firebase/calendar-settings';
import { requireAdmin } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';

type ApplyMode = 'all_days' | 'one_day' | 'date_range';

interface PreviewRequest {
  applyMode: ApplyMode;
  date?: string;
  startDate?: string;
  endDate?: string;
  settings: {
    maxCapacity?: number;
    startTime?: string;
    isOpen?: boolean;
  };
}

function dateRange(startDate: string, endDate: string) {
  const dates: string[] = [];
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  for (let date = start; date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.user) return authResult.response;

    const body: PreviewRequest = await request.json();
    const { applyMode, date, startDate, endDate, settings } = body;

    if (!applyMode || !settings) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    let affectedDates: string[];

    switch (applyMode) {
      case 'all_days': {
        const end = new Date(`${today}T00:00:00Z`);
        end.setUTCDate(end.getUTCDate() + 180);
        affectedDates = dateRange(today, end.toISOString().split('T')[0]);
        break;
      }
      case 'one_day':
        if (!date) {
          return NextResponse.json(
            { error: 'Date required for one_day mode' },
            { status: 400 }
          );
        }
        affectedDates = [date];
        break;
      case 'date_range':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'startDate and endDate required for date_range mode' },
            { status: 400 }
          );
        }
        affectedDates = dateRange(startDate, endDate);
        break;
      default:
        return NextResponse.json({ error: 'Invalid applyMode' }, { status: 400 });
    }

    const counts = await getConfirmedBookingCounts(new Set(affectedDates));
    const bookingsByDate = affectedDates
      .filter((affectedDate) => counts.has(affectedDate))
      .map((affectedDate) => ({
        date: affectedDate,
        count: counts.get(affectedDate) ?? 0,
      }));
    const totalBookings = bookingsByDate.reduce(
      (total, item) => total + item.count,
      0
    );
    const sampleDates = new Set(affectedDates.slice(0, 5));
    const currentSettings = await getFirestoreCalendarSettings(
      affectedDates[0],
      affectedDates.at(-1)
    );
    const sampleSettings = currentSettings
      .filter((setting) => sampleDates.has(setting.date))
      .map((setting) => ({
        date: setting.date,
        maxCapacity: setting.maxCapacity,
        startTime: setting.startTime,
        isOpen: setting.isOpen,
      }));

    return NextResponse.json({
      success: true,
      affectedDatesCount: affectedDates.length,
      affectedDates: affectedDates.slice(0, 10),
      totalAffectedDates: affectedDates.length,
      existingBookingsCount: totalBookings,
      bookingsByDate,
      sampleCurrentSettings: sampleSettings,
      willBlock: settings.isOpen === false,
    });
  } catch (error) {
    console.error('[Settings Preview] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
