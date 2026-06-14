import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAdminDb } from '@/lib/firebase/admin';
import {
  checkinBelongsToVisitor,
  normalizeCheckin,
  normalizeVisitor,
} from '@/lib/firebase/visitors';
import { requireAdmin } from '@/lib/require-admin';

const patchSchema = z.object({
  isVip: z.boolean().optional(),
  vipNotes: z.string().max(2000).optional().nullable(),
  name: z.string().min(1).max(255).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getVisitorReference(id: string) {
  const reference = getAdminDb().collection('visitors').doc(id);
  const snapshot = await reference.get();
  return { reference, snapshot };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { id } = await params;
    const { snapshot } = await getVisitorReference(id);
    if (!snapshot.exists) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    const checkinsSnapshot = await getAdminDb().collection('visitor_checkins').get();
    const history = checkinsSnapshot.docs
      .filter((document) => checkinBelongsToVisitor(document.data(), id))
      .map(normalizeCheckin)
      .sort((left, right) =>
        String(right.bookingDate ?? '').localeCompare(String(left.bookingDate ?? ''))
      )
      .slice(0, 50);

    const visitor = normalizeVisitor(snapshot.id, snapshot.data() ?? {});

    return NextResponse.json({
      visitor,
      history,
      bookings: history,
    });
  } catch (error) {
    console.error('[API] GET /admin/visitors/[id] failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { id } = await params;
    const { reference, snapshot } = await getVisitorReference(id);
    if (!snapshot.exists) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse({
      isVip: body.isVip ?? body.vip ?? body.is_vip,
      vipNotes: body.vipNotes ?? body.vip_notes,
      name: body.name ?? body.visitorName ?? body.visitor_name,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (parsed.data.isVip !== undefined) updates.isVip = parsed.data.isVip;
    if (parsed.data.vipNotes !== undefined) updates.vipNotes = parsed.data.vipNotes;
    if (parsed.data.name !== undefined) updates.name = parsed.data.name;

    await reference.update(updates);
    const updatedSnapshot = await reference.get();
    const visitor = normalizeVisitor(
      updatedSnapshot.id,
      updatedSnapshot.data() ?? {}
    );

    return NextResponse.json({ success: true, visitor });
  } catch (error) {
    console.error('[API] PATCH /admin/visitors/[id] failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { id } = await params;
    const { reference, snapshot } = await getVisitorReference(id);
    if (!snapshot.exists) {
      return NextResponse.json({ error: 'Visitor not found' }, { status: 404 });
    }

    await reference.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] DELETE /admin/visitors/[id] failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
