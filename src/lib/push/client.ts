/**
 * Sanctuary Push Client - Modular implementation
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.replace(/['"]/g, '').trim();

/**
 * Converts a VAPID public key to a Uint8Array for the pushManager.
 */
export function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Registers the Service Worker and returns the registration object.
 */
export async function getRegistration() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        throw new Error('Service Workers not supported in this environment.');
    }

    try {
        await navigator.serviceWorker.register('/sw.js');
        return await navigator.serviceWorker.ready;
    } catch (error) {
        console.error('[Push Client] SW Registration Failed:', error);
        throw error;
    }
}

/**
 * Robustly retrieves or creates a push subscription.
 */
export async function subscribeUser() {
    if (!VAPID_PUBLIC_KEY) throw new Error('VAPID Public Key missing.');
    
    const registration = await getRegistration();
    let subscription = await registration.pushManager.getSubscription();
    
    // Self-Healing Mismatch Check
    if (subscription) {
      const currentKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const existingKey = new Uint8Array(subscription.options.applicationServerKey!);
      const isMismatch = currentKey.length !== existingKey.length || currentKey.some((v, i) => v !== existingKey[i]);

      if (isMismatch) {
        console.warn('[Push Client] VAPID Mismatch. Resetting...');
        await subscription.unsubscribe();
        subscription = null;
      }
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    return subscription;
}
