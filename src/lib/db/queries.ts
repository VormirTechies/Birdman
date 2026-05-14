import { db } from './index';
import { bookings, verificationCodes, feedback, galleryImages, calendarSettings, type NewBooking, type Booking, type NewFeedback, type Feedback, type CalendarSettings, type NewCalendarSettings } from './schema';
import { eq, and, asc, desc, gt, gte, sql } from 'drizzle-orm';

// ═══════════════════════════════════════════════════════════════════════════
// DATABASE QUERIES - Birdman of Chennai Booking System
// All queries use Drizzle ORM with full type safety
// ═══════════════════════════════════════════════════════════════════════════

// ─── Create Booking ──────────────────────────────────────────────────────────

export async function createBooking(data: NewBooking): Promise<Booking> {
  const [booking] = await db
    .insert(bookings)
    .values({
      ...data,
      confirmationSent: false,
      reminderSent: false,
      status: 'confirmed',
    })
    .returning();
  
  return booking;
}

// ─── Get Booking by ID ───────────────────────────────────────────────────────

export async function getBookingById(id: string): Promise<Booking | undefined> {
  return db.query.bookings.findFirst({
    where: eq(bookings.id, id),
  });
}

// ─── Get All Bookings with Filters ───────────────────────────────────────────

export async function getBookings(params: {
  status?: 'confirmed' | 'cancelled' | 'completed';
  date?: string;
  minDate?: string; // e.g. "2024-04-18" to show today onwards
  search?: string;  // name, email, or phone
  limit?: number;
  offset?: number;
  sort?: 'checklist'; // not-visited first, then alphabetical by name
  // History page filters
  visitedFilter?: 'visited' | 'not-visited' | 'yet-to-visit'; // omit = All
  sortBy?: 'name' | 'email' | 'date' | 'guestCount';
  sortDir?: 'asc' | 'desc';
}): Promise<{ bookings: Booking[]; total: number }> {
  const { status, date, minDate, search, limit = 50, offset = 0, sort, visitedFilter, sortBy, sortDir = 'desc' } = params;
  const today = new Date().toISOString().split('T')[0];

  // 1. BASE CONDITIONS
  const conditions = [];
  if (status) conditions.push(eq(bookings.status, status));
  if (date) conditions.push(eq(bookings.bookingDate, date));
  if (minDate) conditions.push(gte(bookings.bookingDate, minDate)); // gte = today and onwards

  // 2. VISITED FILTER (History page)
  if (visitedFilter === 'visited') {
    conditions.push(eq(bookings.visited, true));
  } else if (visitedFilter === 'not-visited') {
    conditions.push(eq(bookings.visited, false));
    conditions.push(sql`${bookings.bookingDate} < ${today}`);
  } else if (visitedFilter === 'yet-to-visit') {
    conditions.push(eq(bookings.visited, false));
    conditions.push(sql`${bookings.bookingDate} >= ${today}`);
  }

  // 3. SEARCH LOGIC (Case Insensitive)
  if (search) {
    const searchLower = `%${search.toLowerCase()}%`;
    conditions.push(sql`(
      lower(${bookings.visitorName}) LIKE ${searchLower} OR 
      lower(${bookings.email}) LIKE ${searchLower} OR 
      ${bookings.phone} LIKE ${searchLower}
    )`);
  }

  const whereClause = conditions.length > 0 
    ? (conditions.length === 1 ? conditions[0] : and(...conditions)) 
    : undefined;

  // 4. ORDER BY
  let orderBy;
  if (sort === 'checklist') {
    orderBy = [sql`${bookings.visited} ASC`, sql`lower(${bookings.visitorName}) ASC`];
  } else if (sortBy) {
    const dir = sortDir === 'asc' ? asc : desc;
    switch (sortBy) {
      case 'name':
        orderBy = [dir(sql`lower(${bookings.visitorName})`)];
        break;
      case 'email':
        orderBy = [dir(sql`lower(COALESCE(${bookings.email}, ''))`)];
        break;
      case 'guestCount':
        orderBy = [dir(bookings.numberOfGuests)];
        break;
      case 'date':
      default:
        orderBy = sortDir === 'asc'
          ? [asc(bookings.bookingDate), asc(bookings.bookingTime)]
          : [desc(bookings.bookingDate), desc(bookings.bookingTime)];
    }
  } else {
    orderBy = [desc(bookings.bookingDate), desc(bookings.bookingTime)];
  }

  // 5. EXECUTE QUERIES (Parallel for speed)
  const [data, totalCount] = await Promise.all([
    db.query.bookings.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy,
    }),
    db.select({ count: sql<number>`count(*)` }).from(bookings).where(whereClause)
  ]);

  return { 
    bookings: data, 
    total: Number(totalCount[0]?.count || 0) 
  };
}

