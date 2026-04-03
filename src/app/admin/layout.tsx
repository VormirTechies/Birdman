'use client';

import { Toaster } from 'sonner';
import { AdminSidebar } from '@/components/organisms/admin/AdminSidebar';
import { RealtimeNotifier } from '@/components/organisms/admin/RealtimeNotifier';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <AdminSidebar />
      <RealtimeNotifier />
      <div className="lg:pl-72 min-h-screen pb-32 lg:pb-0">
        {children}
      </div>
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
