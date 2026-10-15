'use client';
import { useEffect, useRef, useState } from 'react';
import {
  getNotificationDeviceConfig, enableAdminNotifications, disableAdminNotifications,
  notificationsEnabledForCurrentUser, type DeviceConfig,
} from '@/lib/firebase/notification-client';

export function NotificationDeviceControl() {
  const [config, setConfig] = useState<DeviceConfig | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Checking notification setup…');
  const lock = useRef(false);
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (lock.current) return;
      try {
        const next = await getNotificationDeviceConfig();
        if (!cancelled) setConfig(next);
        const restored = next.configured && notificationsEnabledForCurrentUser()
          ? await enableAdminNotifications(next, false) : false;
        if (!cancelled && !lock.current) {
          setConfig(next); setEnabled(restored);
          setMessage(next.mode === 'mock' ? 'Local test mode — no real push is sent.'
            : !next.configured ? 'Push notifications are not configured yet.' : 'Booking alerts for this browser.');
        }
      } catch (error) {
        if (!cancelled) setMessage(error instanceof Error ? error.message : 'Notification setup unavailable.');
      }
    };
    void refresh();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 6 * 60 * 60 * 1000);
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { cancelled = true; clearInterval(timer); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  const toggle = async () => {
    if (lock.current || !config) return;
    lock.current = true; setBusy(true);
    try {
      if (enabled) await disableAdminNotifications();
      else await enableAdminNotifications(config);
      setEnabled(!enabled);
      setMessage(enabled ? 'Notifications disabled for this browser.' : config.mode === 'mock'
        ? 'Mock device registered. No real push will be sent.' : 'This browser is registered for notifications.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to update notifications.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return (
    <section aria-label="Browser notifications" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-100 bg-white p-4">
      <div>
        <p className="font-medium text-[#2E7D32]">Admin notifications</p>
        <p role="status" aria-live="polite" className="text-sm text-gray-600">{message}</p>
      </div>
      <button type="button" disabled={busy || !config?.configured} onClick={toggle}
        className="rounded-lg bg-[#2E7D32] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
        {busy ? 'Please wait…' : enabled ? 'Disable notifications' : config?.mode === 'mock' ? 'Register test device' : 'Enable notifications'}
      </button>
    </section>
  );
}
