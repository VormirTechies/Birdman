import { NextRequest, NextResponse } from 'next/server';
import { broadcastPush } from '@/lib/push/server';
import { requireAdmin } from '@/lib/require-admin';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const result = await broadcastPush({
      title: 'Emergency Emerald Flight Alert!',
      body: 'This is a manual test of the sanctuary push notification engine. If you receive this, your alerts are correctly configured.',
      url: '/admin',
    });

    return NextResponse.json({
      success: true,
      message: `Test push sent to ${result.count} registered devices`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown push error';
    console.error('[Push API] Test failed:', error);
    return NextResponse.json(
      { error: 'Failed to send test push', details: message },
      { status: 500 }
    );
  }
}
