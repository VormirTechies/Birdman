# Database Structure Wireframe: Admin Settings System

## Overview

This document outlines the complete database structure for the Admin Settings feature, showing how calendar settings, bookings, and audit trails interact.

---

## 📊 Database Schema Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ADMIN SETTINGS SYSTEM                            │
└─────────────────────────────────────────────────────────────────────────┘

                   ┌──────────────────────┐
                   │   adminUsers         │
                   ├──────────────────────┤
                   │ id (PK)              │
                   │ username (unique)    │
                   │ passwordHash         │
                   │ createdAt            │
                   └──────────┬───────────┘
                              │
                              │ (created by)
                              │
                   ┌──────────▼───────────────────┐
                   │   settingsHistory (NEW)      │◄─────── Audit Trail
                   ├──────────────────────────────┤
                   │ id (PK)                      │
                   │ changedBy (FK → adminUsers)  │
                   │ changeType (enum)            │
                   │ applyMode (enum)             │
                   │ affectedDates (jsonb)        │
                   │ oldSettings (jsonb)          │
                   │ newSettings (jsonb)          │
                   │ cancelledBookingIds (jsonb)  │
                   │ createdAt                    │
                   └──────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│                      CALENDAR & BOOKING SYSTEM                            │
└──────────────────────────────────────────────────────────────────────────┘

   ┌────────────────────────────────┐
   │   calendarSettings (EXTENDED)  │◄────── Settings Storage
   ├────────────────────────────────┤
   │ id (PK)                        │
   │ date (unique, indexed)         │
   │ maxCapacity (0-200)            │
   │ startTime (HH:MM:SS)           │
   │ isOpen (boolean)               │
   │ settingSource (NEW, enum)      │──┐   Priority Logic:
   │ appliedByHistory (FK, NEW)     │  │   - 'specific' overrides 'range'
   │ createdAt                      │  │   - 'range' overrides 'default'
   │ updatedAt                      │  │   - 'default' is fallback
   └───────────┬────────────────────┘  │
               │                       │
               │ (defines capacity)    │
               │                       │
   ┌───────────▼─────────────────┐    │
   │   bookings                  │    │
   ├─────────────────────────────┤    │
   │ id (PK)                     │    │
   │ visitorName                 │    │
   │ phone                       │    │
   │ email                       │    │
   │ numberOfGuests              │    │
   │ bookingDate (indexed)       │────┤ (references date)
   │ bookingTime                 │    │
   │ status (enum)               │    │
   │ visited                     │    │
   │ confirmationSent            │    │
   │ reminderSent                │    │
   │ createdAt                   │    │
   │ updatedAt                   │    │
   └─────────────────────────────┘    │
                                      │
   Booking Status Flow:              │
   confirmed → cancelled (via settings)
   confirmed → completed (after visit)
                                      │
┌──────────────────────────────────┐  │
│  Query Logic:                    │  │
│  - JOIN bookings ON date         │  │
│  - SUM(numberOfGuests)           │  │
│  - Compare to maxCapacity        │  │
│  - Return: remaining, percentage │  │
└──────────────────────────────────┘  │
                                      │
                                      │
┌──────────────────────────────────┐  │
│  cancellationQueue (NEW, OPTIONAL)  │
├──────────────────────────────────┤  │
│ id (PK)                          │  │
│ bookingId (FK → bookings)        │  │
│ reason (text)                    │  │
│ emailSent (boolean)              │  │
│ settingsHistoryId (FK)           │──┘
│ createdAt                        │
└──────────────────────────────────┘
    (For batch email processing)

```

---

## 📋 Table Schemas

### 1. **calendarSettings** (Extended Existing Table)

Stores date-specific calendar configuration with priority tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | Unique identifier |
| `date` | date | UNIQUE, NOT NULL, INDEXED | Specific date (YYYY-MM-DD) |
| `maxCapacity` | integer | NOT NULL, DEFAULT 100 | Max visitors (0-200) |
| `startTime` | time | NOT NULL, DEFAULT '16:30:00' | Session start time |
| `isOpen` | boolean | NOT NULL, DEFAULT true | Booking availability |
| **`settingSource`** | varchar(20) | NOT NULL, DEFAULT 'default' | **NEW**: `'default'` \| `'specific'` \| `'range'` |
| **`appliedByHistory`** | uuid | NULLABLE, FK | **NEW**: Links to `settingsHistory.id` |
| `createdAt` | timestamp | NOT NULL | Record creation time |
| `updatedAt` | timestamp | NOT NULL | Last modification time |

**Indexes:**
- `calendar_settings_date_idx` on `date`
- `calendar_settings_source_idx` on `settingSource` (NEW)

**Priority Logic:**
```sql
-- When querying for a date:
SELECT * FROM calendarSettings 
WHERE date = '2026-05-15'
ORDER BY 
  CASE settingSource
    WHEN 'specific' THEN 1  -- Highest priority
    WHEN 'range' THEN 2
    WHEN 'default' THEN 3   -- Lowest priority
  END
