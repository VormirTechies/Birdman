export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getDaySettings, upsertDaySettings, blockDate, unblockDate, getBlockedDates, getConfirmedBookingsByDate } from '@/lib/db/queries';

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/admin/day-settings — Get settings for a date or blocked dates range
// Query: ?date=2026-04-19 OR ?startDate=2026-04-01&endDate=2026-04-30&blockedOnly=true
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const blockedOnly = searchParams.get('blockedOnly') === 'true';

    if (date) {
      const settings = await getDaySettings(date);
      return NextResponse.json({ success: true, settings });
    }

    if (startDate && endDate && blockedOnly) {
      const blocked = await getBlockedDates(startDate, endDate);
      return NextResponse.json({ success: true, blockedDates: blocked });
    }

    return NextResponse.json({ success: false, error: 'Provide ?date= or ?startDate=&endDate=&blockedOnly=true' }, { status: 400 });
  } catch (error) {
    console.error('[API] Day settings GET failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch day settings' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/admin/day-settings — Upsert settings or block/unblock a date
// Body: { date, slotTime?, maxGuests?, isBlocked?, blockReason?, action?: 'block' | 'unblock' }
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, action, slotTime, maxGuests, isBlocked, blockReason } = body;

    if (!date) {
      return NextResponse.json({ success: false, error: 'Date is required' }, { status: 400 });
    }

    // Block action
    if (action === 'block') {
      const result = await blockDate(date, blockReason);
      
      // Fire emails async without awaiting
      const { sendBlockedDateCancellation } = await import('@/lib/email');
      result.affectedBookings.forEach(b => {
         sendBlockedDateCancellation({ email: b.email, visitorName: b.visitorName, bookingDate: b.bookingDate, numberOfGuests: b.numberOfGuests }).catch(console.error);
      });

      return NextResponse.json({
        success: true,
        setting: result.setting,
        affectedBookings: result.affectedBookings.map(b => ({
          id: b.id,
          visitorName: b.visitorName,
          email: b.email,
          phone: b.phone,
          numberOfGuests: b.numberOfGuests,
        })),
        message: `Date blocked. ${result.affectedBookings.length} booking(s) cancelled.`,
      });
    }

    // Unblock action
    if (action === 'unblock') {
      const setting = await unblockDate(date);
      return NextResponse.json({ success: true, setting });
    }

    // Check if time is being changed and there are existing bookings
    if (slotTime) {
      const existingBookings = await getConfirmedBookingsByDate(date);
      if (existingBookings.length > 0) {
        const setting = await upsertDaySettings(date, { slotTime, maxGuests, isBlocked, blockReason });
        
        // Fire emails async without awaiting
        const { sendTimeChangeNotification } = await import('@/lib/email');
        existingBookings.forEach(b => {
           sendTimeChangeNotification({ email: b.email, visitorName: b.visitorName, bookingDate: b.bookingDate, bookingTime: slotTime, numberOfGuests: b.numberOfGuests }).catch(console.error);
        });

        return NextResponse.json({
          success: true,
          setting,
          timeChanged: true,
          affectedBookings: existingBookings.map(b => ({
            id: b.id,
            visitorName: b.visitorName,
            email: b.email,
            phone: b.phone,
          })),
          message: `Time updated. ${existingBookings.length} visitor(s) will be notified.`,
        });
      }
    }

    // General upsert
    const setting = await upsertDaySettings(date, { slotTime, maxGuests, isBlocked, blockReason });
    return NextResponse.json({ success: true, setting });
  } catch (error) {
    console.error('[API] Day settings POST failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to update day settings' }, { status: 500 });
  }
}
