import { NextRequest, NextResponse } from 'next/server';
import {
  deletePastCalendarSettings,
  getFirestoreCalendarSettings,
  upsertFirestoreCalendarSetting,
} from '@/lib/firebase/calendar-settings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (
      process.env.CRON_SECRET
      && authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayString = today.toISOString().split('T')[0];
    const futureDate = new Date(today);
    futureDate.setUTCDate(futureDate.getUTCDate() + 180);
    const futureDateString = futureDate.toISOString().split('T')[0];

    const deleted = await deletePastCalendarSettings(todayString);
    const existingFutureSetting = (
      await getFirestoreCalendarSettings(futureDateString, futureDateString)
    )[0];

    if (!existingFutureSetting) {
      await upsertFirestoreCalendarSetting(
        futureDateString,
        {
          maxCapacity: 100,
          startTime: '16:30:00',
          isOpen: true,
        },
        null
      );
    }

    const settings = await getFirestoreCalendarSettings();
    const dates = settings.map((setting) => setting.date).filter(Boolean);

    return NextResponse.json({
      success: true,
      deleted,
      added: futureDateString,
      window: {
        minDate: dates[0] ?? null,
        maxDate: dates.at(-1) ?? null,
        totalRows: settings.length,
      },
    });
  } catch (error) {
    console.error('[Calendar Maintenance] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
