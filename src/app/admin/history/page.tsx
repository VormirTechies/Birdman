'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  CheckCircle2, 
  XCircle, 
  CircleDot,
  Loader2,
  CalendarDays
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
  email: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/bookings');
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      toast.error('Failed to load booking history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="mb-12">
        <h1 className="text-3xl font-display font-bold text-canopy-dark mb-2">Booking History</h1>
        <p className="text-canopy-dark/50">Comprehensive record of all past and future sanctuary visits.</p>
      </div>

      <div className="bg-white rounded-[2rem] border border-canopy-dark/5 shadow-xl shadow-canopy-dark/[0.02] overflow-hidden">
        {/* Filters */}
        <div className="p-6 border-b border-canopy-dark/5 flex flex-col md:flex-row gap-4 items-center justify-between bg-canopy-dark/[0.01]">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-canopy-dark/30" />
            <Input
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 bg-white border-canopy-dark/10 rounded-xl focus-visible:ring-sanctuary-green shadow-sm"
            />
          </div>
          <div className="flex w-full md:w-auto items-center gap-3">
            <div className="relative flex-1 md:flex-0">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-canopy-dark/30" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-11 pr-8 h-12 bg-white border border-canopy-dark/10 rounded-xl text-sm font-medium text-canopy-dark outline-none focus:ring-2 focus:ring-sanctuary-green shadow-sm appearance-none min-w-[160px]"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-40 opacity-20">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <p className="text-sm font-medium">Fetching history...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-canopy-dark/5 bg-canopy-dark/[0.01]">
                  <TableHead className="pl-6 text-xs uppercase tracking-wider font-bold text-canopy-dark/30">Reference</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-bold text-canopy-dark/30">Visitor</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-bold text-canopy-dark/30">Visit Date</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-bold text-canopy-dark/30">Guests</TableHead>
                  <TableHead className="text-xs uppercase tracking-wider font-bold text-canopy-dark/30">Status</TableHead>
                  <TableHead className="text-right pr-6 text-xs uppercase tracking-wider font-bold text-canopy-dark/30">Booked On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {filteredBookings.map((booking, i) => (
                    <motion.tr
                      key={booking.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="group border-b border-canopy-dark/5 hover:bg-canopy-dark/[0.01] transition-colors"
                    >
                      <TableCell className="pl-6 py-5">
                        <span className="text-xs font-mono font-bold text-canopy-dark/40 uppercase">
                          #{booking.id.slice(0, 8)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-canopy-dark">{booking.visitorName}</span>
                          <span className="text-xs text-canopy-dark/30">{booking.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-canopy-dark/70 font-medium">
                          <CalendarDays className="w-4 h-4 text-canopy-dark/10" />
                          {new Date(booking.bookingDate).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-canopy-dark/10" />
                          <span className="text-sm font-medium text-canopy-dark">{booking.numberOfGuests}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                          statusColors[booking.status] || 'bg-gray-100 text-gray-500 border-gray-200'
                        )}>
                          {booking.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                         <span className="text-xs text-canopy-dark/30">
                            {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                         </span>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          )}
        </div>

        {!isLoading && filteredBookings.length === 0 && (
          <div className="py-32 text-center">
             <div className="w-16 h-16 bg-canopy-dark/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <History className="w-8 h-8 text-canopy-dark/20" />
            </div>
            <h3 className="text-lg font-bold text-canopy-dark mb-1">No history found</h3>
            <p className="text-sm text-canopy-dark/40">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </main>
  );
}
