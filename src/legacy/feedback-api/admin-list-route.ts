// Legacy Supabase-authenticated/Postgres endpoint retained for migration reference.
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPendingFeedback } from '@/lib/db/queries';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(await getPendingFeedback());
}
