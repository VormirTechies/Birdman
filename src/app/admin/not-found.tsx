'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminNotFound() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin dashboard for any unknown admin routes
    router.replace('/admin');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f1d4]">
      <div className="text-center">
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
