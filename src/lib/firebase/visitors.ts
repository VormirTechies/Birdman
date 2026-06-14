import type { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

type FirestoreValue = {
  toDate?: () => Date;
  id?: string;
  path?: string;
};

function firstDefined(data: DocumentData, keys: string[]) {
  for (const key of keys) {
    if (data[key] !== undefined && data[key] !== null) {
      return data[key];
    }
  }

  return undefined;
}

export function toIsoString(value: unknown): string | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toISOString();
  }

  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as FirestoreValue).toDate === 'function'
  ) {
    return (value as FirestoreValue).toDate?.().toISOString() ?? null;
  }

  return null;
}

function toDateString(value: unknown): string | null {
  if (typeof value === 'string') return value;
  const isoString = toIsoString(value);
  return isoString ? isoString.slice(0, 10) : null;
}

function serializeFirestoreValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return toIsoString(value);

  if (Array.isArray(value)) {
    return value.map(serializeFirestoreValue);
  }

  if (typeof value === 'object') {
    const firestoreValue = value as FirestoreValue;

    if (typeof firestoreValue.toDate === 'function') {
      return toIsoString(value);
    }

    if (typeof firestoreValue.path === 'string') {
      return firestoreValue.path;
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        serializeFirestoreValue(entry),
      ])
    );
  }

  return value;
}

function serializeDocument(data: DocumentData): DocumentData {
  return serializeFirestoreValue(data) as DocumentData;
}

function toNumber(value: unknown, fallback = 0) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  if (typeof value === 'number') return value === 1;
  return false;
}

export function normalizePhone(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

export function normalizeVisitor(
  id: string,
  data: DocumentData
) {
  const name = firstDefined(data, ['name', 'visitorName', 'visitor_name']);
  const isVip = firstDefined(data, ['isVip', 'vip', 'is_vip']);

  return {
    ...serializeDocument(data),
    id,
    name: String(name ?? ''),
    phone: data.phone ? String(data.phone) : null,
    email: data.email ? String(data.email) : null,
    isVip: toBoolean(isVip),
    vipNotes: firstDefined(data, ['vipNotes', 'vip_notes']) ?? null,
    totalVisits: toNumber(firstDefined(data, ['totalVisits', 'total_visits'])),
    firstVisitDate: toDateString(firstDefined(data, ['firstVisitDate', 'first_visit_date'])),
    lastVisitDate: toDateString(firstDefined(data, ['lastVisitDate', 'last_visit_date'])),
    createdAt: toIsoString(firstDefined(data, ['createdAt', 'created_at'])),
    updatedAt: toIsoString(firstDefined(data, ['updatedAt', 'updated_at'])),
  };
}

export type NormalizedVisitor = ReturnType<typeof normalizeVisitor>;

export function normalizeCheckin(
  snapshot: QueryDocumentSnapshot<DocumentData>
) {
  const data = snapshot.data();
  const bookingDate = firstDefined(data, ['bookingDate', 'booking_date']);
  const bookingTime = firstDefined(data, ['bookingTime', 'booking_time']);

  return {
    ...serializeDocument(data),
    id: snapshot.id,
    bookingDate: toDateString(bookingDate),
    bookingTime: bookingTime ? String(bookingTime) : null,
    numberOfGuests: toNumber(
      firstDefined(data, ['numberOfGuests', 'number_of_guests']),
      toNumber(data.adults) + toNumber(data.children)
    ),
    adults: toNumber(data.adults),
    children: toNumber(data.children),
    status: data.status ? String(data.status) : null,
    visited: toBoolean(data.visited),
    createdAt: toIsoString(firstDefined(data, ['createdAt', 'created_at'])),
    updatedAt: toIsoString(firstDefined(data, ['updatedAt', 'updated_at'])),
  };
}

export function checkinBelongsToVisitor(data: DocumentData, visitorId: string) {
  const value = firstDefined(data, ['visitorId', 'visitor_id']);

  if (typeof value === 'string') return value === visitorId;
  if (typeof value === 'object' && value !== null) {
    return (value as FirestoreValue).id === visitorId;
  }

  return false;
}
