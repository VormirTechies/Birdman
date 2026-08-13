import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { initializeGalleryScript, readProjectFile, uploadGalleryRecord } from './gallery-firebase-utils';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
config({ path: path.join(projectRoot, '.env.local') });

const files = [
  '001.jpeg', '002.jpeg', '003.jpeg', '004.jpeg', '005.jpeg', '006.jpeg',
  '007.jpeg', '008.jpeg', '009.jpeg', '010.jpeg', '011.jpeg', '012.jpeg',
  '013.jpeg', '014.jpeg', 'sudarson-001.png', 'sudarson-002.jpeg',
  'sudarson-003.jpeg', 'sudarson-004.jpg',
] as const;

async function run() {
  const production = process.argv.includes('--production');
  const emulator = process.argv.includes('--emulator');
  if (production === emulator) throw new Error('Pass exactly one of --emulator or --production');
  if (production && !process.argv.includes('--confirm-production')) {
    throw new Error('Production seeding requires --confirm-production');
  }
  const target = production ? 'production' : 'emulator';
  const { db, bucket } = initializeGalleryScript(target);
  let inserted = 0;
  let skipped = 0;
  for (const [index, file] of files.entries()) {
    const input = await readProjectFile(projectRoot, `public/images/gallery/${file}`);
    const result = await uploadGalleryRecord({
      db,
      bucket,
      input,
      title: `Birdman of Chennai sanctuary moment ${index + 1}`,
      caption: 'A moment from Sudarson Sah’s parakeet sanctuary in Chennai.',
      categories: file.startsWith('sudarson') ? ['birdman', 'sanctuary'] : ['parakeets', 'sanctuary'],
      order: index,
      uploadedAt: new Date(Date.now() - index * 1000),
      legacyId: `local-${file.replace(/\.[^.]+$/, '')}`,
    });
    if (result.status === 'inserted') inserted += 1;
    else skipped += 1;
    console.log(`${file}: ${result.status} (${result.id})`);
  }
  console.log('Gallery seed complete', { target, inserted, skipped, total: files.length });
}

run().catch((error) => {
  console.error('Gallery seed failed:', error);
  process.exitCode = 1;
});
