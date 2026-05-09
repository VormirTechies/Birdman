import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

async function migrate() {
  console.log('Dropping visited_at column from bookings table...');
  try {
    await sql`ALTER TABLE bookings DROP COLUMN IF EXISTS visited_at`;
    console.log('✅ visited_at column dropped successfully');
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await sql.end();
  }
}

migrate();
