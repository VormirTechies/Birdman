import { test, expect } from '@playwright/test';
import { randomUUID, createHash } from 'node:crypto';
import { initializeApp, deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

test.skip(process.env.RUN_NOTIFICATION_BROWSER_TESTS !== 'true', 'Explicit local-only opt-in required');
test('admin bell uses the local API, persists read/dismiss and paginates without auto-clearing', async ({ page, request }) => {
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:7003';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:7002';
  const projectId = 'birdman-7e745'; const prefix = `notification-browser-${randomUUID()}`;
  const app = initializeApp({ projectId }, prefix); const db = getFirestore(app, 'notifications-browser-test'); const auth = getAuth(app);
  const email = `${prefix}@birdman.local`; const password = `BrowserOnly${randomUUID()}A1!`;
  const created = await auth.createUser({ email, password }); const ids: string[] = [];
  let ownDeviceId: string | undefined;
  try {
    await db.collection('adminUsers').doc(created.uid).set({ role: 'admin', displayName: 'Notification browser test' });
    const signIn = await request.post('http://127.0.0.1:7002/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=local-test',
      { data: { email, password, returnSecureToken: true } });
    expect(signIn.ok()).toBe(true); const token = (await signIn.json()).idToken;
    const config = await request.get('/api/admin/notifications/devices', { headers: { Authorization: `Bearer ${token}` } });
    expect(config.status(), 'The running app must use the local Auth/default Firestore emulators').toBe(200);
    expect((await config.json()).mode, 'Never run this browser test against live FCM').toBe('mock');
    for (let i = 0; i < 22; i++) {
      const id = createHash('sha256').update(`${prefix}:${i}`).digest('hex'); ids.push(id);
      await db.collection('adminNotifications').doc(id).set({ eventKey: `${prefix}:${i}`, type: 'booking_confirmed',
        bookingId: null, bookingDate: '2099-11-01', title: `${prefix} ${i}`, body: 'A booking was confirmed. Open the dashboard for details.',
        url: '/admin', createdAt: Timestamp.fromMillis(Date.now() + 2000 + i), expiresAt: Timestamp.fromMillis(Date.now() + 86400000) });
    }
    await page.goto('/admin/login');
    await page.getByLabel('Email Address').fill(email); await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Log In', exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    const permissionBefore = await page.evaluate(() => 'Notification' in window ? Notification.permission : 'unsupported');
    const registration = page.waitForResponse(response => response.url().endsWith('/api/admin/notifications/devices') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Register test device', exact: true }).click();
    expect((await registration).status()).toBe(201);
    const mockToken = await page.evaluate(() => sessionStorage.getItem('birdman-mock-notification-token'));
    expect(mockToken).toMatch(/^mock:/);
    if (!mockToken) throw new Error('Mock registration was not saved');
    ownDeviceId = createHash('sha256').update(mockToken).digest('hex');
    const device = await db.collection('adminNotificationDevices').doc(ownDeviceId).get();
    expect(device.exists).toBe(true);
    expect(device.data()?.uid).toBe(created.uid);
    expect(device.data()?.expiresAt).toBeInstanceOf(Timestamp);
    expect(await page.evaluate(() => 'Notification' in window ? Notification.permission : 'unsupported')).toBe(permissionBefore);
    await expect(page.getByRole('button', { name: 'Disable notifications', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Notifications', exact: true }).click();
    const inbox = page.getByRole('region', { name: 'Admin notification inbox' });
    await expect(inbox.getByRole('heading', { name: new RegExp(`${prefix} 21`) })).toBeVisible();
    await expect(inbox.locator('article')).toHaveCount(20);
    const newest = inbox.locator('article').filter({ has: page.getByRole('heading', { name: new RegExp(`${prefix} 21`) }) });
    await expect(newest.getByText('(Unread)', { exact: true })).toBeAttached();
    const read = page.waitForResponse(response => response.url().endsWith('/api/admin/notifications') && response.request().method() === 'PATCH');
    await newest.getByRole('button', { name: 'Mark read', exact: true }).click(); expect((await read).status()).toBe(200);
    await expect(newest.getByRole('button', { name: 'Mark read', exact: true })).toHaveCount(0);
    await page.reload(); await page.getByRole('button', { name: 'Notifications', exact: true }).click();
    await expect(newest.getByRole('heading')).toBeVisible(); await expect(newest.getByRole('button', { name: 'Mark read', exact: true })).toHaveCount(0);
    await inbox.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(inbox.getByRole('heading', { name: new RegExp(`${prefix} 1(?: \\(Unread\\))?$`) })).toBeVisible();
    await inbox.getByRole('button', { name: 'Previous', exact: true }).click(); await expect(newest.getByRole('heading')).toBeVisible();
    await newest.getByRole('button', { name: 'Dismiss', exact: true }).click(); await expect(newest).toHaveCount(0);
    await page.reload(); await page.getByRole('button', { name: 'Notifications', exact: true }).click();
    await expect(inbox.getByRole('heading', { name: new RegExp(`${prefix} 20`) })).toBeVisible(); await expect(newest).toHaveCount(0);
    await page.screenshot({ path: 'test-results/notifications-inbox.png' });
    await page.setViewportSize({ width: 390, height: 844 });
    const bounds = await inbox.boundingBox();
    expect(bounds).not.toBeNull(); expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    await page.screenshot({ path: 'test-results/notifications-inbox-mobile.png' });
    await page.keyboard.press('Escape');
    await expect(inbox).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Notifications', exact: true })).toBeFocused();
    const removal = page.waitForResponse(response => response.url().endsWith('/api/admin/notifications/devices') && response.request().method() === 'DELETE');
    await page.getByRole('button', { name: 'Disable notifications', exact: true }).click(); expect((await removal).status()).toBe(200);
    if (ownDeviceId) expect((await db.collection('adminNotificationDevices').doc(ownDeviceId).get()).exists).toBe(false);
    await expect(page.getByRole('button', { name: 'Register test device', exact: true })).toBeVisible();
  } finally {
    // Exact fixture IDs/UID only. Never clear the app database or another administrator's records.
    await Promise.all(ids.map(id => db.collection('adminNotifications').doc(id).delete()));
    const states = await db.collection('adminNotificationStates').where('uid', '==', created.uid).get();
    for (const state of states.docs) await state.ref.delete();
    const devices = await db.collection('adminNotificationDevices').where('uid', '==', created.uid).get();
    for (const device of devices.docs) await device.ref.delete();
    await db.collection('adminUsers').doc(created.uid).delete(); await auth.deleteUser(created.uid); await deleteApp(app);
  }
});
