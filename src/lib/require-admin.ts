import 'server-only';

import type { DecodedIdToken } from 'firebase-admin/auth';
import { NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

type AdminAuthResult =
  | { user: DecodedIdToken; response: null }
  | { user: null; response: NextResponse };

function unauthorized(message = 'Unauthorized') {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}

export async function requireAdmin(request: Request): Promise<AdminAuthResult> {
  const authorization = request.headers.get('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    return { user: null, response: unauthorized('Missing Firebase ID token') };
  }

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) {
    return { user: null, response: unauthorized('Missing Firebase ID token') };
  }

  try {
    const user = await getAdminAuth().verifyIdToken(token);
    const allowedEmails = process.env.ADMIN_EMAILS
      ?.split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    if (
      allowedEmails?.length
      && (!user.email || !allowedEmails.includes(user.email.toLowerCase()))
    ) {
      return {
        user: null,
        response: NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 }
        ),
      };
    }

    return { user, response: null };
  } catch (error) {
    console.warn('[Auth] Firebase ID token verification failed:', error);
    return { user: null, response: unauthorized('Invalid or expired Firebase ID token') };
  }
}
