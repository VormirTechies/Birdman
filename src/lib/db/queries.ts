import { db } from './index';
import { bookings, verificationCodes, feedback, galleryImages, type NewBooking, type Booking, type NewFeedback, type Feedback } from './schema';
import { eq, and, desc, gt, sql } from 'drizzle-orm';

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
  
  const all = await db.query.bookings.findMany();
  
  const totalVisitors = all.reduce((sum, b) => sum + b.numberOfGuests, 0);
  const todayVisitors = all
    .filter(b => b.bookingDate === today && b.status === 'confirmed')
    .reduce((sum, b) => sum + b.numberOfGuests, 0);
  const upcomingVisitors = all
    .filter(b => b.bookingDate > today && b.status === 'confirmed')
    .reduce((sum, b) => sum + b.numberOfGuests, 0);

  return {
    totalVisitors,
    todayVisitors,
    upcomingVisitors,
    totalBookings: all.length,
    todayBookings: all.filter(b => b.bookingDate === today).length,
    upcomingBookings: all.filter(b => b.bookingDate > today).length
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
