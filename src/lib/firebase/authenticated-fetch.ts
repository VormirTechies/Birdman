'use client';

import { auth, firebaseConfigError } from '@/firebase';

export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
) {
  if (firebaseConfigError) {
    throw new Error(firebaseConfigError);
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('Admin authentication is required');
  }

  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);

  return fetch(input, {
    ...init,
    headers,
  });
}
