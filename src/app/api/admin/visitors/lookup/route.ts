import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import {
  normalizePhone,
  normalizeVisitor,
  type NormalizedVisitor,
} from '@/lib/firebase/visitors';
import { requireAdmin } from '@/lib/require-admin';

function lookupResponse(visitor: NormalizedVisitor | null) {
  if (!visitor) return { visitor: null };

  return {
    visitor: {
      id: visitor.id,
      name: visitor.name,
      isVip: visitor.isVip,
      totalVisits: visitor.totalVisits,
      lastVisitDate: visitor.lastVisitDate,
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id')?.trim();
    const phone = searchParams.get('phone')?.trim();
    const email = searchParams.get('email')?.trim().toLowerCase();
    const name = searchParams.get('name')?.trim().toLowerCase();

    if (!id && !phone && !email && !name) {
      return NextResponse.json({ visitor: null });
    }

    const database = getAdminDb();

    if (id) {
      const snapshot = await database.collection('visitors').doc(id).get();
      const visitor = snapshot.exists
        ? normalizeVisitor(snapshot.id, snapshot.data() ?? {})
        : null;
      return NextResponse.json(lookupResponse(visitor));
    }

    const snapshot = await database.collection('visitors').get();
    const normalizedPhone = normalizePhone(phone);
    const visitors = snapshot.docs
      .map((document) => normalizeVisitor(document.id, document.data()))
      .filter((visitor) => {
        const phoneMatches = normalizedPhone
          ? normalizePhone(visitor.phone) === normalizedPhone
          : false;
        const emailMatches = email
          ? visitor.email?.trim().toLowerCase() === email
          : false;
        const nameMatches = name
          ? visitor.name.trim().toLowerCase().includes(name)
          : false;

        return phoneMatches || emailMatches || nameMatches;
      })
      .sort((left, right) =>
        String(right.lastVisitDate ?? '').localeCompare(String(left.lastVisitDate ?? ''))
      );

    return NextResponse.json(lookupResponse(visitors[0] ?? null));
  } catch (error) {
    console.error('[API] GET /admin/visitors/lookup failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