// ─── Get Bookings by Date ────────────────────────────────────────────────────

export async function getBookingsByDate(date: string): Promise<Booking[]> {
  return db.query.bookings.findMany({
    where: eq(bookings.bookingDate, date),
    orderBy: [desc(bookings.bookingTime)],
  });
}

// ─── Get Bookings Needing Reminders ──────────────────────────────────────────

export async function getBookingsNeedingReminders(date: string): Promise<Booking[]> {
  return db.query.bookings.findMany({
    where: and(
      eq(bookings.bookingDate, date),
      eq(bookings.reminderSent, false),
      eq(bookings.status, 'confirmed')
    ),
  });
}

// ─── Update Booking ──────────────────────────────────────────────────────────

export async function updateBooking(
  id: string,
  data: Partial<NewBooking>
): Promise<Booking | undefined> {
  const [updated] = await db
    .update(bookings)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, id))
    .returning();

  return updated;
}

// ─── Mark Reminder as Sent ───────────────────────────────────────────────────

export async function markReminderSent(id: string): Promise<void> {
  await db
    .update(bookings)
    .set({
      reminderSent: true,
      reminderSentAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, id));
}

// ─── Mark Confirmation as Sent ───────────────────────────────────────────────

export async function markConfirmationSent(id: string): Promise<void> {
  await db
    .update(bookings)
    .set({
      confirmationSent: true,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, id));
}

// ─── Cancel Booking ──────────────────────────────────────────────────────────

export async function cancelBooking(id: string): Promise<Booking | undefined> {
  const [cancelled] = await db
    .update(bookings)
    .set({
      status: 'cancelled',
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, id))
    .returning();

  return cancelled;
}

// ─── Verification Codes ──────────────────────────────────────────────────────

export async function createVerificationCode(userId: string, code: string, newEmail: string) {
  // Delete any existing codes for this user to avoid conflicts
  await db.delete(verificationCodes).where(eq(verificationCodes.userId, userId));

  const [inserted] = await db
    .insert(verificationCodes)
    .values({
      userId,
      code,
      newEmail,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    })
    .returning();

  return inserted;
}

export async function getValidVerificationCode(userId: string, code: string) {
  return db.query.verificationCodes.findFirst({
    where: and(
      eq(verificationCodes.userId, userId),
      eq(verificationCodes.code, code),
      gt(verificationCodes.expiresAt, new Date())
    ),
  });
}

export async function deleteVerificationCode(id: string) {
  await db.delete(verificationCodes).where(eq(verificationCodes.id, id));
}

// ─── Admin Dashboard Queries ──────────────────────────────────────────────────

export async function getTodayBookings() {
  const today = new Date().toISOString().split('T')[0];
  return db.query.bookings.findMany({
    where: eq(bookings.bookingDate, today),
    orderBy: [desc(bookings.bookingTime)],
  });
}

export async function getAllBookings(limit = 100) {
  return db.query.bookings.findMany({
    orderBy: [desc(bookings.createdAt)],
    limit,
  });
}

export async function getDashboardStats() {
  const today = new Date().toISOString().split('T')[0];
  
  const all = await db.query.bookings.findMany();
  
  const totalVisitors = all.reduce((sum, b) => sum + (b.adults + b.children), 0);
  const todayVisitors = all
    .filter(b => b.bookingDate === today && b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.adults + b.children), 0);
  const upcomingVisitors = all
    .filter(b => b.bookingDate > today && b.status === 'confirmed')
    .reduce((sum, b) => sum + (b.adults + b.children), 0);

  return {
    totalVisitors,
    todayVisitors,
    upcomingVisitors,
    totalBookings: all.length,
    todayBookings: all.filter(b => b.bookingDate === today).length,
    upcomingBookings: all.filter(b => b.bookingDate > today).length
  };
}

