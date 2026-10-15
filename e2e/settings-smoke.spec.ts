import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { calendarScopeDates, resolveCalendarScope } from '../src/lib/calendar-settings-request';
import { indiaCalendarDate } from '../src/lib/firebase/booking-capacity';

test.skip(process.env.RUN_SETTINGS_SMOKE_TESTS !== 'true', 'Explicit local-only opt-in required');
test('settings browser → API → emulator preserves selected fields and exact scope', async ({ page, request }, testInfo) => {
  const databaseId = process.env.SETTINGS_SMOKE_DATABASE_ID ?? '';
  expect(databaseId).toMatch(/^settings-smoke-\d+$/);
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:7003';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:7002';
  const app = initializeApp({ projectId: 'birdman-7e745' }, `settings-${randomUUID()}`);
  const db = getFirestore(app, databaseId);
  const auth = getAuth(app);
  const uidPrefix = `settings-smoke-${randomUUID()}`;
  const password = `SmokeOnly${randomUUID()}A1!`;
  const users: string[] = [];
  let ownsDatabase = false;
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  const today = indiaCalendarDate(new Date());
  const scope = resolveCalendarScope({ applyMode: 'all_days', settings: { maxCapacity: 80 } }, today);
  const dates = calendarScopeDates(scope);
  const outside = calendarScopeDates({ startDate: scope.endDate, endDate: new Date(Date.parse(`${scope.endDate}T00:00:00Z`) + 86400000).toISOString().slice(0, 10) })[1];
  const insideBooking = `${uidPrefix}-inside`;
  const outsideBooking = `${uidPrefix}-outside`;
  try {
    expect(await db.listCollections(), 'The smoke database must be new and empty').toHaveLength(0);
    ownsDatabase = true;
    const admin = await auth.createUser({ email: `${uidPrefix}@birdman.local`, password }); users.push(admin.uid);
    const nonAdmin = await auth.createUser({ email: `${uidPrefix}-user@birdman.local`, password }); users.push(nonAdmin.uid);
    await db.collection('adminUsers').doc(admin.uid).set({ role: 'admin', displayName: 'Settings smoke administrator' });
    const signIn = async (email: string) => {
      const result = await request.post('http://127.0.0.1:7002/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=local-test',
        { data: { email, password, returnSecureToken: true } });
      expect(result.status()).toBe(200); return (await result.json()).idToken as string;
    };
    const token = await signIn(admin.email!);
    const nonAdminToken = await signIn(nonAdmin.email!);
    const headers = { Authorization: `Bearer ${token}` };
    const localConfig = await request.get('/api/admin/notifications/devices', { headers });
    expect(localConfig.status()).toBe(200);
    expect((await localConfig.json()).mode, 'Never send real push notifications').toBe('mock');

    const baseline = { maxCapacity: 120, startTime: '18:00:00', isOpen: true };
    await db.collection('calendar_settings').doc(today).set({ date: today, ...baseline, isOpen: false });
    await db.collection('calendar_settings').doc(dates[1]).set({ date: dates[1], ...baseline });
    await db.collection('calendar_settings').doc(outside).set({ date: outside, ...baseline });
    const booking = (bookingDate: string, bookingNumber: number) => ({ bookingDate, bookingNumber,
      visitorName: 'Smoke visitor', email: null, phone: '+919000000001', adults: 2, children: 0, numberOfGuests: 2,
      bookingTime: '18:00:00', status: 'confirmed', visited: false, createdAt: Timestamp.now(), updatedAt: Timestamp.now() });
    await db.collection('bookings').doc(insideBooking).set(booking(dates[1], 1));
    await db.collection('bookings').doc(outsideBooking).set(booking(outside, 2));
    for (const date of [dates[1], outside]) await db.collection('bookingDays').doc(date).set({ confirmedGuests: 2 });

    await page.goto('/admin/login');
    await page.getByLabel('Email Address').fill(admin.email!);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Log In', exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto('/admin/settings');
    await expect(page.getByRole('heading', { name: 'Calendar Settings' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('settings-desktop.png'), fullPage: true });
    await expect(page.getByLabel('Change capacity')).not.toBeChecked();
    await page.getByRole('button', { name: 'Preview Changes', exact: true }).click();
    await expect(page.getByText('Select at least one setting to change', { exact: true })).toBeVisible();
    await page.getByLabel('Change capacity').check();
    await page.getByLabel('Maximum Capacity').fill('80');
    const previewResponse = page.waitForResponse(response => response.url().endsWith('/api/admin/settings/preview'));
    await page.getByRole('button', { name: 'Preview Changes', exact: true }).click();
    const previewResult = await previewResponse;
    expect(previewResult.status()).toBe(200);
    const previewData = await previewResult.json();
    expect(previewData).toMatchObject({ scope, affectedDatesCount: 181, existingBookingsCount: 1 });
    expect(previewResult.request().postDataJSON().settings).toEqual({ maxCapacity: 80 });
    await expect(page.getByLabel('Change capacity')).toBeDisabled();
    await expect(page.getByRole('dialog', { name: 'Preview Changes' })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath('settings-review.png') });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Preview Changes', exact: true })).toBeFocused();
    const reopenedPreview = page.waitForResponse(response => response.url().endsWith('/api/admin/settings/preview'));
    await page.getByRole('button', { name: 'Preview Changes', exact: true }).click();
    expect((await reopenedPreview).status()).toBe(200);
    const appliedResponse = page.waitForResponse(response => response.url().endsWith('/api/admin/settings/bulk-update'));
    await page.getByRole('button', { name: 'Confirm & Apply', exact: true }).click();
    const applied = await appliedResponse;
    expect(applied.status()).toBe(200);
    expect(applied.request().postDataJSON()).toMatchObject({ scope, settings: { maxCapacity: 80 } });
    expect(await applied.json()).toMatchObject({ scope, affectedCount: 181, cancelledBookingsCount: 0 });
    await expect(page.getByText('Updated 181 date(s)', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Change capacity')).not.toBeChecked();
    expect((await db.collection('calendar_settings').doc(today).get()).data()).toMatchObject({ ...baseline, maxCapacity: 80, isOpen: false });
    expect((await db.collection('calendar_settings').doc(dates[1]).get()).data()).toMatchObject({ ...baseline, maxCapacity: 80 });
    expect((await db.collection('calendar_settings').doc(dates[2]).get()).data()).toMatchObject({ date: dates[2], maxCapacity: 80 });
    expect((await db.collection('calendar_settings').doc(dates[2]).get()).data()).not.toHaveProperty('startTime');
    expect((await db.collection('calendar_settings').doc(outside).get()).data()).toEqual({ date: outside, ...baseline });
    expect((await db.collection('bookings').doc(insideBooking).get()).data()?.status).toBe('confirmed');

    // A second real browser submission changes time only; unchecked availability
    // must not reopen the already closed date or alter the chosen capacity.
    await page.getByLabel('Change booking availability').check();
    await page.getByLabel('Open for Bookings', { exact: true }).uncheck();
    await page.getByLabel('Change booking availability').uncheck();
    await page.getByLabel('Change visiting time').check();
    await page.getByLabel('Visiting Hour (India time)').fill('15:00:00');
    const timePreview = page.waitForResponse(response => response.url().endsWith('/api/admin/settings/preview'));
    await page.getByRole('button', { name: 'Preview Changes', exact: true }).click();
    expect((await timePreview).request().postDataJSON().settings).toEqual({ startTime: '15:00:00' });
    const timeApply = page.waitForResponse(response => response.url().endsWith('/api/admin/settings/bulk-update'));
    await page.getByRole('button', { name: 'Confirm & Apply', exact: true }).click();
    expect((await timeApply).status()).toBe(200);
    await expect(page.getByLabel('Change visiting time')).not.toBeChecked();
    expect((await db.collection('calendar_settings').doc(today).get()).data()).toMatchObject({ maxCapacity: 80, startTime: '15:00:00', isOpen: false });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByLabel('Change capacity')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath('settings-mobile.png'), fullPage: true,
      style: '[data-sonner-toaster] { visibility: hidden !important; }' });

    // Exercise actual authorization and validation failures, without browser interception.
    const body = { applyMode: 'all_days', settings: { maxCapacity: 80 }, scope };
    expect((await request.post('/api/admin/settings/bulk-update', { data: body })).status()).toBe(401);
    expect((await request.post('/api/admin/settings/bulk-update', { data: body, headers: { Authorization: `Bearer ${nonAdminToken}` } })).status()).toBe(403);
    expect((await request.post('/api/admin/settings/bulk-update', { headers, data: { ...body, scope: { ...scope, endDate: outside } } })).status()).toBe(400);
    expect((await request.post('/api/admin/settings/preview', { headers, data: { ...body, settings: {} } })).status()).toBe(400);

    // Close only the reviewed window. No emails: both fixture bookings have email:null.
    const closed = await request.post('/api/admin/settings/bulk-update', { headers, data: { ...body, settings: { isOpen: false } } });
    expect(closed.status()).toBe(200);
    expect(await closed.json()).toMatchObject({ affectedCount: 181, cancelledBookingsCount: 1, emailsSent: 0 });
    expect((await db.collection('bookings').doc(insideBooking).get()).data()?.status).toBe('cancelled');
    expect((await db.collection('bookingDays').doc(dates[1]).get()).data()?.confirmedGuests).toBe(0);
    expect((await db.collection('bookings').doc(outsideBooking).get()).data()?.status).toBe('confirmed');
    expect((await db.collection('calendar_settings').doc(outside).get()).data()).toEqual({ date: outside, ...baseline });
    expect(pageErrors).toEqual([]);
    console.log('Settings smoke passed: browser/API/Firestore, 181-date scope, selected fields, mobile, auth and cancellation boundary.');
  } finally {
    // This randomly named database was allocated exclusively to this run.
    // Delete exact returned test document references, never the app's databases.
    if (ownsDatabase && /^settings-smoke-\d+$/.test(databaseId)) {
      for (const collection of await db.listCollections()) {
        const snapshot = await collection.get();
        for (const document of snapshot.docs) await document.ref.delete();
      }
    }
    for (const uid of users) await auth.deleteUser(uid);
    await deleteApp(app);
  }
});
