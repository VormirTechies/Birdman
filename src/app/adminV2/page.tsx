'use client';

import { Users, CalendarCheck, CalendarClock, TrendingUp, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StatCard } from './_components/StatCard';
import { RecentBookings } from './_components/RecentBookings';
import type { StatCardProps } from './_components/StatCard';

const STAT_CARDS: StatCardProps[] = [
  {
    label: "Today's Visitors",
    value: 148,
    icon: Users,
    trend: '+12%',
    trendUp: true,
    iconBg: '#E8F5E9',
    iconColor: '#2E7D32',
  },
  {
    label: 'Next 30 Days',
    value: 320,
    icon: CalendarCheck,
    trend: '+5%',
    trendUp: true,
    iconBg: '#E8F5E9',
    iconColor: '#2E7D32',
  },
  {
    label: 'Last 30 Days',
    value: 1204,
    icon: CalendarClock,
    trend: '-3%',
    trendUp: false,
    iconBg: '#FFF3E0',
    iconColor: '#E65100',
  },
  {
    label: 'Total Visitors',
    value: 12450,
    icon: TrendingUp,
    trend: '→ 0%',
    trendUp: null,
    iconBg: '#F5F5F5',
    iconColor: '#616161',
  },
];

export default function AdminV2Page() {
  const router = useRouter();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl lg:text-3xl font-bold text-[#212121]"
            style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
          >
            Overview
          </h1>
          <p className="text-sm text-[#616161] mt-1">
            Here&apos;s what&apos;s happening at your property today.
          </p>
        </div>
        <button
          onClick={() => router.push('/adminV2/bookings/new')}
          className="shrink-0 inline-flex items-center gap-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors min-h-11"
          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
        >
          <Plus className="w-4 h-4" />
          New Booking
        </button>
      </div>

      {/* Stat cards — 2 cols on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STAT_CARDS.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Recent Bookings section */}
      <div className="mb-8">
        <RecentBookings />
      </div>
    </div>
  );
}