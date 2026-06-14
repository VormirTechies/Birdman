import { NextRequest, NextResponse } from 'next/server';
import { sendCancellationEmails } from '@/lib/email';
import { cancelFirestoreBookingsForDates } from '@/lib/firebase/calendar-admin';
import {
  getFirestoreCalendarSettings,
  getFutureCalendarSettingReferences,
  updateFirestoreCalendarSettings,
  upsertFirestoreCalendarSetting,
  upsertFirestoreCalendarSettings,
} from '@/lib/firebase/calendar-settings';
import { requireAdmin } from '@/lib/require-admin';

export const dynamic = 'force-dynamic';

type ApplyMode = 'all_days' | 'one_day' | 'date_range';

interface BulkUpdateRequest {
  applyMode: ApplyMode;
  date?: string;
  startDate?: string;
  endDate?: string;
  settings: {
    maxCapacity?: number;
    startTime?: string;
    isOpen?: boolean;
  };
  adminId: string;
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

    const body: BulkUpdateRequest = await request.json();
    const { applyMode, date, startDate, endDate, settings, adminId } = body;

    if (!applyMode || !settings || !adminId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const updatedBy = authResult.user.uid;
    let affectedCount = 0;
    let cancellationStart: string | null = null;
    let cancellationEnd: string | null = null;

    switch (applyMode) {
      case 'all_days': {
        const references = await getFutureCalendarSettingReferences(today);
        affectedCount = await updateFirestoreCalendarSettings(
          references,
          settings,
          updatedBy
        );

        if (settings.isOpen === false) {
          const futureSettings = await getFirestoreCalendarSettings(today);
          cancellationStart = today;
          cancellationEnd = futureSettings.at(-1)?.date ?? today;
        }
        break;
      }
      case 'one_day':
        if (!date) {
          return NextResponse.json(
            { error: 'Date required for one_day mode' },
            { status: 400 }
          );
        }
        await upsertFirestoreCalendarSetting(date, settings, updatedBy);
        affectedCount = 1;
        if (settings.isOpen === false) {
          cancellationStart = date;
          cancellationEnd = date;
        }
        break;
      case 'date_range':
        if (!startDate || !endDate) {
          return NextResponse.json(
            { error: 'startDate and endDate required for date_range mode' },
            { status: 400 }
          );
        }
        affectedCount = await upsertFirestoreCalendarSettings(
          dateRange(startDate, endDate),
          settings,
          updatedBy
        );
        if (settings.isOpen === false) {
          cancellationStart = startDate;
          cancellationEnd = endDate;
        }
        break;
      default:
        return NextResponse.json({ error: 'Invalid applyMode' }, { status: 400 });
    }

    const cancelledBookings = cancellationStart && cancellationEnd
      ? await cancelFirestoreBookingsForDates(cancellationStart, cancellationEnd)
      : [];
    const bookingsWithEmail = cancelledBookings.filter(
      (booking) => booking.email !== null
    );
    const emailStats = bookingsWithEmail.length > 0
      ? await sendCancellationEmails(bookingsWithEmail)
      : { sent: 0, failed: 0, errors: [] as string[] };

    return NextResponse.json({
      success: true,
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
