import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getValidVerificationCode, deleteVerificationCode } from '@/lib/db/queries';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Authorize
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await request.json();

    if (!code || code.length !== 6) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // 2. Validate Code in DB
    const verification = await getValidVerificationCode(user.id, code);

    if (!verification) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    // 3. Update Email in Supabase Auth (Requires Service Role)
    const adminClient = createAdminClient();
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      user.id,
      { email: verification.newEmail, email_confirm: true }
    );

    if (updateError) {
      console.error('[API] Auth update failed:', updateError);
      return NextResponse.json({ error: 'Failed to update credentials' }, { status: 500 });
    }

    // 4. Cleanup Code
    await deleteVerificationCode(verification.id);

    // 5. Explicitly Sign Out
    await supabase.auth.signOut();

    return NextResponse.json({ 
      success: true, 
      message: 'Email updated successfully. Please login with your new credentials.' 
    });
  } catch (error: any) {
    console.error('[API] Profile verification failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
