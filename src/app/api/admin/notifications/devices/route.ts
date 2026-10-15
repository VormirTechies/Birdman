import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { resolveNotificationConfig } from '@/lib/firebase/notification-config';
import { notificationDeviceInputSchema } from '@/models/firestore/notification';
import {
  registerNotificationDevice, unregisterNotificationDevice,
  NotificationDeviceOwnershipError, NotificationAdminRequiredError,
} from '@/lib/firebase/notification-devices';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };

export async function GET(request: Request) {
  const auth = await requireAdmin(request, { checkRevoked: true });
  if (!auth.user) return auth.response;
  try {
    const config = resolveNotificationConfig();
    return NextResponse.json({ success: true, ...config }, { headers });
  } catch {
    return NextResponse.json({ success: false, error: 'Notifications are not configured correctly.' }, { status: 503, headers });
  }
}

async function readInput(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('INVALID_BODY');
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 8192) { await reader.cancel(); throw new Error('BODY_TOO_LARGE'); }
    chunks.push(value);
  }
  return notificationDeviceInputSchema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
}

async function mutate(request: Request, remove: boolean) {
  const auth = await requireAdmin(request, { checkRevoked: true });
  if (!auth.user) return auth.response;
  let input;
  try { input = await readInput(request); }
  catch (error) {
    const oversized = error instanceof Error && error.message === 'BODY_TOO_LARGE';
    return NextResponse.json({ success: false, error: 'Invalid notification device request.' }, { status: oversized ? 413 : 400, headers });
  }
  try {
    if (!remove) {
      const config = resolveNotificationConfig();
      if (!config.configured) return NextResponse.json({ success: false, error: 'Notifications are not configured yet.' }, { status: 503, headers });
      if ((config.mode === 'mock') !== input.token.startsWith('mock:')) {
        return NextResponse.json({ success: false, error: 'Device registration does not match this environment.' }, { status: 400, headers });
      }
      const result = await registerNotificationDevice(auth.user.uid, input);
      return NextResponse.json({ success: true, ...result }, { status: 201, headers });
    }
    await unregisterNotificationDevice(auth.user.uid, input);
    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    const status = error instanceof NotificationDeviceOwnershipError ? 409
      : error instanceof NotificationAdminRequiredError ? 403 : 503;
    return NextResponse.json({ success: false, error: status === 409
      ? 'This device is registered to another account. Sign out of that account first.'
      : status === 403 ? 'Administrator access is required.' : 'Notification registration is temporarily unavailable.' }, { status, headers });
  }
}
export const POST = (request: Request) => mutate(request, false);
export const DELETE = (request: Request) => mutate(request, true);
