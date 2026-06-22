'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

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
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback(
    (notificationInput: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
      setNotifications((previous) => {
        const now = Date.now();
        const isDuplicate = previous.some(
          (existing) =>
            existing.body === notificationInput.body &&
            now - existing.createdAt.getTime() < 3000
        );

        if (isDuplicate) return previous;

        const notification: AppNotification = {
          ...notificationInput,
          id: Math.random().toString(36).slice(2) + Date.now().toString(36),
          createdAt: new Date(),
          read: false,
        };

        return [notification, ...previous];
      });
    },
    []
  );

  const markAllRead = useCallback(() => {
    setNotifications((previous) =>
      previous.map((notification) => ({ ...notification, read: true }))
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'NEW_NOTIFICATION') return;
      const payload = event.data.payload ?? {};
      const visitorName =
        typeof payload.visitorName === 'string' && payload.visitorName
          ? payload.visitorName
          : 'Visitor';
      const body =
        typeof payload.body === 'string' && payload.body
          ? payload.body
          : `${visitorName} made a new booking.`;
      const notificationType = payload.notifType === 'feedback' ? 'feedback' : 'booking';

      addNotification({
        visitorName,
        body,
        bookingDate: typeof payload.bookingDate === 'string' ? payload.bookingDate : undefined,
        type: notificationType,
      });
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [addNotification]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markAllRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
}
