/**
 * Import Supabase booking CSV rows into Firestore without duplicating bookings.
 *
 * Usage:
 *   npm run migrate:bookings
 *   npm run migrate:bookings -- --dry-run
 */
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { config } from 'dotenv';

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIRECTORY, '..');

config({ path: path.join(PROJECT_ROOT, '.env.local') });

const CSV_PATH = path.join(PROJECT_ROOT, 'supabase-export', 'bookings-final.csv');
const COLLECTION_NAME = 'bookings';
const dryRun = process.argv.includes('--dry-run');

type CsvRow = Record<string, string>;
type BookingData = Record<string, unknown>;

interface Summary {
  totalRows: number;
  inserted: number;
  skipped: number;
  failed: number;
}

function getAdminDb() {
  const existingApp = getApps()[0];
  const app = existingApp ?? initializeApp({
    credential: cert({
      projectId: requiredEnv('FIREBASE_PROJECT_ID'),
      clientEmail: requiredEnv('FIREBASE_CLIENT_EMAIL'),
      privateKey: requiredEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    }),
  });

  return getFirestore(app);
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseCsv(contents: string): CsvRow[] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < contents.length; index += 1) {
    const character = contents[index];

    if (quoted) {
      if (character === '"') {
        if (contents[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      record.push(field);
      field = '';
    } else if (character === '\n') {
      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else if (character !== '\r') {
      field += character;
    }
  }

  if (quoted) {
    throw new Error('Invalid CSV: unclosed quoted field');
  }

  if (field.length > 0 || record.length > 0) {
    record.push(field);
    records.push(record);
  }

  if (records.length === 0) return [];

  const headers = records[0].map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, '').trim() : header.trim()
  );

  return records.slice(1)
    .filter((values) => values.some((value) => value.trim() !== ''))
    .map((values) => Object.fromEntries(
      headers.map((header, index) => [header, values[index]?.trim() ?? ''])
    ));
}

function firstValue(row: CsvRow, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key]?.trim();
    if (value) return value;
  }
  return '';
}

function parseInteger(value: string, fallback = 0): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: string, fallback = false): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['true', 't', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', 'f', '0', 'no', 'n'].includes(normalized)) return false;
  return fallback;
}

function parseTimestamp(value: string, fallback: Date): Timestamp {
  if (!value) return Timestamp.fromDate(fallback);

  const hasTimezone = /(?:z|[+-]\d{2}(?::?\d{2})?)$/i.test(value);
  const normalized = (value.includes('T') ? value : value.replace(' ', 'T'))
    .replace(/(\.\d{3})\d+/, '$1');
  const parsed = new Date(hasTimezone ? normalized : `${normalized}Z`);

  return Number.isNaN(parsed.getTime())
    ? Timestamp.fromDate(fallback)
    : Timestamp.fromDate(parsed);
}

