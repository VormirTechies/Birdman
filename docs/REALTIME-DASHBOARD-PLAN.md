# Real-Time Dashboard & Push Notifications Implementation Plan

**Feature**: Live admin dashboard with instant updates and web push notifications when new bookings are made.

**Status**: ✅ Infrastructure exists, needs integration

---

## 🎯 Goal

When a user books a slot on the public booking page:
1. **Admin gets web push notification** (even if browser tab is closed)
2. **Dashboard updates instantly** (if tab is open):
   - 4 stat cards refresh with new counts
   - Recent bookings table shows new booking

---

## ✅ Existing Infrastructure

### Already Built:
1. **Supabase Realtime Enabled**: `scripts/enable-realtime.ts` 
   - Publication: `supabase_realtime`
   - Tables: `bookings`, `feedback`
   - Status: ✅ Script exists, needs to be run

2. **Service Worker**: `public/sw.js`
   - Handles push notifications
   - Shows notifications with actions (Open Dashboard, Dismiss)
   - Vibration pattern, icon, badge configured

3. **Push Client Library**: `src/lib/push/client.ts`
   - VAPID key setup
   - Service worker registration
   - Push subscription management
   - Self-healing subscription logic

4. **VAPID Keys**: Environment variable `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

---

## 📋 What Supabase Realtime Provides

Supabase Realtime uses **PostgreSQL's logical replication** with WebSockets:

### Features:
- **INSERT events**: When new booking is created
- **UPDATE events**: When booking status changes
- **DELETE events**: When booking is cancelled
- **Broadcast**: Custom real-time messages between clients
- **Presence**: Track which admins are online

### How it Works:
```typescript
// Subscribe to bookings table changes
const channel = supabase
  .channel('bookings-changes')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'bookings' },
    (payload) => {
      console.log('New booking!', payload.new)
      // Trigger notification & update UI
    }
  )
  .subscribe()
```

---

## 🔧 Implementation Steps

### Phase 1: Enable Realtime on Database ✅

**Run once on Supabase database:**

```bash
npm run db:enable-realtime
# or
tsx scripts/enable-realtime.ts
```

**What it does:**
- Creates `supabase_realtime` publication
- Adds `bookings` table to publication
- Allows Supabase to stream changes via WebSockets

**Verify in Supabase Dashboard:**
- Database → Replication → Check if `bookings` is in publication

---

### Phase 2: Create Realtime Hook

**File**: `src/lib/hooks/useRealtimeBookings.ts` (create new)

```typescript
'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeBookingsOptions {
  onInsert?: (booking: any) => void;
  onUpdate?: (booking: any) => void;
  onDelete?: (bookingId: string) => void;
}

export function useRealtimeBookings(options: UseRealtimeBookingsOptions) {
  const { onInsert, onUpdate, onDelete } = options;

  useEffect(() => {
    const supabase = createClient();
    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      // Check if user is authenticated (admin only)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
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
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime subscription active');
          }
        });
    };

    setupSubscription();

    // Cleanup on unmount
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [onInsert, onUpdate, onDelete]);
}
```

---

### Phase 3: Integrate into Dashboard Page

**File**: `src/app/admin/page.tsx`

**Add realtime subscription:**

```typescript
import { useRealtimeBookings } from '@/lib/hooks/useRealtimeBookings';
import { useState } from 'react';

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState(/* initial stats */);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch stats on mount
  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  // Setup realtime subscription
  useRealtimeBookings({
    onInsert: async (newBooking) => {
      // Show toast notification
      toast.success('New booking received!', {
        description: `${newBooking.visitor_name} booked for ${newBooking.visit_date}`
      });

      // Trigger push notification (if permission granted)
      await sendPushNotification({
        title: '🦅 New Booking!',
        body: `${newBooking.visitor_name} booked ${newBooking.number_of_guests} slot(s)`,
        url: '/admin'
      });

      // Refresh stats
      setRefreshKey(prev => prev + 1);
    },

    onUpdate: (updatedBooking) => {
      toast.info('Booking updated');
      setRefreshKey(prev => prev + 1);
    },

    onDelete: (bookingId) => {
      toast.warning('Booking cancelled');
      setRefreshKey(prev => prev + 1);
    }
  });

  // ... rest of component
}
```

---

### Phase 4: Integrate into Recent Bookings Component

**File**: `src/app/admin/_components/RecentBookings.tsx`

**Add realtime updates to bookings list:**

```typescript
import { useRealtimeBookings } from '@/lib/hooks/useRealtimeBookings';

