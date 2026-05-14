/**
 * Bulk Update API for Admin Settings
 * Apply calendar settings changes to multiple dates in single query
 * 
 * Modes:
 * - all_days: Update all 180 rows (date >= today)
 * - one_day: Update 1 row
 * - date_range: Update N rows in range
 * 
 * If blocking dates (isOpen = false), cancels existing bookings
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calendarSettings } from '@/lib/db/schema';
import { and, eq, gte, sql } from 'drizzle-orm';
import { cancelBookingsForDates } from '@/lib/db/queries';
import { sendCancellationEmails } from '@/lib/email';

export const dynamic = 'force-dynamic';

type ApplyMode = 'all_days' | 'one_day' | 'date_range';

interface BulkUpdateRequest {
  applyMode: ApplyMode;
  date?: string; // For 'one_day' mode
  startDate?: string; // For 'date_range' mode
  endDate?: string; // For 'date_range' mode
  settings: {
    maxCapacity?: number;
    startTime?: string;
    isOpen?: boolean;
  };
  adminId: string; // For updatedBy tracking
}

export async function POST(request: NextRequest) {
  try {
    const body: BulkUpdateRequest = await request.json();
    const { applyMode, date, startDate, endDate, settings, adminId } = body;

    // Validate input
    if (!applyMode || !settings || !adminId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    let affectedCount = 0;
    let cancelledBookingsCount = 0;
    let cancelledBookings: Array<{ id: string; email: string | null; visitorName: string; bookingDate: string; numberOfGuests: number }> = [];

    // Prepare update values
    // Note: updatedBy is null because admin uses Supabase auth, not admin_users table
    const updateValues: any = {
      updatedBy: null,
      updatedAt: new Date(),
    };

    if (settings.maxCapacity !== undefined) {
      updateValues.maxCapacity = settings.maxCapacity;
    }
    if (settings.startTime !== undefined) {
      updateValues.startTime = settings.startTime;
    }
    if (settings.isOpen !== undefined) {
      updateValues.isOpen = settings.isOpen;
    }

    // Execute update based on apply mode
    switch (applyMode) {
      case 'all_days': {
        // Update all dates from today onwards (all 180 rows)
        const result = await db
          .update(calendarSettings)
          .set(updateValues)
          .where(gte(calendarSettings.date, today))
          .returning();

        affectedCount = result.length;

        // If blocking dates, cancel all future bookings
        if (settings.isOpen === false) {
          // Get max date from calendar settings
          const maxDateResult = await db.execute(sql`
            SELECT MAX(date)::text as max_date FROM calendar_settings
          `);
          const maxDate = (maxDateResult[0] as { max_date: string }).max_date;

          cancelledBookings = await cancelBookingsForDates(today, maxDate);
          cancelledBookingsCount = cancelledBookings.length;
        }
        break;
      }

      case 'one_day': {
        if (!date) {
          return NextResponse.json({ error: 'Date required for one_day mode' }, { status: 400 });
        }

        // Use UPSERT to create row if it doesn't exist
        // Note: updated_by is null because admin uses Supabase auth, not admin_users table
        const result = await db.execute(sql`
          INSERT INTO calendar_settings (date, max_capacity, start_time, is_open, created_at, updated_at, updated_by)
          VALUES (
            ${date},
            ${settings.maxCapacity ?? 100},
            ${settings.startTime ?? '16:30:00'},
            ${settings.isOpen ?? true},
            NOW(),
            NOW(),
            NULL
          )
          ON CONFLICT (date) DO UPDATE SET
            max_capacity = COALESCE(${settings.maxCapacity}, calendar_settings.max_capacity),
            start_time = COALESCE(${settings.startTime}, calendar_settings.start_time),
            is_open = COALESCE(${settings.isOpen}, calendar_settings.is_open),
            updated_at = NOW(),
            updated_by = NULL
          RETURNING *
        `);

        affectedCount = result.length ?? 0;

        // If blocking this date, cancel its bookings
        if (settings.isOpen === false) {
          cancelledBookings = await cancelBookingsForDates(date, date);
          cancelledBookingsCount = cancelledBookings.length;
        }
        break;
      }

      case 'date_range': {
        if (!startDate || !endDate) {
          return NextResponse.json({ error: 'startDate and endDate required for date_range mode' }, { status: 400 });
        }

        // Generate all dates in range
        const dates: string[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(d.toISOString().split('T')[0]);
        }

        // Batch UPSERT all dates in range
        // Note: updated_by is null because admin uses Supabase auth, not admin_users table
        let upsertCount = 0;
        for (const dateStr of dates) {
          const result = await db.execute(sql`
            INSERT INTO calendar_settings (date, max_capacity, start_time, is_open, created_at, updated_at, updated_by)
            VALUES (
              ${dateStr},
              ${settings.maxCapacity ?? 100},
              ${settings.startTime ?? '16:30:00'},
              ${settings.isOpen ?? true},
              NOW(),
              NOW(),
              NULL
            )
            ON CONFLICT (date) DO UPDATE SET
              max_capacity = COALESCE(${settings.maxCapacity}, calendar_settings.max_capacity),
              start_time = COALESCE(${settings.startTime}, calendar_settings.start_time),
              is_open = COALESCE(${settings.isOpen}, calendar_settings.is_open),
              updated_at = NOW(),
              updated_by = NULL
          `);
          upsertCount += result.length ?? 0;
        }

        affectedCount = upsertCount;

        // If blocking these dates, cancel bookings in range
        if (settings.isOpen === false) {
          cancelledBookings = await cancelBookingsForDates(startDate, endDate);
          cancelledBookingsCount = cancelledBookings.length;
        }
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid applyMode' }, { status: 400 });
    }

    // Send cancellation emails if bookings were cancelled
    let emailStats = { sent: 0, failed: 0, errors: [] as string[] };
    if (cancelledBookingsCount > 0) {
      const bookingsWithEmail = cancelledBookings.filter(b => b.email !== null);
      if (bookingsWithEmail.length > 0) {
        emailStats = await sendCancellationEmails(bookingsWithEmail);
      }
    }

    // Return response with cancellation and email stats
    return NextResponse.json({
      success: true,
      affectedCount,
      cancelledBookingsCount,
      emailsSent: emailStats.sent,
      emailsFailed: emailStats.failed,
      emailErrors: emailStats.errors.length > 0 ? emailStats.errors : undefined,
      message: `Updated ${affectedCount} date(s)${cancelledBookingsCount > 0 ? `, cancelled ${cancelledBookingsCount} booking(s)` : ''}${emailStats.sent > 0 ? `, sent ${emailStats.sent} cancellation email(s)` : ''}`,
    });
  } catch (error) {
    console.error('❌ Bulk update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
