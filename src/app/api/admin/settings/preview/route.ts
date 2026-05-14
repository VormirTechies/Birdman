/**
 * Preview API for Admin Settings
 * Shows impact of bulk calendar changes before applying them
 * 
 * Returns:
 * - Affected dates array
 * - Existing bookings count per date
 * - Total bookings that will be affected
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, calendarSettings } from '@/lib/db/schema';
import { and, eq, gte, sql, between, inArray } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type ApplyMode = 'all_days' | 'one_day' | 'date_range';

interface PreviewRequest {
  applyMode: ApplyMode;
  date?: string; // For 'one_day' mode
  startDate?: string; // For 'date_range' mode
  endDate?: string; // For 'date_range' mode
  settings: {
    maxCapacity?: number;
    startTime?: string;
    isOpen?: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PreviewRequest = await request.json();
    const { applyMode, date, startDate, endDate, settings } = body;

    // Validate input
    if (!applyMode || !settings) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let affectedDates: string[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Determine affected dates based on apply mode
    switch (applyMode) {
      case 'all_days': {
        // Generate all dates from today to today+180 days
        const dates: string[] = [];
        const start = new Date(today);
        const end = new Date(today);
        end.setDate(end.getDate() + 180);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(d.toISOString().split('T')[0]);
        }
        
        affectedDates = dates;
        break;
      }

      case 'one_day': {
        if (!date) {
          return NextResponse.json({ error: 'Date required for one_day mode' }, { status: 400 });
        }
        affectedDates = [date];
        break;
      }

      case 'date_range': {
        if (!startDate || !endDate) {
          return NextResponse.json({ error: 'startDate and endDate required for date_range mode' }, { status: 400 });
        }

        // Generate all dates in range (don't rely on calendar_settings having them)
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dates: string[] = [];
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          dates.push(d.toISOString().split('T')[0]);
        }
        
        affectedDates = dates;
        break;
      }

      default:
        return NextResponse.json({ error: 'Invalid applyMode' }, { status: 400 });
    }

    // Count existing bookings for each affected date
    const bookingsByDate: { date: string; count: number }[] = [];
    let totalBookings = 0;

    if (affectedDates.length > 0) {
      // Query bookings for all affected dates
      const bookingsResult = await db
        .select({
          bookingDate: bookings.bookingDate,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(bookings)
        .where(
          and(
            inArray(bookings.bookingDate, affectedDates),
            eq(bookings.status, 'confirmed')
          )
        )
        .groupBy(bookings.bookingDate);

      bookingsByDate.push(...bookingsResult.map(r => ({
        date: r.bookingDate,
        count: r.count,
      })));

      totalBookings = bookingsByDate.reduce((sum, item) => sum + item.count, 0);
    }

    // Get sample of current settings for first 5 dates
    let sampleSettings: any[] = [];
    const sampleDates = affectedDates.slice(0, 5);
    
    if (sampleDates.length > 0) {
      sampleSettings = await db
        .select({
          date: calendarSettings.date,
          maxCapacity: calendarSettings.maxCapacity,
          startTime: calendarSettings.startTime,
          isOpen: calendarSettings.isOpen,
        })
        .from(calendarSettings)
        .where(inArray(calendarSettings.date, sampleDates))
        .orderBy(calendarSettings.date);
    }

    return NextResponse.json({
      success: true,
      affectedDatesCount: affectedDates.length,
      affectedDates: affectedDates.slice(0, 10), // Return first 10 for display
      totalAffectedDates: affectedDates.length,
      existingBookingsCount: totalBookings,
      bookingsByDate,
      sampleCurrentSettings: sampleSettings,
      willBlock: settings.isOpen === false,
    });
  } catch (error) {
    console.error('❌ Preview error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