// ─── Get Booking Stats (Optimized with SQL Aggregation) ──────────────────────

export async function getBookingStats() {
  const today = new Date().toISOString().split('T')[0];
  const next30 = new Date();
  next30.setDate(next30.getDate() + 30);
  const next30Str = next30.toISOString().split('T')[0];
  const last30 = new Date();
  last30.setDate(last30.getDate() - 30);
  const last30Str = last30.toISOString().split('T')[0];

  // Execute all stats queries in parallel for performance
  const [todayResult, next30Result, last30Result, totalResult] = await Promise.all([
    // Today's visitors (confirmed bookings only)
    db
      .select({ total: sql<number>`COALESCE(SUM(${bookings.numberOfGuests}), 0)` })
      .from(bookings)
      .where(and(
        eq(bookings.bookingDate, today),
        eq(bookings.status, 'confirmed')
      )),
    
    // Next 30 days (confirmed bookings only)
    db
      .select({ total: sql<number>`COALESCE(SUM(${bookings.numberOfGuests}), 0)` })
      .from(bookings)
      .where(and(
        sql`${bookings.bookingDate} >= ${today}`,
        sql`${bookings.bookingDate} <= ${next30Str}`,
        eq(bookings.status, 'confirmed')
      )),
    
    // Last 30 days (completed + confirmed)
    db
      .select({ total: sql<number>`COALESCE(SUM(${bookings.numberOfGuests}), 0)` })
      .from(bookings)
      .where(and(
        sql`${bookings.bookingDate} >= ${last30Str}`,
        sql`${bookings.bookingDate} < ${today}`,
        sql`${bookings.status} IN ('completed', 'confirmed')`
      )),
    
    // Total visitors (completed bookings only)
    db
      .select({ total: sql<number>`COALESCE(SUM(${bookings.numberOfGuests}), 0)` })
      .from(bookings)
      .where(eq(bookings.status, 'completed'))
  ]);

  return {
    todayVisitors: Number(todayResult[0]?.total || 0),
    next30Days: Number(next30Result[0]?.total || 0),
    last30Days: Number(last30Result[0]?.total || 0),
    totalVisitors: Number(totalResult[0]?.total || 0),
  };
}

export async function getPendingFeedback() {
  return db.query.feedback.findMany({
    where: eq(feedback.isApproved, false),
    orderBy: [desc(feedback.createdAt)],
  });
}

export async function approveFeedback(id: string) {
  await db.update(feedback)
    .set({ isApproved: true })
    .where(eq(feedback.id, id));
}

export async function getApprovedFeedback(limit = 20) {
  return db.query.feedback.findMany({
    where: eq(feedback.isApproved, true),
    orderBy: [desc(feedback.createdAt)],
    limit,
  });
}

export async function deleteFeedback(id: string) {
  await db.delete(feedback).where(eq(feedback.id, id));
}

export async function createFeedback(data: NewFeedback) {
  const [inserted] = await db
    .insert(feedback)
    .values({
      ...data,
      isApproved: false,
    })
    .returning();
  return inserted;
}

// ─── Gallery Queries ─────────────────────────────────────────────────────────

