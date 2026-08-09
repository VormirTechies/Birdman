import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import {
  LOCAL_FIRESTORE_DATABASE_ID,
  resolveFirestoreDatabaseId,
} from '@/lib/firebase/database-id';

const FIREBASE_PROJECT_ID = 'birdman-7e745';

// The Admin SDK only redirects to the Firestore emulator when this environment
// variable is present. Firebase sets it for some managed emulator processes,
// but not when Next.js is started directly with `npm run dev`.
if (process.env.NODE_ENV !== 'production') {
  process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:7003';
  process.env.GCLOUD_PROJECT ??= FIREBASE_PROJECT_ID;
}

export const firestoreDatabaseId = resolveFirestoreDatabaseId();

const app = getApps().length
  ? getApps()[0]
  : initializeApp(
      !process.env.FIRESTORE_EMULATOR_HOST && process.env.NODE_ENV === 'production'
        ? undefined
        : { projectId: FIREBASE_PROJECT_ID }
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
