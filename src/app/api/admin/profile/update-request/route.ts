import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'node:crypto';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { sendAdminVerificationCode } from '@/lib/email';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import {
  ADMIN_EMAIL_VERIFICATIONS_COLLECTION,
  ADMIN_EMAIL_VERIFICATION_TTL_MS,
  hashAdminEmailVerificationCode,
} from '@/lib/firebase/admin-email-verification';
import { requireAdmin } from '@/lib/require-admin';

function isFirebaseUserNotFound(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'auth/user-not-found'
  );
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { newEmail } = await request.json();
    const normalizedEmail =
      typeof newEmail === 'string' ? newEmail.trim().toLowerCase() : '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (auth.user.email?.toLowerCase() === normalizedEmail) {
      return NextResponse.json(
        { error: 'New email must be different from the current email' },
        { status: 400 }
      );
    }

    try {
      const existingUser = await getAdminAuth().getUserByEmail(normalizedEmail);
      if (existingUser.uid !== auth.user.uid) {
        return NextResponse.json(
          { error: 'Email address is already in use' },
          { status: 409 }
        );
      }
    } catch (error) {
      if (!isFirebaseUserNotFound(error)) throw error;
    }

    const code = randomInt(100000, 1000000).toString();
    const reference = getAdminDb()
      .collection(ADMIN_EMAIL_VERIFICATIONS_COLLECTION)
      .doc(auth.user.uid);

    await reference.set({
      userId: auth.user.uid,
      newEmail: normalizedEmail,
      codeHash: hashAdminEmailVerificationCode(
        auth.user.uid,
        normalizedEmail,
        code
      ),
      attempts: 0,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(
        Date.now() + ADMIN_EMAIL_VERIFICATION_TTL_MS
      ),
    });

    const { success, error: emailError } = await sendAdminVerificationCode(
      normalizedEmail,
      code
    );

    if (!success) {
      console.error('[API] Failed to send verification code:', emailError);
      await reference.delete().catch((cleanupError) => {
        console.error('[API] Failed to clean up verification code:', cleanupError);
      });
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Verification code sent to your new email' });
  } catch (error: unknown) {
    console.error('[API] Profile update request failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
