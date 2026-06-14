import { NextRequest, NextResponse } from 'next/server';
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

    const snapshot = await getAdminDb().collection('visitors').get();
    let visitorRows = snapshot.docs.map((document) =>
      normalizeVisitor(document.id, document.data())
    );

    if (vip === 'true' || vip === 'false') {
      const expectedVip = vip === 'true';
      visitorRows = visitorRows.filter((visitor) => visitor.isVip === expectedVip);
    }

    if (search) {
      visitorRows = visitorRows.filter((visitor) =>
        [visitor.name, visitor.phone, visitor.email].some((value) =>
          String(value ?? '').toLowerCase().includes(search)
        )
      );
    }

    visitorRows.sort((left, right) => {
      const leftValue = comparableValue(left, sort);
      const rightValue = comparableValue(right, sort);

      if (leftValue < rightValue) return -1 * order;
      if (leftValue > rightValue) return 1 * order;
      return 0;
    });

    const total = visitorRows.length;
    const offset = (page - 1) * limit;
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
