'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Work_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import { NextIntlClientProvider } from 'next-intl';
import { AdminSidebar } from './_components/Sidebar';
import { AdminHeader } from './_components/Header';
import { AdminBottomNav } from './_components/BottomNav';
import { NotificationProvider } from '@/components/providers/NotificationProvider';
import enMessages from '@/../messages/en.json';
import { PWAInstallBanner } from '@/components/admin/PWAInstallBanner';
import { AdminAuthGuard } from './AdminAuthGuard';
import { NotificationDeviceControl } from '@/components/admin/NotificationDeviceControl';

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

  // Swap to admin-specific PWA manifest
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (link) link.href = '/admin-manifest.json';
  }, []);

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
      <AdminAuthGuard>
        <NotificationProvider>
        <div className={`${workSans.variable} min-h-screen bg-[#f8f8f8]`}>
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
            <NotificationDeviceControl />
            {children}
          </main>
        </div>

        {/* Fixed bottom nav — mobile only */}
        <PWAInstallBanner />
        <AdminBottomNav onMoreClick={() => setIsSidebarOpen(true)} />

        <Toaster position="top-right" richColors expand={true} theme="light" className="z-9999" />
        </div>
        </NotificationProvider>
      </AdminAuthGuard>
    </NextIntlClientProvider>
  );
}

