'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Bird, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AppNotification {
  id: string;
  visitorName: string;
  body: string;
  bookingDate?: string;
  createdAt: Date;
  read: boolean;
  type: 'booking' | 'feedback';
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Session-scoped: React state only — clears on tab close (no localStorage)
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  // Null initially — createClient() must never run during SSR/prerender
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  const addNotification = useCallback((n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    setNotifications(prev => {
      // De-duplicate: skip if same body appeared within the last 3 seconds
      const now = Date.now();
      const isDuplicate = prev.some(
        existing => existing.body === n.body && now - existing.createdAt.getTime() < 3000
      );
      if (isDuplicate) return prev;

      const notification: AppNotification = {
        ...n,
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        createdAt: new Date(),
        read: false,
      };
      return [notification, ...prev];
    });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // ─── Service Worker push message listener ──────────────────────────────
  // Fires when sw.js broadcasts NEW_NOTIFICATION after receiving a push.
  // This is the reliable path — works even if Supabase Realtime is slow.

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'NEW_NOTIFICATION') return;
      const p = event.data.payload ?? {};

      // Derive a display name: prefer explicit visitorName from payload
      const visitorName = p.visitorName || 'Visitor';
      const body = p.body || `${visitorName} made a new booking.`;

      addNotification({
        visitorName,
        body,
        bookingDate: p.bookingDate || undefined,
        type: (p.notifType as 'booking' | 'feedback') ?? 'booking',
      });
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [addNotification]);

  // ─── Realtime Subscriptions ─────────────────────────────────────────────

  useEffect(() => {
    // Initialize lazily — this only runs on the client, never during SSR
    if (!supabaseRef.current) supabaseRef.current = createClient();
    const supabase = supabaseRef.current;

    // New bookings
    const bookingsChannel = supabase
      .channel('admin_notifications_bookings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload: any) => {
          const b = payload.new;
          const body = `${b.visitor_name} scheduled a visit.`;

          addNotification({
            visitorName: b.visitor_name ?? 'Visitor',
            body,
            bookingDate: b.booking_date ?? undefined,
            type: 'booking',
          });

          toast.success('New Booking!', {
            description: body,
            icon: React.createElement(Bird, { className: 'w-4 h-4' }),
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => { window.location.href = '/admin'; },
            },
          });

          // Signal dashboard components to refresh data
          window.dispatchEvent(new CustomEvent('new-booking', { detail: b }));
        }
      )
      .subscribe();

    // New feedback
    const feedbackChannel = supabase
      .channel('admin_notifications_feedback')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feedback' },
        (payload: any) => {
          const f = payload.new;
          const visitorName = f.visitor_name ?? 'A visitor';
          const body = `${visitorName} submitted a new review.`;

          addNotification({
            visitorName,
            body,
            type: 'feedback',
          });

          toast.info('Feedback Received!', {
            description: body,
            icon: React.createElement(MessageSquare, { className: 'w-4 h-4' }),
            duration: 8000,
            action: {
              label: 'Moderate',
              onClick: () => { window.location.href = '/admin/feedback'; },
            },
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(feedbackChannel);
    };
  }, [addNotification]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