LIMIT 1;
```

---

### 2. **settingsHistory** (New Audit Table)

Tracks all calendar settings changes for accountability and rollback capability.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | Unique identifier |
| `changedBy` | uuid | NOT NULL, FK → adminUsers.id | Admin who made the change |
| `changeType` | varchar(50) | NOT NULL | `'update_settings'` \| `'block_dates'` \| `'unblock_dates'` |
| `applyMode` | varchar(20) | NOT NULL | `'all_days'` \| `'one_day'` \| `'date_range'` |
| `affectedDates` | jsonb | NOT NULL | Array of date strings: `["2026-05-15", "2026-05-16", ...]` |
| `oldSettings` | jsonb | NULLABLE | Previous values: `{ maxCapacity: 100, startTime: "16:30:00", isOpen: true }` |
| `newSettings` | jsonb | NOT NULL | New values: `{ maxCapacity: 150, startTime: "17:00:00", isOpen: false }` |
| `cancelledBookingIds` | jsonb | NULLABLE | Array of booking UUIDs cancelled by this change: `["uuid1", "uuid2"]` |
| `createdAt` | timestamp | NOT NULL | When change was applied |

**Indexes:**
- `settings_history_changed_by_idx` on `changedBy`
- `settings_history_created_at_idx` on `createdAt`
- `settings_history_affected_dates_idx` (GIN) on `affectedDates` for array searches

**Example Record:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "changedBy": "admin-uuid-123",
  "changeType": "block_dates",
  "applyMode": "date_range",
  "affectedDates": ["2026-06-01", "2026-06-02", "2026-06-03"],
  "oldSettings": { "isOpen": true },
  "newSettings": { "isOpen": false },
  "cancelledBookingIds": ["booking-uuid-1", "booking-uuid-2"],
  "createdAt": "2026-05-13T14:30:00Z"
}
```

---

### 3. **bookings** (Existing, No Changes)

Visitor reservation records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | Unique identifier |
| `visitorName` | varchar(255) | NOT NULL | Visitor's full name |
| `phone` | varchar(20) | NOT NULL | Contact number |
| `email` | varchar(255) | NULLABLE | Email address |
| `numberOfGuests` | integer | NOT NULL, DEFAULT 1 | Total visitors in party |
| `bookingDate` | date | NOT NULL, INDEXED | Visit date |
| `bookingTime` | time | NOT NULL | Session start time |
| `status` | varchar(50) | NOT NULL, DEFAULT 'confirmed' | `'confirmed'` \| `'cancelled'` \| `'completed'` |
| `visited` | boolean | NOT NULL, DEFAULT false | Check-in status |
| `confirmationSent` | boolean | NOT NULL, DEFAULT false | Email sent flag |
| `reminderSent` | boolean | NOT NULL, DEFAULT false | Reminder sent flag |
| `createdAt` | timestamp | NOT NULL | Booking creation time |
| `updatedAt` | timestamp | NOT NULL | Last update time |

**Indexes:**
- `bookings_booking_date_idx` on `bookingDate`
- `bookings_status_idx` on `status`
- `bookings_visited_idx` on `visited`

---

### 4. **cancellationQueue** (New, Optional)

Temporary queue for batch processing booking cancellations and email notifications.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY | Unique identifier |
| `bookingId` | uuid | NOT NULL, FK → bookings.id | Booking to cancel |
| `reason` | text | NOT NULL | Cancellation reason (e.g., "Date blocked by admin") |
| `emailSent` | boolean | NOT NULL, DEFAULT false | Email notification status |
| `settingsHistoryId` | uuid | NOT NULL, FK → settingsHistory.id | Links to settings change |
| `createdAt` | timestamp | NOT NULL | Queue entry creation |

