'use client';

import { useRef, useState, useEffect } from 'react';
import { Bell, Menu, UserCircle, Settings, LogOut, Bird, MessageSquare, CheckCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { ActionsMenu } from './ActionsMenu';
import { useNotifications, AppNotification } from '@/components/providers/NotificationProvider';

// ─── Avatar helpers (matches profile page palette) ─────────────────────────

const AVATAR_PALETTE = [
  { bg: '#C8E6C9', text: '#2E7D32' },
  { bg: '#FFE0B2', text: '#E65100' },
  { bg: '#F8BBD0', text: '#C2185B' },
  { bg: '#BBDEFB', text: '#1976D2' },
  { bg: '#E1BEE7', text: '#7B1FA2' },
];

function avatarColor(identifier: string) {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash * 31 + identifier.charCodeAt(i)) & 0xffff;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

// ─── Notification item ──────────────────────────────────────────────────────

function NotificationItem({ n }: { n: AppNotification }) {
  const { bg, text } = avatarColor(n.visitorName);
  return (
    <div className={`px-4 py-3 flex gap-3 items-start transition-colors ${n.read ? '' : 'bg-[#F9FCF9]'}`}>
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
        style={{ backgroundColor: bg, color: text }}
      >
        {getInitials(n.visitorName)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {n.type === 'booking' ? (
            <Bird className="w-3 h-3 text-[#2E7D32] shrink-0" />
          ) : (
            <MessageSquare className="w-3 h-3 text-[#1976D2] shrink-0" />
          )}
          <span className="text-sm font-semibold text-[#212121] truncate">{n.visitorName}</span>
          {!n.read && (
            <span className="ml-auto w-2 h-2 rounded-full bg-[#2E7D32] shrink-0" />
          )}
        </div>
        <p className="text-xs text-[#616161] mt-0.5 leading-relaxed">{n.body}</p>
        <p className="text-xs text-[#9E9E9E] mt-1">
          {formatDistanceToNow(n.createdAt, { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

// ─── Header ─────────────────────────────────────────────────────────────────

interface HeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: HeaderProps) {
  const avatarRef = useRef<HTMLButtonElement>(null);
  const bellWrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [userInitial, setUserInitial] = useState('A');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const { notifications, unreadCount, clearAll } = useNotifications();

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserInitial(user.email.charAt(0).toUpperCase());
      }
    };
    fetchUser();
  }, []);

  // Close on outside click / Escape
  useEffect(() => {
    if (!isPopoverOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (bellWrapperRef.current && !bellWrapperRef.current.contains(e.target as Node)) {
        setIsPopoverOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPopoverOpen(false);
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isPopoverOpen]);

  const handleBellClick = () => {
    const next = !isPopoverOpen;
    setIsPopoverOpen(next);
    if (next && unreadCount > 0) clearAll();
  };

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
        suppressHydrationWarning
      >
        <Menu className="w-5 h-5" />
      </button>

      <h1>Birdman of India</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Bell — notifications popover */}
        <div ref={bellWrapperRef} className="relative">
          <button
            onClick={handleBellClick}
            className="relative p-2 rounded-lg hover:bg-[#F5F5F5] text-[#616161] transition-colors min-h-11 min-w-11 flex items-center justify-center"
            aria-label="Notifications"
            suppressHydrationWarning
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 min-w-4 h-4 bg-[#ba1a1a] rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Popover */}
          {isPopoverOpen && (
            <div
              className="absolute top-[calc(100%+8px)] right-0 w-80 bg-white rounded-2xl shadow-xl border border-[#F0F0F0] z-30 overflow-hidden"
              style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
            >
              {/* Popover header */}
              <div className="px-4 py-3 border-b border-[#F0F0F0] flex items-center justify-between">
                <span className="text-sm font-semibold text-[#212121]">Notifications</span>
                {notifications.some(n => n.read === false || true) && notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1 text-xs text-[#2E7D32] font-medium hover:text-[#1B5E20] transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              {notifications.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-[#9E9E9E]">
                  <Bell className="w-8 h-8 opacity-30" />
                  <p className="text-sm font-medium">No new notifications</p>
                  <p className="text-xs">New bookings will appear here</p>
                </div>
              ) : (
                <div className="max-h-100 overflow-y-auto divide-y divide-[#F0F0F0]">
                  {notifications.map(n => (
                    <NotificationItem key={n.id} n={n} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar — triggers profile context menu */}
        <button
          ref={avatarRef}
          className="ml-1 w-9 h-9 rounded-full bg-[#A5D6A7] flex items-center justify-center text-sm font-semibold text-[#1B5E20] hover:ring-2 hover:ring-[#2E7D32]/30 transition-all"
          aria-label="Account menu"
          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
          suppressHydrationWarning
        >
          {userInitial}
        </button>

        {/* Profile context menu — bound to avatar ref */}
        <ActionsMenu groups={profileMenuGroups} triggerRef={avatarRef} />
      </div>
    </header>
  );
}