export function RecentBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);

  // Setup realtime subscription
  useRealtimeBookings({
    onInsert: (newBooking) => {
      // Prepend new booking to list
      setBookings(prev => [formatBooking(newBooking), ...prev]);
      setTotalEntries(prev => prev + 1);
    },

    onUpdate: (updatedBooking) => {
      // Update existing booking
      setBookings(prev => 
        prev.map(b => b.id === updatedBooking.id ? formatBooking(updatedBooking) : b)
      );
    },

    onDelete: (bookingId) => {
      // Remove deleted booking
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      setTotalEntries(prev => prev - 1);
    }
  });

  // ... rest of component
}
```

---

### Phase 5: Create Push Notification API

**File**: `src/app/api/admin/push/route.ts` (create new)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

// Configure VAPID
webpush.setVapidDetails(
  'mailto:admin@birdmanofchennai.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { subscription, notification } = await request.json();

    await webpush.sendNotification(
      subscription,
      JSON.stringify(notification)
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Push API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### Phase 6: Create Push Notification Helper

**File**: `src/lib/push/send.ts` (create new)

```typescript
'use client';

/**
 * Sends a web push notification to the current user's subscription
 */
export async function sendPushNotification(notification: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}) {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('Push notifications not supported');
      return;
    }

    // Check permission
    if (Notification.permission !== 'granted') {
      console.warn('Push notification permission not granted');
      return;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.warn('No push subscription found');
      return;
    }

    // Send push notification via API
    await fetch('/api/admin/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        notification
      })
    });

    console.log('✅ Push notification sent');
  } catch (error) {
    console.error('❌ Failed to send push notification:', error);
  }
}
```

---

### Phase 7: Request Push Notification Permission

**File**: `src/app/admin/layout.tsx`

**Add permission request on admin login:**

```typescript
import { subscribeUser } from '@/lib/push/client';

useEffect(() => {
  const setupPushNotifications = async () => {
    // Check if user is authenticated
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Subscribe to push notifications
        try {
          const subscription = await subscribeUser();
          console.log('✅ Push notifications enabled');
          
          // Optional: Save subscription to database for server-side push
          await fetch('/api/admin/push/subscribe', {
            method: 'POST',
            body: JSON.stringify(subscription.toJSON())
          });
        } catch (error) {
          console.error('Failed to enable push notifications:', error);
        }
      }
    }
  };

  setupPushNotifications();
}, []);
```

---

## 🎨 UI Enhancements

### Option 1: Toast Notifications
Use existing Sonner toast for in-app notifications:

```typescript
import { toast } from 'sonner';

toast.success('New booking!', {
  description: 'John Doe booked 2 slots',
  action: {
    label: 'View',
    onClick: () => router.push('/admin/bookings')
  }
});
```

### Option 2: Realtime Badge
Show "🔴 LIVE" badge when realtime is active:

```typescript
<div className="flex items-center gap-2">
  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
  <span className="text-xs text-green-600">Live</span>
</div>
```

### Option 3: Animated Updates
Use Framer Motion to highlight new bookings:

```typescript
<motion.div
  initial={{ backgroundColor: '#fff' }}
  animate={{ backgroundColor: ['#fff', '#e8f5e9', '#fff'] }}
  transition={{ duration: 2 }}
>
  {/* New booking row */}
