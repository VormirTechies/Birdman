import { NextRequest, NextResponse } from 'next/server';
import {
  approveFirestoreFeedback,
  deleteFirestoreFeedback,
  FeedbackRecommendationLimitError,
  FeedbackNotFoundError,
  InvalidFeedbackStateError,
  setFirestoreFeedbackRecommended,
} from '@/lib/firebase/feedback';
import { requireAdmin } from '@/lib/require-admin';
import { revalidatePath, revalidateTag } from 'next/cache';
import { z } from 'zod';

const feedbackActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve') }).strict(),
  z.object({ action: z.literal('recommend'), isRecommended: z.boolean() }).strict(),
]);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;
    const { id } = await params;
    const parsed = feedbackActionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid feedback action' }, { status: 400 });
    }

    if (parsed.data.action === 'approve') {
      await approveFirestoreFeedback(id, auth.user.uid);
    } else {
      await setFirestoreFeedbackRecommended(id, parsed.data.isRecommended);
    }

    revalidatePath('/');
    revalidatePath('/feedback');
    revalidateTag('recommended-feedback', { expire: 0 });

    return NextResponse.json({
      success: true,
      message: parsed.data.action === 'approve'
        ? 'Feedback approved'
        : parsed.data.isRecommended
          ? 'Feedback recommended'
          : 'Recommendation removed',
    });
  } catch (error: unknown) {
    if (error instanceof FeedbackNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (
      error instanceof FeedbackRecommendationLimitError ||
      error instanceof InvalidFeedbackStateError
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
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
    revalidatePath('/');
    revalidatePath('/feedback');
    revalidateTag('recommended-feedback', { expire: 0 });

    return NextResponse.json({ success: true, message: 'Feedback deleted' });
  } catch (error: unknown) {
    if (error instanceof FeedbackNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error('[API] Failed to delete feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
