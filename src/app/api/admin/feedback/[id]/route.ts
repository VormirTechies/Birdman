import { NextRequest, NextResponse } from 'next/server';
import {
  approveFirestoreFeedback,
  deleteFirestoreFeedback,
  FeedbackNotFoundError,
} from '@/lib/firebase/feedback';
import { requireAdmin } from '@/lib/require-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;
    const { id } = await params;
    await approveFirestoreFeedback(id, auth.user.uid);

    return NextResponse.json({ success: true, message: 'Feedback approved' });
  } catch (error: unknown) {
    if (error instanceof FeedbackNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('[API] Failed to approve feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;
    const { id } = await params;
    await deleteFirestoreFeedback(id);

    return NextResponse.json({ success: true, message: 'Feedback deleted' });
  } catch (error: unknown) {
    if (error instanceof FeedbackNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('[API] Failed to delete feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
