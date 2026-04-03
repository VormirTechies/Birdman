'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Users,
  Bell,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight
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
import { Badge } from '@/components/ui/badge';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [bookings, setBookings] = useState(initialBookings);
  const [stats, setStats] = useState(initialStats);

  // Listen for real-time updates from RealtimeNotifier
  useState(() => {
    if (typeof window !== 'undefined') {
      const handleNewBooking = (e: any) => {
        const newBooking = e.detail;
        console.log('[Dashboard] Real-time booking received:', newBooking);

        const today = new Date().toISOString().split('T')[0];

        // Transform snake_case from Postgres to camelCase for UI
        const transformed: Booking = {
          id: newBooking.id,
          visitorName: newBooking.visitor_name,
          phone: newBooking.phone,
          email: newBooking.email,
          numberOfGuests: newBooking.number_of_guests,
          bookingDate: newBooking.booking_date,
          bookingTime: newBooking.booking_time,
          status: newBooking.status
        };
        
        // UPDATE STATS (Internal logic to reflect raw notification instantly)
        setStats(prev => {
           const isToday = transformed.bookingDate === today;
           const isUpcoming = transformed.bookingDate > today;
           const confirmed = transformed.status === 'confirmed';

           return {
              ...prev,
              totalBookings: prev.totalBookings + 1,
              totalVisitors: prev.totalVisitors + (confirmed ? transformed.numberOfGuests : 0),
              todayBookings: isToday ? prev.todayBookings + 1 : prev.todayBookings,
              todayVisitors: (isToday && confirmed) ? prev.todayVisitors + transformed.numberOfGuests : prev.todayVisitors,
              upcomingBookings: isUpcoming ? prev.upcomingBookings + 1 : prev.upcomingBookings,
              upcomingVisitors: (isUpcoming && confirmed) ? prev.upcomingVisitors + transformed.numberOfGuests : prev.upcomingVisitors,
           };
        });

        // ONLY add to dashboard if booked for TODAY
        if (transformed.bookingDate === today) {
          setBookings(prev => [transformed, ...prev]);
        }
      };

      window.addEventListener('new-booking', handleNewBooking);
      return () => window.removeEventListener('new-booking', handleNewBooking);
    }
  });

  const filteredBookings = bookings.filter((b) =>
    b.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Stats Cards */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-canopy-dark mb-2">Sanctuary Command Center</h1>
          <p className="text-canopy-dark/50 max-w-lg">
            Priority overview of every visitor expected at the sanctuary today. Manage arrivals and track emerald population reach in real-time.
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          {[
            { label: "Today's Visitors", value: stats.todayVisitors, sub: `${stats.todayBookings} confirmed slots`, icon: Clock, color: "text-sanctuary-green" },
            { label: "Upcoming Reach", value: stats.upcomingVisitors, sub: `${stats.upcomingBookings} expected`, icon: Calendar, color: "text-sunset-amber" },
            { label: "Total Sanctuary Echo", value: stats.totalVisitors, sub: `${stats.totalBookings} historical bookings`, icon: Users, color: "text-canopy-dark" },
          ].map((stat, i) => (
            <motion.div 
               key={stat.label}
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: i * 0.1 }}
               className="bg-white px-5 py-3.5 rounded-[1.5rem] border border-canopy-dark/5 shadow-sm hover:shadow-md transition-shadow"
            >
               <div className="flex items-center justify-between mb-1">
                 <p className="text-[10px] uppercase tracking-widest text-canopy-dark/40 font-black">{stat.label}</p>
                 <stat.icon className={cn("w-3.5 h-3.5", stat.color)} />
               </div>
               <p className="text-2xl font-black text-canopy-dark mb-0.5">{stat.value}</p>
               <p className="text-[10px] text-canopy-dark/30 font-medium">{stat.sub}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[2.5rem] border border-canopy-dark/5 shadow-2xl shadow-canopy-dark/[0.03] overflow-hidden">
        <div className="p-8 border-b border-canopy-dark/5 flex flex-col sm:flex-row gap-4 items-center justify-between bg-feather-cream/20">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-sanctuary-green/10 rounded-2xl">
                <Calendar className="w-6 h-6 text-sanctuary-green" />
             </div>
             <div>
                <h3 className="font-display font-bold text-lg text-canopy-dark leading-none mb-1">Today's Visitors</h3>
                <p className="text-xs text-canopy-dark/40 font-medium">Auto-filtering active for {new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</p>
             </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-canopy-dark/30" />
              <Input
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 h-12 bg-canopy-dark/[0.02] border-transparent rounded-2xl focus-visible:ring-sanctuary-green"
              />
            </div>
            <div className="flex items-center gap-2 text-[10px] text-canopy-dark/30 italic uppercase font-bold tracking-widest">
              <span className="w-1.5 h-1.5 bg-sanctuary-green rounded-full animate-pulse" />
              Real-time flight sync active
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-canopy-dark/5">
                <TableHead className="w-[100px] pl-6 text-xs uppercase tracking-wider font-bold text-canopy-dark/30">Arrival</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-bold text-canopy-dark/30">Visitor</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-bold text-canopy-dark/30">Guests</TableHead>
                <TableHead className="text-xs uppercase tracking-wider font-bold text-canopy-dark/30">Status</TableHead>
                <TableHead className="text-right pr-6 text-xs uppercase tracking-wider font-bold text-canopy-dark/30">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredBookings.map((booking, i) => (
                  <motion.tr
                    key={booking.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="group border-b border-canopy-dark/5 hover:bg-canopy-dark/[0.01] transition-colors"
                  >
                    <TableCell className="pl-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-canopy-dark">{booking.bookingTime}</span>
                        <span className="text-[10px] text-canopy-dark/30 uppercase font-medium">IST</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sanctuary-green/10 flex items-center justify-center font-bold text-sanctuary-green uppercase text-xs">
                          {booking.visitorName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-canopy-dark leading-none mb-1">{booking.visitorName}</p>
                          <p className="text-xs text-canopy-dark/40">{booking.phone}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-canopy-dark/20" />
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
                      <Button variant="ghost" size="icon" className="rounded-xl hover:bg-sanctuary-green/10 hover:text-sanctuary-green group-hover:translate-x-1 transition-all">
                        <ArrowRight className="w-5 h-5" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-canopy-dark/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-canopy-dark/20" />
            </div>
            <h3 className="text-lg font-bold text-canopy-dark mb-1">No visitors today</h3>
            <p className="text-sm text-canopy-dark/40">You're all caught up! No active bookings match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
