import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    
    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, user.id));
    
    await db.insert(pushSubscriptions).values({
        userId: user.id,
        subscription: subscriptionString
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API] Push subscription failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
