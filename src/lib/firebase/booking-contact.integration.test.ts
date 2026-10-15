// @vitest-environment node
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import { deleteApp, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { createHash } from 'node:crypto';

const holder = vi.hoisted(() => ({ db: null as unknown as Firestore }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/firebase/admin', () => ({ getAdminDb: () => holder.db }));
import { createFirestoreBooking, updateFirestoreBooking, cancelFirestoreBooking } from './bookings';
import { limitBookingAttempts } from './booking-attempt-limit';

const enabled = process.env.RUN_BOOKING_EMULATOR_TESTS === 'true';
let app: App;
beforeAll(() => {
  if (!enabled) return;
  // Always isolated and loopback-only, regardless of the application's live settings.
  vi.stubEnv('FIRESTORE_EMULATOR_HOST', '127.0.0.1:7003');
  app = initializeApp({ projectId: `demo-birdman-contact-${Date.now()}` }, `quota-${Date.now()}`);
  holder.db = getFirestore(app);
});
afterAll(async () => { if (enabled) { await deleteApp(app); vi.unstubAllEnvs(); } });

it.skipIf(!enabled)('enforces the contact quota atomically across create, edit, cancel and reschedule', async () => {
  const input = { visitorName: 'Quota Test', phone: '9876543210', email: 'quota@example.com', adults: 10, children: 0, bookingDate: '2099-08-20', bookingTime: '16:30:00' };
  const options = { source: 'public' as const, enforceCutoff: false };
  const first = await createFirestoreBooking(input, options);
  const second = await createFirestoreBooking(input, options);
  const attempts = await Promise.allSettled([
    createFirestoreBooking({ ...input, adults: 2, children: 1 }, options),
    createFirestoreBooking({ ...input, adults: 2, children: 1 }, options),
  ]);
  expect(attempts.filter(result => result.status === 'fulfilled')).toHaveLength(1);
  expect((await holder.db.collection('bookingDays').doc(input.bookingDate).get()).data()?.confirmedGuests).toBe(23);

  await expect(updateFirestoreBooking(first.id, { adults: 10, children: 1 }, { enforceContactLimit: true })).rejects.toThrow('between 1 and 10');
  await updateFirestoreBooking(first.id, { adults: 5 }, { enforceContactLimit: true, enforceCutoff: false });
  const third = await createFirestoreBooking({ ...input, adults: 7 }, options);
  expect((await holder.db.collection('bookingDays').doc(input.bookingDate).get()).data()?.confirmedGuests).toBe(25);
  await cancelFirestoreBooking(third.id);
  expect((await holder.db.collection('bookingDays').doc(input.bookingDate).get()).data()?.confirmedGuests).toBe(18);

  const destination = '2099-08-21';
  await createFirestoreBooking({ ...input, bookingDate: destination }, options);
  await createFirestoreBooking({ ...input, bookingDate: destination }, options);
  await expect(updateFirestoreBooking(second.id, { bookingDate: destination }, { enforceContactLimit: true, enforceCutoff: false })).rejects.toMatchObject({ code: 'BOOKING_CONTACT_LIMIT' });
  expect((await holder.db.collection('bookings').doc(second.id).get()).data()?.bookingDate).toBe(input.bookingDate);
  await expect(updateFirestoreBooking(first.id, { adults: 4 }, { verifiedContact: 'wrong@example.com', verifiedBookingNumber: first.bookingNumber })).rejects.toThrow('do not match');
  expect((await holder.db.collection('bookings').doc(first.id).get()).data()?.adults).toBe(5);
  await holder.db.collection('calendar_settings').doc('2099-08-22').set({ date: '2099-08-22', maxCapacity: 100, startTime: '16:30:00', isOpen: true });
  const migrated = holder.db.collection('bookings').doc('legacy-contact');
  await migrated.set({ ...input, bookingDate: '2099-08-22', phone: '+91-9876543210', adults: 20, numberOfGuests: 20, status: 'completed' });
  await expect(createFirestoreBooking({ ...input, bookingDate: '2099-08-22', adults: 6, email: 'changed@example.com' }, options)).rejects.toMatchObject({ code: 'BOOKING_CONTACT_LIMIT' });
}, 60000);

it.skipIf(!enabled)('persists attempt limits and resets after the window expires', async () => {
  const request = new Request('http://localhost/api/bookings/self-service', { headers: { 'x-forwarded-for': '192.0.2.8' } });
  for (let i = 0; i < 20; i++) expect(await limitBookingAttempts(request, 'self-service')).toBeNull();
  const blocked = await limitBookingAttempts(request, 'self-service');
  expect(blocked?.status).toBe(429);
  expect(Number(blocked?.headers.get('Retry-After'))).toBeGreaterThan(0);
  const id = createHash('sha256').update('self-service:192.0.2.8').digest('hex');
  await holder.db.collection('_bookingAttemptLimits').doc(id).set({ count: 20 });
  expect(await limitBookingAttempts(request, 'self-service')).toBeNull();
  for (let i = 0; i < 10; i++) expect(await limitBookingAttempts(request, 'create')).toBeNull();
  expect((await limitBookingAttempts(request, 'create'))?.status).toBe(429);
  vi.spyOn(holder.db, 'runTransaction').mockRejectedValueOnce(new Error('Unavailable'));
  expect((await limitBookingAttempts(request, 'self-service'))?.status).toBe(503);
}, 60000);
