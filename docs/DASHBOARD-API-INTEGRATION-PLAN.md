# Dashboard API Integration Plan

This document outlines the complete plan for integrating real-time data into the admin dashboard.

## 📊 Current State

### Dashboard Page (`src/app/admin/page.tsx`)
**Status**: Using hardcoded mock data

**Current Stats Cards:**
- Today's Visitors: 148 (hardcoded)
- Next 30 Days: 320 (hardcoded)
- Last 30 Days: 1204 (hardcoded)
- Total Visitors: 12450 (hardcoded)

**Recent Bookings Component:**
- Using `MOCK_BOOKINGS` array with 6 sample bookings
- Status: No API integration

### Available APIs
✅ **Bookings API**: `GET /api/admin/bookings` (EXISTS)
- Supports pagination (`page`, `limit`)
- Supports search (`search` query param)
- Supports date filters (`isToday`, `showPast`, `minDate`)
- Returns: `{ data: Booking[], total: number }`

❌ **Stats/Dashboard API**: Does not exist (needs to be created)

---

## 🎯 Implementation Plan

### Phase 1: Create Dashboard Stats API ✅ NEXT PRIORITY

**File**: `src/app/api/admin/stats/route.ts`

**Endpoint**: `GET /api/admin/stats`

**Required Stats:**
1. **Today's Visitors Count**
   - Count all bookings with `visit_date = TODAY`
   - Sum `number_of_guests` field
   
2. **Next 30 Days Visitors Count**
   - Count bookings where `visit_date >= TODAY` AND `visit_date <= TODAY + 30 days`
   - Sum `number_of_guests`
   - Calculate trend vs previous 30 days
   
3. **Last 30 Days Visitors Count**
   - Count bookings where `visit_date >= TODAY - 30 days` AND `visit_date < TODAY`
   - Sum `number_of_guests`
   - Calculate trend vs previous period (30-60 days ago)
   
4. **Total Visitors (All Time)**
   - Count all bookings with status = 'confirmed' or 'completed'
   - Sum `number_of_guests`

**Response Format:**
```typescript
{
  todayVisitors: {
    value: number,
    trend: string,      // e.g., '+12%'
    trendUp: boolean
  },
  next30Days: {
    value: number,
    trend: string,
    trendUp: boolean
  },
  last30Days: {
    value: number,
    trend: string,
    trendUp: boolean
  },
  totalVisitors: {
    value: number,
    trend: string,
    trendUp: null
  }
}
```

**Database Queries Needed:**
```sql
-- Today's Visitors
SELECT SUM(number_of_guests) as count 
FROM bookings 
WHERE visit_date = CURRENT_DATE AND status IN ('confirmed', 'completed');

-- Next 30 Days
SELECT SUM(number_of_guests) as count 
FROM bookings 
WHERE visit_date >= CURRENT_DATE 
  AND visit_date <= CURRENT_DATE + INTERVAL '30 days'
  AND status = 'confirmed';

-- Last 30 Days
SELECT SUM(number_of_guests) as count 
FROM bookings 
WHERE visit_date >= CURRENT_DATE - INTERVAL '30 days'
  AND visit_date < CURRENT_DATE
  AND status IN ('confirmed', 'completed');

-- Total Visitors
SELECT SUM(number_of_guests) as count 
FROM bookings 
WHERE status IN ('confirmed', 'completed');
```

---

### Phase 2: Create Database Query Functions

**File**: `src/lib/db/queries.ts` (extend existing file)

**New Functions to Add:**
```typescript
export async function getDashboardStats() {
  // Return all 4 stats with trend calculations
}

export async function getTodayVisitorCount() {
  // Query today's bookings, sum guests
}

export async function getNext30DaysVisitorCount() {
  // Query upcoming bookings within 30 days
}

export async function getLast30DaysVisitorCount() {
  // Query past 30 days bookings
}

export async function getTotalVisitorCount() {
  // Query all completed bookings
}

export async function calculateTrend(current: number, previous: number): string {
  // Calculate percentage change
  // Return format: '+12%', '-3%', '→ 0%'
}
```

---

### Phase 3: Update Dashboard Page to Consume APIs

**File**: `src/app/admin/page.tsx`

**Changes Required:**
1. Remove hardcoded `STAT_CARDS` array
2. Add `useState` for stats data
3. Add `useEffect` to fetch stats on mount
4. Add loading state while fetching
5. Add error handling
6. Update `StatCard` rendering to use dynamic data

**Code Pattern:**
```typescript
const [stats, setStats] = useState<DashboardStats | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError('Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }
  
  fetchStats();
}, []);
```

---

### Phase 4: Integrate Recent Bookings API

**File**: `src/app/admin/_components/RecentBookings.tsx`

**Changes Required:**
1. Remove `MOCK_BOOKINGS` array
2. Add `useState` for bookings data
3. Add `useEffect` to fetch from `/api/admin/bookings`
4. Update pagination to use server-side total count
5. Add loading skeleton/spinner
6. Add error state UI

