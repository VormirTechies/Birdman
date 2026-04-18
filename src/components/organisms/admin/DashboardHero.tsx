'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Users,
  Search,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  visitorName: string;
  phone: string;
  email: string | null;
  numberOfGuests: number;
  bookingDate: string;
  bookingTime: string;
  status: string;
}

interface DashboardStats {
  totalVisitors: number;
  todayVisitors: number;
  upcomingVisitors: number;
  totalBookings: number;
  todayBookings: number;
  upcomingBookings: number;
}

interface DashboardHeroProps {
  initialBookings: Booking[];
  initialStats: DashboardStats;
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-sanctuary-green/10 text-sanctuary-green border-sanctuary-green/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
  completed: 'bg-canopy-dark/10 text-canopy-dark border-canopy-dark/20',
};

export function DashboardHero({ initialBookings, initialStats }: DashboardHeroProps) {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [totalBookings, setTotalBookings] = useState(initialBookings.length);
  const [stats] = useState(initialStats);
  
  const [isTodayOnly, setIsTodayOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const limit = 10;

  // 🔄 FETCH LOGIC
  const fetchBookings = useCallback(async (p: number, s: string, today: boolean) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: p.toString(),
        limit: limit.toString(),
        isToday: today.toString(),
      });
      if (s) params.append('search', s);

      const res = await fetch(`/api/admin/bookings?${params}`);
      const data = await res.json();
      setBookings(data.bookings || []);
      setTotalBookings(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = () => {
    setSearchTerm('');
    setIsTodayOnly(false);
    setPage(1);
  };

  // ⏱️ Debounced Search Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookings(page, searchTerm, isTodayOnly);
    }, 500);

    return () => clearTimeout(timer);
  }, [page, searchTerm, isTodayOnly, fetchBookings]);

  const totalPages = Math.ceil(totalBookings / limit);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* ── HEADER & STATS ────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-canopy-dark mb-2">Sanctuary Command Center</h1>
          <p className="text-canopy-dark/50 max-w-lg">
            A high-fidelity administrative glance at every expected flight. Manage upcoming guest journeys and track emerald population reach.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          {[
            { label: "Today's Arrivals", value: stats.todayVisitors, icon: Clock, color: "text-sanctuary-green" },
            { label: "Future Reach", value: stats.upcomingVisitors, icon: Calendar, color: "text-sunset-amber" },
            { label: "Total Sanctuary Echo", value: stats.totalVisitors, icon: Users, color: "text-canopy-dark" },
          ].map((stat, i) => (
            <motion.div 
               key={stat.label}
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.1 }}
               className="bg-white px-5 py-3.5 rounded-[1.5rem] border border-canopy-dark/5 shadow-sm min-w-[160px]"
            >
               <div className="flex items-center justify-between mb-1">
                 <p className="text-[10px] uppercase tracking-widest text-canopy-dark/40 font-black">{stat.label}</p>
                 <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
               </div>
               <p className="text-2xl font-black text-canopy-dark">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── VISITOR ARCHIVE ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-[2.5rem] border border-canopy-dark/5 shadow-2xl shadow-canopy-dark/[0.03] overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-6 md:p-8 border-b border-canopy-dark/5 flex flex-col xl:flex-row gap-6 items-center justify-between bg-feather-cream/20">
          <div className="flex flex-wrap items-center gap-4">
             <Button
                onClick={() => { setIsTodayOnly(true); setPage(1); }}
                className={cn(
                  "rounded-2xl px-6 h-12 font-bold transition-all gap-2",
                  isTodayOnly 
                    ? "bg-sanctuary-green text-white shadow-lg shadow-sanctuary-green/20" 
                    : "bg-white text-canopy-dark/60 hover:text-canopy-dark border border-canopy-dark/5"
                )}
             >
                <Clock className="w-4 h-4" />
                Today's Arrivals
             </Button>

             {(searchTerm || isTodayOnly) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Button
                    variant="ghost"
                    onClick={handleReset}
                    className="text-[10px] uppercase font-black tracking-widest text-red-500 hover:text-red-600 hover:bg-red-50 transition-all gap-2"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reset
                  </Button>
                </motion.div>
             )}
          </div>

          <div className="relative w-full xl:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-canopy-dark/30" />
            <Input
              placeholder="Search by name, email, or mobile..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              suppressHydrationWarning
              className="pl-11 h-12 bg-white border-canopy-dark/5 rounded-2xl focus-visible:ring-sanctuary-green shadow-sm"
            />
          </div>
        </div>

        {/* The Archive Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {isLoading && (
            <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-sm flex items-center justify-center">
               <motion.div 
                 animate={{ rotate: 360 }} 
                 transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                 className="w-8 h-8 border-2 border-sanctuary-green border-t-transparent rounded-full"
               />
            </div>
          )}
          
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-canopy-dark/5">
                <TableHead className="pl-8 text-[10px] uppercase font-bold tracking-widest text-canopy-dark/30">Guest Identity</TableHead>
                <TableHead className="text-right pr-8 text-[10px] uppercase font-bold tracking-widest text-canopy-dark/30">Total Guests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {bookings.map((booking, i) => (
                  <motion.tr
                    key={booking.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: i * 0.03 }}
                    className="group border-b border-canopy-dark/5 hover:bg-canopy-dark/[0.01] transition-colors"
                  >
                    <TableCell className="pl-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-canopy-dark/5 flex items-center justify-center font-black text-canopy-dark/20 text-xs">
                          {booking.visitorName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-canopy-dark mb-0.5">{booking.visitorName}</p>
                          <p className="text-[10px] text-canopy-dark/40 font-bold uppercase tracking-tighter">
                            {new Date(booking.bookingDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {booking.bookingTime}
                          </p>
                          <p className="text-[9px] text-canopy-dark/30 font-medium lowercase mt-1">{booking.email || 'No email registered'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-sanctuary-green/10 text-sanctuary-green font-black text-sm">
                        {booking.numberOfGuests}
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        {/* Empty State */}
        {bookings.length === 0 && !isLoading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="py-32 text-center"
          >
            <div className="w-20 h-20 bg-canopy-dark/[0.03] rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-canopy-dark/10" />
            </div>
            <h3 className="text-xl font-bold text-canopy-dark mb-2">No arrivals archived</h3>
            <p className="text-sm text-canopy-dark/40 max-w-xs mx-auto">None of our expected flights match your search or filter. Check your filters or wait for the next breeze.</p>
          </motion.div>
        )}

        {/* ── PAGINATION FOOTER ───────────────────────────────────────────── */}
        <div className="p-6 md:p-8 border-t border-canopy-dark/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-feather-cream/20">
           <p className="text-xs text-canopy-dark/40 font-medium font-display uppercase tracking-widest">
              Showing page <span className="text-canopy-dark font-black">{page}</span> of <span className="text-canopy-dark font-black">{totalPages || 1}</span> 
              <span className="mx-2">•</span> 
              <span className="text-sanctuary-green font-black">{totalBookings}</span> Total Echoes
           </p>
           
           <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage(p => p - 1)}
                className="rounded-xl border-canopy-dark/5 bg-white shadow-sm hover:bg-sanctuary-green hover:text-white transition-all disabled:opacity-30 h-11 w-11"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage(p => p + 1)}
                className="rounded-xl border-canopy-dark/5 bg-white shadow-sm hover:bg-sanctuary-green hover:text-white transition-all disabled:opacity-30 h-11 w-11"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}
