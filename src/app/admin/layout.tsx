'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Work_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import { NextIntlClientProvider } from 'next-intl';
import { AdminSidebar } from './_components/Sidebar';
import { AdminHeader } from './_components/Header';
import { AdminBottomNav } from './_components/BottomNav';
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

  // Routes that should bypass the layout wrapper
  const isExcludedRoute =
    pathname?.includes('/login') || pathname?.includes('/not-found');

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

