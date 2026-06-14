/**
 * Import Supabase visitor CSV exports into Firestore without overwriting data.
 *
 * Usage:
 *   npm run migrate:visitors -- --dry-run
 *   npm run migrate:visitors
 */
import { access, readFile } from 'node:fs/promises';
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
const EXPORT_DIRECTORY = path.join(PROJECT_ROOT, 'supabase-export');
const VISITORS_CSV_PATH = path.join(EXPORT_DIRECTORY, 'visitors.csv');
const CHECKINS_CSV_PATH = path.join(EXPORT_DIRECTORY, 'visitor_checkins.csv');
const dryRun = process.argv.includes('--dry-run');

config({ path: path.join(PROJECT_ROOT, '.env.local') });

type CsvRow = Record<string, string>;

interface Summary {
  visitorRowsTotal: number;
  visitorsInserted: number;
  visitorsSkipped: number;
  checkinsInserted: number;
  checkinsSkipped: number;
  failed: number;
}

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function getAdminDb() {
  const app = getApps()[0] ?? initializeApp({
    credential: cert({
      projectId: requiredEnv('FIREBASE_PROJECT_ID'),
      clientEmail: requiredEnv('FIREBASE_CLIENT_EMAIL'),
      privateKey: requiredEnv('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    }),
  });

  return getFirestore(app);
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
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

  if (quoted) throw new Error('Invalid CSV: unclosed quoted field');

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

function firstValue(row: CsvRow, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key]?.trim();
    if (value) return value;
  }
  return '';
}

function firstDataValue(data: DocumentData, ...keys: string[]) {
  for (const key of keys) {
    const value = data[key];
    if (value !== undefined && value !== null && String(value).trim()) return value;
  }
  return '';
}

function normalizeEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizePhone(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

function parseBoolean(value: string, fallback = false) {
  if (!value) return fallback;
  const normalized = value.toLowerCase();
  if (['true', 't', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', 'f', '0', 'no', 'n'].includes(normalized)) return false;
  return fallback;
}

function parseInteger(value: string, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseTimestamp(value: string, fallback: Date) {
  if (!value) return Timestamp.fromDate(fallback);

  const hasTimezone = /(?:z|[+-]\d{2}(?::?\d{2})?)$/i.test(value);
  const normalized = (value.includes('T') ? value : value.replace(' ', 'T'))
    .replace(/(\.\d{3})\d+/, '$1');
  const parsed = new Date(hasTimezone ? normalized : `${normalized}Z`);

  return Timestamp.fromDate(Number.isNaN(parsed.getTime()) ? fallback : parsed);
}

function normalizeDate(value: string) {
  const match = value.match(/\d{4}-\d{2}-\d{2}/);
  return match?.[0] ?? value;
}

function normalizeTime(value: string) {
  const match = value.match(/\d{2}:\d{2}(?::\d{2})?/);
  return match?.[0] ?? value;
}

function visitorOriginalId(row: CsvRow) {
  return firstValue(
    row,
    'id',
    'originalId',
    'original_id',
    'supabaseId',
    'supabase_id'
  );
}

function checkinOriginalId(row: CsvRow) {
  return firstValue(
    row,
    'id',
    'originalId',
    'original_id',
    'supabaseId',
    'supabase_id'
  );
}

function normalizeVisitorRow(row: CsvRow) {
  const now = new Date();
  const originalId = visitorOriginalId(row);
  const name = firstValue(row, 'name', 'visitorName', 'visitor_name');
  const phone = firstValue(row, 'phone');
  const email = normalizeEmail(firstValue(row, 'email'));
  const vipNotes = firstValue(row, 'vipNotes', 'vip_notes', 'notes');
  const createdAt = parseTimestamp(
    firstValue(row, 'createdAt', 'created_at'),
    now
  );
  const updatedAt = parseTimestamp(
    firstValue(row, 'updatedAt', 'updated_at'),
    createdAt.toDate()
  );

  if (!name) throw new Error('Missing visitor name');
  if (!originalId && !normalizePhone(phone) && !email) {
    throw new Error('Visitor needs an id, phone, or email');
  }

  return {
    originalId,
    data: {
      ...(originalId ? { originalId, supabaseId: originalId } : {}),
      name,
      phone: phone || null,
      email: email || null,
      isVip: parseBoolean(firstValue(row, 'isVip', 'vip', 'is_vip')),
      vipNotes: vipNotes || null,
      notes: firstValue(row, 'notes') || vipNotes || null,
      totalVisits: Math.max(
        0,
        parseInteger(firstValue(row, 'totalVisits', 'total_visits'))
      ),
      firstVisitDate: normalizeDate(
        firstValue(row, 'firstVisitDate', 'first_visit_date')
      ) || null,
      lastVisitDate: normalizeDate(
        firstValue(row, 'lastVisitDate', 'last_visit_date')
      ) || null,
      createdAt,
      updatedAt,
    },
  };
}

function checkinFallbackKey(
  visitorId: string,
  bookingId: string,
  checkinDate: string,
  checkinTime: string
) {
  if (!visitorId || (!bookingId && !checkinDate)) return '';
  return [visitorId, bookingId, checkinDate, checkinTime].join('|');
}

function existingCheckinKey(id: string, data: DocumentData) {
  const originalId = String(firstDataValue(
    data,
    'originalId',
    'original_id',
    'supabaseId',
    'supabase_id'
  ));
  if (originalId) return `id:${originalId}`;

  const visitorId = String(firstDataValue(data, 'visitorId', 'visitor_id'));
  const bookingId = String(firstDataValue(data, 'bookingId', 'booking_id'));
  const date = normalizeDate(String(firstDataValue(
    data,
    'checkinDate',
    'checkin_date',
    'bookingDate',
    'booking_date'
  )));
  const time = normalizeTime(String(firstDataValue(
    data,
    'checkinTime',
    'checkin_time',
    'bookingTime',
    'booking_time'
  )));
  const fallback = checkinFallbackKey(visitorId, bookingId, date, time);
  return fallback ? `key:${fallback}` : `doc:${id}`;
}

async function readCsv(filePath: string) {
  return parseCsv(await readFile(filePath, 'utf8'));
}

async function run() {
  if (!(await fileExists(VISITORS_CSV_PATH))) {
    throw new Error(`Required visitor CSV not found: ${VISITORS_CSV_PATH}`);
  }

  const visitorRows = await readCsv(VISITORS_CSV_PATH);
  const checkinFilePresent = await fileExists(CHECKINS_CSV_PATH);
  const checkinRows = checkinFilePresent ? await readCsv(CHECKINS_CSV_PATH) : [];
  const summary: Summary = {
    visitorRowsTotal: visitorRows.length,
    visitorsInserted: 0,
    visitorsSkipped: 0,
    checkinsInserted: 0,
    checkinsSkipped: 0,
    failed: 0,
  };

  console.log(`Mode: ${dryRun ? 'dry run' : 'import'}`);
  console.log(`Visitors CSV: ${VISITORS_CSV_PATH}`);
  console.log(
    checkinFilePresent
      ? `Check-ins CSV: ${CHECKINS_CSV_PATH}`
      : `Check-ins CSV not found; skipping optional import: ${CHECKINS_CSV_PATH}`
  );

  const db = getAdminDb();
  const visitors = db.collection('visitors');
  const checkins = db.collection('visitor_checkins');
  const existingVisitors = await visitors.get();
  const originalIdToDocumentId = new Map<string, string>();
  const phoneToDocumentId = new Map<string, string>();
  const emailToDocumentId = new Map<string, string>();

  for (const document of existingVisitors.docs) {
    const data = document.data();
    const ids = [
      document.id,
      firstDataValue(data, 'id'),
      firstDataValue(data, 'originalId', 'original_id'),
      firstDataValue(data, 'supabaseId', 'supabase_id'),
    ].map(String).filter(Boolean);

    for (const id of ids) originalIdToDocumentId.set(id, document.id);

    const phone = normalizePhone(firstDataValue(data, 'phone'));
    const email = normalizeEmail(firstDataValue(data, 'email'));
    if (phone) phoneToDocumentId.set(phone, document.id);
    if (email) emailToDocumentId.set(email, document.id);
  }

  for (let index = 0; index < visitorRows.length; index += 1) {
    try {
      const { originalId, data } = normalizeVisitorRow(visitorRows[index]);
      const phone = normalizePhone(data.phone);
      const email = normalizeEmail(data.email);
      const duplicateDocumentId =
        (originalId && originalIdToDocumentId.get(originalId)) ||
        (phone && phoneToDocumentId.get(phone)) ||
        (email && emailToDocumentId.get(email)) ||
        '';

      if (duplicateDocumentId) {
        if (originalId) {
          originalIdToDocumentId.set(originalId, duplicateDocumentId);
        }
        summary.visitorsSkipped += 1;
        continue;
      }

      const reference = originalId ? visitors.doc(originalId) : visitors.doc();
      if (!dryRun) await reference.create(data);

      summary.visitorsInserted += 1;
      if (originalId) originalIdToDocumentId.set(originalId, reference.id);
      if (phone) phoneToDocumentId.set(phone, reference.id);
      if (email) emailToDocumentId.set(email, reference.id);
    } catch (error) {
      summary.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Visitor row ${index + 2} failed: ${message}`);
    }
  }

  const existingCheckins = await checkins.get();
  const checkinKeys = new Set<string>();
  for (const document of existingCheckins.docs) {
    checkinKeys.add(`id:${document.id}`);
    checkinKeys.add(existingCheckinKey(document.id, document.data()));
  }

  for (let index = 0; index < checkinRows.length; index += 1) {
    try {
      const row = checkinRows[index];
      const originalId = checkinOriginalId(row);
      const sourceVisitorId = firstValue(
        row,
        'visitorId',
        'visitor_id',
        'visitor',
        'visitorReference',
        'visitor_reference'
      );
      const visitorId = originalIdToDocumentId.get(sourceVisitorId) ||
        (sourceVisitorId && originalIdToDocumentId.get(sourceVisitorId.trim())) ||
        '';

      if (!visitorId) {
        throw new Error(`Visitor reference not found: ${sourceVisitorId || '(empty)'}`);
      }

      const bookingId = firstValue(
        row,
        'bookingId',
        'booking_id',
        'booking',
        'bookingReference',
        'booking_reference'
      );
      const checkinDate = normalizeDate(firstValue(
        row,
        'checkinDate',
        'checkin_date',
        'checkedInAt',
        'checked_in_at',
        'visitedAt',
        'visited_at',
        'bookingDate',
        'booking_date',
        'date'
      ));
      const checkinTime = normalizeTime(firstValue(
        row,
        'checkinTime',
        'checkin_time',
        'checkedInAt',
        'checked_in_at',
        'visitedAt',
        'visited_at',
        'bookingTime',
        'booking_time',
        'time'
      ));
      const fallback = checkinFallbackKey(
        visitorId,
        bookingId,
        checkinDate,
        checkinTime
      );
      const duplicateKey = originalId ? `id:${originalId}` : `key:${fallback}`;

      if (!originalId && !fallback) {
        throw new Error('Check-in needs an id or a usable visitor/date reference');
      }

      if (checkinKeys.has(duplicateKey)) {
        summary.checkinsSkipped += 1;
        continue;
      }

      const now = new Date();
      const createdAt = parseTimestamp(
        firstValue(row, 'createdAt', 'created_at'),
        now
      );
      const data = {
        ...(originalId ? { originalId, supabaseId: originalId } : {}),
        visitorId,
        visitorOriginalId: sourceVisitorId,
        bookingId: bookingId || null,
        bookingOriginalId: bookingId || null,
        checkinDate: checkinDate || null,
        checkinTime: checkinTime || null,
        bookingDate: checkinDate || null,
        bookingTime: checkinTime || null,
        createdAt,
        updatedAt: parseTimestamp(
          firstValue(row, 'updatedAt', 'updated_at'),
          createdAt.toDate()
        ),
      };
      const reference = originalId ? checkins.doc(originalId) : checkins.doc();

      if (!dryRun) await reference.create(data);
      checkinKeys.add(duplicateKey);
      summary.checkinsInserted += 1;
    } catch (error) {
      summary.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Check-in row ${index + 2} failed: ${message}`);
    }
  }

  console.log('\nMigration summary');
  console.log(`Visitor rows total: ${summary.visitorRowsTotal}`);
  console.log(`Visitors inserted: ${summary.visitorsInserted}`);
  console.log(`Visitors skipped: ${summary.visitorsSkipped}`);
  console.log(`Check-ins inserted: ${summary.checkinsInserted}`);
  console.log(`Check-ins skipped: ${summary.checkinsSkipped}`);
  console.log(`Failed count: ${summary.failed}`);

  if (summary.failed > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error('Visitor migration failed:', error);
  process.exitCode = 1;
});
