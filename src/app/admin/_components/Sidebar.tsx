'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  History,
  Images,
  UserCircle,
  HelpCircle,
  LogOut,
  X,
  Bird,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/adminV2' },
  { label: 'Calendar', icon: Calendar, href: '/adminV2/calendar' },
  { label: 'Checklist', icon: ClipboardList, href: '/adminV2/checklist' },
  { label: 'History', icon: History, href: '/adminV2/history' },
  { label: 'Gallery', icon: Images, href: '/adminV2/gallery' },
  { label: 'Profile', icon: UserCircle, href: '/adminV2/profile' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function SidebarContent({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/adminV2/login';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[#E0E0E0] shrink-0">
        <div className="w-9 h-9 rounded-lg bg-[#2E7D32] flex items-center justify-center shrink-0">
          <Bird className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-[#212121] text-base" style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}>
          Booking Admin
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/adminV2' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-h-11',
                isActive
                  ? 'bg-[#E8F5E9] text-[#2E7D32]'
                  : 'text-[#616161] hover:bg-[#F5F5F5] hover:text-[#212121]'
              )}
              style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
            >
              <item.icon
                className={cn(
                  'w-5 h-5 shrink-0',
                  isActive ? 'text-[#2E7D32]' : 'text-[#9E9E9E]'
                )}
              />
              <span>{item.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-5 rounded-full bg-[#2E7D32]" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-3 border-t border-[#E0E0E0] space-y-0.5 shrink-0">
        <Link
          href="/adminV2/help"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#616161] hover:bg-[#F5F5F5] hover:text-[#212121] transition-colors min-h-11"
          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
        >
          <HelpCircle className="w-5 h-5 text-[#9E9E9E] shrink-0" />
          <span>Help</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#616161] hover:bg-red-50 hover:text-[#ba1a1a] transition-colors min-h-11"
          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
        >
          <LogOut className="w-5 h-5 text-[#ba1a1a] shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

export function AdminV2Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop Sidebar — always visible, fixed */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-65 bg-white z-30">
        <SidebarContent onClose={() => {}} />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
              onClick={onClose}
            />
            {/* Drawer panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 bg-white z-50 flex flex-col shadow-2xl w-70"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[#F5F5F5] text-[#616161] transition-colors z-10"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent onClose={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
