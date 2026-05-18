import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { lookupVisitor } from '@/lib/visitors';

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/admin/visitors/lookup — Real-time returning-visitor check
//   Used by InstantBookingModal to show "Returning VIP" / "Returning visitor"
//   alert as the admin types a phone/email.
//
//   Query params (at least one required):
//     ?phone=+91XXXXXXXXXX
//     ?email=visitor@example.com
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone')?.trim() || undefined;
    const email = searchParams.get('email')?.trim() || undefined;

    if (!phone && !email) {
      return NextResponse.json({ visitor: null });
    }

    const visitor = await lookupVisitor(phone, email);
    if (!visitor) {
      return NextResponse.json({ visitor: null });
    }

    // Return only the fields the modal needs — keep VIP notes private from the wire
    return NextResponse.json({
      visitor: {
        id: visitor.id,
        name: visitor.name,
        isVip: visitor.isVip,
        totalVisits: visitor.totalVisits,
        lastVisitDate: visitor.lastVisitDate,
      },
    });
  } catch (error) {
    console.error('[API] GET /admin/visitors/lookup failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
