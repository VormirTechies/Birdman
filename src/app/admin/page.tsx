'use client';

import { useState, useEffect, useMemo } from 'react';
import { Users, CalendarCheck, CalendarClock, TrendingUp, Plus, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { StatCard } from './_components/StatCard';
import { RecentBookings } from './_components/RecentBookings';
import type { StatCardProps } from './_components/StatCard';

export default function AdminPage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({
    todayVisitors: 0,
    next30Days: 0,
    last30Days: 0,
    totalVisitors: 0,
  });

  // Dynamic stat cards based on real data
  const statCards: StatCardProps[] = useMemo(() => [
    {
      label: "Today's Visitors",
      value: stats.todayVisitors,
      icon: Users,
      trend: stats.todayVisitors > 0 ? '+' + stats.todayVisitors : '0',
      trendUp: true,
      iconBg: '#E8F5E9',
      iconColor: '#2E7D32',
    },
    {
      label: 'Next 30 Days',
      value: stats.next30Days,
      icon: CalendarCheck,
      trend: stats.next30Days > 0 ? '+' + stats.next30Days : '0',
      trendUp: true,
      iconBg: '#E8F5E9',
      iconColor: '#2E7D32',
    },
    {
      label: 'Last 30 Days',
      value: stats.last30Days,
      icon: CalendarClock,
      trend: stats.last30Days > 0 ? stats.last30Days.toString() : '0',
      trendUp: null,
      iconBg: '#FFF3E0',
      iconColor: '#E65100',
    },
    {
      label: 'Total Visitors',
      value: stats.totalVisitors,
      icon: TrendingUp,
      trend: '→ All Time',
      trendUp: null,
      iconBg: '#F5F5F5',
      iconColor: '#616161',
    },
  ], [stats]);

  // Fetch stats from API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/bookings/stats', {
          cache: 'no-cache',
        });
        const data = await response.json();

        if (data.success && data.stats) {
          setStats({
            todayVisitors: data.stats.todayVisitors,
            next30Days: data.stats.next30Days,
            last30Days: data.stats.last30Days,
            totalVisitors: data.stats.totalVisitors,
          });
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [refreshKey]);

  // Manual refresh function
  const handleManualRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast.success('Refreshing data...');
  };

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
        <div className="flex items-center gap-2">
          {/* Manual refresh button */}
          <button
            onClick={handleManualRefresh}
            className="shrink-0 p-2.5 rounded-xl bg-white hover:bg-[#F5F5F5] text-[#2E7D32] transition-colors border border-[#E0E0E0]"
            title="Refresh data"
            suppressHydrationWarning
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => router.push('/admin/bookings/new')}
            className="hidden shrink-0 inline-flex items-center gap-2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors min-h-11"
            style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
            suppressHydrationWarning
          >
            <Plus className="w-4 h-4" />
            New Booking
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      {/* Recent Bookings section */}
      <div className="mb-8">
        <RecentBookings refreshKey={refreshKey} />
      </div>
    </div>
  );
}