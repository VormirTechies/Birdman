import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

async function fixReplicaIdentity() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL not found');
  }

  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    console.log('✅ Connected to database\n');

    // Check current replica identity
    console.log('📋 Checking current replica identity...');
    const current = await sql`
      SELECT relname, relreplident
      FROM pg_class
      WHERE relname = 'bookings' AND relnamespace = 'public'::regnamespace
    `;

    if (current.length > 0) {
      const identityMap: Record<string, string> = {
        'd': 'DEFAULT (primary key only)',
        'n': 'NOTHING',
        'f': 'FULL (all columns)',
        'i': 'INDEX'
      };
      const currentIdentity = current[0].relreplident;
      console.log(`   Current: ${identityMap[currentIdentity] || currentIdentity}\n`);

      if (currentIdentity === 'f') {
        console.log('✅ Already set to FULL - no changes needed!');
        return;
      }
    }

    // Set to FULL for realtime
    console.log('🔧 Setting replica identity to FULL...');
    await sql`ALTER TABLE public.bookings REPLICA IDENTITY FULL`;
    console.log('✅ Successfully set to FULL\n');

    // Verify the change
    const verify = await sql`
      SELECT relname, relreplident
      FROM pg_class
      WHERE relname = 'bookings' AND relnamespace = 'public'::regnamespace
    `;

    if (verify.length > 0 && verify[0].relreplident === 'f') {
      console.log('✅ Verified: Replica identity is now FULL');
      console.log('\n📝 This enables Supabase Realtime to track all column changes.');
      console.log('🔄 Restart your dev server for changes to take effect.');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

fixReplicaIdentity();
