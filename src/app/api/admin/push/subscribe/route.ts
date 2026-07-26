import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/require-admin';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { subscription } = await request.json();
    if (!subscription || typeof subscription.endpoint !== 'string') {
      return NextResponse.json({ error: 'Subscription object is required' }, { status: 400 });
    }

    const endpointHash = createHash('sha256')
      .update(subscription.endpoint)
      .digest('hex');
    const reference = getAdminDb()
      .collection('admin_push_subscriptions')
      .doc(`${auth.user.uid}_${endpointHash}`);

    const existing = await reference.get();
    const previousSubscription = existing.data()?.subscription;
    const hasChanged =
      JSON.stringify(previousSubscription ?? null) !== JSON.stringify(subscription);

    if (!existing.exists || hasChanged) {
      await reference.set(
        {
          userId: auth.user.uid,
          subscription,
          endpointHash,
          updatedAt: FieldValue.serverTimestamp(),
          ...(!existing.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
        },
        { merge: true }
      );
    }

    return NextResponse.json({ success: true, changed: !existing.exists || hasChanged });
  } catch (error: any) {
    console.error('[API] Push subscription failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
