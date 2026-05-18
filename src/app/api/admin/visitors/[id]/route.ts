import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { visitors, bookings } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const patchSchema = z.object({
  isVip: z.boolean().optional(),
  vipNotes: z.string().max(2000).optional().nullable(),
  name: z.string().min(1).max(255).optional(),
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/admin/visitors/[id] — Single Visitor Details + Booking History
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const [visitor] = await db.select().from(visitors).where(eq(visitors.id, id)).limit(1);
    if (!visitor) return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });

    const history = await db
      .select({
        id: bookings.id,
        bookingDate: bookings.bookingDate,
        bookingTime: bookings.bookingTime,
        adults: bookings.adults,
        children: bookings.children,
        status: bookings.status,
        visited: bookings.visited,
        createdAt: bookings.createdAt,
      })
      .from(bookings)
      .where(eq(bookings.visitorId, id))
      .orderBy(desc(bookings.bookingDate))
      .limit(50);

    return NextResponse.json({ visitor, history });
  } catch (error) {
    console.error('[API] GET /admin/visitors/[id] failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/admin/visitors/[id] — Update VIP Status / Notes
// ═══════════════════════════════════════════════════════════════════════════

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (parsed.data.isVip !== undefined) updates.isVip = parsed.data.isVip;
    if (parsed.data.vipNotes !== undefined) updates.vipNotes = parsed.data.vipNotes;
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;

    const [updated] = await db
      .update(visitors)
      .set(updates)
      .where(eq(visitors.id, id))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });

    return NextResponse.json({ success: true, visitor: updated });
  } catch (error) {
    console.error('[API] PATCH /admin/visitors/[id] failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DELETE /api/admin/visitors/[id] — Remove Visitor Record
// (Bookings are kept; visitor_id is nulled via ON DELETE SET NULL)
// ═══════════════════════════════════════════════════════════════════════════

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const [deleted] = await db
      .delete(visitors)
      .where(eq(visitors.id, id))
      .returning({ id: visitors.id });

    if (!deleted) return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /admin/visitors/[id] failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
