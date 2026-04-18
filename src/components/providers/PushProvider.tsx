'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { subscribeUser } from '@/lib/push/client';
import { toast } from 'sonner';

interface PushContextType {
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  enablePush: () => Promise<void>;
  testPush: () => Promise<void>;
}

const PushContext = createContext<PushContextType | undefined>(undefined);

export function PushProvider({ children }: { children: React.ReactNode }) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🔄 HYDRATION: Check status on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        setIsLoading(false);
        return;
      }

      setPermission(Notification.permission);
      
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (err) {
        console.error('[PushProvider] Status check failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  // 🕊️ ACTION: Enable Push
  const enablePush = useCallback(async () => {
    setIsLoading(true);
    try {
      const subscription = await subscribeUser();
      
      // Update Backend
      const res = await fetch('/api/admin/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });

      if (!res.ok) throw new Error('Failed to save subscription');

      setIsSubscribed(true);
      setPermission(Notification.permission);
      toast.success('Sanctuary Alerts Active!', {
         description: 'You will now receive real-time Emerald-Flight notifications.'
      });
    } catch (err: any) {
      console.error('[PushProvider] Enable failed:', err);
      toast.error('Alert Activation Failed', {
         description: err.name === 'AbortError' 
            ? 'Browser push service rejected the request. Please check site permissions.'
            : 'Internal connection error.'
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🛠️ ACTION: Test Push (Manual Trigger)
  const testPush = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/push/test', { method: 'POST' });
      if (res.ok) {
        toast.info('Test Alert Dispatched', {
           description: 'A manual pulse has been sent to all registered devices.'
        });
      } else {
        throw new Error('Test failed');
      }
    } catch (err) {
      toast.error('Test Failed', { description: 'Could not reach the sanctuary push engine.' });
    }
  }, []);

  return (
    <PushContext.Provider value={{ permission, isSubscribed, isLoading, enablePush, testPush }}>
      {children}
    </PushContext.Provider>
  );
}

export function usePush() {
  const context = useContext(PushContext);
  if (context === undefined) {
    throw new Error('usePush must be used within a PushProvider');
  }
  return context;
}
