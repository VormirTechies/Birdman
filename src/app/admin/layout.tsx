'use client';

import { Toaster } from 'sonner';
import { AdminSidebar } from '@/components/organisms/admin/AdminSidebar';
import { RealtimeNotifier } from '@/components/organisms/admin/RealtimeNotifier';
import { PushProvider } from '@/components/providers/PushProvider';
import { usePush } from '@/components/providers/PushProvider';

import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <PushProvider>
        {!isLoginPage && <AdminSidebar />}
        {!isLoginPage && <RealtimeNotifier />}
        <div className={!isLoginPage ? "lg:pl-72 min-h-screen pb-32 lg:pb-0" : "min-h-screen"}>
          {children}
        </div>
      </PushProvider>
      <Toaster 
        position="top-right"
        richColors
        expand={true}
        theme="light"
        className="z-[9999]"
      />
    </div>
  );
}
