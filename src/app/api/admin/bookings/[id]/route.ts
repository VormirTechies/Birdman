import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { bookings, visitors } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { findOrCreateVisitor } from '@/lib/visitors';

const patchSchema = z.object({
  isVip: z.boolean(),
  vipNotes: z.string().max(500).optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/admin/bookings/[id] — Update booking's visitor VIP status
// Finds or creates a visitor profile, links it to the booking if needed,
// then updates the visitor's isVip flag.
// ═══════════════════════════════════════════════════════════════════════════

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: bookingId } = await params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { isVip, vipNotes } = parsed.data;

    // 1. Get the booking
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, bookingId),
      with: { visitor: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    let visitorId = booking.visitorId;

    // 2. If no visitor profile linked, find or create one and link it
    if (!visitorId) {
      const result = await findOrCreateVisitor(
        booking.phone,
        booking.email,
        booking.visitorName,
        booking.bookingDate,
      );
      visitorId = result.visitor.id;

      // Link booking to visitor
      await db
        .update(bookings)
        .set({ visitorId })
        .where(eq(bookings.id, bookingId));
    }

    // 3. Update visitor's VIP status
    const updateData: Record<string, unknown> = { isVip, updatedAt: new Date() };
    if (vipNotes !== undefined) updateData.vipNotes = vipNotes;

    const [updated] = await db
      .update(visitors)
      .set(updateData)
      .where(eq(visitors.id, visitorId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, visitor: updated });
  } catch (error) {
    console.error('[API] PATCH /admin/bookings/[id] failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
