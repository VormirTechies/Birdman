import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBookings, createBooking, markConfirmationSent } from '@/lib/db/queries';
import { createAdminBookingSchema } from '@/lib/validations';
import { sendBookingConfirmation } from '@/lib/email';
import { sendVipWelcomeEmail } from '@/lib/email';
import { sendPushToAllAdmins } from '@/lib/push';
import { findOrCreateVisitor, linkBookingToVisitor } from '@/lib/visitors';
import { ZodError } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/admin/bookings — Fetch Bookings (Admin)
// ═══════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/admin/bookings — Create Booking (Admin - Instant Walk-in)
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body with admin schema (relaxed rules)
    const body = await request.json();
    const validatedData = createAdminBookingSchema.parse(body);

    // Create booking in database
    const booking = await createBooking({
      visitorName: validatedData.visitorName,
      phone: validatedData.phone,
      email: validatedData.email || '', // Empty string if not provided
      adults: validatedData.adults,
      children: validatedData.children,
      numberOfGuests: validatedData.adults + validatedData.children, // Computed total
      bookingDate: validatedData.bookingDate,
      bookingTime: validatedData.bookingTime,
    });

    // Match or create visitor profile
    let isVip = false;
    let isReturning = false;
    let visitorId: string | null = null;
    let totalVisits = 1;
    try {
      const visitorResult = await findOrCreateVisitor(
        validatedData.phone,
        validatedData.email,
        validatedData.visitorName,
        validatedData.bookingDate
      );
      isVip = visitorResult.isVip;
      isReturning = visitorResult.isReturning;
      visitorId = visitorResult.visitor.id;
      totalVisits = visitorResult.visitor.totalVisits ?? 1;
      await linkBookingToVisitor(booking.id, visitorId);
    } catch (visitorError) {
      console.error('[Admin API] Visitor matching failed (non-fatal):', visitorError);
    }

    // Format guest count for display
    const guestCount = booking.children > 0 
      ? `${booking.adults} adult(s) + ${booking.children} child(ren)`
      : `${booking.adults} guest(s)`;

    // Notify All Admins
    await sendPushToAllAdmins({
      title: isVip ? '⭐ VIP Walk-in Registered!' : 'Walk-in Visitor Registered',
      body: `${booking.visitorName} (${guestCount}) checked in for ${booking.bookingDate}.${
        isVip ? ' VIP visitor!' : isReturning ? ' (Returning visitor)' : ''
      }`,
      url: '/admin',
      visitorName: booking.visitorName,
      bookingDate: booking.bookingDate,
    });

    // Send confirmation email only if email is provided (non-blocking)
    let emailSent = false;
    if (validatedData.email && validatedData.email.trim() !== '') {
      try {
        const emailResult = isVip
          ? await sendVipWelcomeEmail(booking, totalVisits)
          : await sendBookingConfirmation(booking);
        emailSent = emailResult.success;

        if (emailResult.success) {
          await markConfirmationSent(booking.id);
        }
      } catch (emailError) {
        console.error('[Admin API] Email send failed, but booking created:', emailError);
        // Continue - booking is still valid even if email fails
      }
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        booking: {
          id: booking.id,
          visitorName: booking.visitorName,
          phone: booking.phone,
          email: booking.email,
          bookingDate: booking.bookingDate,
          bookingTime: booking.bookingTime,
          adults: booking.adults,
          children: booking.children,
          numberOfGuests: booking.numberOfGuests,
          status: booking.status,
          visitorId,
        },
        isVip,
        isReturning,
        emailSent,
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Handle database errors
    console.error('[Admin API] Booking creation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create booking',
        code: 'ADMIN_BOOKING_CREATE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

