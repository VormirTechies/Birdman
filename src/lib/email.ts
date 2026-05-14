import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
import BookingConfirmation from '../../emails/booking-confirmation';
import BookingReminder from '../../emails/booking-reminder';
import BookingReschedule from '../../emails/booking-reschedule';
import BookingCancellation from '../../emails/booking-cancellation';
import type { Booking } from './db/schema';
import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL SERVICE - Nodemailer (Gmail SMTP) Integration
// Handles confirmation, reminder, and reschedule notifications without domain verification
// ═══════════════════════════════════════════════════════════════════════════

// Helper to get Nodemailer transporter safely after env is loaded
function getTransporter() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    throw new Error('[Email Service] Missing GMAIL_USER or GMAIL_PASS environment variables');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS, // 16-character App Password
    },
  });
}

// Email sender configuration
const FROM_EMAIL = process.env.EMAIL_FROM || '"Birdman of Chennai" <vigneshwaran7797@gmail.com>';

// ─── Send Booking Confirmation ───────────────────────────────────────────────

export async function sendBookingConfirmation(booking: Booking): Promise<{
  success: boolean;
  error?: string;
  messageId?: string;
}> {
  try {
    if (!booking.email) {
      console.warn('[Email Service] No email address provided for booking:', booking.id);
      return { success: false, error: 'No email address provided' };
    }

    const transporter = getTransporter();
    
    // Render React component to HTML
    const emailHtml = await render(
        React.createElement(BookingConfirmation, {
            visitorName: booking.visitorName,
            bookingDate: booking.bookingDate,
            bookingTime: booking.bookingTime,
            numberOfGuests: booking.numberOfGuests,
            bookingId: booking.id,
        })
    );

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: booking.email,
      subject: '🦜 Booking Confirmed — Birdman of Chennai',
      html: emailHtml,
    });

    console.log('[Email Service] Confirmation sent via Gmail:', info.messageId);
    return { success: true, messageId: info.messageId };
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
    if (!booking.email) {
      return { success: false, error: 'No email address provided' };
    }

    const transporter = getTransporter();
    
    const emailHtml = await render(
        React.createElement(BookingReminder, {
            visitorName: booking.visitorName,
            bookingDate: booking.bookingDate,
            bookingTime: booking.bookingTime,
            numberOfGuests: booking.numberOfGuests,
        })
    );

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: booking.email,
      subject: '⏰ Reminder: Your Visit is Today! — Birdman of Chennai',
      html: emailHtml,
    });

    console.log('[Email Service] Reminder sent via Gmail:', info.messageId);
    return { success: true, messageId: info.messageId };
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
    if (!booking.email) {
      return { success: false, error: 'No email address provided' };
    }

    const transporter = getTransporter();
    
    const emailHtml = await render(
        React.createElement(BookingReschedule, {
            visitorName: booking.visitorName,
            oldDate: oldBooking.bookingDate,
            oldTime: oldBooking.bookingTime,
            newDate: booking.bookingDate,
            newTime: booking.bookingTime,
            numberOfGuests: booking.numberOfGuests,
            bookingId: booking.id,
        })
    );

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: booking.email,
      subject: '📅 Booking Rescheduled — Birdman of Chennai',
      html: emailHtml,
    });

    console.log('[Email Service] Reschedule notification sent via Gmail:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Email Service] Reschedule exception:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ─── Test Email Connection ───────────────────────────────────────────────────

export async function testEmailConnection(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('[Email Service] SMTP configuration valid');
    return true;
  } catch (error) {
    console.error('[Email Service] SMTP configuration failed:', error);
    return false;
  }
}

// ─── Send Admin Verification Code ──────────────────────────────────────────

export async function sendAdminVerificationCode(email: string, code: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const transporter = getTransporter();
    
    const htmlBody = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2D5A27; text-align: center;">Profile Security Update</h2>
          <p>You have requested to update your administrator email for the Birdman of Chennai dashboard.</p>
          <div style="background: #f9f9f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2D5A27;">${code}</span>
          </div>
          <p>Please enter this 6-digit code in your dashboard to verify this change. This code will expire in 15 minutes.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666; text-align: center;">If you did not request this change, please ignore this email or contact support immediately.</p>
        </div>
    `;

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: '🔐 Verification Code: Admin Profile Update — Birdman of Chennai',
      html: htmlBody,
    });

    return { success: true };
  } catch (error) {
    console.error('[Email Service] Admin OTP failed:', error);
    return { success: false, error: 'Failed to send verification code' };
  }
}

// ─── Send Booking Cancellation ───────────────────────────────────────────────

export async function sendBookingCancellation(booking: Booking): Promise<{
  success: boolean;
  error?: string;
  messageId?: string;
}> {
  try {
    if (!booking.email) {
      console.warn('[Email Service] No email address provided for booking:', booking.id);
      return { success: false, error: 'No email address provided' };
    }

    const transporter = getTransporter();
    
    // Render React component to HTML
    const emailHtml = await render(
        React.createElement(BookingCancellation, {
            visitorName: booking.visitorName,
            bookingDate: booking.bookingDate,
            bookingTime: booking.bookingTime,
            numberOfGuests: booking.numberOfGuests,
            bookingId: booking.id,
        })
    );

    const info = await transporter.sendMail({
      from: FROM_EMAIL,
      to: booking.email,
      subject: '🦜 Booking Cancellation Notice — Birdman of Chennai',
      html: emailHtml,
    });

    console.log('[Email Service] Cancellation email sent via Gmail:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Email Service] Cancellation email exception:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

// ─── Bulk Send Cancellation Emails ───────────────────────────────────────────
// Used by admin settings page when blocking dates

export async function sendCancellationEmails(
  bookings: Array<{ id: string; email: string | null; visitorName: string; bookingDate: string; numberOfGuests: number }>
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  console.log(`[Email Service] Sending cancellation emails to ${bookings.length} booking(s)...`);

  for (const booking of bookings) {
    if (!booking.email) {
      console.warn(`[Email Service] Skipping booking ${booking.id} - no email`);
      failed++;
      continue;
    }

    try {
      const result = await sendBookingCancellation({
        id: booking.id,
        email: booking.email,
        visitorName: booking.visitorName,
        bookingDate: booking.bookingDate,
        bookingTime: '16:30:00', // Default time
        numberOfGuests: booking.numberOfGuests,
      } as Booking);

      if (result.success) {
        sent++;
      } else {
        failed++;
        errors.push(`${booking.id}: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      failed++;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`${booking.id}: ${errorMsg}`);
      console.error(`[Email Service] Failed to send cancellation to ${booking.email}:`, error);
    }

    // Add small delay between emails to avoid rate limiting
    if (bookings.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`[Email Service] Cancellation emails complete: ${sent} sent, ${failed} failed`);
  return { sent, failed, errors };
}
