import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { approveFeedback, deleteFeedback } from '@/lib/db/queries';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    await approveFeedback(id);

    return NextResponse.json({ success: true, message: 'Feedback approved' });
  } catch (error: any) {
    console.error('[API] Failed to approve feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    await deleteFeedback(id);

    return NextResponse.json({ success: true, message: 'Feedback deleted' });
  } catch (error: any) {
    console.error('[API] Failed to delete feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
