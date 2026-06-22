export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

type DebugStep =
  | 'env-check'
  | 'firebase-admin-import'
  | 'firestore-write'
  | 'firestore-read';

function envPresence() {
  return {
    FIREBASE_PROJECT_ID: Boolean(process.env.FIREBASE_PROJECT_ID),
    FIREBASE_CLIENT_EMAIL: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
    FIREBASE_PRIVATE_KEY: Boolean(process.env.FIREBASE_PRIVATE_KEY),
    ADMIN_EMAILS: Boolean(process.env.ADMIN_EMAILS),
    CRON_SECRET: Boolean(process.env.CRON_SECRET),
  };
}

function errorResponse(step: DebugStep, error: unknown) {
  const errorName = error instanceof Error ? error.name : 'UnknownError';
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  console.error(`[firebase-health] ${step} failed`, {
    errorName,
    errorMessage,
  });

  return NextResponse.json(
    {
      success: false,
      step,
      errorName,
      errorMessage,
    },
    { status: 500 }
  );
}

function isAuthorized(request: NextRequest) {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) return false;

  const querySecret = request.nextUrl.searchParams.get('secret');
  const headerSecret = request.headers.get('x-debug-secret');

  return querySecret === expectedSecret || headerSecret === expectedSecret;
}

export async function GET(request: NextRequest) {
  console.log('[firebase-health] started');

  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false }, { status: 404 });
  }

  let env: ReturnType<typeof envPresence>;

  try {
    env = envPresence();
    console.log('[firebase-health] env checked');
  } catch (error) {
    return errorResponse('env-check', error);
  }

  let getAdminDb: () => FirebaseFirestore.Firestore;
  let FieldValue: typeof import('firebase-admin/firestore').FieldValue;

  try {
    const [admin, firestore] = await Promise.all([
      import('@/lib/firebase/admin-runtime'),
      import('firebase-admin/firestore'),
    ]);
    getAdminDb = admin.getAdminDb;
    FieldValue = firestore.FieldValue;
    console.log('[firebase-health] admin imported');
  } catch (error) {
    return errorResponse('firebase-admin-import', error);
  }

  const database = getAdminDb();
  const debugRef = database.collection('_debug').doc('firebase-health');

  try {
    await debugRef.set(
      {
        checkedAt: FieldValue.serverTimestamp(),
        checkedAtIso: new Date().toISOString(),
        source: 'vercel-preview',
      },
      { merge: true }
    );
    console.log('[firebase-health] firestore write success');
  } catch (error) {
    return errorResponse('firestore-write', error);
  }

  try {
    const snapshot = await debugRef.get();
    if (!snapshot.exists) {
      throw new Error('Debug document was not found after write');
    }
  } catch (error) {
    return errorResponse('firestore-read', error);
  }

  return NextResponse.json({
    success: true,
    env,
    firebaseAdminImport: true,
    firestoreWrite: true,
    firestoreRead: true,
  });
}
