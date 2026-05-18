import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { visitors, bookings } from '@/lib/db/schema';
import { eq, desc, ilike, or, and, count, sql } from 'drizzle-orm';

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/admin/visitors — List Visitors (Admin)
//   ?vip=true         — only VIP visitors
//   ?search=           — name/phone/email search
//   ?page=&limit=      — pagination
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const vipOnly = searchParams.get('vip') === 'true';
    const search = searchParams.get('search')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    if (vipOnly) conditions.push(eq(visitors.isVip, true));
    if (search) {
      conditions.push(
        or(
          ilike(visitors.name, `%${search}%`),
          ilike(visitors.phone, `%${search}%`),
          ilike(visitors.email, `%${search}%`)
        )!
      );
    }

    const where = conditions.length > 1
      ? and(...conditions)
      : conditions.length === 1
        ? conditions[0]
        : undefined;

    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(visitors)
        .where(where)
        .orderBy(desc(visitors.lastVisitDate))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(visitors).where(where),
    ]);

    return NextResponse.json({
      visitors: rows,
      total: Number(total),
      page,
      limit,
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (error) {
    console.error('[API] GET /admin/visitors failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
