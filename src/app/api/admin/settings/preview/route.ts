import { NextRequest, NextResponse } from 'next/server';
import { getConfirmedBookingCounts } from '@/lib/firebase/calendar-admin';
import { indiaCalendarDate } from '@/lib/firebase/booking-capacity';
import { getFirestoreCalendarSettings } from '@/lib/firebase/calendar-settings';
import { requireAdmin } from '@/lib/require-admin';
import { calendarSettingsRequestSchema, resolveCalendarScope, calendarScopeDates } from '@/lib/calendar-settings-request';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.user) return authResult.response;

    const parsed = calendarSettingsRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    const { settings } = parsed.data;
    let scope;
    try { scope = resolveCalendarScope(parsed.data, indiaCalendarDate(new Date())); }
    catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
    const affectedDates = calendarScopeDates(scope);

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
      scope,
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
