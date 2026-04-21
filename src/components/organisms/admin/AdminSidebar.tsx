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
            className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sliding drawer */}
          <motion.aside
            key="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 left-0 z-[160] w-72 bg-white flex flex-col shadow-2xl border-r border-black/5"
          >
            {/* Logo + close */}
            <div className="flex items-center justify-between px-6 py-6 border-b border-black/5 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sanctuary-green/10 flex items-center justify-center">
                  <Bird className="w-5 h-5 text-sanctuary-green" />
                </div>
                <span className="font-display font-bold text-lg text-zinc-900 tracking-tight">Birdman Admin</span>
              </div>
              <button
                onClick={onClose}
                suppressHydrationWarning
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto bg-white">
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
                        ? "bg-sanctuary-green text-white shadow-md shadow-sanctuary-green/10"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-white" : "text-zinc-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-4 py-5 border-t border-black/5 space-y-3 bg-zinc-50/50">
              <div className="bg-white border border-black/5 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-sanctuary-green/10 rounded-xl flex items-center justify-center font-bold text-sanctuary-green text-sm">A</div>
                <div>
                  <p className="text-sm font-bold text-zinc-900 leading-none">Administrator</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Control Panel</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                suppressHydrationWarning
                className="w-full justify-start text-zinc-500 hover:text-red-600 hover:bg-red-50 h-11 rounded-xl gap-3 text-sm font-semibold"
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
      <header className="lg:hidden fixed top-0 inset-x-0 z-[100] bg-white/90 backdrop-blur-md border-b border-black/5 flex items-center justify-between px-4 h-16 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sanctuary-green/10 flex items-center justify-center">
            <Bird className="w-5 h-5 text-sanctuary-green" />
          </div>
          <span className="font-display font-bold text-zinc-900 text-base">Overview</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          suppressHydrationWarning
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* ── MOBILE BOTTOM NAV ───────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-[100] bg-white/95 backdrop-blur-md border-t border-black/5 flex items-center justify-around px-2 h-16 safe-area-bottom shadow-[0_-4px_30px_rgba(0,0,0,0.02)]">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all duration-200 min-w-0 relative",
                isActive ? "text-sanctuary-green" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-sanctuary-green rounded-full shadow-sm"
                  />
                )}
              </div>
              <span className="text-[10px] font-bold leading-none">{item.label}</span>
            </Link>
          );
        })}
        {/* More button → opens sidebar */}
        <button
          onClick={() => setIsMobileOpen(true)}
          suppressHydrationWarning
          className="flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-bold leading-none">More</span>
        </button>
      </nav>

      {/* ── MOBILE SLIDING SIDEBAR ──────────────────────────────────────── */}
      <MobileSidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      {/* ── DESKTOP SIDEBAR ─────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 left-0 bg-white border-r border-black/5 shadow-[4px_0_24px_rgba(0,0,0,0.01)] z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 px-8 py-8 border-b border-black/[0.04] bg-white">
          <div className="w-10 h-10 rounded-2xl bg-sanctuary-green/10 flex items-center justify-center">
             <Bird className="w-6 h-6 text-sanctuary-green" />
          </div>
          <span className="font-display font-black text-xl text-zinc-900 tracking-tight">Birdman</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-5 py-6 space-y-1 overflow-y-auto bg-white">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 group relative",
                  isActive
                    ? "bg-sanctuary-green/10 text-sanctuary-green"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                )}
              >
                <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-sanctuary-green" : "text-zinc-400 group-hover:text-zinc-600")} />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="desktop-nav-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sanctuary-green rounded-full shadow-sm"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Push Notifications & User Footer */}
        <div className="px-5 pb-6 border-t border-black/5 pt-6 space-y-5 bg-zinc-50/50">
          <div className="px-2">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">System Alerts</span>
              <span className={cn(
                "text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter border",
                isSubscribed ? "bg-sanctuary-green/10 text-sanctuary-green border-sanctuary-green/20" : "bg-red-50 text-red-600 border-red-100"
              )}>
                {isLoading ? '...' : isSubscribed ? 'Active' : 'Offline'}
              </span>
            </div>
            {isSubscribed ? (
              <Button variant="outline" size="sm" onClick={testPush} suppressHydrationWarning
                className="w-full bg-white border-black/10 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 hover:border-black/20 rounded-xl h-10 text-xs font-semibold gap-2 shadow-sm transition-all">
                <Bell className="w-3.5 h-3.5 filling" /> Test Pulse
              </Button>
            ) : (
              <Button size="sm" onClick={enablePush} disabled={isLoading} suppressHydrationWarning
                className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-10 text-xs font-bold gap-2 shadow-sm transition-all shadow-amber-500/20">
                <Bell className="w-3.5 h-3.5" /> {isLoading ? 'Loading…' : 'Enable Alerts'}
              </Button>
            )}
          </div>

          {/* User Profile Footer */}
          <div className="bg-white border border-black/5 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 bg-sanctuary-green/10 rounded-xl flex items-center justify-center font-bold text-sanctuary-green text-sm">A</div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-zinc-900 leading-none truncate">Administrator</p>
              <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400 mt-1 truncate">Control Panel</p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleSignOut} suppressHydrationWarning
            className="w-full justify-start text-zinc-500 hover:text-red-600 hover:bg-red-50 h-11 rounded-xl gap-3 text-sm font-bold border border-transparent hover:border-red-100 transition-all">
            <LogOut className="w-4 h-4" /> Secure Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
}
