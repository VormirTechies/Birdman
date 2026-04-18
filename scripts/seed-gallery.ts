import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from '../src/lib/db';
import { galleryImages } from '../src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function seedGallery() {
  console.log('--- Registering Sanctuary Exhibits ---');

  // Insert discovered image
  const images = [
    {
      url: 'https://ympyaabsjfaoxvbtxbox.supabase.co/storage/v1/object/public/gallery/009.jpeg',
      caption: 'The Emerald Horizon: A morning flight patterns over Chintadripet.',
      aspect: 'portrait',
      category: ['parakeets', 'sanctuary'],
    }
  ];

  for (const img of images) {
    await db.insert(galleryImages).values({
      url: img.url,
      caption: img.caption,
      aspect: img.aspect,
      category: img.category,
      order: 0
    }).onConflictDoUpdate({
      target: galleryImages.url,
      set: { caption: img.caption, aspect: img.aspect, category: img.category }
    });
    console.log(`- Registered: ${img.url}`);
  }

  console.log('--- Sanctuary Archived ---');
}

seedGallery();
