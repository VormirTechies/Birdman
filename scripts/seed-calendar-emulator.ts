import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const PROJECT_ID = 'birdman-7e745';
const DATABASE_ID = '(default)';
const DEFAULT_EMULATOR_HOST = '127.0.0.1:7003';
const DAYS_TO_SEED = 31;
const SEED_SOURCE = 'calendar-emulator-seed';
const START_TIME = '16:30:00';

interface Scenario {
  name: string;
  maxCapacity: number;
  confirmedGuests: number;
  isOpen: boolean;
}

const SCENARIOS: Scenario[] = [
  { name: 'available', maxCapacity: 100, confirmedGuests: 12, isOpen: true },
  { name: 'available', maxCapacity: 100, confirmedGuests: 28, isOpen: true },
  { name: 'filling-up', maxCapacity: 100, confirmedGuests: 55, isOpen: true },
  { name: 'limited', maxCapacity: 100, confirmedGuests: 88, isOpen: true },
  { name: 'last-3-seats', maxCapacity: 100, confirmedGuests: 97, isOpen: true },
  { name: 'full', maxCapacity: 100, confirmedGuests: 100, isOpen: true },
  { name: 'closed', maxCapacity: 100, confirmedGuests: 0, isOpen: false },
  { name: 'custom-capacity', maxCapacity: 50, confirmedGuests: 35, isOpen: true },
];

function getEmulatorHost() {
  const host = process.env.FIRESTORE_EMULATOR_HOST?.trim() || DEFAULT_EMULATOR_HOST;
  if (!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host)) {
    throw new Error(`Refusing to seed non-local Firestore host: ${host}`);
  }
  return host;
}

function indiaDate(offset: number) {
  const date = new Date(Date.now() + offset * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

async function run() {
  const emulatorHost = getEmulatorHost();
  process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
  process.env.FIRESTORE_DATABASE_ID = DATABASE_ID;
  process.env.GCLOUD_PROJECT = PROJECT_ID;
  process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;

  const app = initializeApp(
    { projectId: PROJECT_ID },
    `calendar-emulator-seed-${Date.now()}`
  );
  const db = getFirestore(app);
  const calendarCollection = db.collection('calendar_settings');
  const dayCollection = db.collection('bookingDays');

  try {
    const [calendarSnapshot, daySnapshot] = await Promise.all([
      calendarCollection.get(),
      dayCollection.get(),
    ]);
    const existingCalendar = new Map(
      calendarSnapshot.docs.map((document) => [document.id, document.data()])
    );
    const existingDays = new Map(
      daySnapshot.docs.map((document) => [document.id, document.data()])
    );
    const batch = db.batch();
    const now = Timestamp.now();
    const summary = {
      calendarCreated: 0,
      calendarUpdated: 0,
      calendarSkipped: 0,
      countersCreated: 0,
      countersUpdated: 0,
      countersSkipped: 0,
    };
    const preview: Array<Record<string, unknown>> = [];

    for (let offset = 0; offset < DAYS_TO_SEED; offset += 1) {
      const date = indiaDate(offset);
      const scenario = SCENARIOS[offset % SCENARIOS.length];
      const calendarReference = calendarCollection.doc(date);
      const dayReference = dayCollection.doc(date);
      const calendarData = existingCalendar.get(date);
      const dayData = existingDays.get(date);
      const hasNonSeedData =
        (!!calendarData && calendarData.seedSource !== SEED_SOURCE) ||
        (!!dayData && dayData.seedSource !== SEED_SOURCE);

      if (hasNonSeedData) {
        summary.calendarSkipped += 1;
        summary.countersSkipped += 1;
        preview.push({
          date,
          scenario: 'preserved-existing-data',
          capacity: calendarData?.maxCapacity ?? 100,
          booked: dayData?.confirmedGuests ?? 0,
          available: 'unchanged',
          open: calendarData?.isOpen ?? true,
        });
        continue;
      }

      batch.set(calendarReference, {
        date,
        maxCapacity: scenario.maxCapacity,
        startTime: START_TIME,
        isOpen: scenario.isOpen,
        updatedBy: SEED_SOURCE,
        seedSource: SEED_SOURCE,
        seedScenario: scenario.name,
        updatedAt: now,
        ...(!calendarData ? { createdAt: now } : {}),
      }, { merge: true });
      if (calendarData) summary.calendarUpdated += 1;
      else summary.calendarCreated += 1;

      batch.set(dayReference, {
        confirmedGuests: scenario.confirmedGuests,
        seedSource: SEED_SOURCE,
        seedScenario: scenario.name,
        updatedAt: now,
        ...(!dayData ? { createdAt: now } : {}),
      }, { merge: true });
      if (dayData) summary.countersUpdated += 1;
      else summary.countersCreated += 1;

      preview.push({
        date,
        scenario: scenario.name,
        capacity: scenario.maxCapacity,
        booked: scenario.confirmedGuests,
        available: Math.max(0, scenario.maxCapacity - scenario.confirmedGuests),
        open: scenario.isOpen,
      });
    }

    await batch.commit();

    console.log('Local calendar availability seeded successfully.', {
      project: PROJECT_ID,
      database: DATABASE_ID,
      emulatorHost,
      days: DAYS_TO_SEED,
      ...summary,
    });
    console.table(preview);
    if (summary.calendarSkipped > 0 || summary.countersSkipped > 0) {
      console.log('Existing non-seed documents were preserved and reported as skipped.');
    }
  } finally {
    await deleteApp(app);
  }
}

run().catch((error) => {
  console.error('Failed to seed local calendar availability:', error);
  process.exitCode = 1;
});
