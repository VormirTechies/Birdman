'use client';

import { useRef } from 'react';
import { Bell, Menu, UserCircle, Settings, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ActionsMenu } from './ActionsMenu';

interface HeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: HeaderProps) {
  const avatarRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const profileMenuGroups = [
    {
      label: 'ACCOUNT',
      items: [
        {
          label: 'Profile',
          icon: UserCircle,
          onClick: () => router.push('/admin/profile'),
        },
        {
          label: 'Settings',
          icon: Settings,
          onClick: () => router.push('/admin/settings'),
        },
      ],
    },
    {
      items: [
        {
          label: 'Logout',
          icon: LogOut,
          onClick: handleSignOut,
          variant: 'danger' as const,
        },
      ],
    },
  ];

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-65 h-16 bg-white shadow-sm z-20 flex items-center px-4 lg:px-8">
      {/* Burger menu — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-[#F5F5F5] text-[#616161] transition-colors min-h-11 min-w-11 flex items-center justify-center"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <h1>Birdman of India</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg hover:bg-[#F5F5F5] text-[#616161] transition-colors min-h-11 min-w-11 flex items-center justify-center"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#ba1a1a] rounded-full" />
        </button>

        {/* Avatar — triggers profile context menu */}
        <button
          ref={avatarRef}
          className="ml-1 w-9 h-9 rounded-full bg-[#A5D6A7] flex items-center justify-center text-sm font-semibold text-[#1B5E20] hover:ring-2 hover:ring-[#2E7D32]/30 transition-all"
          aria-label="Account menu"
          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
        >
          MB
        </button>

        {/* Profile context menu — bound to avatar ref */}
        <ActionsMenu groups={profileMenuGroups} triggerRef={avatarRef} />
      </div>
    </header>
  );
}
