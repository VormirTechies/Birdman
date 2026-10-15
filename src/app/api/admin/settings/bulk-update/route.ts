import { NextRequest, NextResponse } from 'next/server';
import { sendCancellationEmails } from '@/lib/email';
import { cancelFirestoreBookingsForDates } from '@/lib/firebase/calendar-admin';
import { indiaCalendarDate } from '@/lib/firebase/booking-capacity';
import { upsertFirestoreCalendarSettings } from '@/lib/firebase/calendar-settings';
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
    try { scope = resolveCalendarScope(parsed.data, indiaCalendarDate(new Date()), true); }
    catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
    const updatedBy = authResult.user.uid;
    const affectedCount = await upsertFirestoreCalendarSettings(calendarScopeDates(scope), settings, updatedBy);
    const cancelledBookings = settings.isOpen === false
      ? await cancelFirestoreBookingsForDates(
          scope.startDate,
          scope.endDate,
          updatedBy
        )
      : [];
    const bookingsWithEmail = cancelledBookings.filter(
      (booking) => booking.email !== null
    );
    const emailStats = bookingsWithEmail.length > 0
      ? await sendCancellationEmails(bookingsWithEmail)
      : { sent: 0, failed: 0, errors: [] as string[] };

    return NextResponse.json({
      success: true,
      scope,
      affectedCount,
      cancelledBookingsCount: cancelledBookings.length,
      emailsSent: emailStats.sent,
      emailsFailed: emailStats.failed,
      emailErrors: emailStats.errors.length > 0 ? emailStats.errors : undefined,
      message: `Updated ${affectedCount} date(s)${
        cancelledBookings.length > 0
          ? `, cancelled ${cancelledBookings.length} booking(s)`
          : ''
      }${
        emailStats.sent > 0
          ? `, sent ${emailStats.sent} cancellation email(s)`
          : ''
      }`,
    });
  } catch (error) {
    console.error('[Settings Bulk Update] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
