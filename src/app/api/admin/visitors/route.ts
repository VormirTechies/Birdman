import { NextRequest, NextResponse } from 'next/server';
import type { OrderByDirection, Query } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import {
  normalizeVisitor,
  type NormalizedVisitor,
} from '@/lib/firebase/visitors';
import { requireAdmin } from '@/lib/require-admin';

type SortField =
  | 'name'
  | 'phone'
  | 'email'
  | 'isVip'
  | 'totalVisits'
  | 'firstVisitDate'
  | 'lastVisitDate'
  | 'createdAt'
  | 'updatedAt';

const sortFields = new Set<SortField>([
  'name',
  'phone',
  'email',
  'isVip',
  'totalVisits',
  'firstVisitDate',
  'lastVisitDate',
  'createdAt',
  'updatedAt',
]);

function parsePositiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function comparableValue(visitor: NormalizedVisitor, field: SortField) {
  const value = visitor[field];
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number') return value;
  return String(value ?? '').toLowerCase();
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim().toLowerCase() ?? '';
    const vip = searchParams.get('vip');
    const page = parsePositiveInteger(searchParams.get('page'), 1);
    const limit = Math.min(100, parsePositiveInteger(searchParams.get('limit'), 20));
    const requestedSort = searchParams.get('sort') as SortField | null;
    const sort = requestedSort && sortFields.has(requestedSort)
      ? requestedSort
      : 'lastVisitDate';
    const order = searchParams.get('order')?.toLowerCase() === 'asc' ? 1 : -1;
    const orderDirection: OrderByDirection = order === 1 ? 'asc' : 'desc';
    const offset = (page - 1) * limit;
    let query: Query = getAdminDb().collection('visitors');

    // Replaced the default full visitors scan with Firestore-side VIP filtering,
    // sorting, count aggregation, and pagination when free-text search is absent.
    if (vip === 'true' || vip === 'false') {
      query = query.where('isVip', '==', vip === 'true');
    }

    if (!search) {
      const countSnapshot = await query.count().get();
      const total = countSnapshot.data().count;
      console.log('[FIRESTORE READ]', 'GET /admin/visitors:count', 'docs:', total);

      const snapshot = await query
        .orderBy(sort, orderDirection)
        .offset(offset)
        .limit(limit)
        .get();
      console.log('[FIRESTORE READ]', 'GET /admin/visitors', 'docs:', snapshot.size);

      const visitors = snapshot.docs.map((document) =>
        normalizeVisitor(document.id, document.data())
      );

      return NextResponse.json({
        visitors,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }

    // TODO: Backfill visitor search fields and query them directly:
    // phoneNormalized, emailLowercase, nameLowercase.
    // Until then, preserve existing substring search behavior on the reduced set.
    const snapshot = await query.get();
    console.log('[FIRESTORE READ]', 'GET /admin/visitors:search', 'docs:', snapshot.size);
    let visitorRows = snapshot.docs.map((document) =>
      normalizeVisitor(document.id, document.data())
    );

    visitorRows = visitorRows.filter((visitor) =>
      [visitor.name, visitor.phone, visitor.email].some((value) =>
        String(value ?? '').toLowerCase().includes(search)
      )
    );

    visitorRows.sort((left, right) => {
      const leftValue = comparableValue(left, sort);
      const rightValue = comparableValue(right, sort);

      if (leftValue < rightValue) return -1 * order;
      if (leftValue > rightValue) return 1 * order;
      return 0;
    });

    const total = visitorRows.length;
    const visitors = visitorRows.slice(offset, offset + limit);

    return NextResponse.json({
      visitors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('[API] GET /admin/visitors failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
