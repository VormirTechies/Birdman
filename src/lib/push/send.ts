'use client';

/**
 * Sends a web push notification to the current user's subscription.
 * Only works if:
 * - Browser supports push notifications
 * - User has granted permission
 * - Service worker is registered
 * - Push subscription exists
 */
export async function sendPushNotification(notification: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}) {
  try {
    // Check if notifications are supported
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('[Push] Notifications not supported in this browser');
      return false;
    }

    // Check permission
    if (Notification.permission !== 'granted') {
      console.warn('[Push] Notification permission not granted');
      return false;
    }

    // Check service worker
    if (!('serviceWorker' in navigator)) {
      console.warn('[Push] Service workers not supported');
      return false;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.warn('[Push] No push subscription found');
      return false;
    }

    // Send push notification via API
    const response = await fetch('/api/admin/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        notification: {
          title: notification.title,
          body: notification.body,
          url: notification.url || '/admin',
          tag: notification.tag || 'booking-update',
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Push] Failed to send notification:', error);
      return false;
    }

    console.log('✅ Push notification sent successfully');
    return true;
  } catch (error) {
    console.error('[Push] Error sending notification:', error);
    return false;
  }
}

/**
 * Checks if push notifications are available and permission is granted
 */
export function isPushNotificationAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    Notification.permission === 'granted'
  );
}

/**
 * Requests push notification permission from the user
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[Push] Permission result:', permission);
    return permission;
  } catch (error) {
    console.error('[Push] Error requesting permission:', error);
    return 'denied';
  }
}
