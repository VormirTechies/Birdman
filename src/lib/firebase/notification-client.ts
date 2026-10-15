'use client';
import { getApp } from 'firebase/app';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase';
import { authenticatedFetch } from './authenticated-fetch';

export interface DeviceConfig { mode: 'mock' | 'fcm'; vapidKey: string | null; configured: boolean }
const preferenceKey = 'birdman-notification-owner';
let active: { uid: string; token: string; mode: 'mock' | 'fcm' } | null = null;
let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const task = queue.then(fn, fn);
  queue = task.catch(() => {});
  return task;
}

export async function getNotificationDeviceConfig(): Promise<DeviceConfig> {
  const response = await authenticatedFetch('/api/admin/notifications/devices', { cache: 'no-store' });
  if (!response.ok) throw new Error('Notification setup is unavailable. Please try again.');
  return response.json();
}

export function notificationsEnabledForCurrentUser() {
  return Boolean(auth.currentUser && localStorage.getItem(preferenceKey) === auth.currentUser.uid);
}

export async function browserPushSupported() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator
    && window.isSecureContext && await (await import('firebase/messaging')).isSupported();
}

async function verifyMessagingWorker(registration: ServiceWorkerRegistration) {
  const updating = registration.installing || registration.waiting;
  if (updating && updating.state !== 'activated') {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => { updating.removeEventListener('statechange', changed); reject(new Error('Notification worker update timed out. Please retry.')); }, 10_000);
      function changed() {
        if (updating!.state === 'activated' || updating!.state === 'redundant') {
          clearTimeout(timeout); updating!.removeEventListener('statechange', changed); resolve();
        }
      }
      updating.addEventListener('statechange', changed);
    });
  }
  await new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel();
    const close = () => { channel.port1.close(); channel.port2.close(); };
    const timeout = setTimeout(() => { close(); reject(new Error('Notification worker is unavailable. Refresh and try again.')); }, 5000);
    channel.port1.onmessage = event => {
      clearTimeout(timeout); close();
      if (event.data?.ready) resolve();
      else reject(new Error('Firebase notification worker could not initialize. Please retry.'));
    };
    registration.active?.postMessage({ type: 'BIRDMAN_FCM_STATUS' }, [channel.port2]);
  });
}

export function enableAdminNotifications(config: DeviceConfig, requestPermission = true) {
  return serialized(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('Please sign in again.');
    if (!config.configured) throw new Error('Notifications are not configured yet.');
    if (!requestPermission && !notificationsEnabledForCurrentUser()) return false;
    if (config.mode === 'fcm') {
      if (!('Notification' in window) || !('serviceWorker' in navigator) || !window.isSecureContext) {
        throw new Error('Push notifications are not supported in this browser.');
      }
      // Request within the click gesture, before loading SDK code or doing network I/O.
      const permission = requestPermission && Notification.permission === 'default'
        ? await Notification.requestPermission() : Notification.permission;
      if (permission !== 'granted') throw new Error('Notifications are blocked. Allow them in your browser site settings.');
      if (!await browserPushSupported()) throw new Error('Push notifications are not supported in this browser.');
    }
    if (auth.currentUser?.uid !== uid) throw new Error('Your session changed. Please try again.');
    let token: string;
    if (config.mode === 'mock') {
      token = active?.uid === uid && active.mode === 'mock' ? active.token
        : sessionStorage.getItem('birdman-mock-notification-token') || `mock:${crypto.randomUUID()}`;
      sessionStorage.setItem('birdman-mock-notification-token', token);
    } else {
      const { getMessaging, getToken } = await import('firebase/messaging');
      const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      await navigator.serviceWorker.ready;
      await registration.update();
      await verifyMessagingWorker(registration);
      token = await getToken(getMessaging(getApp()), {
        vapidKey: config.vapidKey!, serviceWorkerRegistration: registration,
      });
    }
    if (!token || auth.currentUser?.uid !== uid) throw new Error('Device registration could not be completed.');
    const response = await authenticatedFetch('/api/admin/notifications/devices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }),
    });
    if (!response.ok) {
      if (config.mode === 'fcm') {
        const { deleteToken, getMessaging } = await import('firebase/messaging');
        await deleteToken(getMessaging(getApp())).catch(() => {});
      }
      throw new Error(response.status === 409 ? 'This browser is registered to another account. Sign out there first.'
        : 'Device registration failed. Please try again.');
    }
    active = { uid, token, mode: config.mode };
    localStorage.setItem(preferenceKey, uid);
    window.dispatchEvent(new Event('birdman-notification-preference'));
    return true;
  });
}

async function removeDevice() {
  const owner = localStorage.getItem(preferenceKey);
  const mockToken = sessionStorage.getItem('birdman-mock-notification-token');
  const registration = active || (mockToken && owner === auth.currentUser?.uid
    ? { uid: owner, token: mockToken, mode: 'mock' as const } : null);
  let removed = !registration && !owner;
  if (registration && auth.currentUser?.uid === registration.uid) {
    try {
      const response = await authenticatedFetch('/api/admin/notifications/devices', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: registration.token }),
      });
      removed = response.ok;
    } catch { removed = false; }
  }
  // Delete the actual browser registration too, even if server cleanup fails.
  let revoked = registration?.mode === 'mock';
  if (!revoked && (registration || owner) && typeof window !== 'undefined' && await browserPushSupported()) {
    try {
      const { deleteToken, getMessaging } = await import('firebase/messaging');
      revoked = await deleteToken(getMessaging(getApp()));
    } catch { revoked = false; }
  }
  if (!removed && !revoked) throw new Error('Unable to disable notifications. Check your connection and try again.');
  active = null;
  localStorage.removeItem(preferenceKey);
  sessionStorage.removeItem('birdman-mock-notification-token');
  window.dispatchEvent(new Event('birdman-notification-preference'));
}

export const disableAdminNotifications = () => serialized(removeDevice);
export const signOutAdmin = () => serialized(async () => {
  await removeDevice();
  await signOut(auth);
});
