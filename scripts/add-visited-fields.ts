import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function addVisitedFields() {
  console.log('Adding visited fields to bookings table...');

  const { error: e1 } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS visited BOOLEAN NOT NULL DEFAULT FALSE;`,
  });

  if (e1) {
    // Fallback: try direct query
    const { error: e2 } = await (supabase as any).from('bookings').select('visited').limit(1);
    if (!e2) {
      console.log('visited column already exists.');
    } else {
      console.error('Failed to add visited column:', e1.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Added visited column');
  }

  const { error: e3 } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS visited_at TIMESTAMPTZ;`,
  });

  if (e3) {
    console.warn('Note: Could not add visited_at column (may already exist):', e3.message);
  } else {
    console.log('✅ Added visited_at column');
  }

  console.log('\nDone! If exec_sql RPC is not available, run this SQL in the Supabase SQL Editor:\n');
  console.log('  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS visited BOOLEAN NOT NULL DEFAULT FALSE;');
  console.log('  ALTER TABLE bookings ADD COLUMN IF NOT EXISTS visited_at TIMESTAMPTZ;\n');
}

addVisitedFields();
