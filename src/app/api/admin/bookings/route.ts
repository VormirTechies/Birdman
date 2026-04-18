import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBookings } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const isToday = searchParams.get('isToday') === 'true';
    const showPast = searchParams.get('showPast') === 'true';
    
    const today = new Date().toISOString().split('T')[0];
    const offset = (page - 1) * limit;

    const result = await getBookings({
      date: isToday ? today : undefined,
      minDate: (isToday || showPast) ? undefined : today, // If not 'isToday' and not 'showPast', show 'today onwards'
      search,
      limit,
      offset
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] Failed to fetch bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
