import { db } from '@/lib/db';
import { visitors, bookings } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import type { Visitor } from '@/lib/db/schema';

// ═══════════════════════════════════════════════════════════════════════════
// VISITOR IDENTITY LAYER
// Matches bookings to persistent visitor profiles by phone OR email.
// Creates a new profile if no match is found.
// ═══════════════════════════════════════════════════════════════════════════

export interface VisitorMatchResult {
  visitor: Visitor;
  isVip: boolean;
  isReturning: boolean; // true if this visitor has booked before
}

/**
 * Finds an existing visitor by phone OR email, or creates a new one.
 * Updates name, lastVisitDate, and totalVisits on each match.
 */
export async function findOrCreateVisitor(
  phone: string | null | undefined,
  email: string | null | undefined,
  name: string,
  bookingDate: string
): Promise<VisitorMatchResult> {
  const cleanPhone = phone?.trim() || null;
  const cleanEmail = email?.trim() || null;

  // ── Try to find existing visitor by phone OR email ───────────────────────
  let existing: Visitor | null = null;

  if (cleanPhone || cleanEmail) {
    const conditions = [];
    if (cleanPhone) conditions.push(eq(visitors.phone, cleanPhone));
    if (cleanEmail) conditions.push(eq(visitors.email, cleanEmail));

    const results = await db
      .select()
      .from(visitors)
      .where(conditions.length === 2 ? or(...conditions) : conditions[0])
      .limit(1);

    existing = results[0] ?? null;
  }

  // ── Existing visitor found — update their record ─────────────────────────
  if (existing) {
    const updated = await db
      .update(visitors)
      .set({
        name, // Keep name current
        // Update phone/email if the new booking provides one we didn't have
        ...(cleanPhone && !existing.phone ? { phone: cleanPhone } : {}),
        ...(cleanEmail && !existing.email ? { email: cleanEmail } : {}),
        totalVisits: existing.totalVisits + 1,
        lastVisitDate: bookingDate,
        updatedAt: new Date(),
      })
      .where(eq(visitors.id, existing.id))
      .returning();

    const visitor = updated[0];
    return { visitor, isVip: visitor.isVip, isReturning: true };
  }

  // ── No match — create new visitor profile ────────────────────────────────
  const created = await db
    .insert(visitors)
    .values({
      name,
      phone: cleanPhone,
      email: cleanEmail,
      isVip: false,
      totalVisits: 1,
      firstVisitDate: bookingDate,
      lastVisitDate: bookingDate,
    })
    .returning();

  const visitor = created[0];
  return { visitor, isVip: false, isReturning: false };
}

/**
 * Lookup a visitor by phone OR email without creating one.
 * Used by the InstantBookingModal for real-time returning-visitor detection.
 */
export async function lookupVisitor(
  phone?: string,
  email?: string
): Promise<Visitor | null> {
  const cleanPhone = phone?.trim() || null;
  const cleanEmail = email?.trim() || null;

  if (!cleanPhone && !cleanEmail) return null;

  const conditions = [];
  if (cleanPhone) conditions.push(eq(visitors.phone, cleanPhone));
  if (cleanEmail) conditions.push(eq(visitors.email, cleanEmail));

  const results = await db
    .select()
    .from(visitors)
    .where(conditions.length === 2 ? or(...conditions) : conditions[0])
    .limit(1);

  return results[0] ?? null;
}

/**
 * Links a booking to a visitor profile after booking creation.
 * Call this after inserting the booking row.
 */
export async function linkBookingToVisitor(
  bookingId: string,
  visitorId: string
): Promise<void> {
  await db
    .update(bookings)
    .set({ visitorId })
    .where(eq(bookings.id, bookingId));
}
