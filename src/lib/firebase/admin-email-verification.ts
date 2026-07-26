import { createHash } from 'node:crypto';

export const ADMIN_EMAIL_VERIFICATIONS_COLLECTION = 'admin_email_verifications';
export const ADMIN_EMAIL_VERIFICATION_TTL_MS = 15 * 60 * 1000;

export function hashAdminEmailVerificationCode(
  userId: string,
  newEmail: string,
  code: string
) {
  return createHash('sha256')
    .update(`${userId}:${newEmail.trim().toLowerCase()}:${code}`)
    .digest('hex');
}
