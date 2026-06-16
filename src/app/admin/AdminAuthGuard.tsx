'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';
import { auth, firebaseConfigError } from '@/firebase';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(
    () => auth.currentUser ?? undefined
  );

  useEffect(() => {
    if (pathname === '/admin/login') return;
    if (firebaseConfigError) {
      console.error(firebaseConfigError);
      router.replace('/admin/login');
      return;
    }

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);

      if (!nextUser) {
        router.replace('/admin/login');
      }
    });
  }, [pathname, router]);

  if (pathname === '/admin/login') return children;

  if (user === undefined || user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f8f8]">
        <div className="w-10 h-10 border-4 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return children;
}