**Purpose:** Decouple cancellation logic from settings updates for better performance and retry capability.

---

## 🔄 Data Flow Scenarios

### Scenario 1: Apply "All Days" Default Settings

**User Action:** Admin sets default capacity to 150, start time to 17:00, for all future dates.

**Database Operations:**

```sql
-- Step 1: Create audit record
INSERT INTO settingsHistory (changedBy, changeType, applyMode, affectedDates, newSettings)
VALUES ('admin-uuid', 'update_settings', 'all_days', 
  '["2026-05-13", "2026-05-14", ... "2027-05-13"]', -- Next 365 days
  '{"maxCapacity": 150, "startTime": "17:00:00"}'
);

-- Step 2: Batch upsert calendar settings for future dates
INSERT INTO calendarSettings (date, maxCapacity, startTime, settingSource, appliedByHistory)
VALUES 
  ('2026-05-13', 150, '17:00:00', 'default', 'history-uuid-123'),
  ('2026-05-14', 150, '17:00:00', 'default', 'history-uuid-123'),
  -- ... 365 rows
ON CONFLICT (date) 
DO UPDATE SET 
  maxCapacity = EXCLUDED.maxCapacity,
  startTime = EXCLUDED.startTime,
  settingSource = CASE
    WHEN calendarSettings.settingSource = 'specific' THEN 'specific' -- Preserve specific overrides
    ELSE 'default'
  END,
  updatedAt = NOW()
WHERE calendarSettings.settingSource != 'specific'; -- Don't overwrite specific dates

-- Step 3: Return affected dates count
SELECT COUNT(*) FROM calendarSettings WHERE settingSource = 'default';
```

**Result:** 365 dates updated with new defaults, but dates with `settingSource = 'specific'` remain unchanged.

---

### Scenario 2: Apply "One Day" Specific Override

**User Action:** Admin sets May 20, 2026 capacity to 200 (special event day).

**Database Operations:**

```sql
-- Step 1: Create audit record
INSERT INTO settingsHistory (changedBy, changeType, applyMode, affectedDates, oldSettings, newSettings)
VALUES ('admin-uuid', 'update_settings', 'one_day',
  '["2026-05-20"]',
  '{"maxCapacity": 100, "startTime": "16:30:00", "isOpen": true}', -- Previous values
  '{"maxCapacity": 200}'
)
RETURNING id;

-- Step 2: Upsert specific date setting
INSERT INTO calendarSettings (date, maxCapacity, settingSource, appliedByHistory)
VALUES ('2026-05-20', 200, 'specific', 'history-uuid-456')
ON CONFLICT (date)
DO UPDATE SET
  maxCapacity = 200,
  settingSource = 'specific', -- Always set to 'specific' for one-day changes
  appliedByHistory = 'history-uuid-456',
  updatedAt = NOW();

-- Step 3: Verify capacity change
SELECT 
  cs.date,
  cs.maxCapacity,
  cs.settingSource,
  COALESCE(SUM(b.numberOfGuests), 0) AS currentBookings,
  cs.maxCapacity - COALESCE(SUM(b.numberOfGuests), 0) AS remaining
FROM calendarSettings cs
LEFT JOIN bookings b ON b.bookingDate = cs.date AND b.status = 'confirmed'
WHERE cs.date = '2026-05-20'
GROUP BY cs.date, cs.maxCapacity, cs.settingSource;
```

**Result:** May 20 now has capacity of 200, marked as `'specific'`, and won't be overwritten by future "All Days" changes.

---

### Scenario 3: Block Date Range (With Booking Cancellations)

**User Action:** Admin blocks June 1-10, 2026 (sanctuary closed for maintenance).

**Database Operations:**

