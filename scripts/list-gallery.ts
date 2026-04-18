import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Need service role to list files easily

const supabase = createClient(supabaseUrl, supabaseKey);

async function listStorage() {
  console.log('--- Discovering Sanctuary Exhibits ---');
  
  const { data, error } = await supabase
    .storage
    .from('gallery')
    .list('', {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'desc' },
    });

  if (error) {
    console.error('Error listing storage:', error);
    return;
  }

  console.log(`Found ${data.length} items in storage:`);
  data.forEach(item => {
    // Generate public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('gallery')
      .getPublicUrl(item.name);
      
    console.log(`- ${item.name} | URL: ${publicUrl}`);
  });
}

listStorage();
