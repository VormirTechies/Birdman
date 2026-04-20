export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getDailyChecklist, toggleVisited } from '@/lib/db/queries';

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/admin/checklist — Daily visitor checklist
// Query: ?date=2026-04-19
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    const checklist = await getDailyChecklist(date);

    return NextResponse.json({
      success: true,
      date,
      ...checklist,
      bookings: checklist.bookings.map(b => ({
        id: b.id,
        visitorName: b.visitorName,
        phone: b.phone,
        email: b.email,
        numberOfGuests: b.numberOfGuests,
        category: b.category,
        organisationName: b.organisationName,
        visited: b.visited,
        bookingTime: b.bookingTime,
      })),
    });
  } catch (error) {
    console.error('[API] Checklist GET failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch checklist' }, { status: 500 });
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PATCH /api/admin/checklist — Toggle visited status
// Body: { bookingId, visited }
// ═══════════════════════════════════════════════════════════════════════════

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, visited } = body;

    if (!bookingId || typeof visited !== 'boolean') {
      return NextResponse.json({ success: false, error: 'bookingId and visited (boolean) are required' }, { status: 400 });
    }

    const updated = await toggleVisited(bookingId, visited);

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: updated.id,
        visitorName: updated.visitorName,
        visited: updated.visited,
        status: updated.status,
      },
    });
  } catch (error) {
    console.error('[API] Checklist PATCH failed:', error);
    return NextResponse.json({ success: false, error: 'Failed to toggle visited status' }, { status: 500 });
  }
}
