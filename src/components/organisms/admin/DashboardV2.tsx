'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Calendar, Clock, TrendingUp, CheckCircle2,
  BarChart3, Search, RotateCcw, ChevronLeft, ChevronRight,
  AlertCircle, CalendarDays,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  todayGuests: number;
  todayBookings: number;
  todayVisited: number;
  todayRemaining: number;
  todayCapacity: number;
  todaySlotsUsed: number;
  todaySlotsOpen: number;
  upcomingGuests: number;
  upcomingBookings: number;
  monthGuests: number;
  monthBookings: number;
  totalGuests: number;
  totalBookings: number;
}

interface Booking {
  id: string;
  visitorName: string;
  phone: string;
  email: string | null;
  numberOfGuests: number;
  bookingDate: string;
  bookingTime: string;
  status: string;
  category?: string;
  organisationName?: string | null;
}

// ─── Scorecard Component ──────────────────────────────────────────────────────

interface ScorecardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  subValue?: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  onClick: () => void;
  index: number;
}

function Scorecard({ label, value, subLabel, subValue, icon: Icon, color, bgColor, onClick, index }: ScorecardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl p-5 border border-transparent transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
        bgColor,
        "cursor-pointer group"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-canopy-dark/50 leading-tight">{label}</p>
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", color.replace('text-', 'bg-').replace(/\/\d+/, '/15'))}>
          <Icon className={cn("w-4 h-4", color)} />
        </div>
      </div>
      <p className={cn("text-3xl md:text-4xl font-bold tabular-nums", color.includes('sanctuary') ? 'text-canopy-dark' : 'text-canopy-dark')}>
        {value}
      </p>
      {subLabel && (
        <p className="text-xs text-canopy-dark/40 mt-1.5 font-medium">
          {subLabel}: <span className="text-canopy-dark/60 font-semibold">{subValue}</span>
        </p>
      )}
      <div className="mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-[10px] font-bold uppercase tracking-wider text-canopy-dark/30">View detail</span>
        <ChevronRight className="w-3 h-3 text-canopy-dark/30" />
      </div>
    </motion.button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DashboardV2({ initialStats }: { initialStats: DashboardStats }) {
  const router = useRouter();
  const [stats] = useState<DashboardStats>(initialStats);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const limit = 10;

  const fetchBookings = useCallback(async (p: number, s: string, d: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: p.toString(), limit: limit.toString() });
      if (s) params.set('search', s);
      if (d) params.set('filterDate', d);
      const res = await fetch(`/api/admin/bookings?${params}`);
      const data = await res.json();
      setBookings(data.bookings || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchBookings(page, searchTerm, filterDate), 400);
    return () => clearTimeout(t);
  }, [page, searchTerm, filterDate, fetchBookings]);

  const handleReset = () => {
    setSearchTerm('');
    setFilterDate('');
    setPage(1);
  };

  const hasFilters = searchTerm || filterDate;
  const totalPages = Math.ceil(total / limit);
  const today = new Date().toISOString().split('T')[0];

  // Capacity fill bar for today
  const capacityPct = stats.todayCapacity > 0
    ? Math.min(100, Math.round((stats.todaySlotsUsed / stats.todayCapacity) * 100))
    : 0;

  const scorecards = [
    {
      label: "Today's Guests",
      value: stats.todayGuests,
      subLabel: 'Visited',
      subValue: stats.todayVisited,
      icon: Clock,
      color: 'text-sanctuary-green',
      bgColor: 'bg-sanctuary-green/8',
      onClick: () => setFilterDate(today),
    },
    {
      label: 'Upcoming (7 days)',
      value: stats.upcomingGuests,
      subLabel: 'Bookings',
      subValue: stats.upcomingBookings,
      icon: TrendingUp,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      onClick: () => router.push('/admin/calendar'),
    },
    {
      label: 'This Month',
      value: stats.monthGuests,
      subLabel: 'Bookings',
      subValue: stats.monthBookings,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      onClick: () => router.push('/admin/history'),
    },
    {
      label: 'All Time',
      value: stats.totalGuests.toLocaleString(),
      subLabel: 'Bookings',
      subValue: stats.totalBookings.toLocaleString(),
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      onClick: () => router.push('/admin/history'),
    },
    {
      label: "Today's Slots",
      value: `${stats.todaySlotsUsed}/${stats.todayCapacity}`,
      subLabel: 'Available',
      subValue: stats.todaySlotsOpen,
      icon: Users,
      color: capacityPct >= 80 ? 'text-red-500' : capacityPct >= 50 ? 'text-amber-600' : 'text-sanctuary-green',
      bgColor: capacityPct >= 80 ? 'bg-red-50' : capacityPct >= 50 ? 'bg-amber-50' : 'bg-sanctuary-green/8',
      onClick: () => setFilterDate(today),
    },
    {
      label: 'Visited Today',
      value: stats.todayVisited,
      subLabel: 'Remaining',
      subValue: stats.todayRemaining,
      icon: CheckCircle2,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      onClick: () => router.push('/admin/checklist'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-canopy-dark tracking-tight">Dashboard</h1>
        <p className="text-sm text-canopy-dark/40 mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')} · Sanctuary overview
        </p>
      </div>

      {/* ── TODAY CAPACITY BAR ──────────────────────────────────────────── */}
      {stats.todayCapacity > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-canopy-dark/5 p-4 flex items-center gap-4"
        >
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-canopy-dark/40">Today's Capacity</span>
              <span className="text-xs font-bold text-canopy-dark/60">{capacityPct}% filled</span>
            </div>
            <div className="h-2.5 bg-canopy-dark/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${capacityPct}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                className={cn(
                  "h-full rounded-full",
                  capacityPct >= 80 ? 'bg-red-400' : capacityPct >= 50 ? 'bg-amber-400' : 'bg-sanctuary-green'
                )}
              />
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-lg font-bold text-canopy-dark">{stats.todaySlotsOpen}</p>
            <p className="text-[10px] text-canopy-dark/30 uppercase tracking-widest">left</p>
          </div>
        </motion.div>
      )}

      {/* ── SCORECARDS 2×2 mobile / 3-col tablet ─────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {scorecards.map((card, i) => (
          <Scorecard key={card.label} {...card} index={i} />
        ))}
      </div>

      {/* ── BOOKINGS TABLE ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-canopy-dark/5 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 md:p-6 border-b border-canopy-dark/5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {/* Date filter */}
          <div className="flex items-center gap-2 shrink-0">
            <CalendarDays className="w-4 h-4 text-canopy-dark/30" />
            <input
              type="date"
              value={filterDate}
              onChange={e => { setFilterDate(e.target.value); setPage(1); }}
              className="text-sm border border-canopy-dark/10 rounded-xl px-3 h-10 bg-white text-canopy-dark/70 focus:outline-none focus:ring-2 focus:ring-sanctuary-green/30 focus:border-sanctuary-green/50"
            />
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-canopy-dark/25" />
            <Input
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Search by name, phone or email..."
              suppressHydrationWarning
              className="pl-9 h-10 bg-white border-canopy-dark/10 rounded-xl text-sm focus-visible:ring-sanctuary-green/30"
            />
          </div>

          {/* Reset */}
          <AnimatePresence>
            {hasFilters && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <Button
                  variant="ghost"
                  onClick={handleReset}
                  className="h-10 px-4 text-xs font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 rounded-xl gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Table */}
        <div className="relative overflow-x-auto min-h-[300px]">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-sanctuary-green border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {bookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-canopy-dark/5">
                  <TableHead className="pl-6 text-[10px] uppercase font-bold tracking-widest text-canopy-dark/30">Guest</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest text-canopy-dark/30">Date</TableHead>
                  <TableHead className="text-right pr-6 text-[10px] uppercase font-bold tracking-widest text-canopy-dark/30">Guests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {bookings.map((booking, i) => {
                    const isToday = booking.bookingDate === today;
                    return (
                      <motion.tr
                        key={booking.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.025 }}
                        className={cn(
                          "border-b border-canopy-dark/5 transition-colors",
                          isToday ? "bg-sanctuary-green/[0.03]" : "hover:bg-canopy-dark/[0.01]"
                        )}
                      >
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0",
                              isToday ? 'bg-sanctuary-green/15 text-sanctuary-green' : 'bg-canopy-dark/5 text-canopy-dark/25'
                            )}>
                              {booking.visitorName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-canopy-dark truncate">{booking.visitorName}</p>
                              <p className="text-[10px] text-canopy-dark/35 truncate">
                                {booking.organisationName || booking.email || booking.phone}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className={cn("text-xs font-bold", isToday ? 'text-sanctuary-green' : 'text-canopy-dark/60')}>
                              {isToday ? 'Today' : new Date(booking.bookingDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                            <p className="text-[10px] text-canopy-dark/35">{booking.bookingTime}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <span className="inline-flex items-center justify-center min-w-[2rem] h-8 px-2.5 rounded-lg bg-sanctuary-green/10 text-sanctuary-green font-bold text-sm">
                            {booking.numberOfGuests}
                          </span>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          ) : (
            !isLoading && (
              <div className="py-24 text-center">
                <AlertCircle className="w-10 h-10 text-canopy-dark/10 mx-auto mb-4" />
                <p className="text-sm font-bold text-canopy-dark/30">No bookings found</p>
                <p className="text-xs text-canopy-dark/20 mt-1">Try adjusting your filters</p>
              </div>
            )
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 md:p-6 border-t border-canopy-dark/5 flex items-center justify-between">
            <p className="text-xs text-canopy-dark/35 font-medium">
              Page <span className="font-bold text-canopy-dark/60">{page}</span> of{' '}
              <span className="font-bold text-canopy-dark/60">{totalPages}</span>
              <span className="ml-2 text-sanctuary-green font-bold">{total} total</span>
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" disabled={page <= 1 || isLoading} onClick={() => setPage(p => p - 1)}
                className="h-9 w-9 rounded-xl border-canopy-dark/10 hover:bg-sanctuary-green hover:text-white hover:border-sanctuary-green disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" disabled={page >= totalPages || isLoading} onClick={() => setPage(p => p + 1)}
                className="h-9 w-9 rounded-xl border-canopy-dark/10 hover:bg-sanctuary-green hover:text-white hover:border-sanctuary-green disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
