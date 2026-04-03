import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function initStorage() {
  console.log('Checking Supabase Storage buckets...');

  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('Failed to list buckets:', error.message);
    return;
  }

  const galleryBucket = buckets.find(b => b.name === 'gallery');

  if (!galleryBucket) {
    console.log('Creating "gallery" bucket...');
    const { error: createError } = await supabase.storage.createBucket('gallery', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (createError) {
      console.error('Failed to create bucket:', createError.message);
    } else {
      console.log('Bucket "gallery" created successfully!');
    }
  } else {
    console.log('Bucket "gallery" already exists.');
  }
}

initStorage();
