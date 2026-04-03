import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPendingFeedback } from '@/lib/db/queries';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pending = await getPendingFeedback();
    
    return NextResponse.json(pending.map(f => ({
        id: f.id,
        visitorName: f.visitorName,
        message: f.message,
        rating: f.rating,
        isApproved: f.isApproved,
        createdAt: f.createdAt.toISOString()
    })));
  } catch (error: any) {
    console.error('[API] Failed to fetch feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
