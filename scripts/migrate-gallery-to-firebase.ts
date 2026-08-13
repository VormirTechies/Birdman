import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { db } from '../src/lib/db';
import { galleryImages } from '../src/lib/db/schema';
import { desc } from 'drizzle-orm';
import { initializeGalleryScript, uploadGalleryRecord } from './gallery-firebase-utils';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
config({ path: path.join(projectRoot, '.env.local') });

async function run() {
  const dryRun = process.argv.includes('--dry-run');
  const production = process.argv.includes('--production');
  const emulator = process.argv.includes('--emulator');
  if (production === emulator) throw new Error('Pass exactly one of --emulator or --production');
  if (production && !dryRun && !process.argv.includes('--confirm-production')) {
    throw new Error('Production writes require --confirm-production');
  }
  const target = production ? 'production' : 'emulator';
  const { db: firestore, bucket } = initializeGalleryScript(target);
  const rows = await db.select().from(galleryImages).orderBy(desc(galleryImages.uploadedAt));
  const summary = { total: rows.length, inserted: 0, skipped: 0, failed: 0 };

  for (const row of rows) {
    try {
      const response = await fetch(row.url);
      if (!response.ok) throw new Error(`Download returned ${response.status}`);
      const result = await uploadGalleryRecord({
        db: firestore,
        bucket,
        input: Buffer.from(await response.arrayBuffer()),
        title: row.altText?.trim() || row.caption?.trim() || 'Birdman of Chennai sanctuary',
        caption: row.caption,
        categories: row.category ?? [],
        order: row.order,
        uploadedAt: row.uploadedAt,
        legacyId: row.id,
        dryRun,
      });
      if (result.status === 'skipped') summary.skipped += 1;
      else summary.inserted += 1;
      console.log(`${row.id}: ${result.status}`);
    } catch (error) {
      summary.failed++;
      console.error(`${row.id}: failed`, error instanceof Error ? error.message : error);
    }
  }
  console.log('Gallery migration summary', { target, dryRun, ...summary });
  if (summary.failed) process.exitCode = 1;
}

run().catch((error) => {
  console.error('Gallery migration failed:', error);
  process.exitCode = 1;
});