</motion.div>
```

---

## 🔐 Security Considerations

### 1. Admin-Only Realtime
```typescript
// Only subscribe if user is admin
const { data: { user } } = await supabase.auth.getUser();
if (user?.email !== 'admin@birdmanofchennai.com') return;
```

### 2. Row-Level Security (RLS)
Ensure Supabase RLS policies allow admin to read bookings:

```sql
-- In Supabase dashboard
CREATE POLICY "Admin can read all bookings"
ON bookings FOR SELECT
TO authenticated
USING (auth.email() = 'admin@birdmanofchennai.com');
```

### 3. VAPID Key Security
- Keep `VAPID_PRIVATE_KEY` in `.env.local` (never commit)
- Only expose `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to client

---

## 📊 Performance Considerations

### Bandwidth Optimization
- Realtime only sends changed rows, not entire table
- Typical message size: ~500 bytes per booking
- WebSocket connection: persistent, low overhead

### Connection Management
- Supabase auto-reconnects on network interruption
- Connection pooling handled by Supabase client
- Max 100 concurrent realtime connections per project (free tier)

### Database Impact
- Minimal: uses PostgreSQL logical replication
- No additional queries needed (push-based)

---

## 🧪 Testing Plan

### 1. Local Testing
```bash
# Terminal 1: Run dev server
npm run dev

# Terminal 2: Make test booking
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "visitor_name": "Test User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "visit_date": "2026-05-01",
    "time_slot": "morning",
    "number_of_guests": 2
  }'
```

**Expected Results:**
- Dashboard toast notification appears
- Stat cards update automatically
- Recent bookings table shows new booking
- Web push notification sent

### 2. Browser Testing
- Open admin dashboard in Chrome
- Grant notification permission
- Make booking from incognito window
- Verify push notification appears

### 3. Multi-Tab Testing
- Open admin in 2 tabs
- Make booking
- Both tabs should update simultaneously

---

## 🚀 Deployment Checklist

- [ ] Run `npm run db:enable-realtime` on production database
- [ ] Verify Supabase Realtime is enabled in dashboard
- [ ] Set `VAPID_PRIVATE_KEY` in Vercel environment variables
- [ ] Test realtime subscriptions in production
- [ ] Test push notifications on HTTPS (required for service workers)
- [ ] Monitor Supabase realtime connection usage
- [ ] Test with multiple admin users (if applicable)

---

## 📝 Environment Variables Needed

**`.env.local`:**
```bash
# Existing
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."

# Push Notifications (already exist)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BFx..."
VAPID_PRIVATE_KEY="xxx..."

# No additional variables needed for Realtime!
```

---

## 🔄 Alternative: Server-Sent Events (SSE)

If you prefer SSE over WebSockets:

**Pros:**
- Simpler (HTTP-based)
- Auto-reconnect built-in
- Works through proxies

**Cons:**
- One-way only (server → client)
- Not as efficient as WebSockets

**Recommendation:** Use Supabase Realtime (WebSockets) — it's built-in and optimized.

---

## 📚 Related Documentation

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Web Push Notifications MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

## 🎯 Summary

**Yes, this is 100% possible with Supabase!**

### What You Get:
1. ✅ **Instant dashboard updates** via Supabase Realtime (WebSockets)
2. ✅ **Web push notifications** when dashboard is closed
3. ✅ **Live stat cards** that update automatically
4. ✅ **Live bookings table** with new rows appearing instantly
5. ✅ **No polling required** — push-based updates
6. ✅ **Infrastructure already exists** — just needs integration

### Estimated Implementation Time:
- **Phase 1-2**: 1 hour (enable realtime + create hook)
- **Phase 3-4**: 2 hours (integrate into dashboard + bookings)
- **Phase 5-7**: 2 hours (push notification API + permission flow)
- **Testing**: 1 hour
- **Total**: ~6 hours

### Next Steps:
1. Run `tsx scripts/enable-realtime.ts` to enable on database
2. Create `useRealtimeBookings` hook
3. Integrate into dashboard page
4. Test with mock bookings
5. Deploy to production

Would you like me to start implementing this feature?
