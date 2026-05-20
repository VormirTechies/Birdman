/**
 * Migration: Create visitors table and add visitorId FK to bookings
 *
 * Run: npx tsx scripts/create-visitors-table.ts
 *
 * This script:
 * 1. Creates the `visitors` table with VIP fields
 * 2. Adds `visitor_id` column to bookings (nullable FK)
 * 3. Backfills visitor records by grouping existing bookings on phone/email
 * 4. Links each booking row to its visitor record
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

async function run() {
  console.log('🚀 Starting visitors table migration...\n');

  // ── Step 1: Create visitors table ─────────────────────────────────────────
  console.log('Step 1: Creating visitors table...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "visitors" (
      "id"               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      "name"             varchar(255) NOT NULL,
      "phone"            varchar(20)  UNIQUE,
      "email"            varchar(255) UNIQUE,
      "is_vip"           boolean      NOT NULL DEFAULT false,
      "vip_notes"        text,
      "total_visits"     integer      NOT NULL DEFAULT 1,
      "first_visit_date" date,
      "last_visit_date"  date,
      "created_at"       timestamp    NOT NULL DEFAULT now(),
      "updated_at"       timestamp    NOT NULL DEFAULT now()
    );
  `);
  console.log('  ✅ visitors table created\n');

  // ── Step 2: Add visitor_id FK to bookings ─────────────────────────────────
  console.log('Step 2: Adding visitor_id column to bookings...');
  await db.execute(sql`
    ALTER TABLE "bookings"
    ADD COLUMN IF NOT EXISTS "visitor_id" uuid
      REFERENCES "visitors"("id") ON DELETE SET NULL;
  `);
  console.log('  ✅ visitor_id column added\n');

  // ── Step 3: Create indexes ─────────────────────────────────────────────────
  console.log('Step 3: Creating indexes...');
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "visitors_phone_idx"  ON "visitors"("phone");
    CREATE INDEX IF NOT EXISTS "visitors_email_idx"  ON "visitors"("email");
    CREATE INDEX IF NOT EXISTS "visitors_is_vip_idx" ON "visitors"("is_vip");
  `);
  console.log('  ✅ Indexes created\n');

  // ── Step 4: Backfill — group existing bookings → create visitor records ───
  console.log('Step 4: Backfilling visitor records from existing bookings...');

  // Fetch all bookings ordered by createdAt so firstVisitDate is accurate
  const existingBookings = await db.execute(sql`
    SELECT id, visitor_name, phone, email, booking_date, created_at
    FROM   bookings
    ORDER  BY created_at ASC;
  `);

  // Group by phone (primary key) then email (secondary key)
  const visitorMap = new Map<string, {
    name: string;
    phone: string | null;
    email: string | null;
    firstDate: string;
    lastDate: string;
    visits: number;
    bookingIds: string[];
  }>();

  for (const row of existingBookings as unknown as any[]) {
    const key = row.phone || row.email || row.id; // fallback: treat each booking as unique
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

  console.log(`  Found ${visitorMap.size} unique visitor(s) across ${(existingBookings as unknown as unknown[]).length} bookings`);

  let createdCount = 0;
  let linkedCount = 0;

  for (const [, v] of visitorMap) {
    // Insert visitor record
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
      ON CONFLICT (phone) DO UPDATE SET
        total_visits     = EXCLUDED.total_visits,
        last_visit_date  = EXCLUDED.last_visit_date,
        updated_at       = now()
      RETURNING id;
    `);

    const visitorId = ((inserted as unknown as any[])[0] as any).id;
    createdCount++;

    // Link all their bookings to this visitor
    for (const bookingId of v.bookingIds) {
      await db.execute(sql`
        UPDATE bookings SET visitor_id = ${visitorId} WHERE id = ${bookingId};
      `);
      linkedCount++;
    }
  }

  console.log(`  ✅ Created ${createdCount} visitor record(s)`);
  console.log(`  ✅ Linked ${linkedCount} booking(s) to visitor profiles\n`);

  console.log('🎉 Migration complete!');
  process.exit(0);
}

run().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