export async function getGalleryImages() {
  // 🔥 Self-Healing: Ensure the table exists before attempting to read.
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "gallery_images" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "url" text NOT NULL UNIQUE,
      "caption" text,
      "alt_text" varchar(255),
      "category" text[],
      "aspect" varchar(50) DEFAULT 'square',
      "order" integer NOT NULL DEFAULT 0,
      "uploaded_at" timestamp DEFAULT now() NOT NULL
    );
  `);

  return db.query.galleryImages.findMany({
    orderBy: [desc(galleryImages.uploadedAt)],
  });
}

export async function getGalleryImagesPaginated(offset = 0, limit = 15) {
  return db.query.galleryImages.findMany({
    orderBy: [desc(galleryImages.uploadedAt)],
    limit,
    offset,
  });
}

export async function getGalleryCount(): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(galleryImages);
  return row?.count ?? 0;
}

export async function addGalleryImage(url: string, altText?: string, caption?: string) {
  const [inserted] = await db
    .insert(galleryImages)
    .values({ url, altText, caption, order: 0 })
    .returning();
  return inserted;
}

export async function updateGalleryImage(id: string, data: { altText?: string; caption?: string | null }) {
  const [updated] = await db
    .update(galleryImages)
    .set(data)
    .where(eq(galleryImages.id, id))
    .returning();
  return updated;
}

export async function deleteGalleryImage(id: string) {
  await db.delete(galleryImages).where(eq(galleryImages.id, id));
}

// ═══════════════════════════════════════════════════════════════════════════
// CALENDAR QUERIES - Monthly view and daily capacity management
// ═══════════════════════════════════════════════════════════════════════════

// ─── Get Monthly Booking Statistics ──────────────────────────────────────────
// Returns aggregated booking data for each day in a given month

export async function getMonthlyBookingStats(year: number, month: number): Promise<Array<{
  date: string;
  bookingCount: number;
  maxCapacity: number;
  isOpen: boolean;
  startTime: string;
  percentage: number;
}>> {
  // Local-timezone date formatter (avoids UTC shift on servers ahead of UTC)
  const toLocalDateStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Calculate first and last day of the month
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const firstDayStr = toLocalDateStr(firstDay);
  const lastDayStr = toLocalDateStr(lastDay);

  // Get all bookings for the month (confirmed only)
  const monthBookings = await db
    .select({
      date: bookings.bookingDate,
      count: sql<number>`COUNT(*)::int`,
      guestSum: sql<number>`COALESCE(SUM(${bookings.numberOfGuests}), 0)::int`,
    })
    .from(bookings)
    .where(and(
      sql`${bookings.bookingDate} >= ${firstDayStr}`,
      sql`${bookings.bookingDate} <= ${lastDayStr}`,
      eq(bookings.status, 'confirmed')
    ))
    .groupBy(bookings.bookingDate);

  // Get all calendar settings for the month
  const monthSettings = await db
    .select()
    .from(calendarSettings)
    .where(and(
      sql`${calendarSettings.date} >= ${firstDayStr}`,
      sql`${calendarSettings.date} <= ${lastDayStr}`
    ));

  // Create a map for quick lookup
  const bookingMap = new Map(monthBookings.map(b => [b.date, b]));
  const settingsMap = new Map(monthSettings.map(s => [s.date, s]));

  // Generate array for all days in the month
  const result = [];
  const currentDate = new Date(firstDay);

  while (currentDate <= lastDay) {
    const dateStr = toLocalDateStr(currentDate);
    const booking = bookingMap.get(dateStr);
    const settings = settingsMap.get(dateStr);

    const maxCapacity = settings?.maxCapacity ?? 100;
    const bookingCount = booking?.guestSum ?? 0;
    const percentage = maxCapacity > 0 ? Math.round((bookingCount / maxCapacity) * 100) : 0;

    result.push({
      date: dateStr,
      bookingCount,
      maxCapacity,
      isOpen: settings?.isOpen ?? true,
      startTime: settings?.startTime ?? '16:30:00',
      percentage,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

// ─── Get Day Details ──────────────────────────────────────────────────────────
// Returns detailed information for a specific date

export async function getDayDetails(date: string): Promise<{
  date: string;
  settings: CalendarSettings | { maxCapacity: number; startTime: string; isOpen: boolean };
  bookings: Booking[];
  stats: {
    totalBooked: number;
    available: number;
    percentage: number;
  };
}> {
  // Get settings for this date (or use defaults)
  const settings = await db.query.calendarSettings.findFirst({
    where: eq(calendarSettings.date, date),
  });

  // Get all bookings for this date (confirmed only)
  const dayBookings = await db.query.bookings.findMany({
    where: and(
      eq(bookings.bookingDate, date),
      eq(bookings.status, 'confirmed')
    ),
    orderBy: [desc(bookings.bookingTime)],
  });

  const maxCapacity = settings?.maxCapacity ?? 100;
  const totalBooked = dayBookings.reduce((sum, b) => sum + (b.adults + b.children), 0);
  const available = Math.max(0, maxCapacity - totalBooked);
  const percentage = maxCapacity > 0 ? Math.round((totalBooked / maxCapacity) * 100) : 0;

  return {
    date,
    settings: settings ?? { maxCapacity: 100, startTime: '16:30:00', isOpen: true },
    bookings: dayBookings,
    stats: {
      totalBooked,
      available,
      percentage,
    },
  };
}

// ─── Get Calendar Settings ───────────────────────────────────────────────────
// Returns settings for a specific date (with defaults if not found)

export async function getCalendarSettings(date: string): Promise<CalendarSettings | {
  date: string;
  maxCapacity: number;
  startTime: string;
  isOpen: boolean;
}> {
  const settings = await db.query.calendarSettings.findFirst({
    where: eq(calendarSettings.date, date),
  });

  return settings ?? {
    date,
    maxCapacity: 100,
    startTime: '16:30:00',
    isOpen: true,
  };
}

// ─── Upsert Calendar Settings ────────────────────────────────────────────────
// Create or update calendar settings for a specific date

export async function upsertCalendarSettings(data: {
  date: string;
  maxCapacity: number;
  startTime: string;
  isOpen: boolean;
}): Promise<CalendarSettings> {
  // Check if settings exist for this date
  const existing = await db.query.calendarSettings.findFirst({
    where: eq(calendarSettings.date, data.date),
  });

  if (existing) {
    // Update existing settings
    const [updated] = await db
      .update(calendarSettings)
      .set({
        maxCapacity: data.maxCapacity,
        startTime: data.startTime,
        isOpen: data.isOpen,
        updatedAt: new Date(),
      })
      .where(eq(calendarSettings.date, data.date))
      .returning();
    
    return updated;
  } else {
    // Insert new settings
    const [inserted] = await db
      .insert(calendarSettings)
      .values({
        date: data.date,
        maxCapacity: data.maxCapacity,
        startTime: data.startTime,
        isOpen: data.isOpen,
      })
      .returning();
    
    return inserted;
  }
}

// ─── Checklist Queries ────────────────────────────────────────────────────────
// Daily visitor checklist: fetch visitors for a date and toggle visited status

export async function getChecklistForDate(date: string): Promise<Booking[]> {
  return db.query.bookings.findMany({
    where: and(
      eq(bookings.bookingDate, date),
      eq(bookings.status, 'confirmed')
    ),
    // Sort: not-visited first (name ASC), visited last (name ASC within group)
    orderBy: [
      sql`${bookings.visited} ASC`,
      sql`lower(${bookings.visitorName}) ASC`,
    ],
  });
}

export async function toggleVisited(id: string, visited: boolean): Promise<Booking | undefined> {
  const [updated] = await db
    .update(bookings)
    .set({
      visited,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, id))
    .returning();

  return updated;
}

// ─── Cancel Bookings for Date Range ──────────────────────────────────────────
// Used by admin settings page when blocking dates
// Returns cancelled bookings with email addresses for notification service

export async function cancelBookingsForDates(
  startDate: string,
  endDate: string
): Promise<Array<{ 
  id: string; 
  email: string | null; 
  visitorName: string; 
  bookingDate: string; 
  adults: number;
  children: number;
  numberOfGuests: number;
}>> {
  const cancelled = await db
    .update(bookings)
    .set({
      status: 'cancelled',
      updatedAt: new Date(),
    })
    .where(
      and(
        gte(bookings.bookingDate, startDate),
        sql`${bookings.bookingDate} <= ${endDate}`,
        eq(bookings.status, 'confirmed')
      )
    )
    .returning();

  return cancelled.map(booking => ({
    id: booking.id,
    email: booking.email,
    visitorName: booking.visitorName,
    bookingDate: booking.bookingDate,
    adults: booking.adults,
    children: booking.children,
    numberOfGuests: booking.numberOfGuests,
  }));
}