```sql
-- Step 1: Identify existing bookings
SELECT id, visitorName, email, bookingDate, numberOfGuests
FROM bookings
WHERE bookingDate BETWEEN '2026-06-01' AND '2026-06-10'
  AND status = 'confirmed';

-- Returns 12 bookings across 10 days

-- Step 2: Create audit record with cancelled booking IDs
INSERT INTO settingsHistory (changedBy, changeType, applyMode, affectedDates, oldSettings, newSettings, cancelledBookingIds)
VALUES ('admin-uuid', 'block_dates', 'date_range',
  '["2026-06-01", "2026-06-02", ... "2026-06-10"]',
  '{"isOpen": true}',
  '{"isOpen": false}',
  '["booking-uuid-1", "booking-uuid-2", ... "booking-uuid-12"]' -- 12 cancelled IDs
)
RETURNING id;

-- Step 3: Update calendar settings to blocked
INSERT INTO calendarSettings (date, isOpen, settingSource, appliedByHistory)
SELECT 
  date::date,
  false,
  'range',
  'history-uuid-789'
FROM generate_series('2026-06-01'::date, '2026-06-10'::date, '1 day') AS date
ON CONFLICT (date)
DO UPDATE SET
  isOpen = false,
  settingSource = CASE
    WHEN calendarSettings.settingSource = 'specific' THEN 'specific' -- Preserve specific if exists
    ELSE 'range'
  END,
  updatedAt = NOW();

-- Step 4: Cancel all affected bookings
UPDATE bookings
SET 
  status = 'cancelled',
  updatedAt = NOW()
WHERE bookingDate BETWEEN '2026-06-01' AND '2026-06-10'
  AND status = 'confirmed'
RETURNING id, email;

-- Step 5: Queue cancellation emails (optional queue table)
INSERT INTO cancellationQueue (bookingId, reason, settingsHistoryId)
SELECT 
  b.id,
  'Sanctuary closed for maintenance during your booked dates. Please rebook.',
  'history-uuid-789'
FROM bookings b
WHERE b.bookingDate BETWEEN '2026-06-01' AND '2026-06-10'
  AND b.status = 'cancelled'
  AND b.email IS NOT NULL;

-- Step 6: Trigger email service (background job)
-- Batch send cancellation emails to all email addresses in queue
```

**Result:** 
- 10 dates marked as `isOpen = false`
- 12 bookings cancelled
- 12 email notifications queued/sent
- Full audit trail in `settingsHistory`

---

### Scenario 4: Query Calendar with Priority Logic

**User Action:** Frontend requests availability for May 15, 2026.

**Database Query:**

```sql
-- Get settings with priority (specific > range > default)
WITH ranked_settings AS (
  SELECT *,
    CASE settingSource
      WHEN 'specific' THEN 1
      WHEN 'range' THEN 2
      WHEN 'default' THEN 3
    END AS priority
  FROM calendarSettings
  WHERE date = '2026-05-15'
)
SELECT 
  rs.date,
  rs.maxCapacity,
  rs.startTime,
  rs.isOpen,
  rs.settingSource,
  COALESCE(SUM(b.numberOfGuests), 0) AS bookingCount,
  rs.maxCapacity - COALESCE(SUM(b.numberOfGuests), 0) AS remaining,
  ROUND((COALESCE(SUM(b.numberOfGuests), 0)::float / rs.maxCapacity) * 100) AS percentage
FROM ranked_settings rs
LEFT JOIN bookings b ON b.bookingDate = rs.date AND b.status = 'confirmed'
WHERE rs.priority = (SELECT MIN(priority) FROM ranked_settings) -- Use highest priority
GROUP BY rs.date, rs.maxCapacity, rs.startTime, rs.isOpen, rs.settingSource;

-- Fallback if no settings exist for date (use defaults)
SELECT 
  '2026-05-15' AS date,
  100 AS maxCapacity,
  '16:30:00' AS startTime,
  true AS isOpen,
  'default' AS settingSource,
  COALESCE(SUM(b.numberOfGuests), 0) AS bookingCount,
  100 - COALESCE(SUM(b.numberOfGuests), 0) AS remaining,
  ROUND((COALESCE(SUM(b.numberOfGuests), 0)::float / 100) * 100) AS percentage
FROM bookings b
WHERE b.bookingDate = '2026-05-15' AND b.status = 'confirmed';
```

**Response:**
```json
{
  "date": "2026-05-15",
  "maxCapacity": 150,
  "startTime": "17:00:00",
  "isOpen": true,
  "settingSource": "specific",
  "bookingCount": 85,
  "remaining": 65,
  "percentage": 57
}
```

---

## 🎯 Key Design Decisions

### 1. **Priority System via `settingSource` Field**
- **Why:** Avoids complex date range overlapping logic
- **How:** Single enum field with clear precedence: `specific` > `range` > `default`
- **Benefit:** Fast queries with simple WHERE clause filtering

### 2. **Audit Trail in `settingsHistory`**
- **Why:** Accountability, debugging, and potential rollback capability
- **How:** Every settings change creates an immutable history record
- **Benefit:** Admins can see "who changed what when" and restore previous settings

