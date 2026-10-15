'use client';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getApp } from 'firebase/app';
import { auth, firebaseConfigError } from '@/firebase';
import { authenticatedFetch } from '@/lib/firebase/authenticated-fetch';
import { getNotificationDeviceConfig, notificationsEnabledForCurrentUser } from '@/lib/firebase/notification-client';
import type { NotificationInboxPage } from '@/models/firestore/notification';

interface NotificationContextType extends NotificationInboxPage {
  loading: boolean; error: string; busy: boolean; canPrevious: boolean;
  refresh: () => void; next: () => void; previous: () => void; latest: () => void;
  act: (ids: string[], action: 'read' | 'dismiss') => Promise<void>;
}
const empty: NotificationInboxPage = { notifications: [], unreadCount: 0, pagination: { limit: 20, hasMore: false, nextCursor: null } };
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [page, setPage] = useState(empty);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const mutation = useRef(false); const sequence = useRef(0);
  const cursor = cursors[cursors.length - 1];
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    if (firebaseConfigError) return;
    return onAuthStateChanged(auth, user => {
      sequence.current++; setUid(user?.uid ?? null); setPage(empty); setCursors([null]); setError(''); setLoading(false);
    });
  }, []);
  useEffect(() => {
    if (!uid || !window.location.pathname.startsWith('/admin')) return;
    const controller = new AbortController(); const requestId = ++sequence.current;
    // Loading tracks an external authenticated request, not derived render state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    void (async () => {
      try {
        const response = await authenticatedFetch(`/api/admin/notifications?limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
          { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error(response.status === 403 ? 'Administrator access is required.' : 'Unable to load notifications. Please retry.');
        const data = await response.json() as NotificationInboxPage;
        if (requestId === sequence.current && auth.currentUser?.uid === uid) { setPage(data); setError(''); }
      } catch (failure) {
        if (!controller.signal.aborted && requestId === sequence.current) {
          setError(failure instanceof Error ? failure.message : 'Unable to load notifications.'); setPage(empty);
        }
      } finally { if (requestId === sequence.current) setLoading(false); }
    })();
    return () => controller.abort();
  }, [uid, cursor, revision]);
  useEffect(() => {
    if (!uid) return;
    const visibleRefresh = () => { if (document.visibilityState === 'visible') refresh(); };
    const timer = window.setInterval(visibleRefresh, 30000);
    document.addEventListener('visibilitychange', visibleRefresh); window.addEventListener('focus', visibleRefresh);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visibleRefresh); window.removeEventListener('focus', visibleRefresh); };
  }, [uid, refresh]);
  useEffect(() => {
    if (!uid) return;
    let disposed = false; let generation = 0; let unsubscribe: (() => void) | undefined;
    const seen = new Set<string>();
    const receive = (id: unknown) => {
      if (disposed || auth.currentUser?.uid !== uid || typeof id !== 'string' || !/^[a-f0-9]{64}$/.test(id) || seen.has(id)) return;
      if (seen.size >= 200) seen.delete(seen.values().next().value!);
      seen.add(id); refresh(); // Never render untrusted push text; refetch the authorized inbox.
    };
    const message = (event: MessageEvent) => {
      if (event.origin && event.origin !== window.location.origin) return;
      if (event.data?.type === 'BIRDMAN_NOTIFICATION') receive(event.data.notificationId);
    };
    navigator.serviceWorker?.addEventListener('message', message);
    const connect = async () => {
      const current = ++generation;
      unsubscribe?.(); unsubscribe = undefined;
      try {
        if (disposed || !notificationsEnabledForCurrentUser()) return;
        const config = await getNotificationDeviceConfig();
        if (disposed || current !== generation || config.mode !== 'fcm' || !config.configured) return;
        const sdk = await import('firebase/messaging');
        if (!await sdk.isSupported() || disposed || current !== generation) return;
        unsubscribe = sdk.onMessage(sdk.getMessaging(getApp()), payload => receive(payload.data?.notificationId));
      } catch { /* Polling remains available without push. */ }
    };
    void connect(); window.addEventListener('birdman-notification-preference', connect);
    return () => { disposed = true; unsubscribe?.(); navigator.serviceWorker?.removeEventListener('message', message);
      window.removeEventListener('birdman-notification-preference', connect); };
  }, [uid, refresh]);
  const act = useCallback(async (ids: string[], action: 'read' | 'dismiss') => {
    if (!uid || mutation.current || !ids.length) return;
    mutation.current = true; setBusy(true);
    try {
      const response = await authenticatedFetch('/api/admin/notifications', { method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids, action }) });
      if (!response.ok) throw new Error('Unable to save this action. The notification may have expired; refresh and retry.');
      if (auth.currentUser?.uid === uid) refresh();
    } catch (failure) {
      if (auth.currentUser?.uid === uid) setError(failure instanceof Error ? failure.message : 'Unable to save this action.');
    } finally { mutation.current = false; setBusy(false); }
  }, [uid, refresh]);
  return <NotificationContext.Provider value={{ ...page, loading, error, busy, canPrevious: cursors.length > 1,
    refresh, act, latest: () => { setCursors([null]); refresh(); },
    next: () => { if (!loading && page.pagination.nextCursor) setCursors(values => [...values, page.pagination.nextCursor]); },
    previous: () => { if (!loading) setCursors(values => values.length > 1 ? values.slice(0, -1) : values); } }}>
    {children}
  </NotificationContext.Provider>;
}
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
