import { importBookingCsv, validateBookingCsv } from '../src/lib/firebase/booking-csv-import';
/**
 * Import Supabase booking CSV rows into Firestore without duplicating bookings.
 *
 * Usage:
 *   npm run migrate:bookings -- --validate-only --file <csv> --timestamp-offset Z
 *   npm run migrate:bookings -- --emulator --file <csv> --timestamp-offset Z --dry-run
 * Only choose Z after verifying that timezone-free source timestamps represent UTC.
 */
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { applicationDefault, cert, deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIRECTORY, '..');

const args = process.argv.slice(2);
const target = args.includes('--production') ? 'production' : 'emulator';
config({ path: path.join(PROJECT_ROOT, target === 'production' ? '.env.production' : '.env.local'), quiet: true });
function option(name: string) {
  const value = args[args.indexOf(name) + 1];
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`);
  return value;
}

const CSV_PATH = args.includes('--file') ? path.resolve(option('--file')) : path.join(PROJECT_ROOT, 'supabase-export', 'bookings-final.csv');

const PRODUCTION_PROJECT_ID = 'birdman-7e745';
const PRODUCTION_DATABASE_ID = 'birdman-db';
const dryRun = process.argv.includes('--dry-run');



function getAdminDb() {
  const projectId = PRODUCTION_PROJECT_ID;
  if (target === 'production' && process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Unset FIRESTORE_EMULATOR_HOST for production');
  const emulatorHost = target === 'emulator' ? process.env.FIRESTORE_EMULATOR_HOST?.trim() || '127.0.0.1:7003' : undefined;
  const databaseId = target === 'emulator' ? '(default)' : PRODUCTION_DATABASE_ID;
  if (emulatorHost) process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;

  if (emulatorHost) {
    if (!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(emulatorHost)) {
      throw new Error(`Refusing non-local Firestore emulator host: ${emulatorHost}`);
    }
    if (databaseId !== '(default)') {
      throw new Error('Local booking migration must target the (default) database');
    }
  } else if (
    projectId !== PRODUCTION_PROJECT_ID ||
    databaseId !== PRODUCTION_DATABASE_ID
  ) {
    throw new Error(
      `Production booking migration is pinned to ${PRODUCTION_PROJECT_ID}/${PRODUCTION_DATABASE_ID}`
    );
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!emulatorHost && Boolean(clientEmail) !== Boolean(privateKey)) throw new Error('Configure both service-account fields or use ADC');
  const app = initializeApp({ projectId,
    ...(emulatorHost ? {} : { credential: clientEmail && privateKey ? cert({
      projectId,
      clientEmail, privateKey,
    }) : applicationDefault() }),
  });

  const db = databaseId === '(default)'
    ? getFirestore(app)
    : getFirestore(app, databaseId);
  return { app, db };
}


async function run() {
  if (!args.includes('--validate-only') && Number(args.includes('--emulator')) + Number(args.includes('--production')) !== 1) {
    throw new Error('Choose exactly one of --emulator or --production');
  }
  if (target === 'production' && !dryRun && !args.includes('--validate-only') && !args.includes('--confirm-production')) {
    throw new Error('Production writes require --confirm-production');
  }
  await access(CSV_PATH);
  const contents = await readFile(CSV_PATH, 'utf8');
 const validated = validateBookingCsv(contents, option('--timestamp-offset'));
 console.log('CSV validation', { rows: validated.normalized.length, dates: validated.dates });
 if (args.includes('--validate-only')) return;
 const { app, db } = getAdminDb();
 try { console.log(JSON.stringify(await importBookingCsv(db, contents, option('--timestamp-offset'), target, dryRun), null, 2)); }
 finally { await deleteApp(app); }
}
run().catch(error => { console.error(error instanceof Error ? error.message : 'Migration failed'); process.exitCode = 1; });
