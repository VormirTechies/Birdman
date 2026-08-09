import { NextResponse } from 'next/server';
import { listPendingFirestoreFeedback } from '@/lib/firebase/feedback';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;
    return NextResponse.json(await listPendingFirestoreFeedback());
  } catch (error: unknown) {
    console.error('[API] Failed to fetch feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
