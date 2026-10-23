import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

// Never load dotenv or production credentials. No remote target is supported.
if (process.env.FIRESTORE_EMULATOR_HOST && process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:7003') {
  throw new Error('This seed only supports the local emulator at 127.0.0.1:7003');
}
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:7003';
const app = initializeApp({ projectId: 'birdman-7e745' }, 'booking-support-seed');
const db = getFirestore(app);
const today = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
const day = offset => new Date(Date.parse(`${today}T00:00:00Z`) + offset * 86400000).toISOString().slice(0, 10);
const dates = [day(1), day(2), day(3)];
try {
  // Refuse occupied dates rather than deleting or overwriting local work.
  for (const date of dates) {
    const existing = await db.collection('bookings').where('bookingDate', '==', date).limit(1).get();
    const counter = await db.collection('bookingDays').doc(date).get();
    const setting = await db.collection('calendar_settings').doc(date).get();
    if (!existing.empty || counter.exists || setting.exists) {
      throw new Error(`Date ${date} already has local data. Seed aborted without writes; use an empty local database/date range.`);
    }
  }
  const batch = db.batch();
  const now = Timestamp.now();
  let sequence = 900000;
  for (const [index, date] of dates.entries()) {
    batch.create(db.collection('calendar_settings').doc(date), {
      date, maxCapacity: 100, startTime: '16:30:00', isOpen: true,
      createdAt: now, updatedAt: now,
    });
    const total = index === 0 ? 104 : index === 1 ? 97 : 0;
    for (let remaining = total; remaining > 0;) {
      const guests = Math.min(4, remaining);
      remaining -= guests;
      sequence++;
      batch.create(db.collection('bookings').doc(`support-prod001-${sequence}`), {
        schemaVersion: 2, source: 'migration', bookingNumber: sequence,
        bookingCode: `#${String(sequence).padStart(6, '0')}`,
        visitorName: `Support Test Visitor ${sequence}`, phone: '0000000000',
        phoneNormalized: '0000000000', email: null,
        adults: guests > 1 ? guests - 1 : 1, children: guests > 1 ? 1 : 0,
        numberOfGuests: guests, bookingDate: date, bookingTime: '16:30:00',
        status: 'confirmed', visited: false, confirmationSent: true,
        reminderSent: true, reminderSentAt: null, createdAt: now, updatedAt: now,
        createdBy: null, updatedBy: null, cancelledAt: null, cancelledBy: null,
        visitorId: null,
      });
    }
    // First date deliberately has no day counter, reproducing PROD-001.
    if (index > 0) batch.create(db.collection('bookingDays').doc(date), { confirmedGuests: total, updatedAt: now });
  }
  await batch.commit();
  // Do not reset an existing booking-number sequence.
  await db.runTransaction(async tx => {
    const ref = db.collection('_counters').doc('bookings');
    const snapshot = await tx.get(ref);
    tx.set(ref, { value: Math.max(Number(snapshot.get('value') ?? 0), sequence), updatedAt: now }, { merge: true });
  });
  console.log(JSON.stringify({ target: 'emulator', database: '(default)', cases: [
    { date: dates[0], guests: 104, remaining: 0, counter: 'missing deliberately' },
    { date: dates[1], guests: 97, remaining: 3 },
    { date: dates[2], guests: 0, remaining: 100 },
  ] }, null, 2));
} finally {
  await deleteApp(app);
}
