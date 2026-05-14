/**
 * Daily Calendar Maintenance Cron Job
 * Maintains rolling 180-day window for calendar settings
 * 
 * Triggered daily at midnight UTC via Vercel Cron Jobs
 * 
 * Tasks:
 * 1. Delete past date rows (date < today)
 * 2. Add new future date row (today + 180 days)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calendarSettings } from '@/lib/db/schema';
import { sql, lt } from 'drizzle-orm';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET) {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Calculate future date (today + 180 days)
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 180);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    console.log('🧹 Calendar Maintenance - Starting...');
    console.log(`📅 Today: ${todayStr}`);
    console.log(`📅 Adding date: ${futureDateStr}`);

    // Step 1: Delete past dates
    const deleteResult = await db
      .delete(calendarSettings)
      .where(lt(calendarSettings.date, todayStr))
      .returning();

    console.log(`🗑️  Deleted ${deleteResult.length} past date(s)`);

    // Step 2: Add new future date (180 days from today)
    // Use ON CONFLICT DO NOTHING to avoid duplicate key errors
    const insertResult = await db.execute(sql`
      INSERT INTO calendar_settings (date, max_capacity, start_time, is_open, created_at, updated_at)
      VALUES (${futureDateStr}, 100, '16:30:00', true, NOW(), NOW())
      ON CONFLICT (date) DO NOTHING
    `);

    console.log(`➕ Added future date: ${futureDateStr}`);

    // Count total rows to verify 180-day window
    const countResult = await db.execute(sql`
      SELECT 
        MIN(date) as min_date, 
        MAX(date) as max_date, 
        COUNT(*) as total_rows
      FROM calendar_settings
    `);

    const stats = countResult[0] as { min_date: string; max_date: string; total_rows: number };

    console.log('✅ Maintenance complete');
    console.log(`📊 Window: ${stats.min_date} to ${stats.max_date} (${stats.total_rows} rows)`);

    return NextResponse.json({
      success: true,
      deleted: deleteResult.length,
      added: futureDateStr,
      window: {
        minDate: stats.min_date,
        maxDate: stats.max_date,
        totalRows: Number(stats.total_rows),
      },
    });
  } catch (error) {
    console.error('❌ Calendar maintenance error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
