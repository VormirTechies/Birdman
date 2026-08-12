import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { currentPassword, newPassword } = await request.json();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email!, password: currentPassword });
  if (signInError) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return error
    ? NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
    : NextResponse.json({ success: true });
}