### 3. **JSONB for Flexible Metadata**
- **Why:** Settings may expand (e.g., add "break time", "max group size") without schema changes
- **How:** `oldSettings`/`newSettings` store arbitrary key-value pairs
- **Benefit:** Future-proof schema, easier migrations

### 4. **Optional `cancellationQueue` Table**
- **Why:** Decouples booking cancellation from email sending (reliability)
- **How:** Settings update → booking cancelled → queue entry → async email job
- **Benefit:** Retries on email failure, batch processing for large cancellations

### 5. **No Soft Deletes on Settings**
- **Why:** Settings are always additive/upsertable, old values preserved in history
- **How:** `ON CONFLICT DO UPDATE` pattern for all upserts
- **Benefit:** Cleaner queries, history table is the source of truth for changes

---

## 📈 Scalability Considerations

### Performance Optimization

1. **Indexed Queries:**
   - `calendarSettings.date` (unique B-tree index)
   - `bookings.bookingDate` + `status` (composite index)
   - `settingsHistory.affectedDates` (GIN index for JSONB array searches)

2. **Batch Upserts:**
   ```sql
   -- Process 365 dates in single transaction (~50ms on modern Postgres)
   INSERT INTO calendarSettings (...) VALUES (...), (...), ... -- 365 rows
   ON CONFLICT (date) DO UPDATE ...;
   ```

3. **Materialized Views** (Future):
   ```sql
   -- Pre-aggregate monthly availability stats
   CREATE MATERIALIZED VIEW monthly_availability AS
   SELECT 
     DATE_TRUNC('month', date) AS month,
     AVG(maxCapacity) AS avgCapacity,
     COUNT(*) FILTER (WHERE isOpen = false) AS blockedDays
   FROM calendarSettings
   GROUP BY month;
   ```

### Data Volume Estimates

Assuming 3 years of operation (2026-2029):

| Table | Estimated Rows | Storage Size |
|-------|---------------|--------------|
| `bookings` | ~50,000 (45 bookings/day × 1095 days) | ~15 MB |
| `calendarSettings` | ~1,095 (365 days × 3 years) | ~200 KB |
| `settingsHistory` | ~500 (1-2 changes/week × 156 weeks) | ~100 KB |
| `cancellationQueue` | ~1,000 (transient, cleared after email sent) | ~50 KB |

**Total:** ~15-20 MB for core settings system (negligible for modern databases).

---

## 🔐 Data Integrity Rules

### Foreign Key Constraints

```sql
-- Ensure audit trail links to valid admin
ALTER TABLE settingsHistory
ADD CONSTRAINT fk_changed_by_admin
FOREIGN KEY (changedBy) REFERENCES adminUsers(id)
ON DELETE SET NULL; -- Preserve history even if admin deleted

-- Link settings to history record
ALTER TABLE calendarSettings
ADD CONSTRAINT fk_applied_by_history
FOREIGN KEY (appliedByHistory) REFERENCES settingsHistory(id)
ON DELETE SET NULL; -- Optional: keep settings even if history pruned

-- Link cancellation queue to bookings
ALTER TABLE cancellationQueue
ADD CONSTRAINT fk_booking
FOREIGN KEY (bookingId) REFERENCES bookings(id)
ON DELETE CASCADE; -- If booking hard-deleted, remove from queue
```

### Check Constraints

```sql
-- Capacity limits
ALTER TABLE calendarSettings
ADD CONSTRAINT chk_max_capacity_range
CHECK (maxCapacity BETWEEN 0 AND 200);

-- Valid start times (6 AM - 8 PM)
ALTER TABLE calendarSettings
ADD CONSTRAINT chk_start_time_range
CHECK (startTime >= '06:00:00' AND startTime <= '20:00:00');

-- Valid setting sources
ALTER TABLE calendarSettings
ADD CONSTRAINT chk_setting_source
CHECK (settingSource IN ('default', 'specific', 'range'));
```

---

## 🚀 Migration Path

### Phase 1: Add New Columns (Non-Breaking)

