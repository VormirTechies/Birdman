import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import {
  LOCAL_FIRESTORE_DATABASE_ID,
  resolveFirestoreDatabaseId,
} from '@/lib/firebase/database-id';

export const FIREBASE_PROJECT_ID = 'birdman-7e745';
export const FIREBASE_STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
  `${FIREBASE_PROJECT_ID}.firebasestorage.app`;

if (process.env.NODE_ENV === 'production') {
  const configuredProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (configuredProjectId && configuredProjectId !== FIREBASE_PROJECT_ID) {
    throw new Error(
      `Production Firebase must use ${FIREBASE_PROJECT_ID}; received ${configuredProjectId}`
    );
  }

  if (!FIREBASE_STORAGE_BUCKET.startsWith(`${FIREBASE_PROJECT_ID}.`)) {
    throw new Error(
      `Production Firebase Storage bucket must belong to ${FIREBASE_PROJECT_ID}; received ${FIREBASE_STORAGE_BUCKET}`
    );
  }
}

// The Admin SDK only redirects to the Firestore emulator when this environment
// variable is present. Firebase sets it for some managed emulator processes,
// but not when Next.js is started directly with `npm run dev`.
if (process.env.NODE_ENV !== 'production') {
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:7003';
  process.env.FIREBASE_STORAGE_EMULATOR_HOST ??= '127.0.0.1:7004';
  process.env.GCLOUD_PROJECT ??= FIREBASE_PROJECT_ID;
}

export const firestoreDatabaseId = resolveFirestoreDatabaseId();

const app = getApps().length
  ? getApps()[0]
  : initializeApp(
      !process.env.FIRESTORE_EMULATOR_HOST && process.env.NODE_ENV === 'production'
        ? undefined
        : { projectId: FIREBASE_PROJECT_ID, storageBucket: FIREBASE_STORAGE_BUCKET }
    );

export const adminAuth = getAuth(app);
export const adminDb = firestoreDatabaseId === LOCAL_FIRESTORE_DATABASE_ID
  ? getFirestore(app)
  : getFirestore(app, firestoreDatabaseId);
export const adminStorage = getStorage(app);

export function getAdminAuth() {
  return adminAuth;
}

export function getAdminDb() {
  return adminDb;
}

export default app;
