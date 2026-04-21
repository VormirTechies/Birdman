'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, X, Ban, Unlock,
  Users, Clock, Loader2, AlertTriangle, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isPast } from 'date-fns';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DayData {
  date: string;
  bookingCount: number;
  totalGuests: number;
  maxGuests: number;
  slotTime: string;
  isBlocked: boolean;
  percentFull: number;
}

interface DayBooking {
  id: string;
  visitorName: string;
  phone: string;
  email: string | null;
  numberOfGuests: number;
  bookingTime: string;
  visited: boolean;
  category?: string;
  organisationName?: string | null;
}

// ─── Availability colour helper ───────────────────────────────────────────────

function getAvailabilityColor(day: DayData): { dot: string; bg: string; text: string } {
  if (day.isBlocked) return { dot: 'bg-red-400', bg: 'bg-red-50', text: 'text-red-500' };
  if (day.totalGuests === 0) return { dot: 'bg-zinc-200', bg: '', text: 'text-zinc-300' };
  if (day.percentFull >= 80) return { dot: 'bg-red-400', bg: 'bg-red-50/60', text: 'text-red-600' };
  if (day.percentFull >= 50) return { dot: 'bg-amber-400', bg: 'bg-amber-50/60', text: 'text-amber-600' };
  return { dot: 'bg-sanctuary-green', bg: 'bg-sanctuary-green/5', text: 'text-sanctuary-green' };
}

// ─── Day Detail Sheet ─────────────────────────────────────────────────────────

