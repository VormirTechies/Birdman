import 'server-only';

import type { DecodedIdToken, UserRecord } from 'firebase-admin/auth';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import {
  ADMIN_ROLE,
  isAdminUserDocument,
  type AdminSessionUser,
  type AdminUserDocument,
} from '@/models/firestore/admin-user';
import type { CreateFirebaseUserInput } from '@/models/firebase/auth-user';

const COLLECTION = 'adminUsers';

export async function getAdminRole(uid: string): Promise<AdminUserDocument | null> {
  const snapshot = await getAdminDb().collection(COLLECTION).doc(uid).get();
  if (!snapshot.exists) return null;
  const data = snapshot.data();
  return isAdminUserDocument(data) ? data : null;
}

export async function authorizeAdminToken(
  token: DecodedIdToken
): Promise<AdminSessionUser | null> {
  const role = await getAdminRole(token.uid);
  if (!role) return null;

  return {
    uid: token.uid,
    email: token.email ?? null,
    displayName: role.displayName?.trim() || token.name || null,
    role: ADMIN_ROLE,
  };
}

export async function listFirebaseUsers() {
  const users: UserRecord[] = [];
  let pageToken: string | undefined;

  do {
    const result = await getAdminAuth().listUsers(1000, pageToken);
    users.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);

  return users.map((user) => {
    const email = user.email ?? '';
    return {
      id: user.uid,
      email,
      name: user.displayName || email.split('@')[0] || 'Unknown',
      avatarUrl: user.photoURL ?? null,
      createdAt: user.metadata.creationTime,
    };
  });
}

export async function createFirebaseUser(input: CreateFirebaseUserInput) {
  const auth = getAdminAuth();
  const user = await auth.createUser({
    displayName: input.displayName,
    email: input.email,
    password: input.password,
    emailVerified: false,
    disabled: false,
  });

  try {
    if (input.isAdmin) {
      await getAdminDb().collection(COLLECTION).doc(user.uid).set({
        role: ADMIN_ROLE,
        displayName: input.displayName,
      });
    }
  } catch (error) {
    await auth.deleteUser(user.uid).catch((rollbackError) => {
      console.error('[Admin users] Failed to roll back Firebase Auth user:', rollbackError);
    });
    throw error;
  }

  return {
    id: user.uid,
    email: user.email ?? input.email,
    name: user.displayName ?? input.displayName,
    avatarUrl: user.photoURL ?? null,
    createdAt: user.metadata.creationTime,
    role: input.isAdmin ? ADMIN_ROLE : 'user',
  };
}
