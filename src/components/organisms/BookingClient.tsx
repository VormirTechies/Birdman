'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay,
  isBefore,
  isSameMonth,
} from 'date-fns';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ExternalLink,
  Home,
  Bird,
  Shield,
  VolumeX,
  ZapOff,
  Ban,
  Clock,
  Sun,
  Baby,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type DayStatus = 'available' | 'partial' | 'full' | 'blocked' | 'past';

interface CalendarDay {
  date: string;
  bookingCount: number;
  maxCapacity: number;
  isOpen: boolean;
  startTime: string;
  percentage: number;
  remaining: number;
}

interface FormData {
  date: Date | null;
  name: string;
  email: string;
  phone: string;
  adults: number;
  children: number;
  guests: number; // Computed: adults + children (kept for backward compatibility)
  rulesAccepted: boolean;
}

type Step = 1 | 2 | 3;

// ─── Constants ───────────────────────────────────────────────────────────────

const HERO_IMAGES = [
  '/images/gallery/004.jpeg',
  '/images/gallery/006.jpeg',
  '/images/gallery/012.jpeg',
  '/images/gallery/013.jpeg',
];

const GUIDELINES = [
  { icon: VolumeX, title: 'Silence Policy', desc: 'Maintain silence during feeding sessions' },
  { icon: ZapOff, title: 'No Flash Photography', desc: 'Flash photography disturbs the birds' },
  { icon: Ban, title: 'Hands Off', desc: 'Do not touch, chase, or feed the birds' },
  { icon: Clock, title: 'Be On Time', desc: 'Arrive at the scheduled session time' },
  { icon: Sun, title: 'Light Coloured Dress', desc: 'Wear light coloured clothing to your visit' },
  { icon: Baby, title: 'Children & Birds', desc: 'Keep children away from the birds' },
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatSessionTime(time: string): string {
  const [h] = time.split(':');
  const hour = parseInt(h, 10);
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const endHour = (hour + 2) % 24;
  const displayEnd = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour;
  const startPeriod = hour >= 12 ? 'PM' : 'AM';
  const endPeriod = (hour + 2) >= 12 ? 'PM' : 'AM';
  return `${displayHour}:${time.slice(3, 5)} ${startPeriod} – ${displayEnd}:${time.slice(3, 5)} ${endPeriod}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BookingClient() {
  const stepRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [heroIndex, setHeroIndex] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [calendarData, setCalendarData] = useState<Record<string, CalendarDay>>({});
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    date: null,
    name: '',
    email: '',
    phone: '',
    adults: 1,
    children: 0,
    guests: 1, // Computed value
    rulesAccepted: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [bookingResult, setBookingResult] = useState<{
    id: string;
    date: string;
    adults: number;
    children: number;
    guests: number; // Total guests (backward compatibility)
    startTime: string;
  } | null>(null);

  // ── Hero carousel auto-rotate ──────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((i) => (i + 1) % HERO_IMAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // ── Fetch calendar data ────────────────────────────────────────────────────
  const fetchCalendar = useCallback(async (month: Date) => {
    setCalendarLoading(true);
    try {
      const monthStr = format(month, 'yyyy-MM');
      const res = await fetch(`/api/calendar?month=${monthStr}`);
      if (!res.ok) return;
      const data: CalendarDay[] = await res.json();
      const map: Record<string, CalendarDay> = {};
      data.forEach((d) => {
        map[d.date] = d;
      });
      setCalendarData((prev) => ({ ...prev, ...map }));
    } catch {
      // Silently degrade — calendar shows all dates as available
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendar(calendarMonth);
  }, [calendarMonth, fetchCalendar]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const selectedDateStr = formData.date ? format(formData.date, 'yyyy-MM-dd') : null;
  const selectedDateData = selectedDateStr ? calendarData[selectedDateStr] : null;
  const maxGuests = selectedDateData?.maxCapacity ?? 100;
  const remaining = selectedDateData?.remaining ?? 100;
  const sessionTime = selectedDateData?.startTime ?? '16:30:00';

  const availabilityWarning =
    formData.date && selectedDateData && formData.guests > remaining
      ? `Only ${remaining} spot${remaining === 1 ? '' : 's'} remaining on this date. Please reduce your guest count or choose another date.`
      : null;

  // ── Calendar grid ──────────────────────────────────────────────────────────
  const firstOfMonth = startOfMonth(calendarMonth);
  const lastOfMonth = endOfMonth(calendarMonth);
  const days = eachDayOfInterval({ start: firstOfMonth, end: lastOfMonth });
  const startDow = getDay(firstOfMonth);

  const getDayStatus = (date: Date): DayStatus => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if date is in the past
    if (isBefore(date, today)) return 'past';
    
    // Check if it's today and within 1 hour of session start time
    const dateStr = format(date, 'yyyy-MM-dd');
    const todayStr = format(now, 'yyyy-MM-dd');
    if (dateStr === todayStr) {
      const data = calendarData[dateStr];
      const sessionTime = data?.startTime ?? '16:30:00';
      const [hours, minutes] = sessionTime.split(':').map(Number);
      const sessionStart = new Date();
      sessionStart.setHours(hours, minutes, 0, 0);
      
      // If current time is within 1 hour before session start, block the date
      const oneHourBefore = new Date(sessionStart.getTime() - 60 * 60 * 1000);
      if (now >= oneHourBefore) return 'blocked';
    }
    
    const data = calendarData[dateStr];
    if (!data) return 'available';
    if (!data.isOpen) return 'blocked';
    if (data.percentage >= 100) return 'full';
    if (data.percentage >= 50) return 'partial';
    return 'available';
  };

  const handleDateSelect = (date: Date) => {
    const status = getDayStatus(date);
    if (status === 'past' || status === 'blocked' || status === 'full') return;
    updateField('date', date);
    // Cap total guests to remaining capacity when date changes
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayData = calendarData[dateStr];
    const currentTotal = formData.adults + formData.children;
    if (dayData && currentTotal > dayData.remaining) {
      const newTotal = Math.max(1, dayData.remaining);
      setFormData((prev) => ({ 
        ...prev, 
        date, 
        adults: newTotal, 
        children: 0,
        guests: newTotal,
      }));
    }
  };

  // ── Form helpers ───────────────────────────────────────────────────────────
  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      // Update computed guests total when adults or children change
      if (key === 'adults' || key === 'children') {
        updated.guests = updated.adults + updated.children;
      }
      return updated;
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitError('');
  };

  const validate = (): Partial<Record<keyof FormData, string>> => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!formData.date) errs.date = 'Please select a date';
    if (formData.name.trim().length < 3) errs.name = 'Name must be at least 3 characters';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errs.email = 'Please enter a valid email address';
    if (formData.phone.replace(/\D/g, '').length < 10)
      errs.phone = 'Please enter a valid 10-digit phone number';
    if (formData.adults < 1) errs.adults = 'At least 1 adult is required';
    if (formData.children < 0) errs.children = 'Number of children cannot be negative';
    if ((formData.adults + formData.children) > 10) errs.adults = 'Total guests cannot exceed 10';
    return errs;
  };

  const handleReview = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setStep(2);
    stepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async () => {
    if (!formData.rulesAccepted) {
      setSubmitError('Please accept the sanctuary guidelines to continue');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorName: formData.name,
          phone: formData.phone,
          email: formData.email || undefined,
          adults: formData.adults,
          children: formData.children,
          numberOfGuests: formData.adults + formData.children, // Computed for backward compatibility
          bookingDate: formData.date ? format(formData.date, 'yyyy-MM-dd') : '',
          bookingTime: sessionTime,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.details?.[0]?.message || 'Failed to confirm booking');
      }
      setBookingResult({
        id: result.booking?.id ?? result.id ?? '',
        date: formData.date ? format(formData.date, 'PPP') : '',
        adults: formData.adults,
        children: formData.children,
        guests: formData.adults + formData.children,
        startTime: sessionTime,
      });
      setStep(3);
      stepRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Header />

      {/* ── HERO CAROUSEL ──────────────────────────────────────────────────── */}
      <section className="relative h-[60vh] md:h-[72vh] overflow-hidden">
        {HERO_IMAGES.map((src, i) => (
          <motion.div
            key={src}
            className="absolute inset-0"
            animate={{ opacity: i === heroIndex ? 1 : 0 }}
            transition={{ duration: 1.4, ease: 'easeInOut' }}
          >
            <Image
              src={src}
              alt="Birdman of Chennai sanctuary"
              fill
              className="object-cover"
              priority={i === 0}
              sizes="100vw"
            />
          </motion.div>
        ))}

        {/* Horizontal gradient overlay: transparent left → sanctuary-green right */}
        <div className="absolute inset-0 bg-linear-to-r from-transparent from-30% via-sanctuary-green/65 via-60% to-sanctuary-green" />

        {/* Hero text — right panel */}
        <div className="absolute right-0 top-0 bottom-0 w-[60%] md:w-[48%] flex items-end pb-10 md:pb-14 px-8 md:px-12">
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            <p className="text-white/75 text-xs font-bold uppercase tracking-[0.2em] mb-3">
              Birdman of Chennai
            </p>
            <h1 className="font-display font-bold text-white text-2xl md:text-4xl lg:text-5xl leading-tight">
              Reserve Your Spot<br />
              <span className="text-golden-hour">in the Emerald Sky</span>
            </h1>
            <p className="text-white/75 mt-3 text-sm md:text-base max-w-xs">
              An evening with ~6,000 free-flying parakeets — an experience like no other.
            </p>
          </motion.div>
        </div>

        {/* Carousel dots */}
        <div className="absolute bottom-6 right-8 flex gap-1.5 items-center">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              aria-label={`Go to image ${i + 1}`}
              suppressHydrationWarning
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === heroIndex ? 'bg-white w-5' : 'bg-white/40 w-1.5'
              )}
            />
          ))}
        </div>
      </section>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <main className="bg-feather-cream min-h-screen">
        <div ref={stepRef} className="container-wide py-12 md:py-16 max-w-6xl">
          <AnimatePresence mode="wait">

            {/* ── STEP 1: Booking Form ──────────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-center mb-8">
                  <h2 className="font-display font-bold text-2xl md:text-3xl text-canopy-dark">
                    Plan Your Visit
                  </h2>
                  <p className="text-canopy-dark/50 mt-1 text-sm">
                    Select a date and fill in your details
                  </p>
                </div>

                <div className="bg-white rounded-3xl shadow-card overflow-hidden">
                  <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-canopy-dark/5">

                    {/* ── LEFT: Calendar ───────────────────────────────── */}
                    <div className="p-6 md:p-8">
                      <h3 className="font-semibold text-canopy-dark mb-5 flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 bg-sanctuary-green rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                          1
                        </span>
                        Select Your Date
                      </h3>

                      {/* Month navigation */}
                      <div className="flex items-center justify-between mb-3">
                        <button
                          onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
                          disabled={isSameMonth(calendarMonth, new Date())}
                          suppressHydrationWarning
                          className="p-1.5 rounded-lg hover:bg-morning-mist disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                          aria-label="Previous month"
                        >
                          <ChevronLeft className="w-4 h-4 text-canopy-dark" />
                        </button>
                        <span className="font-semibold text-canopy-dark text-sm">
                          {format(calendarMonth, 'MMMM yyyy')}
                        </span>
                        <button
                          onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                          suppressHydrationWarning
                          className="p-1.5 rounded-lg hover:bg-morning-mist transition-colors"
                          aria-label="Next month"
                        >
                          <ChevronRight className="w-4 h-4 text-canopy-dark" />
                        </button>
                      </div>

                      {/* Day-of-week labels */}
                      <div className="grid grid-cols-7 mb-1">
                        {DAY_LABELS.map((d) => (
                          <div
                            key={d}
                            className="text-center text-[11px] font-semibold text-canopy-dark/30 py-1"
                          >
                            {d}
                          </div>
                        ))}
                      </div>

                      {/* Calendar grid */}
                      <div
                        className={cn(
                          'grid grid-cols-7 gap-0.5',
                          calendarLoading && 'opacity-50 pointer-events-none'
                        )}
                      >
                        {/* Leading empty cells */}
                        {Array.from({ length: startDow }).map((_, i) => (
                          <div key={`pad-${i}`} />
                        ))}

                        {days.map((day) => {
                          const status = getDayStatus(day);
                          const isSelected = formData.date ? isSameDay(day, formData.date) : false;
                          const isDisabled =
                            status === 'past' || status === 'blocked' || status === 'full';

                          return (
                            <button
                              key={day.toISOString()}
                              onClick={() => handleDateSelect(day)}
                              disabled={isDisabled}
                              suppressHydrationWarning
                              aria-label={`${format(day, 'd MMMM')}, ${status}`}
                              aria-pressed={isSelected}
                              className={cn(
                                'aspect-square flex flex-col items-center justify-center rounded-lg text-[13px] font-medium transition-all',
                                isSelected
                                  ? 'bg-sanctuary-green text-white shadow-glow-green scale-105'
                                  : status === 'past'
                                    ? 'text-canopy-dark/20 cursor-not-allowed'
                                    : status === 'blocked'
                                      ? 'text-red-300 line-through cursor-not-allowed bg-red-50/60'
                                      : status === 'full'
                                        ? 'text-canopy-dark/25 cursor-not-allowed bg-canopy-dark/5'
                                        : status === 'partial'
                                          ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 cursor-pointer'
                                          : 'text-canopy-dark hover:bg-morning-mist cursor-pointer'
                              )}
                            >
                              {format(day, 'd')}
                              {!isDisabled && !isSelected && (
                                <span
                                  className={cn(
                                    'w-1 h-1 rounded-full mt-0.5',
                                    status === 'available'
                                      ? 'bg-sanctuary-green'
                                      : 'bg-amber-400'
                                  )}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Legend */}
                      <div className="flex items-center gap-3 mt-4 flex-wrap text-[11px] text-canopy-dark/40">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-sanctuary-green" /> Available
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400" /> Filling up
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-canopy-dark/20" /> Full / Closed
                        </span>
                      </div>

                      {/* Session time badge — appears after date selection */}
                      <AnimatePresence>
                        {formData.date && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            className="mt-5 p-3 bg-sanctuary-green/5 border border-sanctuary-green/20 rounded-xl flex items-center gap-3"
                          >
                            <span className="text-xl">🌇</span>
                            <div>
                              <div className="text-[10px] text-canopy-dark/40 uppercase tracking-wider font-semibold">
                                Session Time
                              </div>
                              <div className="text-sm font-semibold text-canopy-dark">
                                {formatSessionTime(sessionTime)}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {errors.date && (
                        <p className="text-red-500 text-sm mt-3 flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="w-4 h-4 shrink-0" /> {errors.date}
                        </p>
                      )}
                    </div>

                    {/* ── RIGHT: Personal Details ───────────────────────── */}
                    <div className="p-6 md:p-8 flex flex-col">
                      <h3 className="font-semibold text-canopy-dark mb-5 flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 bg-sanctuary-green rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                          2
                        </span>
                        Personal Details
                      </h3>

                      <div className="space-y-4 flex-1">
                        {/* Full Name */}
                        <div>
                          <label className="text-[11px] font-bold text-canopy-dark/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" /> Full Name
                          </label>
                          <Input
                            placeholder="e.g. Priya Sharma"
                            value={formData.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            suppressHydrationWarning
                            className={cn(
                              'rounded-xl h-11 border-canopy-dark/10 focus-visible:ring-sanctuary-green/40',
                              errors.name && 'border-red-400'
                            )}
                          />
                          {errors.name && (
                            <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                          )}
                        </div>

                        {/* Email */}
                        <div>
                          <label className="text-[11px] font-bold text-canopy-dark/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" /> Email{' '}
                            <span className="text-canopy-dark/30 font-normal normal-case tracking-normal">
                              (optional)
                            </span>
                          </label>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            suppressHydrationWarning
                            className={cn(
                              'rounded-xl h-11 border-canopy-dark/10 focus-visible:ring-sanctuary-green/40',
                              errors.email && 'border-red-400'
                            )}
                          />
                          {errors.email && (
                            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                          )}
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="text-[11px] font-bold text-canopy-dark/50 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" /> Phone Number
                          </label>
                          <Input
                            type="tel"
                            inputMode="numeric"
                            placeholder="98765 43210"
                            value={formData.phone}
                            onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, ''))}
                            suppressHydrationWarning
                            className={cn(
                              'rounded-xl h-11 border-canopy-dark/10 focus-visible:ring-sanctuary-green/40',
                              errors.phone && 'border-red-400'
                            )}
                          />
                          {errors.phone && (
                            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                          )}
                        </div>

                        {/* Adults & Children Guest Count */}
                        <div>
                          <label className="text-[11px] font-bold text-canopy-dark/50 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" /> Number of Guests
                          </label>
                          
                          {/* Adults */}
                          <div className="mb-4">
                            <div className="text-[10px] font-semibold text-canopy-dark/60 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <User className="w-3 h-3" /> Adults (13+)
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                suppressHydrationWarning
                                onClick={() =>
                                  updateField('adults', Math.max(1, formData.adults - 1))
                                }
                                className="w-10 h-10 rounded-xl border border-canopy-dark/10 flex items-center justify-center hover:bg-morning-mist transition-colors text-lg text-canopy-dark font-light"
                              >
                                −
                              </button>
                              <span className="w-10 text-center font-bold text-xl text-canopy-dark">
                                {formData.adults}
                              </span>
                              <button
                                type="button"
                                suppressHydrationWarning
                                onClick={() => {
                                  const newAdults = formData.adults + 1;
                                  const newTotal = newAdults + formData.children;
                                  if (newTotal <= 10 && newTotal <= remaining) {
                                    updateField('adults', newAdults);
                                  }
                                }}
                                className="w-10 h-10 rounded-xl border border-canopy-dark/10 flex items-center justify-center hover:bg-morning-mist transition-colors text-lg text-canopy-dark font-light"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Children */}
                          <div>
                            <div className="text-[10px] font-semibold text-canopy-dark/60 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                              <Baby className="w-3 h-3" /> Children (0-12)
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                suppressHydrationWarning
                                onClick={() =>
                                  updateField('children', Math.max(0, formData.children - 1))
                                }
                                className="w-10 h-10 rounded-xl border border-canopy-dark/10 flex items-center justify-center hover:bg-morning-mist transition-colors text-lg text-canopy-dark font-light"
                              >
                                −
                              </button>
                              <span className="w-10 text-center font-bold text-xl text-canopy-dark">
                                {formData.children}
                              </span>
                              <button
                                type="button"
                                suppressHydrationWarning
                                onClick={() => {
                                  const newChildren = formData.children + 1;
                                  const newTotal = formData.adults + newChildren;
                                  if (newTotal <= 10 && newTotal <= remaining) {
                                    updateField('children', newChildren);
                                  }
                                }}
                                className="w-10 h-10 rounded-xl border border-canopy-dark/10 flex items-center justify-center hover:bg-morning-mist transition-colors text-lg text-canopy-dark font-light"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Total & Limit Display */}
                          <div className="mt-3 pt-3 border-t border-canopy-dark/5 flex items-center justify-between text-[11px]">
                            <span className="text-canopy-dark/40 font-semibold uppercase tracking-wider">
                              Total Guests
                            </span>
                            <span className="font-bold text-canopy-dark">
                              {formData.adults + formData.children} / 10
                            </span>
                          </div>

                          {/* Availability warning */}
                          <AnimatePresence>
                            {availabilityWarning && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 overflow-hidden"
                              >
                                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  {availabilityWarning}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="mt-6 pt-5 border-t border-canopy-dark/5">
                        <div className="text-xs text-canopy-dark/40 text-center mb-4">
                          Entry is{' '}
                          <strong className="text-sanctuary-green">free</strong>. No payment required.
                        </div>
                        <Button
                          onClick={handleReview}
                          suppressHydrationWarning
                          disabled={!!availabilityWarning}
                          className="w-full bg-canopy-dark hover:bg-sanctuary-green text-white rounded-xl h-12 text-base font-semibold gap-2 transition-all"
                        >
                          Review Booking
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Review ─────────────────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4 }}
              >
                <div className="text-center mb-8">
                  <h2 className="font-display font-bold text-2xl md:text-3xl text-canopy-dark">
                    Review Your Booking
                  </h2>
                  <p className="text-canopy-dark/50 mt-1 text-sm">
                    Everything looks right? Confirm below.
                  </p>
                </div>

                {/* Guest details + guidelines side by side */}
                <div className="grid md:grid-cols-2 gap-5 mb-5">
                  {/* Guest details card */}
                  <div className="bg-white rounded-2xl p-6 shadow-card">
                    <h3 className="font-semibold text-canopy-dark mb-4 flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-sanctuary-green" />
                      Guest Details
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Name', value: formData.name },
                        {
                          label: 'Date',
                          value: formData.date ? format(formData.date, 'PPP') : '',
                        },
                        {
                          label: 'Session',
                          value: formatSessionTime(sessionTime),
                        },
                        {
                          label: 'Guests',
                          value: `${formData.guests} ${formData.guests === 1 ? 'person' : 'people'}`,
                        },
                        { label: 'Phone', value: formData.phone },
                        ...(formData.email
                          ? [{ label: 'Email', value: formData.email }]
                          : []),
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex justify-between items-start gap-4"
                        >
                          <span className="text-[11px] font-bold text-canopy-dark/40 uppercase tracking-wider shrink-0">
                            {item.label}
                          </span>
                          <span className="text-sm font-medium text-canopy-dark text-right">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-canopy-dark/5 text-center text-xs text-canopy-dark/40 bg-morning-mist rounded-xl py-2 px-3">
                      Entry is{' '}
                      <strong className="text-sanctuary-green">free</strong>. No payment required.
                    </div>
                  </div>

                  {/* Guidelines card */}
                  <div className="bg-white rounded-2xl p-6 shadow-card flex flex-col">
                    <h3 className="font-semibold text-canopy-dark mb-4 flex items-center gap-2 text-sm">
                      <Shield className="w-4 h-4 text-golden-hour" />
                      Sanctuary Guidelines
                    </h3>
                    <div className="grid grid-cols-1 gap-2 flex-1">
                      {GUIDELINES.map((g) => (
                        <div
                          key={g.title}
                          className="flex items-start gap-3 p-2.5 bg-morning-mist rounded-xl"
                        >
                          <g.icon className="w-4 h-4 text-sanctuary-green shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-semibold text-canopy-dark">
                              {g.title}
                            </div>
                            <div className="text-[11px] text-canopy-dark/50 mt-0.5 leading-snug">
                              {g.desc}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer group pt-3 mt-3 border-t border-canopy-dark/5">
                      <Checkbox
                        id="rules"
                        checked={formData.rulesAccepted}
                        onCheckedChange={(checked) =>
                          updateField('rulesAccepted', checked === true)
                        }
                      />
                      <span className="text-sm text-canopy-dark select-none group-hover:text-canopy-dark/80 transition-colors">
                        I agree to the sanctuary guidelines and will respect the birds and the space.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Submit error */}
                <AnimatePresence>
                  {submitError && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm mb-4"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {submitError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep(1)}
                    suppressHydrationWarning
                    variant="outline"
                    className="rounded-xl h-12 px-6 border-canopy-dark/15 gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    suppressHydrationWarning
                    disabled={isSubmitting || !formData.rulesAccepted}
                    className="flex-1 bg-sanctuary-green hover:bg-canopy-dark text-white rounded-xl h-12 text-base font-semibold gap-2 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? (
                      <>
                        <Bird className="w-4 h-4 animate-bounce" /> Confirming…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" /> Confirm Booking
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Success ─────────────────────────────────────────── */}
            {step === 3 && bookingResult && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="max-w-2xl mx-auto bg-white rounded-3xl shadow-card p-8 md:p-10"
              >
                {/* Check icon */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 180, delay: 0.2 }}
                    className="w-20 h-20 bg-sanctuary-green/10 rounded-full flex items-center justify-center mx-auto mb-5"
                  >
                    <CheckCircle2 className="w-10 h-10 text-sanctuary-green" />
                  </motion.div>
                  <h2 className="font-display font-bold text-3xl text-canopy-dark mb-2">
                    Booking Successful!
                  </h2>
                  <p className="text-canopy-dark/50 max-w-sm mx-auto text-sm">
                    {formData.email
                      ? 'A confirmation has been sent to your email address.'
                      : 'Your visit to the Birdman of Chennai is confirmed.'}
                  </p>
                </div>

                {/* Booking ID + Guests */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-morning-mist rounded-xl p-5 text-center">
                    <div className="text-[11px] font-bold text-canopy-dark/60 uppercase tracking-wider mb-2">
                      Booking ID
                    </div>
                    <div className="font-mono font-bold text-lg text-sanctuary-green tracking-wider">
                      #{bookingResult.id.slice(-8).toUpperCase()}
                    </div>
                  </div>
                  <div className="bg-morning-mist rounded-xl p-5 text-center">
                    <div className="text-[11px] font-bold text-canopy-dark/60 uppercase tracking-wider mb-2">
                      Guests
                    </div>
                    <div className="font-bold text-lg text-canopy-dark">
                      {bookingResult.children > 0 
                        ? `${bookingResult.adults}A + ${bookingResult.children}C`
                        : `${bookingResult.adults} Adult${bookingResult.adults !== 1 ? 's' : ''}`
                      }
                    </div>
                  </div>
                </div>

                {/* Date + Session */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-morning-mist rounded-xl p-5 text-center">
                    <div className="text-[11px] font-bold text-canopy-dark/60 uppercase tracking-wider mb-2">
                      Date
                    </div>
                    <div className="text-sm font-semibold text-canopy-dark leading-tight">
                      {bookingResult.date}
                    </div>
                  </div>
                  <div className="bg-morning-mist rounded-xl p-5 text-center">
                    <div className="text-[11px] font-bold text-canopy-dark/60 uppercase tracking-wider mb-2">
                      Session
                    </div>
                    <div className="text-sm font-semibold text-canopy-dark leading-tight">
                      {formatSessionTime(bookingResult.startTime)}
                    </div>
                  </div>
                </div>

                {/* Location - Full Width */}
                <div className="bg-morning-mist rounded-xl p-5 text-center mb-5">
                  <div className="text-[11px] font-bold text-canopy-dark/60 uppercase tracking-wider mb-2">
                    Location
                  </div>
                  <div className="text-sm font-medium text-canopy-dark leading-snug">
                    2/3, Iyya Mudali St, Chintadripet, Chennai
                  </div>
                </div>

                {/* Google Map */}
                <div className="rounded-2xl overflow-hidden shadow-card mb-6">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.1364560756776!2d80.26628887588147!3d13.076882212351234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a52661ab209a803%3A0x6fd7d455d3f23a7e!2s2%2F3%2C%20Iyya%20Mudali%20St%2C%20Adikesavarpuram%2C%20Chintadripet%2C%20Chennai%2C%20Tamil%20Nadu%20600002!5e0!3m2!1sen!2sin!4v1711674374321!5m2!1sen!2sin"
                    className="w-full h-52 border-0"
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Birdman of Chennai location map"
                  />
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button
                    asChild
                    className="flex-1 bg-canopy-dark hover:bg-sanctuary-green text-white rounded-xl h-12 gap-2 transition-all"
                  >
                    <Link href="/">
                      <Home className="w-4 h-4" />
                      Go Home
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="flex-1 rounded-xl h-12 gap-2 border-canopy-dark/15"
                  >
                    <a
                      href={process.env.NEXT_PUBLIC_MAP_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="w-4 h-4" />
                      Open in Maps
                      <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
                    </a>
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </>
  );
}
