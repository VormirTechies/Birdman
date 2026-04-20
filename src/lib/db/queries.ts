import { db } from './index';
import { bookings, verificationCodes, feedback, galleryImages, daySettings, appConfig, type NewBooking, type Booking, type NewFeedback, type Feedback, type DaySetting } from './schema';
import { eq, and, desc, gt, gte, lte, sql, asc, count, sum } from 'drizzle-orm';

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
}): Promise<{ bookings: Booking[]; total: number }> {
  const { status, date, minDate, search, limit = 50, offset = 0 } = params;

  // 1. BASE CONDITIONS
  const conditions = [];
  if (status) conditions.push(eq(bookings.status, status));
  if (date) conditions.push(eq(bookings.bookingDate, date));
  if (minDate) conditions.push(gt(bookings.bookingDate, minDate)); // Using gt or gte? User said "don't show past date", so today onwards.

  // 2. SEARCH LOGIC (Case Insensitive)
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

  // 3. EXECUTE QUERIES (Parallel for speed)
  const [data, totalCount] = await Promise.all([
    db.query.bookings.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [desc(bookings.createdAt)],
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
  const monthStart = today.substring(0, 7) + '-01'; // e.g. 2026-04-01
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekStr = nextWeek.toISOString().split('T')[0];

  // Server-side aggregation for performance at scale
  const [todayStats] = await db.select({
    count: sql<number>`count(*)`,
    guests: sql<number>`coalesce(sum(${bookings.numberOfGuests}), 0)`,
    visited: sql<number>`coalesce(sum(case when ${bookings.visited} = true then 1 else 0 end), 0)`,
  }).from(bookings).where(and(
    eq(bookings.bookingDate, today),
    eq(bookings.status, 'confirmed')
  ));

  const [upcomingStats] = await db.select({
    count: sql<number>`count(*)`,
    guests: sql<number>`coalesce(sum(${bookings.numberOfGuests}), 0)`,
  }).from(bookings).where(and(
    gt(bookings.bookingDate, today),
    lte(bookings.bookingDate, nextWeekStr),
    eq(bookings.status, 'confirmed')
  ));

  const [monthStats] = await db.select({
    count: sql<number>`count(*)`,
    guests: sql<number>`coalesce(sum(${bookings.numberOfGuests}), 0)`,
  }).from(bookings).where(and(
    gte(bookings.bookingDate, monthStart),
    eq(bookings.status, 'confirmed')
  ));

  const [totalStats] = await db.select({
    count: sql<number>`count(*)`,
    guests: sql<number>`coalesce(sum(${bookings.numberOfGuests}), 0)`,
  }).from(bookings);

  // Get today's capacity
  const dayConfig = await getDaySettings(today);

  return {
    todayGuests: Number(todayStats?.guests || 0),
    todayBookings: Number(todayStats?.count || 0),
    todayVisited: Number(todayStats?.visited || 0),
    todayRemaining: Number(todayStats?.count || 0) - Number(todayStats?.visited || 0),
    todayCapacity: dayConfig.maxGuests,
    todaySlotsUsed: Number(todayStats?.guests || 0),
    todaySlotsOpen: dayConfig.maxGuests - Number(todayStats?.guests || 0),
    upcomingGuests: Number(upcomingStats?.guests || 0),
    upcomingBookings: Number(upcomingStats?.count || 0),
    monthGuests: Number(monthStats?.guests || 0),
    monthBookings: Number(monthStats?.count || 0),
    totalGuests: Number(totalStats?.guests || 0),
    totalBookings: Number(totalStats?.count || 0),
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
    orderBy: [sql`${galleryImages.order} asc`],
  });
}

export async function addGalleryImage(url: string, caption?: string) {
  const [inserted] = await db
    .insert(galleryImages)
    .values({ url, caption, order: 0 })
    .returning();
  return inserted;
}

export async function deleteGalleryImage(id: string) {
  await db.delete(galleryImages).where(eq(galleryImages.id, id));
}

// ═══════════════════════════════════════════════════════════════════════════
// v2.0 QUERIES — Day Settings, Availability, Calendar, Checklist
// ═══════════════════════════════════════════════════════════════════════════

// ─── App Config ──────────────────────────────────────────────────────────────

const CONFIG_DEFAULTS: Record<string, string> = {
  default_slot_time: '16:30',
  default_max_guests: '100',
};

export async function getAppConfig(key: string): Promise<string> {
  const row = await db.query.appConfig.findFirst({
    where: eq(appConfig.key, key),
  });
  return row?.value ?? CONFIG_DEFAULTS[key] ?? '';
}

export async function setAppConfig(key: string, value: string): Promise<void> {
  await db.insert(appConfig)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appConfig.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function getAllAppConfig(): Promise<Record<string, string>> {
  const rows = await db.query.appConfig.findMany();
  const config: Record<string, string> = { ...CONFIG_DEFAULTS };
  for (const row of rows) {
    config[row.key] = row.value;
  }
  return config;
}

// ─── Day Settings ────────────────────────────────────────────────────────────

export async function getDaySettings(date: string): Promise<{
  slotTime: string;
  maxGuests: number;
  isBlocked: boolean;
  blockReason: string | null;
}> {
  const row = await db.query.daySettings.findFirst({
    where: eq(daySettings.date, date),
  });

  const defaults = await getAllAppConfig();

  return {
    slotTime: row?.slotTime ?? defaults.default_slot_time ?? '16:30',
    maxGuests: row?.maxGuests ?? parseInt(defaults.default_max_guests ?? '100'),
    isBlocked: row?.isBlocked ?? false,
    blockReason: row?.blockReason ?? null,
  };
}

export async function upsertDaySettings(date: string, data: {
  slotTime?: string | null;
  maxGuests?: number | null;
  isBlocked?: boolean;
  blockReason?: string | null;
}): Promise<DaySetting> {
  const [result] = await db.insert(daySettings)
    .values({
      date,
      slotTime: data.slotTime ?? null,
      maxGuests: data.maxGuests ?? null,
      isBlocked: data.isBlocked ?? false,
      blockReason: data.blockReason ?? null,
    })
    .onConflictDoUpdate({
      target: daySettings.date,
      set: {
        ...(data.slotTime !== undefined && { slotTime: data.slotTime }),
        ...(data.maxGuests !== undefined && { maxGuests: data.maxGuests }),
        ...(data.isBlocked !== undefined && { isBlocked: data.isBlocked }),
        ...(data.blockReason !== undefined && { blockReason: data.blockReason }),
        updatedAt: new Date(),
      },
    })
    .returning();
  return result;
}

// ─── Block / Unblock Dates ───────────────────────────────────────────────────

export async function blockDate(date: string, reason?: string): Promise<{
  setting: DaySetting;
  affectedBookings: Booking[];
}> {
  // 1. Block the date
  const setting = await upsertDaySettings(date, {
    isBlocked: true,
    blockReason: reason ?? null,
  });

  // 2. Find and cancel affected bookings
  const affected = await db.query.bookings.findMany({
    where: and(
      eq(bookings.bookingDate, date),
      eq(bookings.status, 'confirmed')
    ),
  });

  // 3. Cancel them
  if (affected.length > 0) {
    await db.update(bookings)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(
        eq(bookings.bookingDate, date),
        eq(bookings.status, 'confirmed')
      ));
  }

  return { setting, affectedBookings: affected };
}

export async function unblockDate(date: string): Promise<DaySetting> {
  return upsertDaySettings(date, { isBlocked: false, blockReason: null });
}

export async function getBlockedDates(startDate: string, endDate: string): Promise<DaySetting[]> {
  return db.query.daySettings.findMany({
    where: and(
      gte(daySettings.date, startDate),
      lte(daySettings.date, endDate),
      eq(daySettings.isBlocked, true)
    ),
  });
}

// ─── Date Availability ───────────────────────────────────────────────────────

export async function getDateAvailability(date: string): Promise<{
  slotTime: string;
  maxGuests: number;
  bookedGuests: number;
  remaining: number;
  isBlocked: boolean;
  bookingCount: number;
}> {
  const config = await getDaySettings(date);

  const [stats] = await db.select({
    totalGuests: sql<number>`coalesce(sum(${bookings.numberOfGuests}), 0)`,
    bookingCount: sql<number>`count(*)`,
  }).from(bookings).where(and(
    eq(bookings.bookingDate, date),
    eq(bookings.status, 'confirmed')
  ));

  const bookedGuests = Number(stats?.totalGuests || 0);

  return {
    slotTime: config.slotTime,
    maxGuests: config.maxGuests,
    bookedGuests,
    remaining: Math.max(0, config.maxGuests - bookedGuests),
    isBlocked: config.isBlocked,
    bookingCount: Number(stats?.bookingCount || 0),
  };
}

export async function getAvailabilityRange(startDate: string, endDate: string): Promise<Array<{
  date: string;
  slotTime: string;
  maxGuests: number;
  bookedGuests: number;
  remaining: number;
  isBlocked: boolean;
}>> {
  // 1. Get all day settings in range
  const settings = await db.query.daySettings.findMany({
    where: and(
      gte(daySettings.date, startDate),
      lte(daySettings.date, endDate)
    ),
  });
  const settingsMap = new Map(settings.map(s => [s.date, s]));

  // 2. Get booking aggregates per date
  const bookingAgg = await db.select({
    date: bookings.bookingDate,
    totalGuests: sql<number>`coalesce(sum(${bookings.numberOfGuests}), 0)`,
  }).from(bookings).where(and(
    gte(bookings.bookingDate, startDate),
    lte(bookings.bookingDate, endDate),
    eq(bookings.status, 'confirmed')
  )).groupBy(bookings.bookingDate);
  const bookingMap = new Map(bookingAgg.map(b => [b.date, Number(b.totalGuests)]));

  // 3. Get global defaults
  const defaults = await getAllAppConfig();
  const defaultTime = defaults.default_slot_time ?? '16:30';
  const defaultMax = parseInt(defaults.default_max_guests ?? '100');

  // 4. Build result for each date in range
  const results: Array<{
    date: string;
    slotTime: string;
    maxGuests: number;
    bookedGuests: number;
    remaining: number;
    isBlocked: boolean;
  }> = [];

  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const setting = settingsMap.get(dateStr);
    const booked = bookingMap.get(dateStr) ?? 0;
    const maxGuests = setting?.maxGuests ?? defaultMax;

    results.push({
      date: dateStr,
      slotTime: setting?.slotTime ?? defaultTime,
      maxGuests,
      bookedGuests: booked,
      remaining: Math.max(0, maxGuests - booked),
      isBlocked: setting?.isBlocked ?? false,
    });
  }

  return results;
}

