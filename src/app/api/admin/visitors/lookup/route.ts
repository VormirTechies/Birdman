import { NextRequest, NextResponse } from 'next/server';
import type { Query } from 'firebase-admin/firestore';
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

async function firstVisitorFromQuery(query: Query, label: string) {
  const snapshot = await query.limit(5).get();
  console.log('[FIRESTORE READ]', `GET /admin/visitors/lookup:${label}`, 'docs:', snapshot.size);
  const visitors = snapshot.docs
    .map((document) => normalizeVisitor(document.id, document.data()))
    .sort((left, right) =>
      String(right.lastVisitDate ?? '').localeCompare(String(left.lastVisitDate ?? ''))
    );

  return visitors[0] ?? null;
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
      console.log('[FIRESTORE READ]', 'GET /admin/visitors/lookup:id', 'docs:', snapshot.exists ? 1 : 0);
      const visitor = snapshot.exists
        ? normalizeVisitor(snapshot.id, snapshot.data() ?? {})
        : null;
      return NextResponse.json(lookupResponse(visitor));
    }

    const normalizedPhone = normalizePhone(phone);
    let visitor: NormalizedVisitor | null = null;

    // TODO: Backfill phoneNormalized, emailLowercase, and nameLowercase for all existing visitors to improve lookup coverage.
    if (normalizedPhone) {
      visitor = await firstVisitorFromQuery(
        database.collection('visitors').where('phoneNormalized', '==', normalizedPhone),
        'phoneNormalized'
      );
    }

    if (!visitor && phone) {
      visitor = await firstVisitorFromQuery(
        database.collection('visitors').where('phone', '==', phone),
        'phone'
      );
    }

    if (!visitor && email) {
      visitor = await firstVisitorFromQuery(
        database.collection('visitors').where('emailLowercase', '==', email),
        'emailLowercase'
      );
    }

    if (!visitor && email) {
      visitor = await firstVisitorFromQuery(
        database.collection('visitors').where('email', '==', email),
        'email'
      );
    }

    if (!visitor && name) {
      visitor = await firstVisitorFromQuery(
        database
          .collection('visitors')
          .where('nameLowercase', '>=', name)
          .where('nameLowercase', '<=', `${name}\uf8ff`),
        'nameLowercase'
      );
    }

    return NextResponse.json(lookupResponse(visitor));
  } catch (error) {
    console.error('[API] GET /admin/visitors/lookup failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