**API Call:**
```typescript
const fetchBookings = async () => {
  const params = new URLSearchParams({
    page: currentPage.toString(),
    limit: ITEMS_PER_PAGE.toString(),
    search: searchQuery,
    showPast: 'false' // Only show upcoming/recent
  });
  
  const res = await fetch(`/api/admin/bookings?${params}`);
  const { data, total } = await res.json();
  
  setBookings(data);
  setTotalEntries(total);
};
```

---

### Phase 5: Add Real-Time Updates (Optional Enhancement)

**Goal**: Auto-refresh stats every 5 minutes without user interaction

**Implementation:**
```typescript
// In dashboard page.tsx
useEffect(() => {
  const interval = setInterval(() => {
    fetchStats(); // Refresh stats
  }, 5 * 60 * 1000); // Every 5 minutes
  
  return () => clearInterval(interval);
}, []);
```

---

## 🔧 Technical Implementation Steps

### Step 1: Create Stats API Route
1. Create `src/app/api/admin/stats/route.ts`
2. Implement authentication check (Supabase session)
3. Add database query functions in `src/lib/db/queries.ts`
4. Calculate trends (compare with previous periods)
5. Return JSON response with all stats

### Step 2: Update Dashboard Page
1. Import `useState`, `useEffect` hooks
2. Create state variables for stats, loading, error
3. Fetch from `/api/admin/stats` on mount
4. Render loading skeleton while fetching
5. Display error message if API fails
6. Render `StatCard` components with real data

### Step 3: Update Recent Bookings Component
1. Replace `MOCK_BOOKINGS` with API call
2. Fetch from `/api/admin/bookings` with pagination
3. Handle search query in API params
4. Update total entries from API response
5. Add loading state (skeleton or spinner)
6. Handle empty state (no bookings)

### Step 4: Testing
1. Test stats API with different date ranges
2. Verify trend calculations are accurate
3. Test bookings pagination
4. Test search functionality
5. Test loading and error states
6. Verify performance (should load < 500ms)

---

## 📋 Type Definitions Needed

**File**: `src/types/dashboard.ts` (create new file)

```typescript
export interface DashboardStats {
  todayVisitors: StatValue;
  next30Days: StatValue;
  last30Days: StatValue;
  totalVisitors: StatValue;
}

export interface StatValue {
  value: number;
  trend: string;
  trendUp: boolean | null;
}

export interface Booking {
  id: string;
  guestName: string;
  mobile: string;
  email: string;
  checkInDate: Date;
  numberOfGuests: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: Date;
}
```

---

## 🔐 Security Considerations

1. **Authentication**: All admin APIs must verify Supabase session
2. **Authorization**: Ensure only admin users can access stats
3. **Rate Limiting**: Consider adding rate limiting to prevent abuse
4. **Input Validation**: Validate all query parameters (page, limit, search)
5. **SQL Injection**: Use parameterized queries (already handled by Drizzle ORM)

---

## 📊 Database Schema Reference

**Bookings Table**: `public.bookings`
- `id` (uuid, primary key)
- `visitor_name` (text)
- `email` (text)
- `phone` (text)
- `visit_date` (date)
- `time_slot` (text)
- `number_of_guests` (integer)
- `status` (text: 'pending', 'confirmed', 'completed', 'cancelled')
- `created_at` (timestamp)

**Indexes Needed for Performance:**
```sql
CREATE INDEX idx_bookings_visit_date ON bookings(visit_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);
```

---

## 🚀 Deployment Checklist

Before merging to main:
- [ ] Create stats API route with tests
- [ ] Update dashboard page to consume API
- [ ] Update RecentBookings to consume API
- [ ] Add loading states for all API calls
- [ ] Add error handling and error states
- [ ] Test with real booking data
- [ ] Verify performance (< 500ms load time)
- [ ] Add TypeScript types for all responses
- [ ] Document API endpoints in SPRINT docs
- [ ] Test on mobile and desktop

---

## 📝 Related Files

**Existing Files:**
- Dashboard Page: `src/app/admin/page.tsx`
- Recent Bookings: `src/app/admin/_components/RecentBookings.tsx`
- Bookings API: `src/app/api/admin/bookings/route.ts`
- Database Queries: `src/lib/db/queries.ts`

**New Files to Create:**
- Stats API: `src/app/api/admin/stats/route.ts`
- Dashboard Types: `src/types/dashboard.ts`
- Loading Components: `src/app/admin/_components/StatCardSkeleton.tsx`

---

## 🎯 Success Metrics

**Performance:**
- Dashboard stats API: < 200ms response time
- Bookings API: < 300ms response time
- Total page load: < 1 second

**Accuracy:**
- All stats match database counts exactly
- Trends calculated correctly vs previous periods
- Pagination shows correct total counts

**User Experience:**
- Smooth loading states (no janky transitions)
- Clear error messages if API fails
- Auto-refresh keeps data current
- Search and filters work instantly

---

## Next Steps

1. **Immediate**: Create stats API route (`/api/admin/stats`)
2. **Then**: Update dashboard page to consume API
3. **Then**: Update RecentBookings component
4. **Finally**: Add loading states and error handling

This plan provides a complete roadmap for converting the dashboard from mock data to real-time API-driven data.
