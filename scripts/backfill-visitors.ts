/**
 * Backfill visitor records from existing bookings.
 * Run AFTER create-visitors-table.ts has been run.
 *
 * npx tsx scripts/backfill-visitors.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function run() {
  console.log('🔄 Backfilling visitor records from existing bookings...\n');

  const raw = await db.execute(sql`
    SELECT id, visitor_name, phone, email, booking_date, created_at
    FROM   bookings
    ORDER  BY created_at ASC;
  `);

  // Drizzle neon-serverless returns an iterable with IterableIterator semantics;
  // normalise to a plain array regardless of adapter shape.
  const rows: any[] = Array.isArray((raw as any).rows)
    ? (raw as any).rows
    : Array.from(raw as any);

  console.log(`  Found ${rows.length} existing booking(s)`);

  // Group by phone (primary), then email, then fallback to individual booking
  const visitorMap = new Map<string, {
    name: string;
    phone: string | null;
    email: string | null;
    firstDate: string;
    lastDate: string;
    visits: number;
    bookingIds: string[];
  }>();

  for (const row of rows) {
    const key = row.phone || row.email || row.id;
    if (visitorMap.has(key)) {
      const entry = visitorMap.get(key)!;
      entry.visits++;
      if (row.booking_date > entry.lastDate) entry.lastDate = row.booking_date;
      entry.bookingIds.push(row.id);
    } else {
      visitorMap.set(key, {
        name: row.visitor_name,
        phone: row.phone || null,
        email: row.email || null,
        firstDate: row.booking_date,
        lastDate: row.booking_date,
        visits: 1,
        bookingIds: [row.id],
      });
    }
  }

  console.log(`  Grouped into ${visitorMap.size} unique visitor(s)\n`);

  let createdCount = 0;
  let linkedCount = 0;

  for (const [, v] of visitorMap) {
    let visitorId: string | null = null;

    try {
      // Try inserting; skip on any unique-constraint conflict
      const inserted = await db.execute(sql`
        INSERT INTO "visitors" (name, phone, email, total_visits, first_visit_date, last_visit_date)
        VALUES (
          ${v.name},
          ${v.phone},
          ${v.email},
          ${v.visits},
          ${v.firstDate},
          ${v.lastDate}
        )
        ON CONFLICT DO NOTHING
        RETURNING id;
      `);

      const insertedRows: any[] = Array.isArray((inserted as any).rows)
        ? (inserted as any).rows
        : Array.from(inserted as any);

      visitorId = insertedRows[0]?.id ?? null;
    } catch {
      // ignore
    }

    // If insert was skipped (conflict), look up the existing record
    if (!visitorId) {
      if (v.phone) {
        const r = await db.execute(sql`SELECT id FROM "visitors" WHERE phone = ${v.phone} LIMIT 1;`);
        const rows: any[] = Array.isArray((r as any).rows) ? (r as any).rows : Array.from(r as any);
        visitorId = rows[0]?.id ?? null;
      }
      if (!visitorId && v.email) {
        const r = await db.execute(sql`SELECT id FROM "visitors" WHERE email = ${v.email} LIMIT 1;`);
        const rows: any[] = Array.isArray((r as any).rows) ? (r as any).rows : Array.from(r as any);
        visitorId = rows[0]?.id ?? null;
      }
    }

    if (!visitorId) {
      console.warn(`  ⚠️  Could not resolve visitor id for ${v.name}, skipping`);
      continue;
    }
    createdCount++;

    for (const bookingId of v.bookingIds) {
      await db.execute(sql`
        UPDATE bookings SET visitor_id = ${visitorId} WHERE id = ${bookingId};
      `);
      linkedCount++;
    }
  }

  console.log(`✅ Created / updated ${createdCount} visitor record(s)`);
  console.log(`✅ Linked ${linkedCount} booking(s) to visitor profiles`);
  console.log('\n🎉 Backfill complete!');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Backfill failed:', err.message);
  process.exit(1);
});
