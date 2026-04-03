import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAllBookings } from '@/lib/db/queries';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookings = await getAllBookings(200); // Expanded history view
    
    return NextResponse.json(bookings.map(b => ({
        id: b.id,
        visitorName: b.visitorName,
        phone: b.phone,
        email: b.email,
        numberOfGuests: b.numberOfGuests,
        bookingDate: b.bookingDate,
        bookingTime: b.bookingTime,
        status: b.status,
        createdAt: b.createdAt.toISOString()
    })));
  } catch (error: any) {
    console.error('[API] Failed to fetch historical bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
