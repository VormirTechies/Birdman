'use client';

import { useEffect, useRef, useState } from 'react';

export interface Booking {
  id: string;
  visitor_name: string;
  phone: string;
  email: string | null;
  number_of_guests: number;
  visit_date: string;
  visit_time: string;
  status: string;
  created_at: string;
  updated_at: string;
  booking_date?: string; // Optional field for API response
  [key: string]: any;
}

interface UsePollingBookingsOptions {
  interval?: number; // Polling interval in milliseconds (default: 30000 = 30s)
  onInsert?: (booking: Booking) => void;
  onUpdate?: (booking: Booking) => void;
  onDelete?: (bookingId: string) => void;
}

/**
 * Hook to poll for bookings changes at regular intervals.
 * Detects new, updated, and deleted bookings by comparing with previous state.
 * 
 * @example
 * usePollingBookings({
 *   interval: 30000, // 30 seconds
 *   onInsert: (booking) => console.log('New booking:', booking),
 *   onUpdate: (booking) => console.log('Updated:', booking),
 *   onDelete: (id) => console.log('Deleted:', id)
 * });
 */
export function usePollingBookings(options: UsePollingBookingsOptions = {}) {
  const { 
    interval = 30000, // Default 30 seconds
    onInsert, 
    onUpdate, 
    onDelete 
  } = options;

  const previousBookingsRef = useRef<Map<string, Booking>>(new Map());
  const [isPolling, setIsPolling] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBookings = async () => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        console.error('[Polling] Failed to fetch bookings:', response.statusText);
        return;
      }

      const data = await response.json();
      console.log('[Polling] API response:', data);
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        console.error('[Polling] Invalid response format:', data);
        return;
      }

      // Ensure bookings is an array
      const bookings: Booking[] = Array.isArray(data.bookings) ? data.bookings : [];
      
      if (!Array.isArray(data.bookings)) {
        console.error('[Polling] bookings is not an array:', data.bookings);
        return;
      }

      // Convert to Map for efficient lookup
      const currentBookings = new Map(
        bookings.map(booking => [booking.id, booking])
      );

      // Detect changes only if we have previous data
      if (previousBookingsRef.current.size > 0) {
        // Check for new or updated bookings
        for (const [id, currentBooking] of currentBookings) {
          const previousBooking = previousBookingsRef.current.get(id);

          if (!previousBooking) {
            // New booking detected
            console.log('🆕 [Polling] New booking detected:', currentBooking);
            onInsert?.(currentBooking);
          } else {
            // Check if booking was updated
            const hasChanged = 
              previousBooking.updated_at !== currentBooking.updated_at ||
              previousBooking.status !== currentBooking.status ||
              previousBooking.visitor_name !== currentBooking.visitor_name ||
              previousBooking.visit_date !== currentBooking.visit_date ||
              previousBooking.visit_time !== currentBooking.visit_time ||
              previousBooking.number_of_guests !== currentBooking.number_of_guests;

            if (hasChanged) {
              console.log('✏️ [Polling] Booking updated:', currentBooking);
              onUpdate?.(currentBooking);
            }
          }
        }

        // Check for deleted bookings
        for (const [id] of previousBookingsRef.current) {
          if (!currentBookings.has(id)) {
            console.log('🗑️ [Polling] Booking deleted:', id);
            onDelete?.(id);
          }
        }
      } else {
        console.log(`🔄 [Polling] Initial fetch: ${bookings.length} bookings loaded`);
      }

      // Update reference
      previousBookingsRef.current = currentBookings;
    } catch (error) {
      console.error('[Polling] Error fetching bookings:', error);
    }
  };

  useEffect(() => {
    if (!isPolling) return;

    // Initial fetch
    console.log(`[Polling] Starting with ${interval / 1000}s interval`);
    fetchBookings();

    // Setup polling
    intervalRef.current = setInterval(() => {
      fetchBookings();
    }, interval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        console.log('[Polling] Stopping');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [interval, isPolling, onInsert, onUpdate, onDelete]);

  // Return control functions
  return {
    isPolling,
    startPolling: () => setIsPolling(true),
    stopPolling: () => setIsPolling(false),
    refreshNow: fetchBookings,
  };
}
