'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import { auth, firebaseConfigError } from '@/firebase';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const isPublicAuthPage = pathname === '/admin/login' || pathname === '/admin/reset-password';

  useEffect(() => {
    if (isPublicAuthPage) {
      return;
    }
    if (firebaseConfigError) {
      console.error(firebaseConfigError);
      router.replace('/admin/login');
      return;
    }

    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
        router.replace('/admin/login');
        return;
      }

      try {
        const token = await nextUser.getIdToken();
        const response = await fetch('/api/admin/session', {
          cache: 'no-store',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (response.ok) {
          setIsAuthorized(true);
          return;
        }
        await signOut(auth);
        router.replace(response.status === 403 ? '/admin/login?reason=forbidden' : '/admin/login');
      } catch {
        if (!cancelled) router.replace('/admin/login');
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isPublicAuthPage, router]);

  if (isPublicAuthPage) return children;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8]">
        <div className="w-10 h-10 border-4 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return children;
}
