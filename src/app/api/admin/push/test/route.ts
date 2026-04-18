import { NextResponse } from 'next/server';
import { broadcastPush } from '@/lib/push/server';

export async function POST() {
  try {
    const result = await broadcastPush({
      title: '🕊️ Emergency Emerald Flight Alert!',
      body: 'This is a manual test of the sanctuary push notification engine. If you receive this, your alerts are correctly configured.',
      url: '/admin'
    });

    return NextResponse.json({ 
        success: true, 
        message: `Test push sent to ${result.count} registered devices` 
    });
  } catch (error: any) {
    console.error('[Push API] Test failed:', error);
    return NextResponse.json(
      { error: 'Failed to send test push', details: error.message },
      { status: 500 }
    );
  }
}
