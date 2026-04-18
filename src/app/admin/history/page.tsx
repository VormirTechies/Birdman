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
  AlertCircle
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
  confirmed: 'bg-sanctuary-green/10 text-sanctuary-green border-sanctuary-green/20',
  cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
  completed: 'bg-canopy-dark/10 text-canopy-dark border-canopy-dark/20',
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

  const totalPages = Math.ceil(total / limit);

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="mb-12">
        <h1 className="text-3xl font-display font-bold text-canopy-dark mb-2">Sanctuary Archival Records</h1>
        <p className="text-canopy-dark/50">Comprehensive high-fidelity record of every guest journey, past and future.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-canopy-dark/5 shadow-2xl shadow-canopy-dark/[0.03] overflow-hidden">
        {/* Advanced Filters */}
        <div className="p-8 border-b border-canopy-dark/5 flex flex-col md:flex-row gap-6 items-center justify-between bg-feather-cream/20">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-canopy-dark/30" />
            <Input
              placeholder="Search by identity or ID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="pl-11 h-12 bg-white border-canopy-dark/10 rounded-2xl focus-visible:ring-sanctuary-green shadow-sm"
            />
          </div>
          <div className="flex w-full md:w-auto items-center gap-4">
             <div className="relative flex-1 md:flex-0">
               <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-canopy-dark/30" />
               <select
                 value={statusFilter}
                 onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                 className="pl-11 pr-10 h-12 bg-white border border-canopy-dark/10 rounded-2xl text-sm font-bold text-canopy-dark outline-none focus:ring-2 focus:ring-sanctuary-green shadow-sm appearance-none min-w-[180px]"
               >
                 <option value="all">Every Status</option>
                 <option value="confirmed">Confirmed</option>
                 <option value="cancelled">Cancelled</option>
                 <option value="completed">Completed</option>
               </select>
             </div>
          </div>
        </div>

        {/* Archival Table */}
        <div className="overflow-x-auto min-h-[400px] relative">
          {isLoading && (
            <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-sm flex items-center justify-center">
               <Loader2 className="w-8 h-8 text-sanctuary-green animate-spin" />
            </div>
          )}
          
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-canopy-dark/5">
                <TableHead className="pl-8 text-[10px] uppercase font-bold tracking-widest text-canopy-dark/30">Reference</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-canopy-dark/30">Visitor Identity</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-canopy-dark/30">Visit Date</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-canopy-dark/30 text-center">Guests</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-canopy-dark/30">Status</TableHead>
                <TableHead className="text-right pr-8 text-[10px] uppercase font-bold tracking-widest text-canopy-dark/30">Inscribed At</TableHead>
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
                    transition={{ delay: i * 0.02 }}
                    className="group border-b border-canopy-dark/5 hover:bg-canopy-dark/[0.01] transition-colors"
                  >
                    <TableCell className="pl-8 py-6">
                      <span className="text-[10px] font-black font-display text-canopy-dark/20 uppercase tracking-tighter">
                        #{booking.id.slice(0, 8)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-canopy-dark">{booking.visitorName}</span>
                        <span className="text-[10px] text-canopy-dark/40 font-medium tracking-tight">
                            {booking.phone} {booking.email ? `• ${booking.email.toLowerCase()}` : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-sm text-canopy-dark/70 font-bold">
                        <div className="w-8 h-8 rounded-lg bg-canopy-dark/[0.03] flex items-center justify-center">
                            <CalendarDays className="w-4 h-4 text-canopy-dark/20" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs">{new Date(booking.bookingDate).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            <span className="text-[10px] text-canopy-dark/30 uppercase">{booking.bookingTime}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-sanctuary-green/10 text-sanctuary-green font-black text-xs">
                           {booking.numberOfGuests}
                        </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                        statusColors[booking.status] || 'bg-gray-100 text-gray-500 border-gray-200'
                      )}>
                        {booking.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <span className="text-[10px] text-canopy-dark/20 font-medium uppercase font-display">
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
        </div>

        {/* Empty State */}
        {!isLoading && bookings.length === 0 && (
          <div className="py-40 text-center">
             <div className="w-20 h-20 bg-canopy-dark/[0.03] rounded-full flex items-center justify-center mx-auto mb-6">
              <History className="w-10 h-10 text-canopy-dark/10" />
            </div>
            <h3 className="text-xl font-bold text-canopy-dark mb-2">No archival records</h3>
            <p className="text-sm text-canopy-dark/40 max-w-xs mx-auto">None of your guests match the current filters. Check your search terms or adjust your criteria.</p>
          </div>
        )}

        {/* ── ARCHIVE PAGINATION ─────────────────────────────────────────── */}
        <div className="p-8 border-t border-canopy-dark/5 flex flex-col sm:flex-row items-center justify-between gap-6 bg-feather-cream/20">
           <div className="flex flex-col items-center sm:items-start gap-1">
              <p className="text-[10px] text-canopy-dark/30 font-black uppercase tracking-widest">Archive Navigation</p>
              <p className="text-xs text-canopy-dark/60 font-medium">
                Vault <span className="text-canopy-dark font-black">{page}</span> of <span className="text-canopy-dark font-black">{totalPages || 1}</span> 
                <span className="mx-2">•</span> 
                Inscribed: <span className="text-sanctuary-green font-black">{total}</span> Echoes
              </p>
           </div>
           
           <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage(p => p - 1)}
                className="rounded-2xl border-canopy-dark/10 bg-white shadow-sm hover:bg-sanctuary-green hover:text-white transition-all disabled:opacity-30 h-12 w-12"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <div className="flex gap-1 h-12 items-center px-1">
                 {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const pNum = i + 1;
                    return (
                        <button
                           key={pNum}
                           onClick={() => setPage(pNum)}
                           className={cn(
                             "w-8 h-8 rounded-lg text-xs font-black transition-all",
                             page === pNum ? "bg-sanctuary-green text-white shadow-lg" : "text-canopy-dark/40 hover:text-canopy-dark hover:bg-canopy-dark/5"
                           )}
                        >
                           {pNum}
                        </button>
                    );
                 })}
              </div>
              <Button
                variant="outline"
                size="icon"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage(p => p + 1)}
                className="rounded-2xl border-canopy-dark/10 bg-white shadow-sm hover:bg-sanctuary-green hover:text-white transition-all disabled:opacity-30 h-12 w-12"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
           </div>
        </div>
      </div>
    </main>
  );
}
