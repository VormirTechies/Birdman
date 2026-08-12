import { deleteApp, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'birdman-7e745';
const AUTH_EMULATOR_HOST = '127.0.0.1:7002';
const FIRESTORE_EMULATOR_HOST = '127.0.0.1:7003';
const DATABASE_ID = '(default)';
const PASSWORD = 'Birdman123!';

const users = [
  { uid: 'local-admin-01', email: 'admin.one@birdman.local', displayName: 'Ananya Admin', isAdmin: true },
  { uid: 'local-admin-02', email: 'admin.two@birdman.local', displayName: 'Arjun Admin', isAdmin: true },
  { uid: 'local-admin-03', email: 'admin.three@birdman.local', displayName: 'Meera Admin', isAdmin: true },
  { uid: 'local-user-01', email: 'user.one@birdman.local', displayName: 'Karthik User', isAdmin: false },
  { uid: 'local-user-02', email: 'user.two@birdman.local', displayName: 'Priya User', isAdmin: false },
] as const;

function requireLocalHost(name: string, configured: string | undefined, fallback: string) {
  const host = configured?.trim() || fallback;
  if (!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host)) {
    throw new Error(`Refusing to seed non-local ${name} host: ${host}`);
  }
  return host;
}

async function run() {
  const authHost = requireLocalHost('Auth', process.env.FIREBASE_AUTH_EMULATOR_HOST, AUTH_EMULATOR_HOST);
  const firestoreHost = requireLocalHost('Firestore', process.env.FIRESTORE_EMULATOR_HOST, FIRESTORE_EMULATOR_HOST);

  process.env.FIREBASE_AUTH_EMULATOR_HOST = authHost;
  process.env.FIRESTORE_EMULATOR_HOST = firestoreHost;
  process.env.GCLOUD_PROJECT = PROJECT_ID;
  process.env.GOOGLE_CLOUD_PROJECT = PROJECT_ID;
  process.env.FIRESTORE_DATABASE_ID = DATABASE_ID;

  const app = initializeApp({ projectId: PROJECT_ID }, `auth-emulator-seed-${Date.now()}`);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const batch = db.batch();

  try {
    for (const seedUser of users) {
      try {
        await auth.getUser(seedUser.uid);
        await auth.updateUser(seedUser.uid, {
          email: seedUser.email,
          password: PASSWORD,
          displayName: seedUser.displayName,
          emailVerified: true,
          disabled: false,
        });
      } catch (error: unknown) {
        const code = typeof error === 'object' && error && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';
        if (code !== 'auth/user-not-found') throw error;
        await auth.createUser({
          uid: seedUser.uid,
          email: seedUser.email,
          password: PASSWORD,
          displayName: seedUser.displayName,
          emailVerified: true,
        });
      }

      const roleReference = db.collection('adminUsers').doc(seedUser.uid);
      if (seedUser.isAdmin) {
        batch.set(roleReference, {
          role: 'admin',
          displayName: seedUser.displayName,
        });
      } else {
        batch.delete(roleReference);
      }
    }

    await batch.commit();

    console.log('Local Firebase emulator users seeded successfully.');
    console.table(users.map((user) => ({
      uid: user.uid,
      email: user.email,
      password: PASSWORD,
      role: user.isAdmin ? 'admin' : 'user',
    })));
    console.log({
      project: PROJECT_ID,
      authHost,
      firestoreHost,
      database: DATABASE_ID,
      users: users.length,
      administrators: users.filter((user) => user.isAdmin).length,
    });
  } finally {
    await deleteApp(app);
  }
}

run().catch((error) => {
  console.error('Failed to seed local Firebase emulator users:', error);
  process.exitCode = 1;
});
