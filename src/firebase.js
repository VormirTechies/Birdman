import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { connectAuthEmulator, getAuth } from "firebase/auth";

const cleanEnv = (value) => value?.trim().replace(/^["']|["']$/g, "");

const firebaseConfig = {
  apiKey: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  measurementId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID),
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
    if (
      process.env.NODE_ENV !== "production" &&
      typeof window !== "undefined" &&
      !globalThis.__birdmanAuthEmulatorConnected
    ) {
      const emulatorUrl =
        cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL) ||
        "http://127.0.0.1:7002";
      connectAuthEmulator(authInstance, emulatorUrl, { disableWarnings: true });
      globalThis.__birdmanAuthEmulatorConnected = true;
    }
  } catch (error) {
    firebaseConfigError =
      error instanceof Error
        ? `Firebase client initialization failed: ${error.message}`
        : "Firebase client initialization failed";
  }
}

export const db = dbInstance;
export const auth = authInstance;
