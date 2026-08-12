import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const adminClient = createAdminClient();
  const { data: { users }, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  if (error) return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  const formatted = users.map((item) => ({
    id: item.id,
    email: item.email ?? '',
    name: item.user_metadata?.name ?? item.user_metadata?.full_name ?? item.email?.split('@')[0] ?? 'Unknown',
    avatarUrl: item.user_metadata?.avatar_url ?? null,
    createdAt: item.created_at,
  }));
  return NextResponse.json({ users: formatted, total: formatted.length });
}
