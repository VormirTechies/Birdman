import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const result = await getAdminAuth().listUsers(1000);
    const users = result.users.map((user) => ({
      id: user.uid,
      email: user.email ?? '',
      name: user.displayName ?? user.email?.split('@')[0] ?? 'Unknown',
      avatarUrl: user.photoURL ?? null,
      createdAt: user.metadata.creationTime,
    }));

    return NextResponse.json({ users, total: users.length });
  } catch (error: unknown) {
    console.error('[API] Failed to list Firebase users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
