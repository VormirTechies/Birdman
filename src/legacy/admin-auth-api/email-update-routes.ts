/**
 * Archive marker for the former Supabase email-change OTP endpoints:
 * `profile/update-request` and `profile/verify-update`.
 *
 * They authenticated with Supabase, stored a six-digit verification code in
 * Postgres, emailed it through Resend, and used the Supabase service-role client
 * to update the account email. Email changes are not exposed by the current UI.
 */
export const legacySupabaseEmailUpdateRoutes = true;
