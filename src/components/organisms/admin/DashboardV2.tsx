'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import {
  Users, Calendar, Clock, TrendingUp, CheckCircle2,
  Search, RotateCcw, ChevronLeft, ChevronRight,
  AlertCircle, CalendarDays, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// ─── Number Formatting Utility (Indian System) ────────────────────────────────

function formatCount(num: number): string {
  if (num >= 10000000) return (num / 10000000).toFixed(1).replace(/\.0$/, '') + 'C';
  if (num >= 100000) return (num / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toString();
}

// ─── Animated Number Component ────────────────────────────────────────────────

function AnimatedNumber({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => formatCount(Math.round(latest)));
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(count, value, { 
      duration: 2,
      ease: [0.16, 1, 0.3, 1] // Custom ease-out
    });
    return controls.stop;
  }, [count, value]);

  return <motion.span ref={nodeRef}>{rounded}</motion.span>;
}

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
  value: number;
  subLabel?: string;
  subValue?: string | number;
  icon: React.ElementType;
  className?: string; // Icon container BG
  iconColor?: string;
  onClick: () => void;
  index: number;
}

function Scorecard({ label, value, subLabel, subValue, icon: Icon, className, iconColor, onClick, index }: ScorecardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, ease: "easeOut" }}
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-[1.25rem] md:rounded-[2rem] p-3 md:p-6 lg:p-8 border border-black/[0.02] transition-all duration-300",
        "bg-white shadow-xl shadow-black/[0.01] hover:shadow-black/[0.04] hover:-translate-y-1 active:scale-[0.98]",
        "cursor-pointer group relative overflow-hidden"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-2 md:gap-4 mb-3 md:mb-6 relative">
        <div className="min-w-0">
          <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 leading-tight mb-0.5 md:mb-1.5 truncate">
            {label}
          </p>
          <p className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-black text-zinc-900 tracking-tighter tabular-nums leading-none">
            <AnimatedNumber value={value} />
          </p>
        </div>
        <div className={cn("hidden sm:flex w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform duration-500 group-hover:scale-110", className)}>
          <Icon className={cn("w-3.5 h-3.5 md:w-5 md:h-5", iconColor || "text-white")} />
        </div>
      </div>
      
      {subLabel && (
        <div className="flex items-center justify-between relative mt-1 md:mt-2 pt-2 md:pt-4 border-t border-black/[0.01]">
          <p className="text-[7px] md:text-[9px] font-black uppercase tracking-widest text-zinc-400 truncate">
             {subLabel} <span className="text-zinc-900 ml-1">{subValue}</span>
          </p>
          <div className="hidden lg:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-1 group-hover:translate-x-0">
            <ChevronRight className="w-3 h-3 text-sanctuary-green/60" />
          </div>
        </div>
      )}
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

  const scorecards = [
    {
      label: "Today",
      value: stats.todayGuests,
      subLabel: 'Expected',
      subValue: stats.todayBookings,
      icon: Clock,
      className: "bg-sanctuary-green",
      onClick: () => setFilterDate(today),
    },
    {
      label: 'Upcoming',
      value: stats.upcomingGuests,
      subLabel: 'Archive',
      subValue: stats.upcomingBookings,
      icon: TrendingUp,
      className: "bg-amber-500",
      onClick: () => router.push('/admin/calendar'),
    },
    {
      label: 'Visited',
      value: stats.todayVisited,
      subLabel: 'Pending',
      subValue: stats.todayRemaining,
      icon: CheckCircle2,
      className: "bg-sanctuary-green",
      onClick: () => router.push('/admin/checklist'),
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-black text-zinc-900 tracking-tight mb-2">Sanctuary Command</h1>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
            {format(new Date(), 'EEEE, MMMM d, yyyy')} • Administrative Node
          </p>
        </div>
      </div>

      {/* ── SCORECARDS GRID (FORCE SINGLE ROW) ───────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 md:gap-6 lg:gap-10">
        {scorecards.map((card, i) => (
          <Scorecard key={card.label} {...card} index={i} />
        ))}
      </div>

      {/* ── LOG BOOK ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[3rem] border border-black/[0.02] shadow-2xl shadow-black/[0.02] overflow-hidden">
        {/* Toolbar */}
        <div className="p-8 md:p-10 border-b border-zinc-50 flex flex-col xl:flex-row gap-6 items-center justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full xl:w-auto">
             <div className="relative w-full sm:w-auto">
               <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
               <input
                 type="date"
                 value={filterDate}
                 onChange={e => { setFilterDate(e.target.value); setPage(1); }}
                 className="w-full sm:w-44 pl-11 h-14 bg-zinc-50 border-transparent rounded-2xl text-sm font-bold text-zinc-900 outline-none focus:bg-white focus:ring-4 focus:ring-sanctuary-green/5 transition-all"
               />
             </div>
             
             <div className="relative w-full sm:w-80">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                <Input
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                  placeholder="Record lookup..."
                  className="pl-12 h-14 bg-zinc-50 border-transparent rounded-2xl text-sm font-bold text-zinc-900 placeholder:text-zinc-300 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-sanctuary-green/5 transition-all"
                />
             </div>

             <AnimatePresence>
                {hasFilters && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                    <Button
                      variant="ghost"
                      onClick={handleReset}
                      className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 hover:bg-orange-50 rounded-2xl gap-2 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset
                    </Button>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          <div className="hidden xl:block">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">Registry Archives</p>
          </div>
        </div>

        {/* Table Content */}
        <div className="relative overflow-x-auto min-h-[400px]">
          {isLoading && (
            <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-sanctuary-green animate-spin" />
            </div>
          )}

          {bookings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-zinc-50">
                  <TableHead className="pl-10 h-16 text-[10px] uppercase font-black tracking-widest text-zinc-400">Identity</TableHead>
                  <TableHead className="h-16 text-[10px] uppercase font-black tracking-widest text-zinc-400">Flight Window</TableHead>
                  <TableHead className="text-right pr-10 h-16 text-[10px] uppercase font-black tracking-widest text-zinc-400">Pax</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {bookings.map((booking, i) => {
                    const isTodayRow = booking.bookingDate === today;
                    return (
                      <motion.tr
                        key={booking.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ delay: i * 0.03, ease: "easeOut" }}
                        className={cn(
                          "border-b border-zinc-50 transition-all duration-300 group",
                          isTodayRow ? "bg-sanctuary-green/[0.04]" : "hover:bg-zinc-50/50"
                        )}
                      >
                        <TableCell className="pl-10 py-7">
                          <div className="flex items-center gap-5">
                            <div className={cn(
                              "w-12 h-12 rounded-[1.25rem] flex items-center justify-center font-black text-sm shrink-0 shadow-sm transition-transform group-hover:scale-110",
                              isTodayRow ? 'bg-sanctuary-green text-white' : 'bg-amber-500 text-white'
                            )}>
                              {booking.visitorName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-base font-black text-zinc-900 truncate tracking-tight mb-0.5">{booking.visitorName}</p>
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate">
                                {booking.organisationName || booking.email || booking.phone}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className={cn("text-sm font-black mb-0.5", isTodayRow ? 'text-sanctuary-green' : 'text-zinc-900')}>
                              {isTodayRow ? 'Global Ready' : new Date(booking.bookingDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">{booking.bookingTime}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-10">
                          <span className="inline-flex items-center justify-center min-w-[3rem] h-10 px-4 rounded-xl bg-zinc-50 text-sanctuary-green border border-sanctuary-green/10 font-black text-sm">
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
              <div className="py-40 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-zinc-50 rounded-[2rem] flex items-center justify-center mb-6 border border-zinc-100">
                  <AlertCircle className="w-8 h-8 text-zinc-200" />
                </div>
                <h3 className="text-xl font-black text-zinc-300 tracking-widest uppercase">Registry Empty</h3>
              </div>
            )
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-10 border-t border-zinc-50 flex flex-col sm:flex-row items-center justify-between gap-6 bg-zinc-50/20">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Navigation <span className="text-zinc-900 mx-2">{page} / {totalPages}</span> 
            </p>
            <div className="flex gap-4">
              <Button variant="outline" disabled={page <= 1 || isLoading} onClick={() => setPage(p => p - 1)}
                className="h-12 w-12 rounded-2xl border-black/5 bg-white shadow-sm hover:bg-sanctuary-green hover:text-white transition-all active:scale-90">
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button variant="outline" disabled={page >= totalPages || isLoading} onClick={() => setPage(p => p + 1)}
                className="h-12 w-12 rounded-2xl border-black/5 bg-white shadow-sm hover:bg-sanctuary-green hover:text-white transition-all active:scale-90">
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
