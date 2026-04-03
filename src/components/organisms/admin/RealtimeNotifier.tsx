'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { Bird, MessageSquare, Bell } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.replace(/['"]/g, '').trim();

export function RealtimeNotifier() {
  const supabase = createClient();

  useEffect(() => {
    // 0. Register Service Worker & Subscribe to Push
    const registerPush = async () => {
        if ('serviceWorker' in navigator && VAPID_PUBLIC_KEY) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                
                // Get Subscription
                let subscription = await registration.pushManager.getSubscription();
                
                if (!subscription) {
                    subscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                    });
                }

                // Send to backend
                await fetch('/api/admin/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subscription })
                });

            } catch (err) {
                console.error('Failed to register push:', err);
            }
        }
    };

    registerPush();

    // 1. Listen for New Bookings
    const bookingsChannel = supabase.channel('realtime_bookings')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings' },
        (payload: any) => {
          const newBooking = payload.new;
          toast.success('New Booking!', {
            description: `${newBooking.visitor_name} scheduled a visit.`,
            icon: <Bird className="w-4 h-4 text-sanctuary-green" />,
            duration: 5000,
            action: {
              label: 'View',
              onClick: () => window.location.href = '/admin'
            }
          });
          
          // Dispatch custom event for dashboard components to update without refresh
          window.dispatchEvent(new CustomEvent('new-booking', { detail: newBooking }));
          
          // Trigger browser notification if supported
          if (Notification.permission === 'granted') {
            new Notification('New Booking: Birdman Sanctuary', {
              body: `${newBooking.visitor_name} has just booked a slot!`,
              icon: '/icons/bird-icon.png' // Ensure this exists later
            });
          }
        }
      )
      .subscribe();

    // 2. Listen for New Feedback
    const feedbackChannel = supabase.channel('realtime_feedback')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feedback' },
        (payload: any) => {
          const newFeedback = payload.new;
          toast.info('Feedback Received!', {
            description: 'A visitor submitted a new review.',
            icon: <MessageSquare className="w-4 h-4 text-info" />,
            duration: 8000,
            action: {
              label: 'Moderate',
              onClick: () => window.location.href = '/admin/feedback'
            }
          });
        }
      )
      .subscribe();

    // 3. Request Notification Permission on mount
    if (typeof window !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(feedbackChannel);
    };
  }, [supabase]);

  return null; // This component handles side effects only
}

// Utility for push key (Robust implementation)
function urlBase64ToUint8Array(base64String: string) {
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

