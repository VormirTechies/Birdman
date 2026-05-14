/**
 * Migration: Add updatedBy column to calendar_settings table
 * For Admin Settings Page - Track last editor for calendar settings
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env.local explicitly
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function addUpdatedByColumn() {
  console.log('🔄 Starting migration: Add updatedBy to calendar_settings...');

  try {
    // Add updatedBy column
    await db.execute(sql`
      ALTER TABLE calendar_settings 
      ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES admin_users(id) ON DELETE SET NULL
    `);
    console.log('✅ Added updated_by column');

    // Create index on updatedBy for performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS calendar_settings_updated_by_idx 
      ON calendar_settings(updated_by)
    `);
    console.log('✅ Created index on updated_by');

    console.log('✨ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration
addUpdatedByColumn()
  .then(() => {
    console.log('✅ Database migration complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration error:', error);
    process.exit(1);
  });
