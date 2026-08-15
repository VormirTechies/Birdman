import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { applicationDefault, cert, deleteApp, initializeApp } from 'firebase-admin/app';
import { getAuth, type UserRecord } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { z } from 'zod';

const PROJECT_ID = 'birdman-7e745';
const DATABASE_ID = 'birdman-db';
const DEFAULT_USERS_FILE = '.firebase/production-admin-users.json';

config({ path: path.resolve(process.cwd(), '.env.production') });
config({ path: path.resolve(process.cwd(), '.env.local'), override: false });

const adminSeedUserSchema = z.object({
  uid: z.string().trim().min(1).max(128).optional(),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  displayName: z.string().trim().min(2).max(100),
  password: z.string()
    .min(8)
    .max(128)
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .optional(),
}).strict();

const adminSeedFileSchema = z.array(adminSeedUserSchema).min(1).max(20).superRefine((users, context) => {
  const emails = new Set<string>();
  const uids = new Set<string>();

  users.forEach((user, index) => {
    if (emails.has(user.email)) {
      context.addIssue({
        code: 'custom',
        path: [index, 'email'],
        message: 'Duplicate email address',
      });
    }
    emails.add(user.email);

    if (user.uid) {
      if (uids.has(user.uid)) {
        context.addIssue({
          code: 'custom',
          path: [index, 'uid'],
          message: 'Duplicate UID',
        });
      }
      uids.add(user.uid);
    }
  });
});

type AdminSeedUser = z.infer<typeof adminSeedUserSchema>;

function requireProductionConfirmation() {
  if (!process.argv.includes('--confirm-production')) {
    throw new Error(
      'Refusing to seed production without --confirm-production. ' +
      'Run: npm run seed:auth:production -- --confirm-production'
    );
  }
}

function requireProductionTarget() {
  const emulatorVariables = [
    'FIREBASE_AUTH_EMULATOR_HOST',
    'FIRESTORE_EMULATOR_HOST',
    'FIREBASE_STORAGE_EMULATOR_HOST',
    'STORAGE_EMULATOR_HOST',
  ];

  for (const variable of emulatorVariables) {
    if (process.env[variable]?.trim()) {
      throw new Error(`Refusing production seed while ${variable} is configured`);
    }
  }

  const projectVariables = [
    'FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'GCLOUD_PROJECT',
    'GOOGLE_CLOUD_PROJECT',
  ];

  for (const variable of projectVariables) {
    const value = process.env[variable]?.trim();
    if (value && value !== PROJECT_ID) {
      throw new Error(`Refusing production seed: ${variable} targets ${value}, expected ${PROJECT_ID}`);
    }
  }

  const configuredDatabase = process.env.FIRESTORE_DATABASE_ID?.trim();
  if (configuredDatabase && configuredDatabase !== DATABASE_ID) {
    throw new Error(
      `Refusing production seed: FIRESTORE_DATABASE_ID targets ${configuredDatabase}, expected ${DATABASE_ID}`
    );
  }
}

function getUsersFilePath() {
  const argumentIndex = process.argv.indexOf('--users-file');
  if (argumentIndex === -1) return path.resolve(process.cwd(), DEFAULT_USERS_FILE);

  const value = process.argv[argumentIndex + 1]?.trim();
  if (!value || value.startsWith('--')) {
    throw new Error('--users-file requires a JSON file path');
  }
  return path.resolve(process.cwd(), value);
}

async function readSeedUsers(filePath: string) {
  let raw: string;
  try {
    raw = await readFile(filePath, 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to read production admin seed file ${filePath}: ${message}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Production admin seed file is not valid JSON: ${filePath}`);
  }

  return adminSeedFileSchema.parse(parsed);
}

function getCredential() {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    return cert({ projectId: PROJECT_ID, clientEmail, privateKey });
  }
  if (clientEmail || privateKey) {
    throw new Error('FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must be configured together');
  }
  return applicationDefault();
}

function isUserNotFound(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error &&
    String((error as { code: unknown }).code) === 'auth/user-not-found';
}

async function findExistingUser(
  auth: ReturnType<typeof getAuth>,
  seedUser: AdminSeedUser
): Promise<UserRecord | null> {
  try {
    if (seedUser.uid) {
      const user = await auth.getUser(seedUser.uid);
      if (user.email?.toLowerCase() !== seedUser.email) {
        throw new Error(
          `UID ${seedUser.uid} already belongs to ${user.email ?? 'a user without email'}, not ${seedUser.email}`
        );
      }
      return user;
    }
    return await auth.getUserByEmail(seedUser.email);
  } catch (error) {
    if (isUserNotFound(error)) return null;
    throw error;
  }
}

async function run() {
  requireProductionConfirmation();
  requireProductionTarget();

  const usersFile = getUsersFilePath();
  const users = await readSeedUsers(usersFile);
  const app = initializeApp(
    { projectId: PROJECT_ID, credential: getCredential() },
    `auth-production-seed-${Date.now()}`
  );
  const auth = getAuth(app);
  const db = getFirestore(app, DATABASE_ID);
  const createdUsers: UserRecord[] = [];

  try {
    // Fail before mutating Authentication if the named production database is
    // unavailable or the supplied credentials cannot access it.
    await db.collection('adminUsers').limit(1).get();

    const resolvedUsers: Array<{ record: UserRecord; seed: AdminSeedUser; created: boolean }> = [];
    for (const seedUser of users) {
      const existing = await findExistingUser(auth, seedUser);
      if (existing) {
        resolvedUsers.push({ record: existing, seed: seedUser, created: false });
        continue;
      }

      if (!seedUser.password) {
        throw new Error(
          `No Firebase Auth user exists for ${seedUser.email}; provide a password to create it`
        );
      }

      const record = await auth.createUser({
        ...(seedUser.uid ? { uid: seedUser.uid } : {}),
        email: seedUser.email,
        displayName: seedUser.displayName,
        password: seedUser.password,
        emailVerified: false,
        disabled: false,
      });
      createdUsers.push(record);
      resolvedUsers.push({ record, seed: seedUser, created: true });
    }

    const batch = db.batch();
    for (const { record, seed } of resolvedUsers) {
      batch.set(db.collection('adminUsers').doc(record.uid), {
        role: 'admin',
        displayName: seed.displayName,
      });
    }
    await batch.commit();

    console.log('Production Firebase administrators seeded successfully.');
    console.table(resolvedUsers.map(({ record, seed, created }) => ({
      uid: record.uid,
      email: seed.email,
      displayName: seed.displayName,
      authUser: created ? 'created' : 'existing',
      role: 'admin',
    })));
    console.log({
      project: PROJECT_ID,
      database: DATABASE_ID,
      administrators: resolvedUsers.length,
      createdAuthUsers: createdUsers.length,
      usersFile,
    });
  } catch (error) {
    if (createdUsers.length > 0) {
      await Promise.allSettled(createdUsers.map((user) => auth.deleteUser(user.uid)));
    }
    throw error;
  } finally {
    await deleteApp(app);
  }
}

run().catch((error) => {
  if (error instanceof z.ZodError) {
    console.error('Invalid production admin seed file:', z.treeifyError(error));
  } else {
    console.error('Failed to seed production Firebase administrators:', error);
  }
  process.exitCode = 1;
});
