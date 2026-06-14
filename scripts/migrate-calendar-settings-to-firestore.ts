/**
 * Import Supabase calendar settings into Firestore without overwriting data.
 *
 * Usage:
 *   npm run migrate:calendar-settings -- --dry-run
 *   npm run migrate:calendar-settings
 */
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Timestamp,
  type DocumentData,
} from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { getAdminDb } from '../src/lib/firebase/admin-runtime';

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIRECTORY, '..');
const CSV_PATH = path.join(
  PROJECT_ROOT,
  'supabase-export',
  'calendar_settings.csv'
);
const COLLECTION_NAME = 'calendar_settings';
const dryRun = process.argv.includes('--dry-run');

config({ path: path.join(PROJECT_ROOT, '.env.local') });

type CsvRow = Record<string, string>;

interface Summary {
  totalRows: number;
  inserted: number;
  skipped: number;
  failed: number;
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

function parseBoolean(value: string, fallback = false) {
  if (!value) return fallback;
  const normalized = value.toLowerCase();
  if (['true', 't', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', 'f', '0', 'no', 'n'].includes(normalized)) return false;
  return fallback;
}

function parseInteger(value: string, fallback: number) {
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

function toCamelCase(value: string) {
  return value.replace(/_([a-z])/g, (_, character: string) =>
    character.toUpperCase()
  );
}

function preserveAdditionalFields(row: CsvRow) {
  const excluded = new Set([
    'id',
    'originalId',
    'original_id',
    'supabaseId',
    'supabase_id',
    'date',
    'maxCapacity',
    'max_capacity',
    'startTime',
    'start_time',
    'isOpen',
    'is_open',
    'createdAt',
    'created_at',
    'updatedAt',
    'updated_at',
    'updatedBy',
    'updated_by',
  ]);

  return Object.fromEntries(
    Object.entries(row)
      .filter(([key, value]) => !excluded.has(key) && value !== '')
      .map(([key, value]) => [toCamelCase(key), value])
  );
}

function normalizeRow(row: CsvRow) {
  const now = new Date();
  const originalId = firstValue(
    row,
    'id',
    'originalId',
    'original_id',
    'supabaseId',
    'supabase_id'
  );
  const date = normalizeDate(firstValue(row, 'date', 'settingDate', 'setting_date'));
  const settingKey = firstValue(
    row,
    'key',
    'settingKey',
    'setting_key',
    'name',
    'settingName',
    'setting_name'
  );
  const createdAt = parseTimestamp(
    firstValue(row, 'createdAt', 'created_at'),
    now
  );

  if (!date && !settingKey) {
    throw new Error('Missing date or setting key/name');
  }

  return {
    originalId,
    date,
    settingKey,
    data: {
      ...preserveAdditionalFields(row),
      ...(originalId ? { originalId, supabaseId: originalId } : {}),
      ...(settingKey ? { settingKey } : {}),
      date: date || null,
      maxCapacity: parseInteger(
        firstValue(row, 'maxCapacity', 'max_capacity'),
        100
      ),
      startTime: normalizeTime(
        firstValue(row, 'startTime', 'start_time')
      ) || '16:30:00',
      isOpen: parseBoolean(
        firstValue(row, 'isOpen', 'is_open'),
        true
      ),
      updatedBy: firstValue(row, 'updatedBy', 'updated_by') || null,
      createdAt,
      updatedAt: parseTimestamp(
        firstValue(row, 'updatedAt', 'updated_at'),
        createdAt.toDate()
      ),
    },
  };
}

async function run() {
  try {
    await access(CSV_PATH);
  } catch {
    throw new Error(`Calendar settings CSV not found: ${CSV_PATH}`);
  }

  const rows = parseCsv(await readFile(CSV_PATH, 'utf8'));
  const summary: Summary = {
    totalRows: rows.length,
    inserted: 0,
    skipped: 0,
    failed: 0,
  };

  console.log(`CSV: ${CSV_PATH}`);
  console.log(`Mode: ${dryRun ? 'dry run' : 'import'}`);
  console.log(`Rows: ${rows.length}`);

  const collection = getAdminDb().collection(COLLECTION_NAME);
  const existingSnapshot = await collection.get();
  const ids = new Set<string>();
  const settingKeys = new Set<string>();
  const dates = new Set<string>();

  for (const document of existingSnapshot.docs) {
    const data = document.data();
    const documentIds = [
      document.id,
      firstDataValue(data, 'id'),
      firstDataValue(data, 'originalId', 'original_id'),
      firstDataValue(data, 'supabaseId', 'supabase_id'),
    ].map(String).filter(Boolean);

    for (const id of documentIds) ids.add(id);

    const settingKey = String(firstDataValue(
      data,
      'settingKey',
      'setting_key',
      'key',
      'settingName',
      'setting_name',
      'name'
    )).toLowerCase();
    const date = normalizeDate(String(firstDataValue(
      data,
      'date',
      'settingDate',
      'setting_date'
    )));

    if (settingKey) settingKeys.add(settingKey);
    if (date) dates.add(date);
  }

  for (let index = 0; index < rows.length; index += 1) {
    try {
      const normalized = normalizeRow(rows[index]);
      const comparableKey = normalized.settingKey.toLowerCase();
      const duplicate =
        (normalized.originalId && ids.has(normalized.originalId)) ||
        (comparableKey && settingKeys.has(comparableKey)) ||
        (normalized.date && dates.has(normalized.date));

      if (duplicate) {
        summary.skipped += 1;
        continue;
      }

      const reference = normalized.originalId
        ? collection.doc(normalized.originalId)
        : collection.doc();

      if (!dryRun) await reference.create(normalized.data);

      summary.inserted += 1;
      ids.add(reference.id);
      if (normalized.originalId) ids.add(normalized.originalId);
      if (comparableKey) settingKeys.add(comparableKey);
      if (normalized.date) dates.add(normalized.date);
    } catch (error) {
      summary.failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Row ${index + 2} failed: ${message}`);
    }
  }

  console.log('\nMigration summary');
  console.log(`Total rows: ${summary.totalRows}`);
  console.log(
    `${dryRun ? 'Would insert' : 'Inserted'} count: ${summary.inserted}`
  );
  console.log(`Skipped count: ${summary.skipped}`);
  console.log(`Failed count: ${summary.failed}`);

  if (summary.failed > 0) process.exitCode = 1;
}

run().catch((error) => {
  console.error('Calendar settings migration failed:', error);
  process.exitCode = 1;
});
