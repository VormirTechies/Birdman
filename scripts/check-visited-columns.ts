import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data, error } = await s.from('bookings').select('visited').limit(1);
  if (error) {
    console.log('Error — column may not exist:', error.message);
  } else {
    console.log('Columns exist! Sample:', JSON.stringify(data));
  }
}

check();
