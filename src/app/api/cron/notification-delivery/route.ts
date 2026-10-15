import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { runNotificationDeliveryWorker } from '@/lib/firebase/notification-delivery';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 180;
export async function POST(request: Request) {
  const secret = process.env.NOTIFICATIONS_WORKER_SECRET;
  const actual = Buffer.from(request.headers.get('authorization') || '');
  const expected = Buffer.from(`Bearer ${secret || ''}`);
  if (!secret || secret.trim().length < 32 || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    const result = await runNotificationDeliveryWorker();
    console.info('[Notification delivery]', result);
    return NextResponse.json({ success: true, ...result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Notification delivery is temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
