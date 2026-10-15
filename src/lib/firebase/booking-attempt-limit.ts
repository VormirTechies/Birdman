import 'server-only';
import { createHash } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { getAdminDb } from './admin';

const WINDOW_MS = 15 * 60 * 1000;
export async function limitBookingAttempts(request: Request, scope: 'create' | 'self-service') {
  // Use the proxy-appended address rather than an arbitrary leading address.
  const ip = request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const id = createHash('sha256').update(`${scope}:${ip}`).digest('hex');
  const reference = getAdminDb().collection('_bookingAttemptLimits').doc(id);
  const maximum = scope === 'create' ? 10 : 20;
  try {
    const retryAfter = await getAdminDb().runTransaction(async transaction => {
      const snapshot = await transaction.get(reference);
      const data = snapshot.data();
      const now = Date.now();
      const resetsAt = data?.resetsAt?.toMillis?.() ?? 0;
      const active = resetsAt > now;
      const count = active ? Number(data?.count ?? 0) : 0;
      if (count >= maximum) return Math.max(1, Math.ceil((resetsAt - now) / 1000));
      transaction.set(reference, { count: count + 1, resetsAt: Timestamp.fromMillis(active ? resetsAt : now + WINDOW_MS) });
      return 0;
    });
    if (retryAfter) return NextResponse.json({ success: false, code: 'BOOKING_RATE_LIMIT', error: 'Too many booking attempts. Please wait and try again.' }, { status: 429, headers: { 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store' } });
    return null;
  } catch {
    return NextResponse.json({ success: false, error: 'Booking services are temporarily unavailable. Please try again later.' }, { status: 503 });
  }
}
