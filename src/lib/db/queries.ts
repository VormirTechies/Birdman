import { db } from './index';
import { bookings, type NewBooking, type Booking } from './schema';
import { eq, and, desc } from 'drizzle-orm';

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
  limit?: number;
  offset?: number;
}): Promise<Booking[]> {
  const { status, date, limit = 50, offset = 0 } = params;

  let query = db.query.bookings.findMany({
    limit,
    offset,
    orderBy: [desc(bookings.createdAt)],
  });

  // Apply filters
  const conditions = [];
  if (status) {
    conditions.push(eq(bookings.status, status));
  }
  if (date) {
    conditions.push(eq(bookings.bookingDate, date));
  }

  if (conditions.length > 0) {
    query = db.query.bookings.findMany({
      where: conditions.length === 1 ? conditions[0] : and(...conditions),
      limit,
      offset,
      orderBy: [desc(bookings.createdAt)],
    });
  }

  return query;
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
