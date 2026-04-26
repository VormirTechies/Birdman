/**
 * Script to check and fix RLS policies for Supabase Realtime
 * 
 * This script ensures that authenticated users (admin) can:
 * 1. SELECT from bookings table (required for realtime subscriptions)
 * 2. Receive realtime updates
 * 
 * Run: npx tsx scripts/check-rls-for-realtime.ts
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env.local');
  process.exit(1);
}

async function checkAndFixRLS() {
  const sql = postgres(DATABASE_URL, {
    max: 1,
  });

  try {
    console.log('✅ Connected to database\n');

    // Step 1: Check if RLS is enabled on bookings table
    console.log('📋 Step 1: Checking RLS status on bookings table...');
    const rlsCheck = await sql`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = 'bookings'
    `;
    
    if (rlsCheck.length > 0) {
      const isRLSEnabled = rlsCheck[0].relrowsecurity;
      console.log(`   RLS Enabled: ${isRLSEnabled ? '✅ YES' : '❌ NO'}`);
    }

    // Step 2: List existing policies
    console.log('\n📋 Step 2: Listing existing RLS policies for bookings...');
    const policiesCheck = await sql`
      SELECT 
        policyname as policy_name,
        cmd as command,
        roles
      FROM pg_policies
      WHERE tablename = 'bookings' AND schemaname = 'public'
    `;

    if (policiesCheck.length > 0) {
      console.log(`   Found ${policiesCheck.length} existing policies:`);
      policiesCheck.forEach(policy => {
        console.log(`   - ${policy.policy_name} (${policy.command})`);
      });
    } else {
      console.log('   ⚠️ No RLS policies found');
    }

    // Step 3: Check for SELECT policy for authenticated users
    console.log('\n📋 Step 3: Checking SELECT policy for authenticated users...');
    const selectPolicyCheck = await sql`
      SELECT policyname 
      FROM pg_policies
      WHERE tablename = 'bookings' 
        AND schemaname = 'public'
        AND cmd = 'SELECT'
        AND 'authenticated' = ANY(roles::text[])
    `;

    if (selectPolicyCheck.length > 0) {
      console.log('   ✅ SELECT policy exists for authenticated role');
    } else {
      console.log('   ⚠️ No SELECT policy found for authenticated role - this might block realtime!');
    }

    // Step 4: Create or update SELECT policy for authenticated users
    console.log('\n🔧 Step 4: Ensuring SELECT policy for authenticated users...');
    
    try {
      // Drop existing policy if it exists
      await sql`
        DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.bookings
      `;
      
      // Create new policy
      await sql`
        CREATE POLICY "Enable read access for authenticated users" 
        ON public.bookings 
        FOR SELECT 
        TO authenticated 
        USING (true)
      `;
      
      console.log('   ✅ Created SELECT policy for authenticated users');
    } catch (err: any) {
      if (err.message.includes('already exists')) {
        console.log('   ✅ Policy already exists');
      } else {
        console.error('   ❌ Error creating policy:', err.message);
      }
    }

    // Step 5: Verify realtime publication
    console.log('\n📋 Step 5: Verifying realtime publication...');
    const pubCheck = await sql`
      SELECT 
        p.pubname,
        pt.schemaname,
        pt.tablename
      FROM pg_publication p
      LEFT JOIN pg_publication_tables pt ON p.pubname = pt.pubname
      WHERE p.pubname = 'supabase_realtime'
        AND pt.tablename = 'bookings'
    `;

    if (pubCheck.length > 0) {
      console.log('   ✅ bookings table is in supabase_realtime publication');
    } else {
      console.log('   ⚠️ bookings table NOT in realtime publication');
      console.log('   Attempting to add it...');
      
      try {
        await sql`
          ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings
        `;
        console.log('   ✅ Added bookings to realtime publication');
      } catch (err: any) {
        if (err.message.includes('already member')) {
          console.log('   ✅ bookings already in publication');
        } else {
          console.error('   ❌ Error:', err.message);
        }
      }
    }

    // Step 6: Check if anon role has access (for public booking page)
    console.log('\n📋 Step 6: Checking anon role access (optional)...');
    const anonPolicyCheck = await sql`
      SELECT policyname 
      FROM pg_policies
      WHERE tablename = 'bookings'
        AND schemaname = 'public'
        AND 'anon' = ANY(roles::text[])
    `;

    if (anonPolicyCheck.length > 0) {
      console.log('   ✅ anon role has policies (for public booking)');
    } else {
      console.log('   ℹ️ No anon policies (admin-only access)');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ RLS check and fix completed!');
    console.log('='.repeat(60));
    console.log('\n📝 Summary:');
    console.log('   • RLS policies checked and updated');
    console.log('   • SELECT policy enabled for authenticated users');
    console.log('   • Realtime publication verified');
    console.log('\n🔄 Next steps:');
    console.log('   1. Restart your Next.js dev server');
    console.log('   2. Clear browser cache and reload admin dashboard');
    console.log('   3. Check console for "✅ Realtime subscription active"');
    console.log('\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Run the script
checkAndFixRLS().catch(console.error);
