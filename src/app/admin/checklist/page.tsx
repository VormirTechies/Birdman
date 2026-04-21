'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Phone, Users, Loader2, CalendarDays, ClipboardCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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
  const totalBookingsCount = data?.bookings.length || 0;
  const pct = totalBookingsCount > 0
    ? Math.round((data!.visitedCount / totalBookingsCount) * 100) : 0;

  return (
    <main className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12 animate-in fade-in duration-1000">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-display font-black text-zinc-900 mb-2 tracking-tight">
             {isDateToday ? "Day Flow" : "Archival Check"}
          </h1>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">
             {format(new Date(date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        
        <div className="relative group">
           <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 transition-colors group-hover:text-zinc-900" />
           <input
             type="date"
             value={date}
             onChange={e => setDate(e.target.value)}
             className="pl-12 pr-6 h-14 bg-white border border-black/[0.03] rounded-2xl text-sm font-bold text-zinc-900 outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all shadow-xl shadow-black/[0.01]"
             suppressHydrationWarning
           />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[3rem] border border-black/[0.03] shadow-sm">
          <Loader2 className="w-12 h-12 text-zinc-900 animate-spin mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">Synchronizing Vault...</p>
        </div>
      ) : !data || data.bookings.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-black/5 py-32 text-center shadow-xl shadow-black/[0.02]">
          <div className="w-20 h-20 bg-zinc-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-zinc-100 shadow-inner">
             <Users className="w-8 h-8 text-zinc-200" />
          </div>
          <h3 className="text-2xl font-black text-zinc-300 tracking-widest uppercase mb-2">Registry Void</h3>
          <p className="text-sm font-bold text-zinc-300 uppercase tracking-widest">No entries discovered for this window</p>
        </div>
      ) : (
        <>
          {/* ── PROGRESS INSIGHT ────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] border border-black/[0.03] p-8 mb-10 shadow-2xl shadow-black/[0.02] flex items-center justify-between gap-8"
          >
            <div className="flex items-center gap-8">
               <div className="relative w-24 h-24 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                     <circle cx="48" cy="48" r="42" className="stroke-zinc-50 fill-none" strokeWidth="6" />
                     <motion.circle 
                       cx="48" cy="48" r="42" 
                       className="fill-none stroke-sanctuary-green"
                       strokeWidth="6"
                       strokeDasharray={264}
                       initial={{ strokeDashoffset: 264 }}
                       animate={{ strokeDashoffset: 264 - (264 * pct) / 100 }}
                       transition={{ duration: 1.5, ease: "easeOut" }}
                       strokeLinecap="round"
                       style={{ filter: "drop-shadow(0 0 4px rgba(5, 150, 105, 0.2))" }}
                     />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-xl font-black text-zinc-900 tabular-nums">{pct}%</span>
                  </div>
               </div>
               
               <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-2">Phase Completion</p>
                  <div className="flex gap-6">
                     <div>
                        <p className="text-2xl font-black text-zinc-900 leading-none">{data.visitedCount}</p>
                        <p className="text-[8px] uppercase font-black tracking-widest text-zinc-400 mt-1">Processed</p>
                     </div>
                     <div className="w-px bg-zinc-50" />
                     <div>
                        <p className="text-2xl font-black text-zinc-300 leading-none">{data.remainingCount}</p>
                        <p className="text-[8px] uppercase font-black tracking-widest text-zinc-400 mt-1">Queue</p>
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="hidden sm:block">
               <div className="bg-zinc-900 text-white rounded-2xl px-6 py-4 shadow-xl shadow-zinc-950/20">
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1">Impact Pax</p>
                  <p className="text-2xl font-black leading-none">{data.totalGuests}</p>
               </div>
            </div>
          </motion.div>

          {/* ── QUEUE LIST ──────────────────────────────────────────────────── */}
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {data.bookings.map((booking, i) => (
                <motion.div
                  key={booking.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04, ease: "easeOut" }}
                  className={cn(
                    "bg-white rounded-[2.5rem] border p-6 flex items-center gap-6 shadow-2xl transition-all duration-500 group relative overflow-hidden",
                    booking.visited
                      ? "border-sanctuary-green/10 bg-zinc-50/50 shadow-black/[0.01]"
                      : "border-black/[0.03] hover:border-black/10 shadow-black/[0.03] hover:shadow-black/[0.06] hover:translate-y-[-2px]"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Status Interaction */}
                  <button
                    onClick={() => handleToggle(booking)}
                    disabled={toggling === booking.id}
                    className={cn(
                      "w-16 h-16 rounded-[1.8rem] flex items-center justify-center shrink-0 transition-all duration-500 relative z-10",
                      "active:scale-90 focus:outline-none",
                      booking.visited
                        ? "bg-sanctuary-green text-white shadow-xl shadow-sanctuary-green/30"
                        : "bg-zinc-900 text-white shadow-xl shadow-zinc-950/10 hover:scale-105"
                    )}
                    aria-label={booking.visited ? 'Mark Pending' : 'Mark Visited'}
                  >
                    {toggling === booking.id ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : booking.visited ? (
                      <ClipboardCheck className="w-8 h-8" />
                    ) : (
                      <ArrowRight className="w-7 h-7 group-hover:translate-x-1 transition-transform" />
                    )}
                  </button>

                  {/* Identity Grid */}
                  <div className="flex-1 min-w-0 relative z-10">
                    <div className="flex items-center gap-3 mb-1">
                      <p className={cn(
                        "text-lg font-black tracking-tight truncate transition-all duration-500 transform",
                        booking.visited ? 'text-zinc-300 line-through decoration-zinc-900/10' : 'text-zinc-900 group-hover:translate-x-1'
                      )}>
                        {booking.visitorName}
                      </p>
                      {booking.category && booking.category !== 'individual' && (
                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-zinc-900 text-white shadow-lg shadow-zinc-950/10 shrink-0">
                          {booking.category}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4">
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                          <Users className="w-3 h-3" /> {booking.numberOfGuests} Guests
                       </p>
                       <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2">
                          <ClipboardCheck className="w-3 h-3" /> {booking.bookingTime}
                       </p>
                    </div>
                  </div>

                  {/* Comm Link */}
                  <a
                    href={`tel:${booking.phone}`}
                    className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative z-10",
                      booking.visited
                        ? "bg-zinc-50 text-zinc-200 pointer-events-none"
                        : "bg-zinc-50 text-zinc-400 hover:bg-zinc-900 hover:text-white hover:shadow-xl hover:shadow-zinc-950/10 active:scale-90"
                    )}
                  >
                    <Phone className="w-5 h-5" />
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
