'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bird, LayoutDashboard, History, Image as ImageIcon,
  MessageSquare, Settings, LogOut, Menu, X, Bell,
  Calendar, ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { usePush } from '@/components/providers/PushProvider';

// ─── Navigation items ─────────────────────────────────────────────────────────

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Calendar',  icon: Calendar,        href: '/admin/calendar' },
  { label: 'Checklist', icon: ClipboardList,    href: '/admin/checklist' },
  { label: 'History',   icon: History,          href: '/admin/history' },
  { label: 'Gallery',   icon: ImageIcon,        href: '/admin/gallery' },
  { label: 'Feedback',  icon: MessageSquare,    href: '/admin/feedback' },
  { label: 'Settings',  icon: Settings,         href: '/admin/settings' },
];

// Bottom nav shows first 4 items
const bottomNavItems = navItems.slice(0, 4);

// ─── Sidebar overlay (mobile burger menu) ────────────────────────────────────

function MobileSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  // Lock scroll when sidebar open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[150] bg-canopy-dark/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sliding drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 left-0 z-[160] w-72 bg-canopy-dark flex flex-col shadow-2xl"
          >
            {/* Logo + close */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Bird className="w-7 h-7 text-sanctuary-green" />
                <span className="font-display font-bold text-lg text-white">Birdman Admin</span>
              </div>
              <button
                onClick={onClose}
                suppressHydrationWarning
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200",
                      isActive
                        ? "bg-sanctuary-green text-white shadow-lg shadow-sanctuary-green/25"
                        : "text-white/50 hover:text-white hover:bg-white/8"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-4 py-5 border-t border-white/5 space-y-3">
              <div className="bg-white/5 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-sanctuary-green/80 rounded-xl flex items-center justify-center font-bold text-white text-sm">A</div>
                <div>
                  <p className="text-sm font-bold text-white leading-none">Administrator</p>
                  <p className="text-[10px] text-white/30 mt-0.5">Birdman of Chennai</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                suppressHydrationWarning
                className="w-full justify-start text-white/40 hover:text-red-400 hover:bg-red-500/10 h-11 rounded-xl gap-3 text-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Main Sidebar (desktop) ───────────────────────────────────────────────────

export function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { permission, isSubscribed, isLoading, enablePush, testPush } = usePush();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  return (
    <>
      {/* ── MOBILE HEADER BAR ───────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-[100] bg-canopy-dark/95 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2.5">
          <Bird className="w-6 h-6 text-sanctuary-green" />
          <span className="font-bold text-white text-base">Birdman Admin</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          suppressHydrationWarning
          className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ── MOBILE BOTTOM NAV ───────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-[100] bg-canopy-dark/95 backdrop-blur-md border-t border-white/5 flex items-center justify-around px-2 h-16 safe-area-bottom">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200 min-w-0",
                isActive ? "text-sanctuary-green" : "text-white/35 hover:text-white/60"
              )}
            >
              <div className="relative">
                <item.icon className="w-6 h-6" />
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-sanctuary-green rounded-full"
                  />
                )}
              </div>
              <span className="text-[10px] font-semibold leading-none">{item.label}</span>
            </Link>
          );
        })}
        {/* More button → opens sidebar */}
        <button
          onClick={() => setIsMobileOpen(true)}
          suppressHydrationWarning
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl text-white/35 hover:text-white/60 transition-colors"
        >
          <Menu className="w-6 h-6" />
          <span className="text-[10px] font-semibold leading-none">More</span>
        </button>
      </nav>

      {/* ── MOBILE SLIDING SIDEBAR ──────────────────────────────────────── */}
      <MobileSidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-canopy-dark border-r border-white/5">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-7 border-b border-white/5">
          <Bird className="w-7 h-7 text-sanctuary-green" />
          <span className="font-display font-bold text-lg text-white">Birdman Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative",
                  isActive
                    ? "bg-white/8 text-white"
                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                )}
              >
                <item.icon className={cn("w-4.5 h-4.5 shrink-0 transition-colors", isActive ? "text-sanctuary-green" : "text-white/25 group-hover:text-white/40")} />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="desktop-nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-sanctuary-green rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Push Notifications */}
        <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
          <div className="px-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/25">Alerts</span>
              <span className={cn(
                "text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter",
                isSubscribed ? "bg-sanctuary-green/20 text-sanctuary-green" : "bg-red-500/20 text-red-400"
              )}>
                {isLoading ? '...' : isSubscribed ? 'On' : 'Off'}
              </span>
            </div>
            {isSubscribed ? (
              <Button variant="outline" size="sm" onClick={testPush} suppressHydrationWarning
                className="w-full bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10 rounded-xl h-9 text-xs gap-2">
                <Bell className="w-3.5 h-3.5" /> Test Pulse
              </Button>
            ) : (
              <Button size="sm" onClick={enablePush} disabled={isLoading} suppressHydrationWarning
                className="w-full bg-sanctuary-green hover:bg-sanctuary-green/90 text-white rounded-xl h-9 text-xs gap-2">
                <Bell className="w-3.5 h-3.5" /> {isLoading ? 'Loading…' : 'Enable Alerts'}
              </Button>
            )}
          </div>

          {/* User */}
          <div className="bg-white/5 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-sanctuary-green/70 rounded-xl flex items-center justify-center font-bold text-white text-xs">A</div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-none truncate">Administrator</p>
              <p className="text-[10px] text-white/30 mt-0.5 truncate">Birdman of Chennai</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleSignOut} suppressHydrationWarning
            className="w-full justify-start text-white/35 hover:text-red-400 hover:bg-red-500/10 h-10 rounded-xl gap-3 text-sm">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
}
