/**
 * Migration: Add adults and children columns to bookings table
 * Split numberOfGuests into separate adult and child counts
 * 
 * Changes:
 * - Add adults column (integer, NOT NULL, default 1)
 * - Add children column (integer, NOT NULL, default 0)
 * - Backfill existing data: adults = numberOfGuests, children = 0
 * - Add constraint: adults >= 1 AND children >= 0 AND adults + children <= 10
 * - Keep numberOfGuests for backward compatibility (will be removed later)
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function addAdultChildSplit() {
  console.log('🔄 Starting migration: Add adults and children columns to bookings...');

  try {
    // Step 1: Add adults column
    console.log('📝 Adding adults column...');
    await db.execute(sql`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS adults INTEGER NOT NULL DEFAULT 1
    `);
    console.log('✅ Added adults column');

    // Step 2: Add children column
    console.log('📝 Adding children column...');
    await db.execute(sql`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS children INTEGER NOT NULL DEFAULT 0
    `);
    console.log('✅ Added children column');

    // Step 3: Backfill existing data (adults = numberOfGuests, children = 0)
    console.log('📝 Backfilling existing bookings...');
    const backfillResult = await db.execute(sql`
      UPDATE bookings 
      SET 
        adults = GREATEST(1, number_of_guests),
        children = 0
    `);
    console.log(`✅ Backfilled existing bookings`);

    // Step 3b: Fix any bookings where adults + children > 10
    console.log('📝 Fixing bookings with total > 10...');
    await db.execute(sql`
      UPDATE bookings 
      SET 
        adults = LEAST(10, GREATEST(1, number_of_guests)),
        children = 0
      WHERE number_of_guests > 10
    `);
    console.log('✅ Fixed bookings exceeding max capacity');

    // Step 4: Add constraint to ensure data integrity
    console.log('📝 Adding constraint check...');
    await db.execute(sql`
      ALTER TABLE bookings 
      ADD CONSTRAINT bookings_guest_count_check 
      CHECK (
        adults >= 1 AND 
        children >= 0 AND 
        adults + children <= 10
      )
    `);
    console.log('✅ Added guest count constraint');

    // Step 5: Create indexes for performance
    console.log('📝 Creating indexes...');
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS bookings_adults_idx ON bookings(adults)
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS bookings_children_idx ON bookings(children)
    `);
    console.log('✅ Created indexes on adults and children columns');

    // Step 6: Verify migration
    console.log('📝 Verifying migration...');
    const verifyResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_bookings,
        SUM(adults) as total_adults,
        SUM(children) as total_children,
        SUM(number_of_guests) as total_guests,
        SUM(adults + children) as computed_total
      FROM bookings
    `);
    const stats = verifyResult[0] as any;
    console.log('📊 Migration verification:');
    console.log(`   Total bookings: ${stats.total_bookings}`);
    console.log(`   Total adults: ${stats.total_adults}`);
    console.log(`   Total children: ${stats.total_children}`);
    console.log(`   Total guests (old field): ${stats.total_guests}`);
    console.log(`   Computed total (adults + children): ${stats.computed_total}`);

    console.log('✨ Migration completed successfully!');
    console.log('ℹ️  Note: numberOfGuests field kept for backward compatibility');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
addAdultChildSplit()
  .then(() => {
    console.log('✅ Database migration complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration error:', error);
    process.exit(1);
  });
