'use client';

import { useRef, useState, useEffect } from 'react';
import { Bell, Menu, UserCircle, LogOut } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { signOutAdmin } from '@/lib/firebase/notification-client';
import { toast } from 'sonner';
import { auth, firebaseConfigError } from '@/firebase';
import { ActionsMenu } from './ActionsMenu';
import { useNotifications } from '@/components/providers/NotificationProvider';
import { NotificationInbox } from './NotificationInbox';

// ─── Avatar helpers (matches profile page palette) ─────────────────────────


// ─── Notification item ──────────────────────────────────────────────────────


// ─── Header ─────────────────────────────────────────────────────────────────
interface HeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: HeaderProps) {
  const avatarRef = useRef<HTMLButtonElement>(null);
  const bellWrapperRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const [userInitial, setUserInitial] = useState('A');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const { unreadCount, refresh } = useNotifications();

  useEffect(() => {
    if (firebaseConfigError) {
      console.error(firebaseConfigError);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        setUserInitial(user.email.charAt(0).toUpperCase());
      }
    });

    return unsubscribe;
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
      if (e.key === 'Escape') {
        setIsPopoverOpen(false);
        bellRef.current?.focus();
      }
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
    if (next) refresh();
  };

  const handleSignOut = async () => {
    try {
      if (!firebaseConfigError) await signOutAdmin();
      router.replace('/admin/login');
    } catch {
      toast.error('Unable to disable notifications safely. Check your connection and try signing out again.');
    }
  };

  const profileMenuGroups = [
    {
      label: 'ACCOUNT',
      items: [
        {
          label: 'Profile',
          icon: UserCircle,
          onClick: () => router.push('/admin/profile'),
        }
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
    <header className="fixed top-0 right-0 left-0 lg:left-65 h-16 bg-white shadow-sm z-40 flex items-center px-4 lg:px-8">
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
            ref={bellRef}
            onClick={handleBellClick}
            className="relative p-2 rounded-lg hover:bg-[#F5F5F5] text-[#616161] transition-colors min-h-11 min-w-11 flex items-center justify-center"
            aria-label="Notifications"
            aria-expanded={isPopoverOpen}
            aria-controls={isPopoverOpen ? 'admin-notification-popover' : undefined}
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
          <AnimatePresence>
            {isPopoverOpen && (
              <motion.div
                id="admin-notification-popover"
                initial={{ opacity: 0, y: reduceMotion ? 0 : -6, scale: reduceMotion ? 1 : 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -6, scale: reduceMotion ? 1 : 0.97 }}
                transition={{ duration: reduceMotion ? 0 : 0.15, ease: 'easeOut' }}
                className="fixed top-20 left-4 right-4 sm:absolute sm:top-[calc(100%+8px)] sm:left-auto sm:right-0 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#E0E0E0] z-50 overflow-hidden origin-top-right"
                style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
              >
                <NotificationInbox onNavigate={() => setIsPopoverOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>
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

