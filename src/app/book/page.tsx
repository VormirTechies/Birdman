'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Bird,
  Sunset,
  Shield,
  AlertCircle,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarUI } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

/* ════════════════════════════════════════════════════════════════════════════
   BOOKING PAGE — Multi-Step Wizard
   ════════════════════════════════════════════════════════════════════════════ */

type Step = 1 | 2 | 3 | 4;

interface BookingData {
  date: Date | undefined;
  session: 'evening' | '';
  name: string;
  phone: string;
  email: string;
  guests: number;
  rulesAccepted: boolean;
}

const steps = [
  { number: 1, label: 'Date & Time' },
  { number: 2, label: 'Your Details' },
  { number: 3, label: 'Review' },
];

export default function BookingPage() {
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<BookingData>({
    date: undefined,
    session: 'evening',
    name: '',
    phone: '',
    email: '',
    guests: 1,
    rulesAccepted: false,
  });

  const updateField = <K extends keyof BookingData>(
    key: K,
    value: BookingData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const validateStep1 = () => {
    if (!formData.date) return 'Please select a date';
    if (!formData.session) return 'Please choose a session';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (formData.date <= today) return 'Please select a future date';
    return '';
  };

  const validateStep2 = () => {
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (formData.name.trim().length < 3) return 'Full name must be at least 3 characters';
    if (cleanPhone.length !== 10) return 'Please enter a valid 10-digit phone number';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      return 'Please enter a valid email';
    if (formData.guests < 1 || formData.guests > 10)
      return 'Guests must be between 1 and 10';
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
  };

  const prevStep = () => {
    setError('');
    setStep((prev) => Math.max(prev - 1, 1) as Step);
  };

  const handleSubmit = async () => {
    if (!formData.rulesAccepted) {
      setError('Please accept the sanctuary guidelines');
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
          bookingTime: '04:30 PM', // Hardcoded as per session requirement for now
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to confirm booking. Please try again.');
      }

      setStep(4);
    } catch (err: any) {
      console.error('[Booking] Submission error:', err);
      setError(err.message || 'An unexpected error occurred. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-20 bg-canopy-dark">
        <div className="container-wide py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="font-display font-bold text-white text-3xl md:text-4xl lg:text-5xl mb-3">
              Book Your{' '}
              <span className="text-golden-hour">Visit</span>
            </h1>
            <p className="text-white/60 text-base md:text-lg max-w-lg mx-auto">
              Experience the daily miracle of 4,000 parakeets
            </p>
          </motion.div>
        </div>
      </section>

      <main className="py-10 md:py-16 bg-feather-cream">
        <div className="container-wide max-w-2xl">
          {/* Step Indicator */}
          {step < 4 && (
            <div className="flex items-center justify-center gap-2 mb-10">
              {steps.map((s, i) => (
                <div key={s.number} className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      step >= s.number
                        ? 'bg-sanctuary-green text-white'
                        : 'bg-canopy-dark/10 text-canopy-dark/40'
                    }`}
                  >
                    {step > s.number ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      s.number
                    )}
                  </div>
                  <span
                    className={`hidden sm:inline text-sm font-medium ${
                      step >= s.number
                        ? 'text-canopy-dark'
                        : 'text-canopy-dark/40'
                    }`}
                  >
                    {s.label}
                  </span>
                  {i < steps.length - 1 && (
                    <div
                      className={`w-8 md:w-12 h-px ${
                        step > s.number
                          ? 'bg-sanctuary-green'
                          : 'bg-canopy-dark/10'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm mb-6"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* ── STEP 1: Date & Time ─────────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="bg-white p-8 rounded-2xl shadow-card space-y-8"
              >
                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-12 rounded-xl border-canopy-dark/10",
                          !formData.date && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4 text-sanctuary-green" />
                        {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarUI
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => updateField('date', date)}
                        disabled={(date) => date <= new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-canopy-dark mb-3">
                    <Clock className="w-4 h-4 text-sanctuary-green" />
                    Choose Session
                  </label>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      {
                        value: 'evening' as const,
                        icon: Sunset,
                        label: 'Evening',
                        time: '4:30 – 6:30 PM',
                        desc: 'The only gathering session available',
                      },
                    ].map((session) => (
                      <div
                        key={session.value}
                        className="p-5 rounded-2xl border-2 border-sanctuary-green bg-morning-mist shadow-glow-green text-left flex items-start gap-4"
                      >
                        <session.icon
                          className="w-8 h-8 text-sanctuary-green shrink-0 mt-1"
                        />
                        <div>
                          <div className="font-semibold text-canopy-dark text-lg">
                            {session.label} Session
                          </div>
                          <div className="text-base text-sunset-amber font-bold mb-1">
                            {session.time}
                          </div>
                          <div className="text-sm text-canopy-dark/60">
                            {session.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={nextStep}
                  className="w-full bg-sanctuary-green hover:bg-canopy-dark text-white rounded-xl h-12 text-base gap-2"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {/* ── STEP 2: Details ──────────────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="bg-white p-8 rounded-2xl shadow-card space-y-6"
              >
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-canopy-dark mb-2">
                    <User className="w-4 h-4 text-sanctuary-green" />
                    Full Name
                  </label>
                  <Input
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="rounded-xl h-11 border-canopy-dark/10"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-canopy-dark mb-2">
                    <Phone className="w-4 h-4 text-sanctuary-green" />
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className="rounded-xl h-11 border-canopy-dark/10"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-canopy-dark mb-2">
                    <Mail className="w-4 h-4 text-sanctuary-green" />
                    Email <span className="text-canopy-dark/30 font-normal">(optional)</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className="rounded-xl h-11 border-canopy-dark/10"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-canopy-dark mb-2">
                    <Users className="w-4 h-4 text-sanctuary-green" />
                    Number of Guests
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        updateField('guests', Math.max(1, formData.guests - 1))
                      }
                      className="w-10 h-10 rounded-xl border border-canopy-dark/10 flex items-center justify-center hover:bg-morning-mist transition-colors text-lg"
                    >
                      −
                    </button>
                    <span className="w-10 text-center font-semibold text-lg text-canopy-dark">
                      {formData.guests}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateField(
                          'guests',
                          Math.min(10, formData.guests + 1)
                        )
                      }
                      className="w-10 h-10 rounded-xl border border-canopy-dark/10 flex items-center justify-center hover:bg-morning-mist transition-colors text-lg"
                    >
                      +
                    </button>
                    <span className="text-sm text-canopy-dark/40 ml-2">
                      Max 10 per booking
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={prevStep}
                    variant="outline"
                    className="rounded-xl h-12 px-6 gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button
                    onClick={nextStep}
                    className="flex-1 bg-sanctuary-green hover:bg-canopy-dark text-white rounded-xl h-12 text-base gap-2"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Review ───────────────────────────────────────── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                {/* Summary Card */}
                <div className="bg-white p-8 rounded-2xl shadow-card space-y-5">
                  <h3 className="font-display font-bold text-xl text-canopy-dark flex items-center gap-2">
                    <Bird className="w-5 h-5 text-sanctuary-green" />
                    Booking Summary
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Date', value: formData.date ? format(formData.date, 'PPPP') : '' },
                      { label: 'Session', value: '🌇 Evening (4:30 – 6:30 PM)' },
                      { label: 'Name', value: formData.name },
                      { label: 'Phone', value: formData.phone },
                      { label: 'Email', value: formData.email || 'Not provided' },
                      { label: 'Guests', value: `${formData.guests} ${formData.guests === 1 ? 'person' : 'people'}` },
                    ].map((item) => (
                      <div key={item.label}>
                        <span className="text-xs text-canopy-dark/40 uppercase tracking-wider">
                          {item.label}
                        </span>
                        <div className="text-sm font-medium text-canopy-dark mt-0.5">
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-center text-sm text-canopy-dark/40 bg-morning-mist px-4 py-2 rounded-xl">
                    Entry is <strong className="text-sanctuary-green">free</strong>. No payment required.
                  </div>
                </div>

                {/* Guidelines */}
                <div className="bg-white p-6 rounded-2xl shadow-card">
                  <h3 className="font-display font-bold text-base text-canopy-dark flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-golden-hour" />
                    Sanctuary Guidelines
                  </h3>
                  <ul className="space-y-2 text-sm text-canopy-dark/60">
                    {[
                      'Maintain silence during feeding sessions',
                      'No flash photography — it scares the birds',
                      'Do not touch, chase, or feed the birds yourself',
                      'Follow the guide\'s instructions at all times',
                      'Children must be accompanied by an adult',
                    ].map((rule) => (
                      <li key={rule} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-sanctuary-green shrink-0 mt-0.5" />
                        {rule}
                      </li>
                    ))}
                  </ul>

                  <label className="flex items-center gap-3 mt-5 pt-4 border-t border-canopy-dark/5 cursor-pointer group">
                    <Checkbox
                      id="rules"
                      checked={formData.rulesAccepted}
                      onCheckedChange={(checked) => updateField('rulesAccepted', checked === true)}
                    />
                    <span className="text-sm text-canopy-dark select-none group-hover:text-canopy-dark/80 transition-colors">
                      I accept and will follow the sanctuary guidelines
                    </span>
                  </label>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={prevStep}
                    variant="outline"
                    className="rounded-xl h-12 px-6 gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-golden-hour hover:bg-sunset-amber text-canopy-dark rounded-xl h-12 text-base font-semibold gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Bird className="w-5 h-5 animate-bounce" />
                        Confirming...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Confirm Booking
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: Confirmation ─────────────────────────────────── */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-10 rounded-2xl shadow-card text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                >
                  <div className="w-20 h-20 bg-sanctuary-green/10 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 className="w-10 h-10 text-sanctuary-green" />
                  </div>
                </motion.div>

                <h2 className="font-display font-bold text-2xl md:text-3xl text-canopy-dark mb-2">
                  Booking Confirmed!
                </h2>
                <p className="text-canopy-dark/60 mb-6 max-w-md mx-auto">
                  Your visit to the Birdman of Chennai sanctuary has been
                  confirmed. We&apos;ll see you soon!
                </p>

                {/* Map Section */}
                <div className="mb-8 overflow-hidden rounded-2xl border border-canopy-dark/5 shadow-inner">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3886.1364560756776!2d80.26628887588147!3d13.076882212351234!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a52661ab209a803%3A0x6fd7d455d3f23a7e!2s2%2F3%2C%20Iyya%20Mudali%20St%2C%20Adikesavarpuram%2C%20Chintadripet%2C%20Chennai%2C%20Tamil%20Nadu%20600002!5e0!3m2!1sen!2sin!4v1711674374321!5m2!1sen!2sin"
                    className="w-full h-48 sm:h-64 border-0"
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>

                <div className="bg-morning-mist p-6 rounded-2xl mb-8 text-left max-w-sm mx-auto shadow-sm">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-canopy-dark/50">Date</span>
                      <span className="font-medium text-canopy-dark">
                        {formData.date && format(formData.date, 'PPP')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-canopy-dark/50">Session</span>
                      <span className="font-medium text-canopy-dark">
                        Evening
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-canopy-dark/50">Guests</span>
                      <span className="font-medium text-canopy-dark">
                        {formData.guests}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 max-w-sm mx-auto mb-10">
                  <Button asChild className="bg-sanctuary-green hover:bg-canopy-dark text-white rounded-xl h-12 gap-2 shadow-lg shadow-sanctuary-green/20">
                    <a
                      href={process.env.NEXT_PUBLIC_MAP_LINK}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapPin className="w-5 h-5" />
                      Open Maps for Navigation
                      <ExternalLink className="w-4 h-4 ml-auto opacity-50" />
                    </a>
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center border-t border-canopy-dark/5 pt-8">
                  <Button asChild variant="outline" className="rounded-full gap-2">
                    <Link href="/">
                      Back to Home
                    </Link>
                  </Button>
                  <Button asChild className="bg-sanctuary-green hover:bg-canopy-dark text-white rounded-full gap-2">
                    <Link href="/gallery">
                      <Bird className="w-4 h-4" /> Explore Gallery
                    </Link>
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
