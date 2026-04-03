import { NextRequest, NextResponse } from 'next/server';
import { createFeedback } from '@/lib/db/queries';
import { sendPushToAllAdmins } from '@/lib/push';

export async function POST(request: NextRequest) {
  try {
    const { name, rating, message } = await request.json();

    if (!message || !rating) {
      return NextResponse.json({ error: 'Message and rating are required' }, { status: 400 });
    }

    const feedback = await createFeedback({
      visitorName: name || 'Anonymous',
      rating,
      message,
    });

    // Notify Admins
    await sendPushToAllAdmins({
      title: 'New Feedback Received!',
      body: `"${message.substring(0, 50)}${message.length > 50 ? '...' : ''}" - from ${name || 'Anonymous'}`,
      url: '/admin/feedback'
    });

    return NextResponse.json({ success: true, feedback }, { status: 201 });
  } catch (error: any) {
    console.error('[API] Feedback submission failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
