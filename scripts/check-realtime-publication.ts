import { config } from 'dotenv';
import postgres from 'postgres';

config({ path: '.env.local' });

async function checkRealtimePublication() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL not found');
  }

  const sql = postgres(DATABASE_URL, { max: 1 });

  try {
    console.log('✅ Connected to database\n');

    // Check if publication exists
    console.log('📋 Step 1: Checking supabase_realtime publication...');
    const pubExists = await sql`
      SELECT pubname, puballtables 
      FROM pg_publication 
      WHERE pubname = 'supabase_realtime'
    `;

    if (pubExists.length === 0) {
      console.log('❌ supabase_realtime publication does not exist!');
      return;
    }

    console.log(`   ✅ Publication exists (All tables: ${pubExists[0].puballtables})`);

    // Check which tables are in the publication
    console.log('\n📋 Step 2: Tables in supabase_realtime publication...');
    const tablesInPub = await sql`
      SELECT schemaname, tablename
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
    `;

    if (tablesInPub.length === 0) {
      console.log('   ⚠️ No tables found in publication');
    } else {
      console.log(`   Found ${tablesInPub.length} tables:`);
      tablesInPub.forEach(t => {
        console.log(`   - ${t.schemaname}.${t.tablename}`);
      });
    }

    // Check if bookings is in the publication
    const bookingsInPub = tablesInPub.find(t => t.tablename === 'bookings');
    if (!bookingsInPub) {
      console.log('\n❌ bookings table is NOT in the publication!');
      console.log('   Adding it now...');
      
      try {
        await sql`
          ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings
        `;
        console.log('   ✅ Added bookings to publication');
      } catch (err: any) {
        console.error('   ❌ Error:', err.message);
      }
    } else {
      console.log('\n✅ bookings table is in the publication');
    }

    // Check replica identity
    console.log('\n📋 Step 3: Checking replica identity...');
    const replicaIdentity = await sql`
      SELECT relname, relreplident
      FROM pg_class
      WHERE relname = 'bookings' AND relnamespace = 'public'::regnamespace
    `;

    if (replicaIdentity.length > 0) {
      const identity = replicaIdentity[0].relreplident;
      const identityMap: Record<string, string> = {
        'd': 'DEFAULT (primary key)',
        'n': 'NOTHING',
        'f': 'FULL',
        'i': 'INDEX'
      };
      console.log(`   Replica Identity: ${identityMap[identity] || identity}`);
      
      if (identity === 'n') {
        console.log('   ⚠️ NOTHING identity may limit realtime functionality');
        console.log('   Fixing to FULL...');
        
        try {
          await sql`ALTER TABLE public.bookings REPLICA IDENTITY FULL`;
          console.log('   ✅ Changed to FULL');
        } catch (err: any) {
          console.error('   ❌ Error:', err.message);
        }
      }
    }

    console.log('\n============================================================');
    console.log('✅ Realtime publication check completed!');
    console.log('============================================================');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

checkRealtimePublication();
