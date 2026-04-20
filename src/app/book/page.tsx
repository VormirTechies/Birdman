'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Calendar, Clock, User, Phone, Mail, Users, CheckCircle2,
  ArrowRight, ArrowLeft, Bird, AlertCircle, MapPin, ExternalLink,
  Shield, GraduationCap, Building2, Loader2, Info
} from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

interface DayAvailability {
  date: string;
  maxGuests: number;
  totalGuests: number;
  remaining: number;
  slotTime: string;
  isBlocked: boolean;
}

interface BookingData {
  date: Date | undefined;
  category: 'individual' | 'school' | 'organisation';
  organisationName: string;
  name: string;
  phone: string;
  email: string;
  guests: number;
  rulesAccepted: boolean;
}

const steps = [
  { number: 1, label: 'Date Selection' },
  { number: 2, label: 'Your Details' },
  { number: 3, label: 'Review' },
];

export default function BookingPage() {
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Availability state
  const [availabilities, setAvailabilities] = useState<Record<string, DayAvailability>>({});
  const [loadingAvail, setLoadingAvail] = useState(true);

  const [formData, setFormData] = useState<BookingData>({
    date: undefined,
    category: 'individual',
    organisationName: '',
    name: '',
    phone: '',
    email: '',
    guests: 1,
    rulesAccepted: false,
  });

  // Calculate booking window (today -> 30 days from now)
  const today = startOfDay(new Date());
  const maxDate = addDays(today, 30);

  // Fetch availability for the next 30 days
  useEffect(() => {
    const fetchAvailabilities = async () => {
      try {
        const start = format(today, 'yyyy-MM-dd');
        const end = format(maxDate, 'yyyy-MM-dd');
        const res = await fetch(`/api/availability?startDate=${start}&endDate=${end}`);
        const data = await res.json();
        
        if (data.success && data.availability) {
          const map: Record<string, DayAvailability> = {};
          data.availability.forEach((d: DayAvailability) => {
            map[d.date] = d;
          });
          setAvailabilities(map);
        }
      } catch (err) {
        console.error('Failed to load availability', err);
      } finally {
        setLoadingAvail(false);
      }
    };
    fetchAvailabilities();
  }, [today, maxDate]);

  // Selected day's availability
  const selectedAvail = formData.date 
    ? availabilities[format(formData.date, 'yyyy-MM-dd')] 
    : undefined;

  // Max allowed guests for the selected category and date
  const maxAllowedGuests = useMemo(() => {
    if (!selectedAvail) return 10; // Fallback
    const remaining = selectedAvail.remaining;
    if (formData.category === 'individual') return Math.min(10, remaining);
    return remaining; // Schools/Orgs can book up to total capacity
  }, [selectedAvail, formData.category]);

  // Reset guests if category changes or max changes
  useEffect(() => {
    if (formData.guests > maxAllowedGuests) {
      setFormData(prev => ({ ...prev, guests: Math.max(1, maxAllowedGuests) }));
    }
  }, [maxAllowedGuests, formData.guests]);


  const updateField = <K extends keyof BookingData>(key: K, value: BookingData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.date) return 'Please select a date from the calendar';
    
    const dateStr = format(formData.date, 'yyyy-MM-dd');
    const avail = availabilities[dateStr];
    
    if (avail?.isBlocked) return 'The selected date is blocked for maintenance or a private event.';
    if (avail?.remaining <= 0) return 'The selected date is fully booked.';
    if (formData.date <= today) return 'Please select a future date.';
    if (formData.date > maxDate) return 'Bookings are only open up to 30 days in advance.';

    return '';
  };

  const validateStep2 = () => {
    if (formData.category !== 'individual' && formData.organisationName.trim().length < 2) {
      return 'Please provide your School/Organisation name';
    }
    if (formData.name.trim().length < 3) return 'Full name must be at least 3 characters';
    
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) return 'Please enter a valid 10-digit phone number';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      return 'Please enter a valid email address';
      
    if (formData.guests < 1) return 'At least 1 guest is required';
    if (formData.guests > maxAllowedGuests) return `Maximum allowed guests is ${maxAllowedGuests}`;
    
    return '';
  };

  const nextStep = () => {
    let err = '';
    if (step === 1) err = validateStep1();
    if (step === 2) err = validateStep2();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep((prev) => Math.min(prev + 1, 4) as Step);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const prevStep = () => {
    setError('');
    setStep((prev) => Math.max(prev - 1, 1) as Step);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!formData.rulesAccepted) {
      setError('Please accept the sanctuary guidelines to proceed');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitorName: formData.name,
          phone: formData.phone,
          email: formData.email,
          numberOfGuests: formData.guests,
          bookingDate: formData.date ? format(formData.date, 'yyyy-MM-dd') : '',
          bookingTime: selectedAvail?.slotTime || '16:30',
          category: formData.category,
          organisationName: formData.category === 'individual' ? undefined : formData.organisationName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to confirm booking. Please try again.');
      }

      setStep(4);
      window.scrollTo({ top: 300, behavior: 'smooth' });
    } catch (err: any) {
      console.error('[Booking] Submission error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calendar render functions
  const isDateDisabled = (date: Date) => {
    if (date <= today || date > maxDate) return true;
    const dateStr = format(date, 'yyyy-MM-dd');
    const avail = availabilities[dateStr];
    if (avail?.isBlocked) return true;
    if (avail && avail.remaining <= 0) return true;
    return false;
  };

  const getDayClass = (date: Date) => {
    if (date <= today || date > maxDate) return 'opacity-30';
    const dateStr = format(date, 'yyyy-MM-dd');
    const avail = availabilities[dateStr];
    if (avail?.isBlocked) return 'text-red-500 line-through opacity-50 bg-red-50';
    if (avail && avail.remaining <= 0) return 'text-canopy-dark/20 line-through bg-gray-50';
    if (avail && avail.remaining <= 20) return 'text-amber-600 bg-amber-50 font-bold';
    return '';
  };

  return (
    <>
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-8 md:pt-32 md:pb-12 bg-canopy-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-canopy-dark to-transparent"></div>
        
        <div className="container-wide relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl mx-auto">
            <h1 className="font-display font-bold text-white text-3xl md:text-5xl lg:text-6xl mb-4 tracking-tight">
              Plan Your <span className="text-sanctuary-green inline-block">Visit</span>
            </h1>
            <p className="text-white/60 text-base md:text-lg">
              Book your session to witness the daily gathering of 4,000 free-flying parakeets. 
              Bookings are open up to 30 days in advance.
            </p>
          </motion.div>
        </div>
      </section>

      <main className="py-8 md:py-16 bg-feather-cream/50 min-h-[60vh]">
        <div className="container-wide max-w-3xl">
          
          {/* Step Indicator */}
          {step < 4 && (
            <div className="flex items-center justify-center gap-2 mb-10">
              {steps.map((s, i) => (
                <div key={s.number} className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all shadow-sm",
                    step >= s.number ? "bg-sanctuary-green text-white" : "bg-white border border-canopy-dark/10 text-canopy-dark/30"
                  )}>
                    {step > s.number ? <CheckCircle2 className="w-5 h-5" /> : s.number}
                  </div>
                  <span className={cn(
                    "hidden sm:inline text-xs md:text-sm font-bold uppercase tracking-widest",
                    step >= s.number ? "text-canopy-dark" : "text-canopy-dark/30"
                  )}>
                    {s.label}
                  </span>
                  {i < steps.length - 1 && (
                    <div className={cn("w-6 md:w-12 h-0.5 rounded-full", step > s.number ? "bg-sanctuary-green" : "bg-canopy-dark/10")} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm mb-6 shadow-sm font-medium"
              >
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            {loadingAvail && step === 1 && (
              <div className="absolute inset-0 z-50 bg-feather-cream/50 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl min-h-[400px]">
                <Loader2 className="w-8 h-8 text-sanctuary-green animate-spin mb-4" />
                <p className="text-sm font-bold text-canopy-dark/40 uppercase tracking-widest">Loading Availability...</p>
              </div>
            )}

            <AnimatePresence mode="wait">
              
              {/* ── STEP 1: Date & Time ─────────────────────────────────── */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="bg-white p-6 md:p-10 rounded-3xl shadow-xl shadow-canopy-dark/[0.02] border border-canopy-dark/5 space-y-8"
                >
                  <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                    
                    {/* Calendar Selection */}
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-canopy-dark/40 mb-4">
                        <Calendar className="w-4 h-4 text-sanctuary-green" /> Select Date
                      </h3>
                      
                      <div className="bg-canopy-dark/[0.02] rounded-2xl p-4 border border-canopy-dark/5 flex justify-center">
                        <CalendarUI
                          mode="single"
                          selected={formData.date}
                          onSelect={(d) => updateField('date', d)}
                          disabled={isDateDisabled}
                          modifiersClassNames={{ disabled: 'opacity-30', today: 'font-bold text-sanctuary-green' }}
                          className="font-medium"
                          components={{
                            DayContent: ({ date, activeModifiers }) => {
                              const d = date.getDate();
                              return (
                                <div className={cn("w-full h-full flex items-center justify-center rounded-full transition-colors", getDayClass(date))}>
                                  {d}
                                </div>
                              );
                            }
                          }}
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-3 mt-4 text-[10px] font-bold uppercase tracking-widest text-canopy-dark/40 justify-center">
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-sanctuary-green" /> Available</span>
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-400" /> Filling Fast</span>
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400" /> Full / Blocked</span>
                      </div>
                    </div>

                    {/* Right column: Availability status */}
                    <div className="flex flex-col">
                      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-canopy-dark/40 mb-4">
                        <Clock className="w-4 h-4 text-sanctuary-green" /> Session Details
                      </h3>
                      
                      {formData.date ? (
                        <div className="flex-1 flex flex-col gap-4">
                          {selectedAvail?.isBlocked ? (
                            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center text-red-600 flex-1 flex flex-col items-center justify-center">
                              <Shield className="w-8 h-8 mb-3 opacity-50" />
                              <p className="font-bold">Date Blocked</p>
                              <p className="text-xs opacity-70 mt-1">This date cannot accept bookings.</p>
                            </div>
                          ) : selectedAvail?.remaining! <= 0 ? (
                            <div className="bg-canopy-dark/5 rounded-2xl p-6 text-center text-canopy-dark flex-1 flex flex-col items-center justify-center">
                              <Users className="w-8 h-8 mb-3 opacity-20" />
                              <p className="font-bold">Fully Booked</p>
                              <p className="text-xs opacity-50 mt-1">Please select another date.</p>
                            </div>
                          ) : (
                            <>
                              <div className="bg-sanctuary-green/[0.04] border border-sanctuary-green/20 rounded-2xl p-6">
                                <p className="text-xs font-bold uppercase tracking-widest text-sanctuary-green/60 mb-1">Arrival Time</p>
                                <p className="text-2xl font-bold text-canopy-dark tracking-tight">
                                  {selectedAvail?.slotTime || '16:30'} 
                                  <span className="text-base text-canopy-dark/40 font-medium ml-1">PM</span>
                                </p>
                                <p className="text-xs text-canopy-dark/50 mt-2">
                                  The gathering happens exactly around sunset. Please arrive on time.
                                </p>
                              </div>
                              
                              <div className="bg-white border border-canopy-dark/10 rounded-2xl p-6 flex-1">
                                <p className="text-xs font-bold uppercase tracking-widest text-canopy-dark/40 mb-1">Availability</p>
                                <p className="text-xl font-bold text-canopy-dark mb-2">
                                  {selectedAvail?.remaining} <span className="text-sm text-canopy-dark/50 font-medium">slots left</span>
                                </p>
                                
                                {/* Progress bar */}
                                <div className="h-2 w-full bg-canopy-dark/5 rounded-full overflow-hidden mb-2">
                                  <div 
                                    className={cn("h-full rounded-full transition-all duration-1000", selectedAvail?.remaining! <= 20 ? 'bg-amber-400' : 'bg-sanctuary-green')}
                                    style={{ width: `${((selectedAvail?.maxGuests! - selectedAvail?.remaining!) / selectedAvail?.maxGuests!) * 100}%` }}
                                  />
                                </div>
                                <p className="text-[10px] uppercase font-bold text-canopy-dark/30 tracking-widest">
                                  Max daily capacity: {selectedAvail?.maxGuests}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex-1 border-2 border-dashed border-canopy-dark/10 rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-canopy-dark/[0.02]">
                          <Calendar className="w-10 h-10 text-canopy-dark/15 mb-4" />
                          <p className="text-sm font-bold text-canopy-dark/40">Select a date</p>
                          <p className="text-xs text-canopy-dark/30 mt-2 max-w-[200px]">Choose a green date from the calendar to see session details.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button onClick={nextStep} disabled={!formData.date || selectedAvail?.isBlocked || selectedAvail?.remaining! <= 0}
                    className="w-full bg-sanctuary-green hover:bg-canopy-dark text-white rounded-xl h-14 text-base font-bold shadow-lg shadow-sanctuary-green/20 group"
                  >
                    Continue to Details
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              )}

              {/* ── STEP 2: Details ──────────────────────────────────────── */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="bg-white p-6 md:p-10 rounded-3xl shadow-xl shadow-canopy-dark/[0.02] border border-canopy-dark/5 space-y-8"
                >
                  
                  {/* Category Selection */}
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-canopy-dark/40 mb-4">
                      Booking Type
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'individual', label: 'Individual', icon: User, desc: 'Up to 10 pax' },
                        { id: 'school', label: 'School', icon: GraduationCap, desc: 'Large groups' },
                        { id: 'organisation', label: 'Organisation', icon: Building2, desc: 'Corporate / NGO' }
                      ].map(cat => (
                        <button key={cat.id} type="button" onClick={() => updateField('category', cat.id as any)}
                          className={cn(
                            "p-3 md:p-4 rounded-2xl border text-left transition-all",
                            formData.category === cat.id 
                              ? "border-sanctuary-green bg-sanctuary-green/5 ring-1 ring-sanctuary-green/20" 
                              : "border-canopy-dark/10 hover:border-canopy-dark/30 hover:bg-canopy-dark/[0.02]"
                          )}
                        >
                          <cat.icon className={cn("w-5 h-5 mb-2", formData.category === cat.id ? "text-sanctuary-green" : "text-canopy-dark/40")} />
                          <div className="text-sm md:text-base font-bold text-canopy-dark">{cat.label}</div>
                          <div className="text-[10px] uppercase font-semibold text-canopy-dark/40 mt-1">{cat.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.category !== 'individual' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className="flex items-center gap-2 text-sm font-bold text-canopy-dark mb-2">
                        {formData.category === 'school' ? <GraduationCap className="w-4 h-4 text-sanctuary-green" /> : <Building2 className="w-4 h-4 text-sanctuary-green" />}
                        {formData.category === 'school' ? 'School Name' : 'Organisation Name'}
                      </label>
                      <Input
                        placeholder="Enter full name of institution"
                        value={formData.organisationName}
                        onChange={(e) => updateField('organisationName', e.target.value)}
                        className="rounded-xl h-12 border-canopy-dark/10 bg-canopy-dark/[0.02] focus:bg-white"
                      />
                    </motion.div>
                  )}

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-canopy-dark mb-2">
                        <User className="w-4 h-4 text-sanctuary-green" /> Lead Name
                      </label>
                      <Input placeholder="Enter your full name" value={formData.name} onChange={(e) => updateField('name', e.target.value)}
                        className="rounded-xl h-12 border-canopy-dark/10 bg-canopy-dark/[0.02] focus:bg-white" />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-canopy-dark mb-2">
                        <Phone className="w-4 h-4 text-sanctuary-green" /> Phone Number
                      </label>
                      <Input type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)}
                        className="rounded-xl h-12 border-canopy-dark/10 bg-canopy-dark/[0.02] focus:bg-white" />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-canopy-dark mb-2">
                        <Mail className="w-4 h-4 text-sanctuary-green" /> Email <span className="text-canopy-dark/30 font-normal">(optional)</span>
                      </label>
                      <Input type="email" placeholder="your@email.com" value={formData.email} onChange={(e) => updateField('email', e.target.value)}
                        className="rounded-xl h-12 border-canopy-dark/10 bg-canopy-dark/[0.02] focus:bg-white" />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-canopy-dark mb-2">
                        <Users className="w-4 h-4 text-sanctuary-green" /> Number of Guests
                      </label>
                      <div className="flex items-center justify-between bg-canopy-dark/[0.02] border border-canopy-dark/10 rounded-xl h-12 px-2 focus-within:ring-2 ring-sanctuary-green/30 ring-offset-2">
                        <button type="button" onClick={() => updateField('guests', Math.max(1, formData.guests - 1))}
                          className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-canopy-dark/5 transition-colors font-bold text-lg text-canopy-dark"
                        >−</button>
                        <span className="font-bold text-lg text-canopy-dark">{formData.guests}</span>
                        <button type="button" onClick={() => updateField('guests', Math.min(maxAllowedGuests, formData.guests + 1))}
                          className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-canopy-dark/5 transition-colors font-bold text-lg text-canopy-dark"
                        >+</button>
                      </div>
                      <div className="flex justify-between mt-2 px-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-sanctuary-green">{selectedAvail?.remaining} slots available</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-canopy-dark/30">Max {maxAllowedGuests}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-canopy-dark/5">
                    <Button onClick={prevStep} variant="outline" className="rounded-xl h-14 md:w-32 font-bold text-canopy-dark/60">Back</Button>
                    <Button onClick={nextStep} className="flex-1 bg-sanctuary-green hover:bg-canopy-dark text-white rounded-xl h-14 text-base font-bold shadow-lg shadow-sanctuary-green/20 group">
                      Review Booking <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3: Review ───────────────────────────────────────── */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  
                  <div className="bg-white p-8 rounded-3xl shadow-xl shadow-canopy-dark/[0.02] border border-canopy-dark/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                      <Bird className="w-48 h-48 -rotate-12" />
                    </div>
                    
                    <h3 className="font-display font-bold text-2xl text-canopy-dark flex items-center gap-2 mb-8">
                      Booking Summary
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6 gap-x-4 mb-8">
                      {[
                        { label: 'Date', value: formData.date ? format(formData.date, 'EEEE, MMM do') : '' },
                        { label: 'Arrival Time', value: selectedAvail?.slotTime || '16:30' },
                        { label: 'Guest Type', value: formData.category.charAt(0).toUpperCase() + formData.category.slice(1) },
                        { label: 'Lead Name', value: formData.name },
                        { label: 'Total Guests', value: formData.guests },
                        { label: 'Contact', value: formData.phone },
                      ].map((item, i) => (
                        <div key={i}>
                          <span className="block text-[10px] font-bold uppercase tracking-widest text-canopy-dark/40 mb-1">{item.label}</span>
                          <span className="block text-sm font-bold text-canopy-dark">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-sanctuary-green/5 border border-sanctuary-green/20 rounded-2xl p-4 flex gap-3 text-sm text-canopy-dark">
                      <Info className="w-5 h-5 text-sanctuary-green shrink-0" />
                      <p>Access to the sanctuary is entirely <strong className="text-sanctuary-green font-bold">free of charge</strong>. All donations go directly towards feeding the parakeets.</p>
                    </div>
                  </div>

                  {/* Guidelines */}
                  <div className="bg-white p-8 rounded-3xl shadow-xl shadow-canopy-dark/[0.02] border border-canopy-dark/5">
                    <h3 className="font-bold text-canopy-dark flex items-center gap-2 mb-6">
                      <Shield className="w-5 h-5 text-amber-500" /> Sanctuary Rules
                    </h3>
                    <ul className="space-y-3 ms-1 mb-8">
                      {[
                        'Maintain absolute silence during feeding.',
                        'No flash photography — it causes severe distress.',
                        'Never touch, chase, or attempt to feed the birds yourself.',
                        'Children must be strictly supervised.',
                      ].map((rule, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 text-sanctuary-green shrink-0" />
                          <span className="text-sm font-medium text-canopy-dark/70 leading-snug">{rule}</span>
                        </li>
                      ))}
                    </ul>

                    <label className="flex items-start gap-3 p-4 bg-canopy-dark/[0.02] border border-canopy-dark/10 rounded-2xl cursor-pointer group hover:bg-canopy-dark/[0.04] transition-colors">
                      <Checkbox id="rules" checked={formData.rulesAccepted} onCheckedChange={(c) => updateField('rulesAccepted', c === true)} className="mt-1 flex-shrink-0" />
                      <span className="text-sm font-bold text-canopy-dark leading-snug">
                        I pledge to respect the sanctuary rules and ensure all guests in my group comply with them.
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={prevStep} variant="outline" className="rounded-xl h-14 md:w-32 font-bold text-canopy-dark/60">Back</Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !formData.rulesAccepted}
                      className="flex-1 bg-sanctuary-green hover:bg-canopy-dark text-white rounded-xl h-14 text-base font-bold shadow-lg shadow-sanctuary-green/20"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Confirming...</>
                      ) : (
                        <>Confirm Booking</>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 4: Confirmation ─────────────────────────────────── */}
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-canopy-dark/[0.02] border border-canopy-dark/5 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15, delay: 0.2 }}
                    className="w-24 h-24 bg-sanctuary-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12 text-sanctuary-green" />
                  </motion.div>

                  <h2 className="font-display font-bold text-3xl md:text-4xl text-canopy-dark mb-4 tracking-tight">
                    Booking Confirmed!
                  </h2>
                  <p className="text-canopy-dark/60 mb-8 max-w-sm mx-auto text-sm md:text-base leading-relaxed">
                    Thank you, {formData.name}. We look forward to welcoming {formData.guests > 1 ? `your group of ${formData.guests}` : 'you'} to witness the daily gathering.
                  </p>

                  <div className="bg-canopy-dark/[0.02] border border-canopy-dark/5 p-6 rounded-2xl max-w-sm mx-auto mb-8 text-left space-y-4">
                    <div className="flex justify-between items-center border-b border-canopy-dark/5 pb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-canopy-dark/40">Date</span>
                      <span className="font-bold text-canopy-dark">{formData.date && format(formData.date, 'MMM do, yyyy')}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-canopy-dark/5 pb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-canopy-dark/40">Time</span>
                      <span className="font-bold text-sanctuary-green">{selectedAvail?.slotTime} PM</span>
                    </div>
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-canopy-dark/40">Guests</span>
                      <span className="font-bold text-canopy-dark">{formData.guests}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 max-w-sm mx-auto mb-10">
                    <Button asChild className="bg-sanctuary-green hover:bg-canopy-dark text-white rounded-xl h-12 font-bold group">
                      <a href={process.env.NEXT_PUBLIC_MAP_LINK || "https://maps.app.goo.gl/346Q34yV95xSbdg27"} target="_blank" rel="noopener noreferrer">
                        <MapPin className="w-4 h-4 mr-2" /> Get Directions
                        <ExternalLink className="w-4 h-4 ml-auto opacity-50 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </Button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button asChild variant="outline" className="rounded-xl font-bold h-11 text-canopy-dark/60">
                      <Link href="/">Return Home</Link>
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