function DaySheet({ day, onClose, onBlock, onUnblock, onTimeChange }: {
  day: DayData;
  onClose: () => void;
  onBlock: (date: string, reason: string) => Promise<void>;
  onUnblock: (date: string) => Promise<void>;
  onTimeChange: (date: string, newTime: string) => Promise<void>;
}) {
  const [bookings, setBookings] = useState<DayBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [newTime, setNewTime] = useState(day.slotTime);
  const [blocking, setBlocking] = useState(false);
  const [changingTime, setChangingTime] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/checklist?date=${day.date}`)
      .then(r => r.json())
      .then(d => setBookings(d.bookings || []))
      .finally(() => setLoading(false));
  }, [day.date]);

  const handleBlock = async () => {
    setBlocking(true);
    await onBlock(day.date, blockReason);
    setBlocking(false);
    setShowBlockForm(false);
  };

  const handleTimeChange = async () => {
    setChangingTime(true);
    await onTimeChange(day.date, newTime);
    setChangingTime(false);
  };

  const color = getAvailabilityColor(day);
  const displayDate = format(new Date(day.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg rounded-t-[2rem] sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden pb-safe-area-bottom"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-black/5 bg-white">
          <div>
            <p className="font-bold text-zinc-900 text-lg tracking-tight">{displayDate}</p>
            <p className="text-xs font-semibold text-zinc-400 mt-0.5 uppercase tracking-wider">
              {day.isBlocked ? '🚫 Session Blocked' : `${day.totalGuests}/${day.maxGuests} Active Guests · ${day.slotTime}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-zinc-100 transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Controls */}
          <div className="grid grid-cols-2 gap-3">
            {/* Time change */}
            <div className="bg-zinc-50 rounded-2xl p-4 border border-black/[0.03]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Session Time</p>
              <input
                type="time"
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                className="w-full text-sm font-bold text-zinc-900 bg-transparent border-none outline-none mb-3"
              />
              <Button
                onClick={handleTimeChange}
                disabled={changingTime || newTime === day.slotTime}
                className="w-full h-8 text-xs rounded-xl bg-sanctuary-green hover:bg-zinc-900 text-white shadow-sm"
              >
                {changingTime ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Update Time'}
              </Button>
            </div>

            {/* Block / Unblock */}
            <div className="bg-zinc-50 rounded-2xl p-4 border border-black/[0.03]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Date Control</p>
              {day.isBlocked ? (
                <Button
                  onClick={() => onUnblock(day.date)}
                  className="w-full h-8 text-xs mt-7 rounded-xl bg-sanctuary-green hover:bg-zinc-900 text-white gap-1.5 shadow-sm"
                >
                  <Unlock className="w-3 h-3" /> Unblock
                </Button>
              ) : (
                <>
                  {!showBlockForm ? (
                    <Button
                      onClick={() => setShowBlockForm(true)}
                      variant="outline"
                      className="w-full h-8 text-xs mt-7 rounded-xl border-red-200 text-red-500 hover:bg-red-50 gap-1.5"
                    >
                      <Ban className="w-3 h-3" /> Block Date
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <input
                        value={blockReason}
                        onChange={e => setBlockReason(e.target.value)}
                        placeholder="Reason (optional)"
                        className="w-full text-xs bg-white border border-black/5 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-red-200 transition-all"
                      />
                      <Button
                        onClick={handleBlock}
                        disabled={blocking}
                        className="w-full h-8 text-xs rounded-xl bg-red-500 hover:bg-red-600 text-white"
                      >
                        {blocking ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm Block'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Bookings list */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
              Bookings ({bookings.length})
            </p>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-zinc-900 animate-spin" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-zinc-300 text-sm">No bookings for this day</div>
            ) : (
              <div className="space-y-2">
                {bookings.map(b => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-black/5">
                    <div className="w-8 h-8 rounded-xl bg-zinc-100 flex items-center justify-center font-bold text-xs text-zinc-400 shrink-0">
                      {b.visitorName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-zinc-900 truncate">{b.visitorName}</p>
                      <p className="text-[10px] text-zinc-400">{b.phone}</p>
                    </div>
                    <span className="text-xs font-bold text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-lg shrink-0">
                      {b.numberOfGuests}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Calendar Page ────────────────────────────────────────────────────────────

export default function AdminCalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarData, setCalendarData] = useState<Record<string, DayData>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  const fetchCalendar = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const res = await fetch(`/api/admin/calendar?year=${year}&month=${month}`);
      const data = await res.json();
      const map: Record<string, DayData> = {};
      for (const d of (data.days || [])) {
        map[d.date] = d;
      }
      setCalendarData(map);
    } catch (e) {
      toast.error('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCalendar(currentMonth); }, [currentMonth, fetchCalendar]);

  const handleBlock = async (date: string, reason: string) => {
    const res = await fetch('/api/admin/day-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, action: 'block', blockReason: reason }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success(`Date blocked. ${data.affectedBookings?.length || 0} booking(s) cancelled.`);
      setSelectedDay(null);
      fetchCalendar(currentMonth);
    } else {
      toast.error('Failed to block date');
    }
  };

  const handleUnblock = async (date: string) => {
    const res = await fetch('/api/admin/day-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, action: 'unblock' }),
    });
    const data = await res.json();
    if (data.success) {
      toast.success('Date unblocked');
      setSelectedDay(null);
      fetchCalendar(currentMonth);
    } else {
      toast.error('Failed to unblock date');
    }
  };

  const handleTimeChange = async (date: string, newTime: string) => {
    const res = await fetch('/api/admin/day-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, slotTime: newTime }),
    });
    const data = await res.json();
    if (data.success) {
      if (data.timeChanged && data.affectedBookings?.length > 0) {
        toast.success(`Time updated. ${data.affectedBookings.length} visitor(s) will be notified.`);
        // TODO: trigger email notifications
      } else {
        toast.success('Session time updated');
      }
      // Optimistically update local state
      setCalendarData(prev => ({
        ...prev,
        [date]: { ...(prev[date] || {} as DayData), slotTime: newTime },
      }));
    } else {
      toast.error('Failed to update time');
    }
  };

  // Build the calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun

  const prevMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">Calendar</h1>
          <p className="text-sm text-zinc-400 mt-1">Manage session times & visitor blocks</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}
            className="h-10 w-10 rounded-xl border-black/5 hover:bg-zinc-100 transition-colors shadow-sm">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm font-bold text-zinc-900 px-4 min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}
            className="h-10 w-10 rounded-xl border-black/5 hover:bg-zinc-100 transition-colors shadow-sm">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
        {[
          { dot: 'bg-zinc-100', label: 'Empty' },
          { dot: 'bg-sanctuary-green', label: 'Available' },
          { dot: 'bg-amber-400', label: 'Filling Fast' },
          { dot: 'bg-red-400', label: 'Full / Blocked' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={cn("w-2.5 h-2.5 rounded-full", l.dot)} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-black/5 bg-zinc-50/30">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-zinc-300">
              {d}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-sanctuary-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {/* Padding cells */}
            {Array.from({ length: startPad }).map((_, i) => (
              <div key={`pad-${i}`} className="border-r border-b border-black/5 h-20 md:h-24 bg-zinc-50/20" />
            ))}

            {/* Day cells */}
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const data = calendarData[dateStr];
              const color = data ? getAvailabilityColor(data) : { dot: 'bg-zinc-100', bg: '', text: 'text-zinc-300' };
              const todayDay = isToday(day);
              const pastDay = isPast(day) && !isToday(day);

              return (
                <button
                  key={dateStr}
                  onClick={() => data && setSelectedDay(data)}
                  className={cn(
                    "border-r border-b border-black/5 h-20 md:h-24 p-2 text-left transition-all duration-150 flex flex-col group",
                    data ? "hover:bg-zinc-50 cursor-pointer" : "cursor-default opacity-40",
                    color.bg,
                    todayDay && "bg-sanctuary-green/[0.03]"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-xs md:text-sm font-bold w-6 h-6 flex items-center justify-center rounded-lg transition-colors",
                      todayDay ? "bg-sanctuary-green text-white shadow-md shadow-sanctuary-green/20" : pastDay ? "text-zinc-300" : "text-zinc-600 group-hover:text-zinc-900"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {data && (
                      <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", color.dot)} />
                    )}
                  </div>

                  {data && data.totalGuests > 0 && (
                    <div className="mt-auto">
                      <p className={cn("text-[10px] font-black leading-tight", color.text)}>
                        {data.totalGuests}
                      </p>
                      <p className="text-[8px] font-bold uppercase tracking-tighter text-zinc-300 leading-tight hidden md:block">Active</p>
                    </div>
                  )}

                  {data?.isBlocked && (
                    <div className="mt-auto">
                      <p className="text-[9px] font-bold text-red-500 bg-red-50 px-1 rounded">Blocked</p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Day Detail Sheet */}
      <AnimatePresence>
        {selectedDay && (
          <DaySheet
            day={selectedDay}
            onClose={() => setSelectedDay(null)}
            onBlock={handleBlock}
            onUnblock={handleUnblock}
            onTimeChange={handleTimeChange}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
