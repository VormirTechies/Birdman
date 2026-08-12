import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (!auth.user) return auth.response;

    const { subscription } = await request.json();
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription object is required' }, { status: 400 });
    }

    // 🔥 Self-Healing: Ensure the table exists before attempting to write 
    // This bypasses any drizzle-kit push delays in the pooler environment.
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "push_subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "subscription" text NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    const subscriptionString = JSON.stringify(subscription);
    
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, auth.user.uid));
    
    await db.insert(pushSubscriptions).values({
        userId: auth.user.uid,
        subscription: subscriptionString
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('[API] Push subscription failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
