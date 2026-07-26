import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/require-admin';

async function verifyCurrentPassword(email: string, password: string) {
  const apiKey =
    process.env.FIREBASE_WEB_API_KEY ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (!apiKey) {
    throw new Error('Missing Firebase Web API key');
  }

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: false,
      }),
      cache: 'no-store',
    }
  );

  if (response.ok) return true;

  const data = (await response.json().catch(() => null)) as {
    error?: { message?: string };
  } | null;
  const code = data?.error?.message ?? '';

  if (
    code.includes('INVALID_PASSWORD') ||
    code.includes('INVALID_LOGIN_CREDENTIALS') ||
    code.includes('EMAIL_NOT_FOUND')
  ) {
    return false;
  }

  throw new Error(`Firebase password verification failed: ${code || response.status}`);
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    if (!auth.user.email) {
      return NextResponse.json(
        { error: 'Authenticated user does not have an email address' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'currentPassword and newPassword are required' },
        { status: 400 },
      );
    }

    // Server-side validation of new password requirements
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 },
      );
    }
    if (!/[A-Z]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter' },
        { status: 400 },
      );
    }
    if (!/[0-9]/.test(newPassword)) {
      return NextResponse.json(
        { error: 'Password must contain at least one number' },
        { status: 400 },
      );
    }

    const currentPasswordIsValid = await verifyCurrentPassword(
      auth.user.email,
      currentPassword
    );
    if (!currentPasswordIsValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    await getAdminAuth().updateUser(auth.user.uid, { password: newPassword });

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error: unknown) {
    console.error('[API] Failed to change Firebase password:', error);
    return NextResponse.json(
      { error: 'Failed to update password. Please try again.' },
      { status: 500 }
    );
  }
}
