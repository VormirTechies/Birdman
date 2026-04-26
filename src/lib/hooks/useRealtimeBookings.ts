'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeBookingsOptions {
  onInsert?: (booking: any) => void;
  onUpdate?: (booking: any) => void;
  onDelete?: (bookingId: string) => void;
}

/**
 * Hook to subscribe to real-time bookings changes via Supabase Realtime.
 * Automatically manages subscription lifecycle and cleanup.
 * 
 * @example
 * useRealtimeBookings({
 *   onInsert: (booking) => console.log('New booking:', booking),
 *   onUpdate: (booking) => console.log('Updated:', booking),
 *   onDelete: (id) => console.log('Deleted:', id)
 * });
 */
export function useRealtimeBookings(options: UseRealtimeBookingsOptions) {
  const { onInsert, onUpdate, onDelete } = options;
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const setupSubscription = async () => {
      // Only subscribe if user is authenticated (admin)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[Realtime] Not authenticated, skipping subscription');
        return;
      }

      console.log('[Realtime] Setting up bookings subscription...');

      // Create a unique channel for this subscription
      const channel = supabase
        .channel('admin-bookings-realtime')
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'bookings' 
          },
          (payload) => {
            console.log('🆕 New booking detected:', payload.new);
            onInsert?.(payload.new);
          }
        )
        .on(
          'postgres_changes',
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'bookings' 
          },
          (payload) => {
            console.log('✏️ Booking updated:', payload.new);
            onUpdate?.(payload.new);
          }
        )
        .on(
          'postgres_changes',
          { 
            event: 'DELETE', 
            schema: 'public', 
            table: 'bookings' 
          },
          (payload) => {
            console.log('🗑️ Booking deleted:', payload.old.id);
            onDelete?.(payload.old.id);
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime subscription active');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Realtime subscription error:', err);
            console.error('Possible causes:');
            console.error('1. RLS policies blocking access');
            console.error('2. Realtime not enabled on table');
            console.error('3. Invalid channel configuration');
          } else if (status === 'TIMED_OUT') {
            console.error('⏱️ Realtime subscription timed out');
            console.error('Check your internet connection and Supabase status');
          }
        });

      channelRef.current = channel;
    };

    setupSubscription();

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        console.log('[Realtime] Cleaning up subscription');
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [onInsert, onUpdate, onDelete]);
}
