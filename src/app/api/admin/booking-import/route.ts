import { NextResponse } from 'next/server';
import { createConnection } from 'node:net';
import { requireAdmin } from '@/lib/require-admin';
import { adminDb, firestoreDatabaseId } from '@/lib/firebase/admin';
import { importBookingCsv } from '@/lib/firebase/booking-csv-import';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const schema = z.object({
  csv: z.string().min(1).max(500_000),
  target: z.enum(['emulator', 'production']),
  offset: z.enum(['+05:30', 'Z']),
  dryRun: z.boolean(),
  confirmation: z.string().optional(),
}).strict();

async function checkTarget(target: string) {
  const host = process.env.FIRESTORE_EMULATOR_HOST;
  if (target === 'production') {
    if (host || process.env.FIREBASE_AUTH_EMULATOR_HOST || firestoreDatabaseId !== 'birdman-db') {
      throw new Error('Live imports require signing in on the production admin site. Emulator accounts cannot authorize live writes.');
    }
    return;
  }
  if (!host || firestoreDatabaseId !== '(default)') throw new Error('Local emulator is unavailable from this server. Open this page on your local application with the emulator running.');
  const match = /^(127\.0\.0\.1|localhost):([0-9]+)$/.exec(host);
  if (!match) throw new Error('Local emulator host must use localhost or 127.0.0.1.');
  await new Promise<void>((resolve, reject) => {
    const socket = createConnection({ host: match[1], port: Number(match[2]) });
    socket.setTimeout(2000);
    socket.once('connect', () => { socket.destroy(); resolve(); });
    const fail = () => { socket.destroy(); reject(new Error('Local emulator is not accessible. Start the Firebase emulators, then retry.')); };
    socket.once('error', fail);
    socket.once('timeout', fail);
  });
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.user) return auth.response;
  try {
    const target = new URL(request.url).searchParams.get('target');
    if (target !== 'production' && target !== 'emulator') return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
    await checkTarget(target);
    return NextResponse.json({ available: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Target unavailable' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.user) return auth.response;
  if (Number(request.headers.get('content-length') || 0) > 600_000) return NextResponse.json({ error: 'CSV must be under 500 KB' }, { status: 413 });
  let input: z.infer<typeof schema>;
  try { input = schema.parse(await request.json()); }
  catch { return NextResponse.json({ error: 'Invalid upload. Select a CSV under 500 KB.' }, { status: 400 }); }
  try { await checkTarget(input.target); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Target unavailable' }, { status: 503 }); }
  if (!input.dryRun && input.confirmation !== (input.target === 'production' ? 'IMPORT LIVE' : 'IMPORT')) {
    return NextResponse.json({ error: 'Import confirmation is required' }, { status: 400 });
  }
  try {
    const report = await importBookingCsv(adminDb, input.csv, input.offset, input.target, input.dryRun);
    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Import failed; retry the preview.' }, { status: 400 });
  }
}
