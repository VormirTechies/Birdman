interface NotificationEnvironment {
  NODE_ENV?: string;
  FIRESTORE_EMULATOR_HOST?: string;
  FIREBASE_USE_LIVE?: string;
  NOTIFICATIONS_DELIVERY_MODE?: string;
  NEXT_PUBLIC_FIREBASE_FCM_VAPID_KEY?: string;
}

export function resolveNotificationConfig(environment: NotificationEnvironment = process.env) {
  const local = environment.NODE_ENV !== 'production' && environment.FIREBASE_USE_LIVE !== 'true';
  const mode = environment.NOTIFICATIONS_DELIVERY_MODE?.trim() || (local ? 'mock' : 'fcm');
  if (mode !== 'mock' && mode !== 'fcm') throw new Error('Invalid notification delivery mode');
  if (!local && (mode === 'mock' || environment.FIRESTORE_EMULATOR_HOST)) {
    throw new Error('Live notifications cannot use mock delivery or the Firestore emulator');
  }
  if (local && mode === 'fcm') throw new Error('Local notification development must use mock delivery');
  const vapidKey = environment.NEXT_PUBLIC_FIREBASE_FCM_VAPID_KEY?.trim() || null;
  if (vapidKey && !/^[A-Za-z0-9_-]{87}$/.test(vapidKey)) {
    throw new Error('Invalid Firebase FCM public VAPID key');
  }
  return { mode, vapidKey, configured: mode === 'mock' || Boolean(vapidKey) } as const;
}
