// @vitest-environment node
import { beforeAll, afterAll, expect, it, vi } from 'vitest';
import { initializeApp, deleteApp, type App } from 'firebase-admin/app';
import { getFirestore, FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { NotificationDocument } from '@/models/firestore/notification';
const holder = vi.hoisted(() => ({ db: null as unknown as Firestore }));
vi.mock('server-only', () => ({}));
vi.mock('./admin', () => ({ getAdminDb: () => holder.db }));
import { createFirestoreBooking, updateFirestoreBooking, cancelFirestoreBooking, deleteFirestoreBooking } from './bookings';
import { notificationEventId } from './notifications';

const enabled = process.env.RUN_NOTIFICATION_EMULATOR_TESTS === 'true';
let app: App;
const input = { visitorName: 'Private Visitor', phone: '9876543210', email: 'private@example.com', adults: 1, children: 0,
  bookingDate: '2099-11-01', bookingTime: '16:30:00' };
const options = { source: 'admin' as const, actorUid: 'test-admin', enforceCutoff: false };
beforeAll(() => {
  if (!enabled) return;
  vi.stubEnv('FIRESTORE_EMULATOR_HOST', '127.0.0.1:7003');
  app = initializeApp({ projectId: `demo-birdman-booking-notifications-${Date.now()}` }, `booking-notifications-${Date.now()}`);
  holder.db = getFirestore(app, app.name);
});
afterAll(async () => { if (enabled) { await deleteApp(app); vi.unstubAllEnvs(); } });
async function setting(date: string, maxCapacity: number) {
  await holder.db.collection('calendar_settings').doc(date).set({ date, maxCapacity, isOpen: true, startTime: '16:30:00' });
}
async function events(date: string) {
  return (await holder.db.collection('adminNotifications').where('bookingDate', '==', date).get()).docs.map(doc => ({ id: doc.id, ...doc.data() as NotificationDocument }));
}

it.skipIf(!enabled)('queues one confirmed/full pair under concurrent booking and rejects excess without alerts', async () => {
  const date = '2099-11-01'; await setting(date, 1);
  const results = await Promise.allSettled([1, 2].map(() => createFirestoreBooking({ ...input, bookingDate: date }, options)));
  expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  const rows = await events(date);
  expect(rows.map(row => row.type).sort()).toEqual(['booking_confirmed', 'capacity_full']);
  expect((await holder.db.collection('bookingDays').doc(date).get()).data()?.notificationFullRevision).toBe(1);
  for (const row of rows) {
    expect((await holder.db.collection('notificationDeliveryJobs').doc(row.id).get()).data()?.status).toBe('pending');
    expect(JSON.stringify(row)).not.toMatch(/private@example.com|Private Visitor|9876543210/);
  }
});

it.skipIf(!enabled)('deduplicates no-op/cancel retries and alerts on a later refill', async () => {
  const date = '2099-11-02'; await setting(date, 2);
  const booking = await createFirestoreBooking({ ...input, bookingDate: date, adults: 2 }, options);
  await updateFirestoreBooking(booking.id, { adults: 2 }, { enforceCutoff: false });
  expect((await events(date)).length).toBe(2);
  await cancelFirestoreBooking(booking.id); await cancelFirestoreBooking(booking.id);
  expect((await events(date)).filter(row => row.type === 'booking_cancelled')).toHaveLength(1);
  await updateFirestoreBooking(booking.id, { status: 'confirmed' }, { enforceCutoff: false });
  const rows = await events(date);
  expect(rows.filter(row => row.type === 'capacity_full')).toHaveLength(2);
  expect(rows.filter(row => row.type === 'booking_confirmed')).toHaveLength(2);
  expect((await holder.db.collection('bookings').doc(booking.id).get()).data()?.notificationRevision).toBe(3);
});

it.skipIf(!enabled)('reschedules and fills destination atomically, leaving source capacity available', async () => {
  const source = '2099-11-03', target = '2099-11-04';
  await setting(source, 3); await setting(target, 2);
  const booking = await createFirestoreBooking({ ...input, bookingDate: source }, options);
  await createFirestoreBooking({ ...input, bookingDate: target }, options);
  await updateFirestoreBooking(booking.id, { bookingDate: target }, { enforceCutoff: false });
  const rows = await events(target);
  expect(rows.filter(row => row.type === 'booking_changed')).toHaveLength(1);
  expect(rows.filter(row => row.type === 'capacity_full')).toHaveLength(1);
  expect((await holder.db.collection('bookingDays').doc(source).get()).data()?.confirmedGuests).toBe(0);
  expect((await holder.db.collection('bookingDays').doc(target).get()).data()?.confirmedGuests).toBe(2);
  await updateFirestoreBooking(booking.id, { bookingDate: target }, { enforceCutoff: false });
  expect((await events(target)).length).toBe(rows.length);
});

it.skipIf(!enabled)('queues a change/full pair for guest increases and cancellation on confirmed deletion', async () => {
  const date = '2099-11-05'; await setting(date, 3);
  const booking = await createFirestoreBooking({ ...input, bookingDate: date }, options);
  await updateFirestoreBooking(booking.id, { adults: 2, children: 1 }, { enforceCutoff: false });
  expect((await events(date)).map(row => row.type).sort()).toEqual(['booking_changed', 'booking_confirmed', 'capacity_full']);
  await deleteFirestoreBooking(booking.id);
  expect((await events(date)).filter(row => row.type === 'booking_cancelled')).toHaveLength(1);
  expect((await holder.db.collection('bookings').doc(booking.id).get()).exists).toBe(false);
  expect((await holder.db.collection('bookingDays').doc(date).get()).data()?.confirmedGuests).toBe(0);
});

it.skipIf(!enabled)('does not commit booking/capacity changes when notification staging fails', async () => {
  const date = '2099-11-06'; await setting(date, 3);
  const booking = await createFirestoreBooking({ ...input, bookingDate: date }, options);
  const key = `booking:${booking.id}:2:booking_changed`;
  const id = notificationEventId(key);
  await holder.db.collection('adminNotifications').doc(id).set({ eventKey: key, body: 'Conflicting event' });
  await expect(updateFirestoreBooking(booking.id, { adults: 2 }, { enforceCutoff: false })).rejects.toThrow('collision');
  expect((await holder.db.collection('bookings').doc(booking.id).get()).data()?.adults).toBe(1);
  expect((await holder.db.collection('bookingDays').doc(date).get()).data()?.confirmedGuests).toBe(1);
  expect((await holder.db.collection('notificationDeliveryJobs').doc(id).get()).exists).toBe(false);
});

it.skipIf(!enabled)('supports existing records without revision and suppresses housekeeping alerts', async () => {
  const date = '2099-11-07'; await setting(date, 5);
  const booking = await createFirestoreBooking({ ...input, bookingDate: date }, options);
  await holder.db.collection('bookings').doc(booking.id).set({ notificationRevision: FieldValue.delete() }, { merge: true });
  // Simulate migrated data with no historical notification document.
  const history = await holder.db.collection('adminNotifications').where('bookingDate', '==', date).get();
  for (const row of history.docs) await row.ref.delete();
  await updateFirestoreBooking(booking.id, { email: 'changed@example.com' });
  await updateFirestoreBooking(booking.id, { visited: true });
  expect((await events(date)).map(row => row.type)).toEqual(['booking_changed']);
});

it.skipIf(!enabled)('does not notify for closed dates, contact mismatches or deletion of an already-cancelled booking', async () => {
  const date = '2099-11-08'; await setting(date, 5);
  const booking = await createFirestoreBooking({ ...input, bookingDate: date }, options);
  await expect(updateFirestoreBooking(booking.id, { adults: 2 }, {
    verifiedContact: 'wrong@example.com', verifiedBookingNumber: booking.bookingNumber,
  })).rejects.toThrow('do not match');
  expect((await events(date))).toHaveLength(1);
  await cancelFirestoreBooking(booking.id); await deleteFirestoreBooking(booking.id);
  expect((await events(date)).filter(row => row.type === 'booking_cancelled')).toHaveLength(1);
  await holder.db.collection('calendar_settings').doc(date).update({ isOpen: false });
  await expect(createFirestoreBooking({ ...input, bookingDate: date }, options)).rejects.toThrow('closed');
  expect((await events(date))).toHaveLength(2);
});
