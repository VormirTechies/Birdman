import { NextRequest, NextResponse } from 'next/server';
import { getBookingsNeedingReminders, markReminderSent } from '@/lib/db/queries';
import { sendBookingReminder } from '@/lib/email';

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/cron/send-reminders — Send Daily Booking Reminders
// Triggered by Vercel Cron at 10:00 AM daily
// Security: Requires Authorization header with CRON_SECRET
// ═══════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    // ─── Security Check: Verify Cron Secret ──────────────────────────────────
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      console.error('[Cron] CRON_SECRET not configured in environment');
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error',
        },
        { status: 500 }
      );
    }

    // Validate authorization header format: "Bearer <token>"
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[Cron] Missing or invalid authorization header');
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const providedSecret = authHeader.substring(7); // Remove "Bearer " prefix

    if (providedSecret !== expectedSecret) {
      console.warn('[Cron] Invalid cron secret provided');
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // ─── Get Today's Date ────────────────────────────────────────────────────
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    console.log(`[Cron] Sending reminders for bookings on ${todayString}`);

    // ─── Fetch Bookings Needing Reminders ───────────────────────────────────
    const bookings = await getBookingsNeedingReminders(todayString);

    if (bookings.length === 0) {
      console.log('[Cron] No bookings found needing reminders');
      return NextResponse.json({
        success: true,
        message: 'No reminders to send',
        remindersSent: 0,
        date: todayString,
      });
    }

    console.log(`[Cron] Found ${bookings.length} booking(s) needing reminders`);

    // ─── Send Reminders ──────────────────────────────────────────────────────
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as { bookingId: string; error: string }[],
    };

    for (const booking of bookings) {
      try {
        console.log(`[Cron] Sending reminder for booking ${booking.id}`);

        // Send reminder email
        const emailResult = await sendBookingReminder(booking);

        if (emailResult.success) {
          // Mark reminder as sent in database
          await markReminderSent(booking.id);
          results.sent++;
          console.log(`[Cron] Reminder sent successfully for booking ${booking.id}`);
        } else {
          results.failed++;
          results.errors.push({
            bookingId: booking.id,
            error: emailResult.error || 'Unknown error',
          });
          console.error(
            `[Cron] Failed to send reminder for booking ${booking.id}:`,
            emailResult.error
          );
        }
      } catch (error) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          bookingId: booking.id,
          error: errorMessage,
        });
        console.error(`[Cron] Exception sending reminder for booking ${booking.id}:`, error);
      }
    }

    // ─── Return Summary ──────────────────────────────────────────────────────
    console.log(
      `[Cron] Reminder job complete: ${results.sent} sent, ${results.failed} failed`
    );

    return NextResponse.json({
      success: true,
      message: 'Reminder job complete',
      remindersSent: results.sent,
      remindersFailed: results.failed,
      totalBookings: bookings.length,
      date: todayString,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (error) {
    console.error('[Cron] Reminder job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Reminder job failed',
        code: 'CRON_JOB_ERROR',
      },
      { status: 500 }
    );
  }
}
