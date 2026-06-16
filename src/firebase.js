import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const requiredConfig = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  appId: firebaseConfig.appId,
};

const missingConfigKeys = Object.entries(requiredConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export let firebaseConfigError =
  missingConfigKeys.length > 0
    ? `Missing Firebase client configuration: ${missingConfigKeys.join(", ")}`
    : null;

let dbInstance = null;

/** @type {import("firebase/auth").Auth} */
let authInstance = /** @type {import("firebase/auth").Auth} */ ({
  currentUser: null,
});

if (!firebaseConfigError) {
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);
    authInstance = getAuth(app);
  } catch (error) {
    firebaseConfigError =
      error instanceof Error
        ? `Firebase client initialization failed: ${error.message}`
        : "Firebase client initialization failed";
  }
}

export const db = dbInstance;
export const auth = authInstance;
