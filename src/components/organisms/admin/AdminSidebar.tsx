'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bird,
  LayoutDashboard,
  History,
  Image as ImageIcon,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'History', icon: History, href: '/admin/history' },
  { label: 'Gallery', icon: ImageIcon, href: '/admin/gallery' },
  { label: 'Feedback', icon: MessageSquare, href: '/admin/feedback' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [permission, setPermission] = useState<string>('loading');
  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermission(Notification.permission);
    }
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  return (
    <>
      {/* MOBILE BOTTOM NAV */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[100]">
        <nav className="bg-canopy-dark/90 backdrop-blur-xl border border-white/10 rounded-3xl p-3 shadow-2xl flex items-center justify-around">
          {navItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "p-3 rounded-2xl transition-all duration-300 relative",
                  isActive ? "bg-sanctuary-green text-white" : "text-white/40 hover:text-white/70"
                )}
              >
                <item.icon className="w-6 h-6" />
                {isActive && (
                  <motion.div
                    layoutId="active-pill-mobile"
                    className="absolute inset-0 bg-sanctuary-green rounded-2xl -z-10 shadow-lg shadow-sanctuary-green/30"
                  />
                )}
              </Link>
            );
          })}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(true)}
            className="text-white/40 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </Button>
        </nav>
      </div>

      {/* MOBILE FULL-SCREEN MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="lg:hidden fixed inset-0 bg-canopy-dark z-[200] p-8 flex flex-col"
          >
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-3">
                <Bird className="w-8 h-8 text-sanctuary-green" />
                <span className="font-display font-bold text-xl text-white">Birdman Admin</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-white/50 hover:text-white">
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="space-y-4 flex-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 p-5 rounded-2xl text-lg font-medium transition-all",
                    pathname === item.href ? "bg-sanctuary-green text-white" : "bg-white/5 text-white/50"
                  )}
                >
                  <item.icon className="w-6 h-6" />
                  {item.label}
                </Link>
              ))}
            </div>

            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="h-16 rounded-2xl text-lg gap-3"
            >
              <LogOut className="w-6 h-6" />
              Sign Out
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 left-0 bg-canopy-dark border-r border-white/5 p-8">
        <div className="flex items-center gap-3 mb-12">
          <Bird className="w-8 h-8 text-sanctuary-green" />
          <h1 className="font-display font-bold text-xl text-white">Birdman Admin</h1>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative",
                  isActive ? "text-white" : "text-white/40 hover:text-white/70"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-sanctuary-green" : "text-white/20 group-hover:text-white/40")} />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-white/5 rounded-xl -z-10"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="pt-8 mt-8 border-t border-white/5 space-y-6">
          {/* Notification Quick Access */}
          <div className="px-4">
             <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/30">Sanctuary Alerts</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter",
                  permission === 'granted' 
                    ? "bg-sanctuary-green/20 text-sanctuary-green" 
                    : "bg-red-500/20 text-red-500"
                )}>
                  {permission}
                </span>
             </div>
             <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                   const res = await fetch('/api/admin/push/test', { method: 'POST' });
                   if (res.ok) alert('🕊️ Test push dispatched! Check your desktop/phone.');
                   else alert('❌ Test push failed. Please check permissions.');
                }}
                className="w-full bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10 rounded-xl h-10 text-xs gap-2"
             >
                <Bell className="w-3.5 h-3.5" />
                Push Test Alert
             </Button>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-sanctuary-green rounded-xl flex items-center justify-center font-bold text-white uppercase">
              A
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white leading-none mb-1">Administrator</p>
              <p className="text-[10px] text-white/30 truncate">Birdman of Chennai</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start text-white/40 hover:text-white hover:bg-white/5 h-12 rounded-xl gap-3"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
}