function normalizeEmail(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function normalizePhone(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}

function normalizeDate(value: unknown): string {
  const text = String(value ?? '').trim();
  const match = text.match(/^\d{4}-\d{2}-\d{2}/);
  return match?.[0] ?? text;
}

function normalizeTime(value: unknown): string {
  const text = String(value ?? '').trim();
  const match = text.match(/^\d{2}:\d{2}(?::\d{2})?/);
  return match?.[0] ?? text;
}

function normalizeBookingNumber(value: unknown): string | null {
  const text = String(value ?? '').replace(/^#/, '').trim();
  if (!/^\d+$/.test(text)) return null;

  const number = Number.parseInt(text, 10);
  return Number.isSafeInteger(number) && number > 0 ? String(number) : null;
}

function fallbackKey(data: BookingData): string | null {
  const email = normalizeEmail(data.email);
  const phone = normalizePhone(data.phone);
  const bookingDate = normalizeDate(data.bookingDate ?? data.booking_date);
  const bookingTime = normalizeTime(data.bookingTime ?? data.booking_time);

  if (!email || !phone || !bookingDate || !bookingTime) return null;
  return [email, phone, bookingDate, bookingTime].join('|');
}

function normalizeRow(row: CsvRow): BookingData {
  const now = new Date();
  const visitorName = firstValue(row, 'visitorName', 'visitor_name');
  const phone = firstValue(row, 'phone');
  const email = firstValue(row, 'email').toLowerCase();
  const adults = parseInteger(firstValue(row, 'adults'));
  const children = parseInteger(firstValue(row, 'children'));
  const storedGuestCount = firstValue(row, 'numberOfGuests', 'number_of_guests');
  const numberOfGuests = storedGuestCount
    ? parseInteger(storedGuestCount)
    : adults + children;
  const bookingDate = normalizeDate(firstValue(row, 'bookingDate', 'booking_date'));
  const bookingTime = normalizeTime(firstValue(row, 'bookingTime', 'booking_time'));
  const bookingNumber = normalizeBookingNumber(
    firstValue(row, 'bookingNumber', 'booking_number')
  );

  if (!visitorName) throw new Error('Missing visitor name');
  if (!phone) throw new Error('Missing phone');
  if (!bookingDate || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
    throw new Error(`Invalid booking date: ${bookingDate || '(empty)'}`);
  }
  if (!bookingTime || !/^\d{2}:\d{2}(?::\d{2})?$/.test(bookingTime)) {
    throw new Error(`Invalid booking time: ${bookingTime || '(empty)'}`);
  }

  const data: BookingData = {
    visitorName,
    phone,
    email: email || null,
    adults,
    children,
    numberOfGuests: Math.max(0, numberOfGuests),
    bookingDate,
    bookingTime,
    status: firstValue(row, 'status') || 'confirmed',
    visited: parseBoolean(firstValue(row, 'visited')),
    createdAt: parseTimestamp(firstValue(row, 'createdAt', 'created_at'), now),
    updatedAt: parseTimestamp(firstValue(row, 'updatedAt', 'updated_at'), now),
  };

  if (bookingNumber !== null) {
    data.bookingNumber = Number.parseInt(bookingNumber, 10);
  }

  return data;
}

async function updateBookingCounter(maxBookingNumber: number) {
  if (dryRun || maxBookingNumber < 1) return;

  const db = getAdminDb();
  const counterRef = db.collection('_counters').doc('bookings');

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(counterRef);
    const currentValue = Number(snapshot.data()?.value ?? 0);

    if (maxBookingNumber > currentValue) {
      transaction.set(
        counterRef,
        {
          value: maxBookingNumber,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }
  });
}

async function run() {
  try {
    await access(CSV_PATH);
  } catch {
    throw new Error(
      `CSV file not found. Place the final export at: ${CSV_PATH}`
    );
  }

  const contents = await readFile(CSV_PATH, 'utf8');
  const rows = parseCsv(contents);
  const summary: Summary = {
    totalRows: rows.length,
    inserted: 0,
    skipped: 0,
    failed: 0,
  };

  console.log(`CSV: ${CSV_PATH}`);
  console.log(`Mode: ${dryRun ? 'dry run' : 'import'}`);
  console.log(`Rows: ${rows.length}`);

  const db = getAdminDb();
  const bookings = db.collection(COLLECTION_NAME);
  const existingSnapshot = await bookings.get();
  const bookingNumbers = new Set<string>();
  const fallbackKeys = new Set<string>();
  let maxBookingNumber = 0;

  for (const document of existingSnapshot.docs) {
    const data = document.data() as BookingData;
    const number = normalizeBookingNumber(data.bookingNumber ?? data.booking_number);
    const identity = fallbackKey(data);

    if (number) {
      bookingNumbers.add(number);
      maxBookingNumber = Math.max(maxBookingNumber, Number.parseInt(number, 10) || 0);
    }
    if (identity) fallbackKeys.add(identity);
  }

  for (let index = 0; index < rows.length; index += 1) {
    try {
      const data = normalizeRow(rows[index]);
      const number = normalizeBookingNumber(data.bookingNumber);
      const identity = fallbackKey(data);
      const duplicate = number
        ? bookingNumbers.has(number)
        : identity !== null && fallbackKeys.has(identity);

      if (duplicate) {
        summary.skipped += 1;
        continue;
      }

      if (!dryRun) {
        await bookings.add(data);
      }

      summary.inserted += 1;
      if (number) {
        bookingNumbers.add(number);
        maxBookingNumber = Math.max(maxBookingNumber, Number.parseInt(number, 10) || 0);
      }
      if (identity) fallbackKeys.add(identity);
    } catch (error) {
      summary.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Row ${index + 2} failed: ${message}`);
    }
  }

  await updateBookingCounter(maxBookingNumber);

  console.log('\nMigration summary');
  console.log(`Total rows: ${summary.totalRows}`);
  console.log(`Inserted count: ${summary.inserted}`);
  console.log(`Skipped count: ${summary.skipped}`);
  console.log(`Failed count: ${summary.failed}`);

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exitCode = 1;
});
