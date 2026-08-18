import path from 'node:path';
import {
  applicationDefault,
  cert,
  deleteApp,
  initializeApp,
} from 'firebase-admin/app';
import {
  getFirestore,
  Timestamp,
  type DocumentReference,
} from 'firebase-admin/firestore';
import { config } from 'dotenv';
import {
  calculateBookingReconciliation,
  reconciliationInteger,
} from '../src/lib/firebase/booking-reconciliation';

const PROJECT_ID = 'birdman-7e745';
const PRODUCTION_DATABASE_ID = 'birdman-db';
const DEFAULT_EMULATOR_HOST = '127.0.0.1:7003';

config({ path: path.resolve(process.cwd(), '.env.production') });
config({ path: path.resolve(process.cwd(), '.env.local'), override: false });

const target = process.argv.includes('--production') ? 'production' :
  process.argv.includes('--emulator') ? 'emulator' : null;
const dryRun = process.argv.includes('--dry-run');

function initializeTarget() {
  if (!target) {
    throw new Error('Choose exactly one target: --emulator or --production');
  }
  if (process.argv.includes('--emulator') && process.argv.includes('--production')) {
    throw new Error('Choose only one target');
  }

  if (target === 'emulator') {
    const host = process.env.FIRESTORE_EMULATOR_HOST?.trim() || DEFAULT_EMULATOR_HOST;
    if (!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host)) {
      throw new Error(`Refusing non-local emulator host: ${host}`);
    }
    process.env.FIRESTORE_EMULATOR_HOST = host;
    process.env.GCLOUD_PROJECT = PROJECT_ID;
  } else {
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      throw new Error('Refusing production reconciliation while FIRESTORE_EMULATOR_HOST is set');
    }
    if (!dryRun && !process.argv.includes('--confirm-production')) {
      throw new Error('Production writes require --confirm-production');
    }
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (Boolean(clientEmail) !== Boolean(privateKey)) {
    throw new Error('FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be configured together');
  }
  const credential = clientEmail && privateKey
    ? cert({ projectId: PROJECT_ID, clientEmail, privateKey })
    : applicationDefault();
  const app = initializeApp(
    { projectId: PROJECT_ID, credential },
    `booking-reconciliation-${target}-${Date.now()}`
  );
  const db = target === 'production'
    ? getFirestore(app, PRODUCTION_DATABASE_ID)
    : getFirestore(app);
  return { app, db };
}

async function run() {
  const { app, db } = initializeTarget();
  try {
    const [bookingsSnapshot, daysSnapshot, counterSnapshot] = await Promise.all([
      db.collection('bookings').get(),
      db.collection('bookingDays').get(),
      db.collection('_counters').doc('bookings').get(),
    ]);
    const existingDays = new Map(daysSnapshot.docs.map((document) => [
      document.id,
      reconciliationInteger(
        document.data().confirmedGuests,
        `bookingDays/${document.id}.confirmedGuests`
      ),
    ]));
    const currentCounter = reconciliationInteger(
      counterSnapshot.data()?.value,
      '_counters/bookings.value'
    );
    const { differences, bookingCodeDifferences, desiredCounter } = calculateBookingReconciliation(
      bookingsSnapshot.docs.map((document) => ({
        id: document.id,
        data: document.data(),
      })),
      existingDays,
      currentCounter
    );

    console.log('Booking reconciliation audit', {
      project: PROJECT_ID,
      database: target === 'production' ? PRODUCTION_DATABASE_ID : '(default)',
      target,
      dryRun,
      bookings: bookingsSnapshot.size,
      dayCounters: daysSnapshot.size,
      dayDifferences: differences.length,
      bookingCodeDifferences: bookingCodeDifferences.length,
      currentBookingCounter: currentCounter,
      desiredBookingCounter: desiredCounter,
    });
    if (differences.length > 0) console.table(differences);
    if (bookingCodeDifferences.length > 0) console.table(bookingCodeDifferences);

    if (!dryRun && (
      differences.length > 0 ||
      bookingCodeDifferences.length > 0 ||
      desiredCounter !== currentCounter
    )) {
      const now = Timestamp.now();
      const writes: Array<{
        reference: DocumentReference;
        data: Record<string, unknown>;
      }> = differences.map((difference) => ({
        reference: db.collection('bookingDays').doc(difference.date),
        data: { confirmedGuests: difference.after, updatedAt: now },
      }));
      writes.push(...bookingCodeDifferences.map((difference) => ({
        reference: db.collection('bookings').doc(difference.id),
        data: { bookingCode: difference.after, updatedAt: now },
      })));

      for (let offset = 0; offset < writes.length; offset += 499) {
        const batch = db.batch();
        for (const write of writes.slice(offset, offset + 499)) {
          batch.set(write.reference, write.data, { merge: true });
        }
        await batch.commit();
      }
      await db.collection('_counters').doc('bookings').set(
        { value: desiredCounter, updatedAt: now },
        { merge: true }
      );
    }

    console.log(dryRun ? 'Audit completed without writes.' : 'Booking counters reconciled successfully.');
  } finally {
    await deleteApp(app);
  }
}

run().catch((error) => {
  console.error('Booking reconciliation failed:', error);
  process.exitCode = 1;
});
