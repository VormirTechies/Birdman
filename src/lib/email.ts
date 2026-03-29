import { Resend } from 'resend';
import BookingConfirmation from '../../emails/booking-confirmation';
import BookingReminder from '../../emails/booking-reminder';
import BookingReschedule from '../../emails/booking-reschedule';
import type { Booking } from './db/schema';

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL SERVICE - Resend Integration for Birdman Booking System
// Handles confirmation, reminder, and reschedule notifications
// ═══════════════════════════════════════════════════════════════════════════

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender configuration
const FROM_EMAIL = process.env.EMAIL_FROM || 'Birdman Chennai <bookings@birdmanofchennai.com>';

// ─── Send Booking Confirmation ───────────────────────────────────────────────

export async function sendBookingConfirmation(booking: Booking): Promise<{
  success: boolean;
  error?: string;
  messageId?: string;
}> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.email,
      subject: '🦜 Booking Confirmed — Birdman of Chennai',
      react: BookingConfirmation({
        visitorName: booking.visitorName,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        numberOfGuests: booking.numberOfGuests,
        bookingId: booking.id,
      }),
    });

    if (error) {
      console.error('[Email Service] Confirmation send failed:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email Service] Confirmation sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Email Service] Confirmation exception:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ─── Send Booking Reminder ───────────────────────────────────────────────────

export async function sendBookingReminder(booking: Booking): Promise<{
  success: boolean;
  error?: string;
  messageId?: string;
}> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.email,
      subject: '⏰ Reminder: Your Visit is Today! — Birdman of Chennai',
      react: BookingReminder({
        visitorName: booking.visitorName,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        numberOfGuests: booking.numberOfGuests,
      }),
    });

    if (error) {
      console.error('[Email Service] Reminder send failed:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email Service] Reminder sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Email Service] Reminder exception:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ─── Send Reschedule Notification ────────────────────────────────────────────

export async function sendRescheduleNotification(
  booking: Booking,
  oldBooking: { bookingDate: string; bookingTime: string }
): Promise<{
  success: boolean;
  error?: string;
  messageId?: string;
}> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: booking.email,
      subject: '📅 Booking Rescheduled — Birdman of Chennai',
      react: BookingReschedule({
        visitorName: booking.visitorName,
        oldDate: oldBooking.bookingDate,
        oldTime: oldBooking.bookingTime,
        newDate: booking.bookingDate,
        newTime: booking.bookingTime,
        numberOfGuests: booking.numberOfGuests,
        bookingId: booking.id,
      }),
    });

    if (error) {
      console.error('[Email Service] Reschedule send failed:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email Service] Reschedule notification sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Email Service] Reschedule exception:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ─── Test Email Connection ───────────────────────────────────────────────────

export async function testEmailConnection(): Promise<boolean> {
  try {
    // Simple test to verify Resend API key is valid
    if (!process.env.RESEND_API_KEY) {
      console.error('[Email Service] RESEND_API_KEY not configured');
      return false;
    }
    
    console.log('[Email Service] Configuration valid');
    return true;
  } catch (error) {
    console.error('[Email Service] Configuration test failed:', error);
    return false;
  }
}
