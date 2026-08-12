import { NextResponse } from 'next/server';
import { createFirebaseUser, listFirebaseUsers } from '@/lib/firebase/admin-users';
import { requireAdmin } from '@/lib/require-admin';
import { createFirebaseUserSchema } from '@/models/firebase/auth-user';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.user) return auth.response;

    const users = await listFirebaseUsers();
    return NextResponse.json({ users, total: users.length });
  } catch (error) {
    console.error('[Admin users] Failed to list Firebase Authentication users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.user) return auth.response;

  try {
    const body: unknown = await request.json();
    const parsed = createFirebaseUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please correct the highlighted fields.',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const user = await createFirebaseUser(parsed.data);
    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error: unknown) {
    const code = typeof error === 'object' && error && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';
    if (code === 'auth/email-already-exists') {
      return NextResponse.json(
        { success: false, error: 'A Firebase user with this email already exists.' },
        { status: 409 }
      );
    }
    console.error('[Admin users] Failed to create Firebase user:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to create the user. Please try again.' },
      { status: 500 }
    );
  }
}
