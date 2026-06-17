export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getBookingStats } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const { requireAdmin } = await import('@/lib/require-admin');
    const authResult = await requireAdmin(request);
    if (!authResult.user) return authResult.response;

    const stats = await getBookingStats();

    return NextResponse.json(
      {
        success: true,
        stats,
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error) {
    console.error('[API] Failed to fetch booking stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch booking stats',
        code: 'STATS_FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}
