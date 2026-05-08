import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const {
      data: { users },
      error,
    } = await adminClient.auth.admin.listUsers({ perPage: 1000 });

    if (error) {
      console.error('[API] Failed to list users:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const formatted = users.map((u) => ({
      id: u.id,
      email: u.email ?? '',
      name:
        (u.user_metadata?.name as string | undefined) ??
        (u.user_metadata?.full_name as string | undefined) ??
        u.email?.split('@')[0] ??
        'Unknown',
      avatarUrl: (u.user_metadata?.avatar_url as string | undefined) ?? null,
      createdAt: u.created_at,
    }));

    return NextResponse.json({ users: formatted, total: formatted.length });
  } catch (error: unknown) {
    console.error('[API] Unexpected error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