// ─── Calendar Month View ─────────────────────────────────────────────────────

export async function getCalendarMonth(year: number, month: number): Promise<Array<{
  date: string;
  bookingCount: number;
  totalGuests: number;
  maxGuests: number;
  slotTime: string;
  isBlocked: boolean;
  percentFull: number;
}>> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

  // Last day of month
  const lastDay = new Date(endYear, month === 12 ? 0 : month, 0).getDate();
  const lastDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  return getAvailabilityRange(startDate, lastDate).then(range =>
    range.map(day => ({
      ...day,
      bookingCount: 0, // Will be enriched below
      totalGuests: day.bookedGuests,
      percentFull: day.maxGuests > 0 ? Math.round((day.bookedGuests / day.maxGuests) * 100) : 0,
    }))
  );
}

// ─── Daily Checklist ─────────────────────────────────────────────────────────

export async function getDailyChecklist(date: string): Promise<{
  bookings: Booking[];
  totalGuests: number;
  visitedCount: number;
  remainingCount: number;
}> {
  const dayBookings = await db.query.bookings.findMany({
    where: and(
      eq(bookings.bookingDate, date),
      eq(bookings.status, 'confirmed')
    ),
    orderBy: [asc(bookings.bookingTime), asc(bookings.visitorName)],
  });

  const totalGuests = dayBookings.reduce((s, b) => s + b.numberOfGuests, 0);
  const visitedCount = dayBookings.filter(b => b.visited).length;

  return {
    bookings: dayBookings,
    totalGuests,
    visitedCount,
    remainingCount: dayBookings.length - visitedCount,
  };
}

export async function toggleVisited(bookingId: string, visited: boolean): Promise<Booking | undefined> {
  const [updated] = await db.update(bookings)
    .set({
      visited,
      ...(visited && { status: 'completed' as const }),
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId))
    .returning();
  return updated;
}

// ─── Get Bookings by Date for Time Change Notifications ─────────────────────

export async function getConfirmedBookingsByDate(date: string): Promise<Booking[]> {
  return db.query.bookings.findMany({
    where: and(
      eq(bookings.bookingDate, date),
      eq(bookings.status, 'confirmed')
    ),
  });
}
