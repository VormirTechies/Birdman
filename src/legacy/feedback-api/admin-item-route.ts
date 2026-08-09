// Legacy Supabase-authenticated/Postgres endpoint retained for migration reference.
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { approveFeedback, deleteFeedback } from '@/lib/db/queries';

async function authorized() {
  const supabase = await createClient();
  return Boolean((await supabase.auth.getUser()).data.user);
}

export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await approveFeedback((await params).id);
  return NextResponse.json({ success: true, message: 'Feedback approved' });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await authorized())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await deleteFeedback((await params).id);
  return NextResponse.json({ success: true, message: 'Feedback deleted' });
}
