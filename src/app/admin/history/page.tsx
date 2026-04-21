'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Search, 
  Filter, 
  Users, 
  Loader2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  RotateCcw
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
import { toast } from 'sonner';

interface Booking {
  id: string;
  visitorName: string;
  phone: string;
  email: string | null;
  numberOfGuests: number;
  bookingDate: string;
  bookingTime: string;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  confirmed: 'bg-sanctuary-green text-white border-sanctuary-green/20 shadow-sm shadow-sanctuary-green/20',
  cancelled: 'bg-red-500 text-white border-red-500/20 shadow-sm shadow-red-500/10',
  completed: 'bg-zinc-900 text-white border-zinc-950 shadow-sm shadow-zinc-950/10',
};

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const limit = 15;

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        showPast: 'true',
      });
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/admin/bookings?${params}`);
      const data = await res.json();
      
      setBookings(data.bookings || []);
      setTotal(data.total || 0);
    } catch (err) {
      toast.error('Failed to load booking history');
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookings();
    }, searchTerm ? 500 : 0);
    return () => clearTimeout(timer);
  }, [fetchBookings, searchTerm]);

  const handleReset = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPage(1);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in duration-1000">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-display font-black text-zinc-900 mb-2 tracking-tight">Record Vault</h1>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Administrative Archive • Past Journeys</p>
        </div>
        
        <div className="bg-white rounded-[2rem] border border-black/[0.03] p-6 shadow-xl shadow-black/[0.01] flex items-center gap-6 min-w-[240px]">
           <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center shadow-lg shadow-zinc-950/10">
              <History className="w-6 h-6 text-white" />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300 mb-1">Total Logs</p>
              <p className="text-2xl font-black text-zinc-900 tabular-nums leading-none tracking-tight">{total}</p>
           </div>
        </div>
      </div>

      {/* ── ARCHIVE CONTROL PANEL ─────────────────────────────────────────── */}
      <div className="bg-white rounded-[3rem] border border-black/[0.03] shadow-2xl shadow-black/[0.02] overflow-hidden">
        {/* Toolbar */}
        <div className="p-8 md:p-10 border-b border-zinc-50 flex flex-col xl:flex-row gap-8 items-center justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full xl:w-auto">
             <div className="relative w-full sm:w-80">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                <Input
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                  placeholder="Scan identity or contact records..."
                  className="pl-12 h-14 bg-zinc-50 border-transparent rounded-2xl text-sm font-bold text-zinc-900 placeholder:text-zinc-300 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-zinc-900/5 transition-all"
                />
             </div>

             <div className="relative w-full sm:w-56">
                <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="w-full pl-12 pr-10 h-14 bg-zinc-50 border-transparent rounded-2xl text-sm font-bold text-zinc-900 outline-none appearance-none hover:bg-zinc-100/50 focus:bg-white focus:ring-4 focus:ring-zinc-900/5 transition-all"
                >
                  <option value="all">Every State</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
             </div>

             <AnimatePresence>
                {(searchTerm || statusFilter !== 'all') && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                    <Button
                      variant="ghost"
                      onClick={handleReset}
                      className="h-14 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-red-500 hover:bg-red-50 rounded-2xl gap-2 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Wipe
                    </Button>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>

          <div className="hidden xl:block">
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">Long-term Archival Logs</p>
          </div>
        </div>

        {/* Archival Table */}
        <div className="overflow-x-auto min-h-[500px] relative">
          {isLoading && (
            <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm flex items-center justify-center">
               <Loader2 className="w-10 h-10 text-zinc-900 animate-spin" />
            </div>
          )}
          
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-zinc-50">
                <TableHead className="pl-10 h-20 text-[10px] uppercase font-black tracking-[0.3em] text-zinc-300">Reference</TableHead>
                <TableHead className="h-20 text-[10px] uppercase font-black tracking-[0.3em] text-zinc-300">Individual Identity</TableHead>
                <TableHead className="h-20 text-[10px] uppercase font-black tracking-[0.3em] text-zinc-300">Flight Window</TableHead>
                <TableHead className="text-center h-20 text-[10px] uppercase font-black tracking-[0.3em] text-zinc-300">Pax</TableHead>
                <TableHead className="h-20 text-[10px] uppercase font-black tracking-[0.3em] text-zinc-300">Phase State</TableHead>
                <TableHead className="text-right pr-10 h-20 text-[10px] uppercase font-black tracking-[0.3em] text-zinc-300">Registry Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {bookings.map((booking, i) => (
                  <motion.tr
                    key={booking.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ delay: i * 0.02, ease: "easeOut" }}
                    className="group border-b border-zinc-50 hover:bg-zinc-50/50 transition-all duration-300"
                  >
                    <TableCell className="pl-10 py-7">
                      <span className="text-[10px] font-black text-zinc-200 uppercase tracking-tighter">
                        #{booking.id.slice(0, 8)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-zinc-900 rounded-[1.25rem] shadow-xl shadow-zinc-950/10 flex items-center justify-center font-black text-white text-sm transition-transform group-hover:scale-110">
                          {booking.visitorName?.charAt(0) || 'A'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-black text-zinc-900 truncate tracking-tight leading-none mb-1.5">{booking.visitorName || 'Anonymous'}</p>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest truncate">
                             {booking.email || booking.phone || 'System Registry'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <p className="text-sm font-black text-zinc-900 mb-0.5">
                           {new Date(booking.bookingDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">{booking.bookingTime}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center min-w-[2.5rem] h-9 px-3 rounded-xl bg-zinc-900 text-white font-black text-xs shadow-lg shadow-zinc-950/10">
                           {booking.numberOfGuests}
                        </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] border-none shadow-sm",
                        statusColors[booking.status] || 'bg-zinc-100 text-zinc-400'
                      )}>
                        {booking.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-10">
                       <span className="text-[10px] text-zinc-300 font-black uppercase tracking-widest">
                          {new Date(booking.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: '2-digit'
                          })}
                       </span>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>

          {/* Empty State */}
          {!isLoading && bookings.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="py-48 text-center flex flex-col items-center"
            >
              <div className="w-24 h-24 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center mb-8 border border-zinc-100 shadow-inner">
                <History className="w-10 h-10 text-zinc-200" />
              </div>
              <h3 className="text-2xl font-black text-zinc-300 tracking-widest uppercase">Archive Void</h3>
              <p className="text-sm text-zinc-300 font-bold max-w-xs mt-3 uppercase tracking-widest">No matching archival records discovered.</p>
            </motion.div>
          )}
        </div>

        {/* ── ARCHIVE PAGINATION ─────────────────────────────────────────── */}
        <div className="p-10 border-t border-zinc-50 flex flex-col sm:flex-row items-center justify-between gap-8 bg-zinc-50/20">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">
               Navigation Link <span className="text-zinc-900 mx-3">{page} / {totalPages || 1}</span> 
               <span className="mx-6 text-zinc-200">|</span> 
               <span className="text-sanctuary-green">{total} Vault Entries</span>
            </p>
           
           <div className="flex items-center gap-4">
              <Button
                variant="outline"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage(p => p - 1)}
                className="h-14 w-14 rounded-2xl border-black/5 bg-white shadow-2xl shadow-black/[0.02] hover:bg-zinc-900 hover:text-white transition-all active:scale-90"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              
              <div className="hidden sm:flex gap-2">
                 {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const pNum = i + 1;
                    return (
                        <button
                           key={pNum}
                           onClick={() => setPage(pNum)}
                           className={cn(
                             "w-10 h-10 rounded-xl text-[10px] font-black transition-all",
                             page === pNum ? "bg-zinc-900 text-white shadow-xl shadow-zinc-950/20" : "text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
                           )}
                        >
                           {pNum}
                        </button>
                    );
                 })}
              </div>

              <Button
                variant="outline"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage(p => p + 1)}
                className="h-14 w-14 rounded-2xl border-black/5 bg-white shadow-2xl shadow-black/[0.02] hover:bg-zinc-900 hover:text-white transition-all active:scale-90"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
           </div>
        </div>
      </div>
    </main>
  );
}
