import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/require-admin';

const COLLECTION = 'feedback';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { id } = await params;
    const reference = getAdminDb().collection(COLLECTION).doc(id);
    const snapshot = await reference.get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    await reference.update({
      isApproved: true,
      approvedAt: Timestamp.now(),
      approvedBy: auth.user.uid,
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback approved',
    });
  } catch (error: unknown) {
    console.error('[API] Failed to approve Firebase feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { id } = await params;
    const reference = getAdminDb().collection(COLLECTION).doc(id);
    const snapshot = await reference.get();

    if (!snapshot.exists) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    await reference.delete();

    return NextResponse.json({
      success: true,
      message: 'Feedback deleted',
    });
  } catch (error: unknown) {
    console.error('[API] Failed to delete Firebase feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
