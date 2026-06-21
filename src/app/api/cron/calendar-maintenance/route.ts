import { NextRequest, NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { calendarSettings } from '@/lib/db/schema';

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

    const deletedRows = await db
      .delete(calendarSettings)
      .where(sql`${calendarSettings.date} < ${todayString}`)
      .returning();

    await db.execute(sql`
      INSERT INTO calendar_settings (date, max_capacity, start_time, is_open)
      VALUES (${futureDateString}, 100, '16:30:00', true)
      ON CONFLICT (date) DO NOTHING
    `);

    const stats = await db.execute(sql`
      SELECT
        MIN(date)::text AS min_date,
        MAX(date)::text AS max_date,
        COUNT(*)::int AS total_rows
      FROM calendar_settings
    `);
    const firstStatsRow = Array.isArray(stats)
      ? stats[0]
      : (stats as { rows?: unknown[] }).rows?.[0];
    const window = firstStatsRow as
      | { min_date: string | null; max_date: string | null; total_rows: number }
      | undefined;

    return NextResponse.json({
      success: true,
      deleted: deletedRows.length,
      added: futureDateString,
      window: {
        minDate: window?.min_date ?? null,
        maxDate: window?.max_date ?? null,
        totalRows: window?.total_rows ?? 0,
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
