'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Phone, Users, Loader2, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday } from 'date-fns';
import { toast } from 'sonner';

interface ChecklistBooking {
  id: string;
  visitorName: string;
  phone: string;
  email: string | null;
  numberOfGuests: number;
  category?: string;
  organisationName?: string | null;
  visited: boolean;
  bookingTime: string;
}

interface ChecklistData {
  bookings: ChecklistBooking[];
  totalGuests: number;
  visitedCount: number;
  remainingCount: number;
}

export default function AdminChecklistPage() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  const [data, setData] = useState<ChecklistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchChecklist = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/checklist?date=${d}`);
      const json = await res.json();
      if (json.success) setData(json);
    } catch (e) {
      toast.error('Failed to load checklist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChecklist(date); }, [date, fetchChecklist]);

  const handleToggle = async (booking: ChecklistBooking) => {
    setToggling(booking.id);
    const newVisited = !booking.visited;
    try {
      const res = await fetch('/api/admin/checklist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, visited: newVisited }),
      });
      const json = await res.json();
      if (json.success) {
        setData(prev => {
          if (!prev) return prev;
          const updatedBookings = prev.bookings.map(b =>
            b.id === booking.id ? { ...b, visited: newVisited } : b
          );
          const visitedCount = updatedBookings.filter(b => b.visited).length;
          return { ...prev, bookings: updatedBookings, visitedCount, remainingCount: updatedBookings.length - visitedCount };
        });
        toast.success(newVisited ? `${booking.visitorName} marked as visited ✅` : `${booking.visitorName} marked as pending`);
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setToggling(null);
    }
  };

  const isDateToday = date === todayStr;
  const pct = data && data.bookings.length > 0
    ? Math.round((data.visitedCount / data.bookings.length) * 100) : 0;

  return (
    <main className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-canopy-dark">
            {isDateToday ? "Today's Checklist" : 'Visitor Checklist'}
          </h1>
          <p className="text-sm text-canopy-dark/40 mt-1">
            {format(new Date(date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        {/* Date picker */}
        <div className="flex items-center gap-2 shrink-0">
          <CalendarDays className="w-4 h-4 text-canopy-dark/30" />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="text-sm border border-canopy-dark/10 rounded-xl px-3 h-10 bg-white text-canopy-dark/70 focus:outline-none focus:ring-2 focus:ring-sanctuary-green/30"
            suppressHydrationWarning
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-sanctuary-green animate-spin" />
        </div>
      ) : !data || data.bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-canopy-dark/5 p-12 text-center">
          <Users className="w-12 h-12 text-canopy-dark/10 mx-auto mb-4" />
          <p className="font-bold text-canopy-dark/30">No bookings for this day</p>
          <p className="text-sm text-canopy-dark/20 mt-1">Check another date or go relax 😊</p>
        </div>
      ) : (
        <>
          {/* Progress summary */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-canopy-dark/5 p-5 mb-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-5">
                <div>
                  <p className="text-2xl font-bold text-sanctuary-green">{data.visitedCount}</p>
                  <p className="text-[10px] uppercase tracking-widest text-canopy-dark/35 font-semibold">Visited</p>
                </div>
                <div className="w-px bg-canopy-dark/5" />
                <div>
                  <p className="text-2xl font-bold text-canopy-dark/50">{data.remainingCount}</p>
                  <p className="text-[10px] uppercase tracking-widest text-canopy-dark/35 font-semibold">Remaining</p>
                </div>
                <div className="w-px bg-canopy-dark/5" />
                <div>
                  <p className="text-2xl font-bold text-canopy-dark">{data.totalGuests}</p>
                  <p className="text-[10px] uppercase tracking-widest text-canopy-dark/35 font-semibold">Total Guests</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-canopy-dark">{pct}%</p>
                <p className="text-[10px] uppercase tracking-widest text-canopy-dark/35 font-semibold">Done</p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-3 bg-canopy-dark/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-sanctuary-green"
              />
            </div>
          </motion.div>

          {/* Checklist items */}
          <div className="space-y-2">
            <AnimatePresence>
              {data.bookings.map((booking, i) => (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    "bg-white rounded-2xl border transition-all duration-200 p-4 flex items-center gap-4",
                    booking.visited
                      ? "border-sanctuary-green/20 bg-sanctuary-green/[0.02]"
                      : "border-canopy-dark/5 hover:border-canopy-dark/10"
                  )}
                >
                  {/* Big checkbox */}
                  <button
                    onClick={() => handleToggle(booking)}
                    disabled={toggling === booking.id}
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200",
                      "active:scale-95 focus:outline-none",
                      booking.visited
                        ? "bg-sanctuary-green/10 text-sanctuary-green"
                        : "bg-canopy-dark/5 text-canopy-dark/20 hover:bg-canopy-dark/10"
                    )}
                    aria-label={booking.visited ? 'Mark as not visited' : 'Mark as visited'}
                  >
                    {toggling === booking.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : booking.visited ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn(
                        "text-base font-bold truncate",
                        booking.visited ? 'text-canopy-dark/50 line-through decoration-sanctuary-green/50' : 'text-canopy-dark'
                      )}>
                        {booking.visitorName}
                      </p>
                      {booking.category && booking.category !== 'individual' && (
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                          {booking.category}
                        </span>
                      )}
                    </div>
                    {booking.organisationName && (
                      <p className="text-xs text-canopy-dark/40 mt-0.5">{booking.organisationName}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-canopy-dark/35 font-medium">
                        <Users className="w-3 h-3" /> {booking.numberOfGuests} guests
                      </span>
                    </div>
                  </div>

                  {/* Call button */}
                  <a
                    href={`tel:${booking.phone}`}
                    className="w-10 h-10 rounded-xl bg-canopy-dark/5 hover:bg-sanctuary-green/10 hover:text-sanctuary-green flex items-center justify-center transition-colors shrink-0"
                    aria-label={`Call ${booking.visitorName}`}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </main>
  );
}