```sql
-- Extend calendarSettings table
ALTER TABLE calendarSettings
ADD COLUMN settingSource VARCHAR(20) NOT NULL DEFAULT 'default',
ADD COLUMN appliedByHistory UUID;

-- Create indexes
CREATE INDEX calendar_settings_source_idx ON calendarSettings(settingSource);
CREATE INDEX calendar_settings_history_idx ON calendarSettings(appliedByHistory);

-- Backfill existing records
UPDATE calendarSettings
SET settingSource = 'specific'
WHERE date < CURRENT_DATE + INTERVAL '30 days'; -- Recent specific edits
```

### Phase 2: Create New Tables

```sql
-- Create settingsHistory table
CREATE TABLE settingsHistory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  changedBy UUID NOT NULL,
  changeType VARCHAR(50) NOT NULL,
  applyMode VARCHAR(20) NOT NULL,
  affectedDates JSONB NOT NULL,
  oldSettings JSONB,
  newSettings JSONB NOT NULL,
  cancelledBookingIds JSONB,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX settings_history_changed_by_idx ON settingsHistory(changedBy);
CREATE INDEX settings_history_created_at_idx ON settingsHistory(createdAt);
CREATE INDEX settings_history_affected_dates_idx ON settingsHistory USING GIN(affectedDates);

-- Optional: Create cancellationQueue table
CREATE TABLE cancellationQueue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bookingId UUID NOT NULL,
  reason TEXT NOT NULL,
  emailSent BOOLEAN NOT NULL DEFAULT false,
  settingsHistoryId UUID NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Phase 3: Deploy Settings Page UI (No DB Changes)

Deploy new admin settings page that uses new tables and columns.

---

## 📝 Example Data Snapshots

### calendarSettings Table (After Mixed Operations)

| date | maxCapacity | startTime | isOpen | settingSource | appliedByHistory |
|------|-------------|-----------|---------|---------------|------------------|
| 2026-05-13 | 100 | 16:30:00 | true | default | uuid-all-days-123 |
| 2026-05-14 | 100 | 16:30:00 | true | default | uuid-all-days-123 |
| 2026-05-20 | 200 | 16:30:00 | true | **specific** | uuid-one-day-456 |
| 2026-06-01 | 100 | 16:30:00 | **false** | range | uuid-range-789 |
| 2026-06-02 | 100 | 16:30:00 | **false** | range | uuid-range-789 |
| 2026-06-15 | 100 | 16:30:00 | true | default | uuid-all-days-123 |

**Explanation:**
- Most dates have `default` settings (100 capacity, 4:30 PM)
- May 20 has `specific` override (200 capacity for special event)
- June 1-2 have `range` setting (blocked for maintenance)

### settingsHistory Table (Last 5 Changes)

| id | changedBy | changeType | applyMode | affectedDates (excerpt) | newSettings | createdAt |
|----|-----------|------------|-----------|-------------------------|-------------|-----------|
| uuid-789 | admin-1 | block_dates | date_range | ["2026-06-01", "2026-06-02"] | `{"isOpen": false}` | 2026-05-13 14:30 |
| uuid-456 | admin-1 | update_settings | one_day | ["2026-05-20"] | `{"maxCapacity": 200}` | 2026-05-13 10:15 |
| uuid-123 | admin-1 | update_settings | all_days | ["2026-05-13" ... "2027-05-12"] | `{"maxCapacity": 100}` | 2026-05-12 16:00 |
| uuid-111 | admin-1 | update_settings | one_day | ["2026-05-15"] | `{"startTime": "17:00:00"}` | 2026-05-10 09:30 |
| uuid-000 | admin-1 | unblock_dates | date_range | ["2026-05-01", "2026-05-02"] | `{"isOpen": true}` | 2026-04-28 11:00 |

**Explanation:** Full audit trail showing who made what changes, when, and to which dates.

---

## ✅ Summary

This database design provides:

1. ✅ **Flexible Settings Management:** Global defaults, specific overrides, and date range operations
2. ✅ **Clear Priority Logic:** Simple `settingSource` enum with explicit precedence
3. ✅ **Complete Audit Trail:** Every change tracked with before/after values
4. ✅ **Scalable Performance:** Indexed queries, batch operations, minimal storage overhead
5. ✅ **Data Integrity:** Foreign keys, check constraints, and transactional safety
6. ✅ **Backward Compatible:** Extends existing schema without breaking changes
7. ✅ **Future-Proof:** JSONB fields allow adding new settings without migrations

---

**Next Steps:**
1. Review and approve schema design
2. Create Drizzle migration file for new tables/columns
3. Implement API endpoints using this data model
4. Build UI components that interact with these tables
