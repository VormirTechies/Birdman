import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
type CsvRow = Record<string, string>;
type BookingData = Record<string, unknown>;
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
  if (new Set(headers).size !== headers.length || headers.some(header => !header)) throw new Error('Invalid or duplicate CSV headers');
  for (const values of records.slice(1)) {
    if (values.some(value => value.trim()) && values.length !== headers.length) throw new Error('CSV row column count differs from header');
  }

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
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error('Invalid nonnegative integer');
  return parsed;
}

function parseBoolean(value: string, fallback = false): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['true', 't', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', 'f', '0', 'no', 'n'].includes(normalized)) return false;
  throw new Error('Invalid boolean');
}

function parseTimestamp(value: string, zone: string): Timestamp {
  if (!value) throw new Error('Missing timestamp');

  const hasTimezone = /(?:z|[+-]\d{2}(?::?\d{2})?)$/i.test(value);
  const normalized = (value.includes('T') ? value : value.replace(' ', 'T'))
    .replace(/(\.\d{3})\d+/, '$1');
  if (!hasTimezone && !/^(Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.test(zone)) throw new Error('Timezone-free timestamps require --timestamp-offset Z or +05:30');
  const parsed = new Date(hasTimezone ? normalized : `${normalized}${zone}`);

  if (Number.isNaN(parsed.getTime())) throw new Error('Invalid timestamp');
  return Timestamp.fromDate(parsed);
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

function normalizeRow(row: CsvRow, zone: string): BookingData {
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
  if (!row.id || !/^[a-zA-Z0-9_-]+$/.test(row.id)) throw new Error('Missing or invalid legacy ID');
  if (!bookingNumber) throw new Error('Missing booking number');
  if (!['confirmed', 'cancelled', 'completed'].includes(row.status)) throw new Error('Invalid status');
  if (adults < 1 || numberOfGuests !== adults + children) throw new Error('Invalid guest totals');
  if (!/^\d{10,15}$/.test(normalizePhone(phone))) throw new Error('Invalid phone');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email');
  if (!phone) throw new Error('Missing phone');
  if (!bookingDate || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
    throw new Error(`Invalid booking date: ${bookingDate || '(empty)'}`);
  }
  if (!bookingTime || !/^\d{2}:\d{2}(?::\d{2})?$/.test(bookingTime)) {
    throw new Error(`Invalid booking time: ${bookingTime || '(empty)'}`);
  }

  const parsedDate = new Date(`${bookingDate}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== bookingDate) throw new Error('Invalid calendar date');
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(bookingTime)) throw new Error('Invalid booking time');
  const data: BookingData = {
    legacyId: row.id,
    legacyMetadata: { category: row.category || null, organisationName: row.organisation_name || row.organization_name || null, visitorId: row.visitor_id || null },
    visitorId: null,
    visitorName,
    visitorNameLowercase: visitorName.toLowerCase(),
    phone,
    phoneNormalized: normalizePhone(phone),
    email: email || null,
    emailLowercase: email || null,
    adults,
    children,
    numberOfGuests: Math.max(0, numberOfGuests),
    bookingDate,
    bookingTime,
    status: firstValue(row, 'status') || 'confirmed',
    visited: parseBoolean(firstValue(row, 'visited')),
    source: 'migration',
    confirmationSent: parseBoolean(firstValue(row, 'confirmationSent', 'confirmation_sent')),
    reminderSent: parseBoolean(firstValue(row, 'reminderSent', 'reminder_sent')),
    reminderSentAt: row.reminder_sent_at ? parseTimestamp(row.reminder_sent_at, zone) : null,
    reminderClaimedAt: null,
    createdAt: parseTimestamp(firstValue(row, 'createdAt', 'created_at'), zone),
    updatedAt: parseTimestamp(firstValue(row, 'updatedAt', 'updated_at'), zone),
    createdBy: null,
    updatedBy: null,
    cancelledAt: null,
    cancelledBy: null,
    isVip: false,
    vipNotes: null,
    schemaVersion: 2,
  };

  if (bookingNumber !== null) {
    const numericBookingNumber = Number.parseInt(bookingNumber, 10);
    data.bookingNumber = numericBookingNumber;
    data.bookingCode = `#${String(numericBookingNumber).padStart(6, '0')}`;
  }

  return data;
}


export function validateBookingCsv(contents: string, zone: string) {
 const rows = parseCsv(contents);
  const normalized: BookingData[] = [];
  const errors: string[] = [];
  const ids = new Set<string>();
  const numbers = new Set<number>();
  rows.forEach((row, index) => {
    try {
      const data = normalizeRow(row, zone);
      if (ids.has(String(data.legacyId)) || numbers.has(Number(data.bookingNumber))) throw new Error('Duplicate ID or booking number within CSV');
      ids.add(String(data.legacyId));
      numbers.add(Number(data.bookingNumber));
      normalized.push(data);
    } catch (error) { errors.push(`Row ${index + 2}: ${error instanceof Error ? error.message : 'Invalid row'}`); }
  });
  if (errors.length) throw new Error(errors.join('\n'));
  if (!normalized.length) throw new Error('CSV contains no bookings');
  const dates = [...new Set(normalized.map(data => String(data.bookingDate)))];

 return { normalized, dates };
}
export async function importBookingCsv(db: Firestore, contents: string, zone: string, target: 'production' | 'emulator', dryRun: boolean) {
 const { normalized, dates } = validateBookingCsv(contents, zone);
    const bookings = db.collection('bookings');
    const counter = db.collection('_counters').doc('bookings');
    return await db.runTransaction(async transaction => {
      const existing = await transaction.get(bookings);
      const counterSnapshot = await transaction.get(counter);
      const inserts: BookingData[] = [];
      let duplicates = 0;
      const conflicts: string[] = [];
      for (const data of normalized) {
        const matches = existing.docs.filter(doc =>
          doc.id === `supabase-${data.legacyId}` || doc.data().legacyId === data.legacyId ||
          normalizeBookingNumber(doc.data().bookingNumber) === String(data.bookingNumber) ||
          (fallbackKey(data) !== null && fallbackKey(doc.data()) === fallbackKey(data)));
        if (!matches.length) { inserts.push(data); continue; }
        const current = matches[0].data();
        const same = matches.length === 1 && [
          'bookingNumber', 'bookingDate', 'status', 'adults', 'children', 'numberOfGuests', 'visited',
          'confirmationSent', 'reminderSent',
        ].every(key => current[key] === data[key]) &&
          normalizeTime(current.bookingTime) === normalizeTime(data.bookingTime) &&
          normalizeEmail(current.email) === normalizeEmail(data.email) &&
          normalizePhone(current.phone) === normalizePhone(data.phone) &&
          String(current.visitorName).trim() === data.visitorName;
        if (same) duplicates++;
        else conflicts.push(`Booking #${data.bookingNumber}: existing record differs; review before importing`);
      }
      if (conflicts.length) throw new Error(conflicts.join('\n'));
      const all = [...existing.docs.map(doc => doc.data()), ...inserts];
      const maxNumber = Math.max(parseInteger(String(counterSnapshot.data()?.value ?? 0)), ...all.map(data => parseInteger(String(data.bookingNumber ?? 0))));
      const dayTotals = dates.map(date => ({
        date,
        confirmedGuests: all.filter(data => data.bookingDate === date && data.status === 'confirmed')
          .reduce((sum, data) => sum + parseInteger(String(data.numberOfGuests)), 0),
      }));
      if (inserts.length + dayTotals.length + 1 > 450) throw new Error('Import exceeds atomic write limit; split into smaller files');
      if (!dryRun) {
        for (const data of inserts) transaction.create(bookings.doc(`supabase-${data.legacyId}`), data);
        for (const day of dayTotals) transaction.set(db.collection('bookingDays').doc(day.date), {
          confirmedGuests: day.confirmedGuests, updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        transaction.set(counter, { value: maxNumber, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      }
      return { target, database: target === 'production' ? 'birdman-db' : '(default)', dryRun, inserts: inserts.length, duplicates, counter: maxNumber, dayTotals };
    });

}

