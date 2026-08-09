import { NextRequest, NextResponse } from 'next/server';
import {
  createFirestoreFeedback,
  InvalidFeedbackCursorError,
  listApprovedFirestoreFeedbackPage,
} from '@/lib/firebase/feedback';
import { feedbackSubmissionSchema } from '@/models/firestore/feedback';

export async function GET(request: Request) {
  try {
    const requestedLimit = Number(new URL(request.url).searchParams.get('limit') ?? 50);
    const limit = Number.isInteger(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 50;
    const cursor = new URL(request.url).searchParams.get('cursor') ?? undefined;
    const page = await listApprovedFirestoreFeedbackPage(limit, cursor);
    return NextResponse.json(
      {
        success: true,
        feedback: page.feedback,
        pagination: {
          limit,
          hasMore: page.hasMore,
          nextCursor: page.nextCursor,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error: unknown) {
    if (error instanceof InvalidFeedbackCursorError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    console.error('[API] Approved feedback fetch failed:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to load feedback' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const parsed = feedbackSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid feedback', fields: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    if (parsed.data.website) {
      return NextResponse.json({ success: true, id: 'accepted', status: 'pending' }, { status: 201 });
    }
    const result = await createFirestoreFeedback(parsed.data);
    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error: unknown) {
    console.error('[API] Feedback submission failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to submit feedback' }, { status: 500 });
  }
}
