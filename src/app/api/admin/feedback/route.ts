import { NextResponse } from 'next/server';
import {
  countRecommendedFirestoreFeedback,
  InvalidFeedbackCursorError,
  listAdminFirestoreFeedbackPage,
} from '@/lib/firebase/feedback';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;
    const { searchParams } = new URL(request.url);
    const requestedStatus = searchParams.get('status') ?? 'pending';
    if (requestedStatus !== 'pending' && requestedStatus !== 'approved') {
      return NextResponse.json({ error: 'Invalid feedback status' }, { status: 400 });
    }
    const requestedLimit = Number(searchParams.get('limit') ?? '10');
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(50, Math.max(1, Math.floor(requestedLimit)))
      : 10;
    const cursor = searchParams.get('cursor') || undefined;
    const [page, recommendedCount] = await Promise.all([
      listAdminFirestoreFeedbackPage(requestedStatus, limit, cursor),
      countRecommendedFirestoreFeedback(),
    ]);

    return NextResponse.json({
      success: true,
      feedback: page.feedback,
      pagination: {
        limit,
        hasMore: page.hasMore,
        nextCursor: page.nextCursor,
      },
      recommendedCount,
    });
  } catch (error: unknown) {
    if (error instanceof InvalidFeedbackCursorError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('[API] Failed to fetch feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
