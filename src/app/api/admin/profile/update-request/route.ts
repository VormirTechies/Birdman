import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createVerificationCode } from '@/lib/db/queries';
import { sendAdminVerificationCode } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Authorize - only logged in admin can request
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { newEmail } = await request.json();

    if (!newEmail || !newEmail.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // 2. Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Save OTP to DB
    await createVerificationCode(user.id, code, newEmail);

    // 4. Send Code via Resend
    const { success, error: emailError } = await sendAdminVerificationCode(newEmail, code);

    if (!success) {
      console.error('[API] Failed to send verification code:', emailError);
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Verification code sent to your new email' });
  } catch (error: any) {
    console.error('[API] Profile update request failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
