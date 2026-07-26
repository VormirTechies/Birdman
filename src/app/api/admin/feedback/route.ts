import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/require-admin';

const COLLECTION = 'feedback';

function toDate(value: unknown): Date | null {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    // Sort in memory so this route does not require a composite Firestore index.
    const snapshot = await getAdminDb()
      .collection(COLLECTION)
      .where('isApproved', '==', false)
      .get();

    const pending = snapshot.docs
      .map((document) => {
        const data = document.data();
        const createdAt = toDate(data.createdAt ?? data.created_at);

        return {
          id: document.id,
          visitorName: data.visitorName ?? data.visitor_name ?? null,
          message: String(data.message ?? ''),
          rating: typeof data.rating === 'number' ? data.rating : null,
          isApproved: false,
          createdAt: createdAt?.toISOString() ?? null,
          createdAtMillis: createdAt?.getTime() ?? 0,
        };
      })
      .sort((left, right) => right.createdAtMillis - left.createdAtMillis)
      .map(({ createdAtMillis: _createdAtMillis, ...feedback }) => feedback);

    return NextResponse.json(pending);
  } catch (error: unknown) {
    console.error('[API] Failed to fetch Firebase feedback:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
