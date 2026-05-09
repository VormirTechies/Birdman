import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function createCalendarSettingsTable() {
  try {
    console.log('🗄️  Creating calendar_settings table...\n');

    // Create the table
    await sql`
      CREATE TABLE IF NOT EXISTS calendar_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        date DATE UNIQUE NOT NULL,
        max_capacity INTEGER NOT NULL DEFAULT 100,
        start_time TIME NOT NULL DEFAULT '16:30:00',
        is_open BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;

    console.log('✅ Table created successfully');

    // Create index
    await sql`
      CREATE INDEX IF NOT EXISTS calendar_settings_date_idx 
      ON calendar_settings(date);
    `;

    console.log('✅ Index created successfully\n');

    // Verify table exists
    const result = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'calendar_settings'
      ORDER BY ordinal_position;
    `;

    console.log('📋 Table structure:');
    console.table(result);

    console.log('\n🎉 Calendar settings table is ready!');
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

createCalendarSettingsTable();
