import 'server-only';

import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type DocumentReference,
  type Query,
} from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';

export const DEFAULT_CALENDAR_CAPACITY = 100;
export const DEFAULT_CALENDAR_START_TIME = '16:30:00';

export interface CalendarSettingInput {
  maxCapacity?: number;
  startTime?: string;
  isOpen?: boolean;
}

function field(data: DocumentData, camelCase: string, snakeCase: string) {
  return data[camelCase] ?? data[snakeCase];
}

function numberValue(value: unknown, fallback: number) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanValue(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
  }
  return fallback;
}

function isoString(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
}

export function normalizeCalendarSetting(id: string, data: DocumentData) {
  return {
    ...data,
    id,
    date: String(field(data, 'date', 'setting_date') ?? ''),
    maxCapacity: numberValue(
      field(data, 'maxCapacity', 'max_capacity'),
      DEFAULT_CALENDAR_CAPACITY
    ),
    startTime: String(
      field(data, 'startTime', 'start_time') ?? DEFAULT_CALENDAR_START_TIME
    ),
    isOpen: booleanValue(field(data, 'isOpen', 'is_open'), true),
    updatedBy: field(data, 'updatedBy', 'updated_by') ?? null,
    createdAt: isoString(field(data, 'createdAt', 'created_at')),
    updatedAt: isoString(field(data, 'updatedAt', 'updated_at')),
  };
}

export type NormalizedCalendarSetting = ReturnType<typeof normalizeCalendarSetting>;

async function calendarSettingDocuments(startDate?: string, endDate?: string) {
  let query: Query = getAdminDb().collection('calendar_settings');

  if (startDate) query = query.where('date', '>=', startDate);
  if (endDate) query = query.where('date', '<=', endDate);

  // Range queries avoid scanning all calendar settings for month/day availability.
  const snapshot = await query.get();
  console.log('[FIRESTORE READ]', 'calendarSettingDocuments', 'docs:', snapshot.size);

  return snapshot.docs.map((document) => ({
    reference: document.ref,
    setting: normalizeCalendarSetting(document.id, document.data()),
  }));
}

async function calendarSettingDocumentForDate(date: string) {
  const database = getAdminDb();
  const directSnapshot = await database.collection('calendar_settings').doc(date).get();
  console.log('[FIRESTORE READ]', 'calendarSettingDocumentForDate:direct', 'docs:', directSnapshot.exists ? 1 : 0);

  if (directSnapshot.exists) {
    return {
      reference: directSnapshot.ref,
      setting: normalizeCalendarSetting(
        directSnapshot.id,
        directSnapshot.data() ?? {}
      ),
    };
  }

  // Fallback for migrated data whose document ID is not the date.
  const querySnapshot = await database
    .collection('calendar_settings')
    .where('date', '==', date)
    .limit(1)
    .get();
  console.log('[FIRESTORE READ]', 'calendarSettingDocumentForDate:query', 'docs:', querySnapshot.size);

  const document = querySnapshot.docs[0];
  return document
    ? {
        reference: document.ref,
        setting: normalizeCalendarSetting(document.id, document.data()),
      }
    : null;
}

export async function getFirestoreCalendarSetting(date: string) {
  const document = await calendarSettingDocumentForDate(date);
  return document?.setting ?? {
    date,
    maxCapacity: DEFAULT_CALENDAR_CAPACITY,
    startTime: DEFAULT_CALENDAR_START_TIME,
    isOpen: true,
  };
}

export async function getFirestoreCalendarSettings(
  startDate?: string,
  endDate?: string
) {
  const documents = await calendarSettingDocuments(startDate, endDate);
  return documents
    .map(({ setting }) => setting)
    .sort((left, right) => left.date.localeCompare(right.date));
}

export async function upsertFirestoreCalendarSetting(
  date: string,
  settings: CalendarSettingInput,
  updatedBy: string | null
) {
  const database = getAdminDb();
  const existingDocument = await calendarSettingDocumentForDate(date);
  const existingReference = existingDocument?.reference ?? null;
  const reference = existingReference ??
    database.collection('calendar_settings').doc(date);
  const existing = existingDocument?.setting ?? null;
  const data = {
    date,
    maxCapacity: settings.maxCapacity ?? existing?.maxCapacity ??
      DEFAULT_CALENDAR_CAPACITY,
    startTime: settings.startTime ?? existing?.startTime ??
      DEFAULT_CALENDAR_START_TIME,
    isOpen: settings.isOpen ?? existing?.isOpen ?? true,
    updatedBy,
    updatedAt: FieldValue.serverTimestamp(),
    ...(!existing ? { createdAt: FieldValue.serverTimestamp() } : {}),
  };

  await reference.set(data, { merge: true });
  const updatedSnapshot = await reference.get();
  return normalizeCalendarSetting(
    updatedSnapshot.id,
    updatedSnapshot.data() ?? data
  );
}

export async function upsertFirestoreCalendarSettings(
  dates: string[],
  settings: CalendarSettingInput,
  updatedBy: string | null
) {
  if (dates.length === 0) return 0;

  const database = getAdminDb();
  const sortedDates = [...dates].sort();
  const documents = await calendarSettingDocuments(
    sortedDates[0],
    sortedDates[sortedDates.length - 1]
  );
  const byDate = new Map(
    documents.map((document) => [document.setting.date, document])
  );

  for (let offset = 0; offset < dates.length; offset += 500) {
    const batch = database.batch();

    for (const date of dates.slice(offset, offset + 500)) {
      const existingDocument = byDate.get(date);
      const reference = existingDocument?.reference ??
        database.collection('calendar_settings').doc(date);
      const existing = existingDocument?.setting;

      batch.set(
        reference,
        {
          date,
          maxCapacity: settings.maxCapacity ?? existing?.maxCapacity ??
            DEFAULT_CALENDAR_CAPACITY,
          startTime: settings.startTime ?? existing?.startTime ??
            DEFAULT_CALENDAR_START_TIME,
          isOpen: settings.isOpen ?? existing?.isOpen ?? true,
          updatedBy,
          updatedAt: FieldValue.serverTimestamp(),
          ...(!existing ? { createdAt: FieldValue.serverTimestamp() } : {}),
        },
        { merge: true }
      );
    }

    await batch.commit();
  }

  return dates.length;
}

export async function updateFirestoreCalendarSettings(
  references: DocumentReference[],
  settings: CalendarSettingInput,
  updatedBy: string | null
) {
  if (references.length === 0) return 0;

  const database = getAdminDb();
  const updates = {
    ...settings,
    updatedBy,
    updatedAt: FieldValue.serverTimestamp(),
  };

  for (let offset = 0; offset < references.length; offset += 500) {
    const batch = database.batch();
    for (const reference of references.slice(offset, offset + 500)) {
      batch.set(reference, updates, { merge: true });
    }
    await batch.commit();
  }

  return references.length;
}

export async function getFutureCalendarSettingReferences(startDate: string) {
  const documents = await calendarSettingDocuments(startDate);
  return documents
    .map(({ reference }) => reference);
}

export async function deletePastCalendarSettings(today: string) {
  const database = getAdminDb();
  const documents = await calendarSettingDocuments(undefined, today);
  const references = documents
    .filter(({ setting }) => setting.date && setting.date < today)
    .map(({ reference }) => reference);

  for (let offset = 0; offset < references.length; offset += 500) {
    const batch = database.batch();
    for (const reference of references.slice(offset, offset + 500)) {
      batch.delete(reference);
    }
    await batch.commit();
  }

  return references.length;
}
