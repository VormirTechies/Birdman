'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Work_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import { NextIntlClientProvider } from 'next-intl';
import { AdminSidebar } from './_components/Sidebar';
import { AdminHeader } from './_components/Header';
import { AdminBottomNav } from './_components/BottomNav';
import { subscribeUser } from '@/lib/push/client';
import { requestPushPermission } from '@/lib/push/send';
import { createClient } from '@/lib/supabase/client';
import enMessages from '@/../messages/en.json';

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Setup push notifications on mount
  useEffect(() => {
    const setupPushNotifications = async () => {
      // Only run on client side and when not on excluded routes
      if (typeof window === 'undefined') return;
      if (pathname?.includes('/login') || pathname?.includes('/reset-password')) return;

      try {
        // Check if user is authenticated
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        console.log('[Admin Layout] Setting up push notifications...');

        // Request notification permission if not already granted
        if ('Notification' in window && Notification.permission === 'default') {
          const permission = await requestPushPermission();
          
          if (permission === 'granted') {
            console.log('✅ Push notification permission granted');
            
            // Subscribe to push notifications
            try {
              const subscription = await subscribeUser();
              console.log('✅ Push subscription created:', subscription);
            } catch (subError) {
              console.error('Failed to create push subscription:', subError);
            }
          } else {
            console.log('❌ Push notification permission denied');
          }
        } else if (Notification.permission === 'granted') {
          // Permission already granted, ensure subscription exists
          try {
            await subscribeUser();
            console.log('✅ Push subscription verified');
          } catch (subError) {
            console.error('Failed to verify push subscription:', subError);
          }
        }
      } catch (error) {
        console.error('[Admin Layout] Error setting up push notifications:', error);
      }
    };

    setupPushNotifications();
  }, [pathname]);

  // Routes that should bypass the layout wrapper
  const isExcludedRoute =
    pathname?.includes('/login') || pathname?.includes('/not-found') || pathname?.includes('/reset-password');

  if (isExcludedRoute) {
    return (
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <div className={workSans.variable}>
          {children}
        </div>
        <Toaster position="top-right" richColors expand={true} theme="light" className="z-9999" />
      </NextIntlClientProvider>
    );
  }

  return (
    <NextIntlClientProvider locale="en" messages={enMessages}>
      <div className={`${workSans.variable} min-h-screen bg-[#F5F5F5]`}>
        {/* Fixed sidebar (desktop) + drawer (mobile) */}
        <AdminSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main area — offset right of the desktop sidebar */}
        <div className="lg:ml-65 flex flex-col min-h-screen">
          {/* Fixed top header */}
          <AdminHeader onMenuClick={() => setIsSidebarOpen(true)} />

          {/* Page content — padded below header, and above bottom nav on mobile */}
          <main className="flex-1 mt-16 pb-16 lg:pb-0 p-4 lg:p-8">
            {children}
          </main>
        </div>

        {/* Fixed bottom nav — mobile only */}
        <AdminBottomNav onMoreClick={() => setIsSidebarOpen(true)} />

        <Toaster position="top-right" richColors expand={true} theme="light" className="z-9999" />
      </div>
    </NextIntlClientProvider>
  );
}

