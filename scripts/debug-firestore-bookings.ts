/**
 * Read-only diagnostics for the Firestore bookings collection.
 *
 * Usage:
 *   npm run debug:bookings
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import {
  getFirestore,
  Timestamp,
  type DocumentData,
} from 'firebase-admin/firestore';
import { config } from 'dotenv';

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIRECTORY, '..');

config({ path: path.join(PROJECT_ROOT, '.env.local') });

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function getAdminDb() {
  const projectId = requiredEnv('FIREBASE_PROJECT_ID');
  const app = getApps()[0] ?? initializeApp({
    credential: cert({
      projectId,
      clientEmail: requiredEnv('FIREBASE_CLIENT_EMAIL'),
      privateKey: requiredEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    }),
  });

  return {
    app,
    db: getFirestore(app),
    projectId,
  };
}

function field(data: DocumentData, camelCase: string, snakeCase: string) {
  return data[camelCase] ?? data[snakeCase];
}

function printable(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value ?? null;
}

function increment(counts: Map<string, number>, key: string) {
  counts.set(key, (counts.get(key) ?? 0) + 1);
}

function printCounts(title: string, counts: Map<string, number>) {
  console.log(`\n${title}`);
  for (const [key, count] of [...counts.entries()].sort()) {
    console.log(`  ${key}: ${count}`);
  }
}

async function run() {
  const { db, projectId } = getAdminDb();
  const collectionPath = 'bookings';
  const snapshot = await db.collection(collectionPath).get();
  const today = new Date().toISOString().split('T')[0];
  const statusCounts = new Map<string, number>();
  const bookingDateCounts = new Map<string, number>();
  const createdAtCounts = new Map<string, number>();
  const bookingNumberTypes = new Map<string, number>();
  const bookingNumbers: number[] = [];
  let onOrAfterToday = 0;
  let beforeToday = 0;

  console.log('Firestore booking diagnostics');
  console.log(`Project ID: ${projectId}`);
  console.log('Database ID: (default)');
  console.log(`Collection path: ${collectionPath}`);
  console.log(`Total documents: ${snapshot.size}`);
  console.log(`Admin default minimum date: ${today}`);

  for (const document of snapshot.docs) {
    const data = document.data();
    const status = String(data.status ?? '(missing)');
    const bookingDate = field(data, 'bookingDate', 'booking_date');
    const createdAt = field(data, 'createdAt', 'created_at');
    const bookingNumber = field(data, 'bookingNumber', 'booking_number');

    increment(statusCounts, status);
    increment(
      bookingDateCounts,
      bookingDate === undefined || bookingDate === null || bookingDate === ''
        ? 'missing'
        : 'present'
    );
    increment(
      createdAtCounts,
      createdAt === undefined || createdAt === null
        ? 'missing'
        : 'present'
    );
    increment(
      bookingNumberTypes,
      bookingNumber === undefined || bookingNumber === null
        ? 'missing'
        : typeof bookingNumber
    );

    const numericBookingNumber = Number(bookingNumber);
    if (Number.isFinite(numericBookingNumber)) {
      bookingNumbers.push(numericBookingNumber);
    }

    const normalizedDate = String(bookingDate ?? '');
    if (normalizedDate >= today) {
      onOrAfterToday += 1;
    } else {
      beforeToday += 1;
    }
  }

  console.log(`Documents on/after ${today}: ${onOrAfterToday}`);
  console.log(`Documents before/missing ${today}: ${beforeToday}`);

  console.log('\nFirst 5 documents');
  for (const document of snapshot.docs.slice(0, 5)) {
    const data = document.data();
    console.log({
      id: document.id,
      bookingNumber: field(data, 'bookingNumber', 'booking_number') ?? null,
      visitorName: field(data, 'visitorName', 'visitor_name') ?? null,
      bookingDate: field(data, 'bookingDate', 'booking_date') ?? null,
      bookingTime: field(data, 'bookingTime', 'booking_time') ?? null,
      status: data.status ?? null,
      visited: data.visited ?? null,
      createdAt: printable(field(data, 'createdAt', 'created_at')),
    });
  }

  printCounts('Counts by status', statusCounts);
  printCounts('bookingDate field', bookingDateCounts);
  printCounts('createdAt field', createdAtCounts);
  printCounts('bookingNumber value type', bookingNumberTypes);

  console.log('\nBooking number range');
  console.log(
    bookingNumbers.length > 0
      ? `  min: ${Math.min(...bookingNumbers)}, max: ${Math.max(...bookingNumbers)}`
      : '  No numeric booking numbers found'
  );
}

run().catch((error) => {
  console.error('Firestore booking diagnostics failed:', error);
  process.exitCode = 1;
});
