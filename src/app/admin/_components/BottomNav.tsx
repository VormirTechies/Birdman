'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, ClipboardList, UserCircle, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const BOTTOM_NAV_ITEMS = [
  { label: 'DASHBOARD', icon: LayoutDashboard, href: '/admin' },
  { label: 'CALENDAR', icon: Calendar, href: '/admin/calendar' },
  { label: 'CHECKLIST', icon: ClipboardList, href: '/admin/checklist' },
  { label: 'PROFILE', icon: UserCircle, href: '/admin/profile' },
];

interface BottomNavProps {
  onMoreClick: () => void;
}

export function AdminBottomNav({ onMoreClick }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.08)] z-40 flex items-stretch justify-around"
      style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
    >
      {BOTTOM_NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/admin' && pathname?.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 flex-1 px-1"
          >
            <item.icon
              className={cn(
                'w-5 h-5 transition-colors',
                isActive ? 'text-[#2E7D32]' : 'text-gray-400'
              )}
            />
            <span
              className={cn(
                'text-[10px] font-medium tracking-wide transition-colors',
                isActive ? 'text-[#2E7D32]' : 'text-[#9E9E9E]'
              )}
            >
              {item.label}
            </span>
            {/* Active indicator */}
            {isActive && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-[#2E7D32] rounded-t-full" />
            )}
          </Link>
        );
      })}

      {/* More button — opens sidebar drawer */}
      <button
        onClick={onMoreClick}
        className="flex flex-col items-center justify-center gap-1 flex-1 px-1"
        aria-label="More"
        suppressHydrationWarning
      >
        <MoreHorizontal className="w-5 h-5 text-[#9E9E9E]" />
        <span className="text-[10px] font-medium tracking-wide text-[#9E9E9E]">
          MORE
        </span>
      </button>
    </nav>
  );
}
