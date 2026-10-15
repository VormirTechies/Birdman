import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { notificationStateInputSchema } from '@/models/firestore/notification';
import { listNotificationInbox, notificationListSchema, updateNotificationStates,
  NotificationInboxAccessError, NotificationInboxMissingError } from '@/lib/firebase/notification-inbox';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };
export async function GET(request: Request) {
  const auth = await requireAdmin(request, { checkRevoked: true });
  if (!auth.user) return auth.response;
  let input;
  try {
    const params = new URL(request.url).searchParams;
    if ([...params.keys()].some(key => params.getAll(key).length > 1)) throw new Error('Duplicate parameter');
    input = notificationListSchema.parse(Object.fromEntries(params));
  } catch { return NextResponse.json({ success: false, error: 'Invalid notification page.' }, { status: 400, headers }); }
  try { return NextResponse.json({ success: true, ...await listNotificationInbox(auth.user.uid, input) }, { headers }); }
  catch { return NextResponse.json({ success: false, error: 'Notifications are temporarily unavailable.' }, { status: 503, headers }); }
}
export async function PATCH(request: Request) {
  const auth = await requireAdmin(request, { checkRevoked: true });
  if (!auth.user) return auth.response;
  let input;
  try {
    const reader = request.body?.getReader(); if (!reader) throw new Error('Invalid body');
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 4096) { await reader.cancel(); throw new Error('TOO_LARGE'); }
      chunks.push(value);
    }
    input = notificationStateInputSchema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
  } catch (error) { return NextResponse.json({ success: false, error: 'Invalid notification action.' },
    { status: error instanceof Error && error.message === 'TOO_LARGE' ? 413 : 400, headers }); }
  try {
    await updateNotificationStates(auth.user.uid, input);
    return NextResponse.json({ success: true }, { headers });
  } catch (error) {
    const status = error instanceof NotificationInboxAccessError ? 403 : error instanceof NotificationInboxMissingError ? 404 : 503;
    return NextResponse.json({ success: false, error: status === 404 ? 'This notification has expired or was removed.'
      : status === 403 ? 'Administrator access is required.' : 'Unable to update notifications. Please try again.' }, { status, headers });
  }
}
