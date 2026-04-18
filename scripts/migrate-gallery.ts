import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  console.log('--- Evolving Sanctuary Architecture ---');

  await db.execute(sql`
    ALTER TABLE "gallery_images" 
    ADD COLUMN IF NOT EXISTS "category" text[],
    ADD COLUMN IF NOT EXISTS "aspect" varchar(50) DEFAULT 'portrait',
    ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0;
  `);

  await db.execute(sql`
    ALTER TABLE "gallery_images" 
    ADD CONSTRAINT "gallery_images_url_unique" UNIQUE ("url");
  `).catch(e => console.log('Constraint likely already exists.'));

  console.log('--- Architecture Stabilized ---');
}

migrate();
