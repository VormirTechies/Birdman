'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { User, Baby, Calendar as CalendarIcon, Clock, Mail, Phone as PhoneIcon, AlertCircle, CheckCircle2, Loader2, Crown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { GuestCounter } from './GuestCounter';
import { DatePicker } from './DatePicker';
import { TimePicker } from './TimePicker';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InstantBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface FormData {
  visitorName: string;
  phone: string;
  email: string;
  adults: number;
  children: number;
  bookingDate: Date;
  bookingTime: string;
}

interface FormErrors {
  visitorName?: string;
  phone?: string;
  email?: string;
  adults?: string;
  children?: string;
  general?: string;
}

interface VisitorLookupResult {
  id: string;
  name: string;
  isVip: boolean;
  totalVisits: number;
  lastVisitDate: string | null;
}

export function InstantBookingModal({
  open,
  onOpenChange,
  onSuccess,
}: InstantBookingModalProps) {
  const [formData, setFormData] = useState<FormData>({
    visitorName: '',
    phone: '',
    email: '',
    adults: 1,
    children: 0,
    bookingDate: new Date(),
    bookingTime: '16:30:00',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string>('');
  const [visitorMatch, setVisitorMatch] = useState<VisitorLookupResult | null>(null);
  const lookupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      // Delay reset to avoid flickering during close animation
      setTimeout(() => {
        setFormData({
          visitorName: '',
          phone: '',
          email: '',
          adults: 1,
          children: 0,
          bookingDate: new Date(),
          bookingTime: '16:30:00',
        });
        setErrors({});
        setShowSuccess(false);
        setBookingId('');
        setVisitorMatch(null);
      }, 200);
    }
  }, [open]);

  // Debounced visitor lookup on phone/email change
  const triggerLookup = (phone: string, email: string) => {
    if (lookupTimeout.current) clearTimeout(lookupTimeout.current);
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10 && !email.includes('@')) {
      setVisitorMatch(null);
      return;
    }
    lookupTimeout.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (cleaned.length >= 10) params.set('phone', phone.trim());
        if (email.includes('@')) params.set('email', email.trim());
        const res = await fetch(`/api/admin/visitors/lookup?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.visitor) {
          setVisitorMatch(data.visitor);
          // Auto-populate name if empty
          setFormData(prev => ({
            ...prev,
            visitorName: prev.visitorName.trim() === '' ? data.visitor.name : prev.visitorName,
          }));
        } else {
          setVisitorMatch(null);
        }
      } catch {
        // silently ignore lookup errors
      }
    }, 300);
  };

  const totalGuests = formData.adults + formData.children;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Visitor Name validation
    if (!formData.visitorName.trim()) {
      newErrors.visitorName = 'Name is required';
    } else if (formData.visitorName.trim().length < 2) {
      newErrors.visitorName = 'Name must be at least 2 characters';
    } else if (formData.visitorName.length > 100) {
      newErrors.visitorName = 'Name must be less than 100 characters';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.replace(/\D/g, '').length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits';
    }

    // Email validation (optional, but if provided must be valid)
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Adults validation
    if (formData.adults < 1 || formData.adults > 10) {
      newErrors.adults = 'Adults must be between 1 and 10';
    }

    // Children validation
    if (formData.children < 0 || formData.children > 10) {
      newErrors.children = 'Children must be between 0 and 10';
    }

    // Total guests validation
    if (totalGuests > 10) {
      newErrors.general = 'Total number of guests cannot exceed 10';
    } else if (totalGuests < 1) {
      newErrors.general = 'At least one guest is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitorName: formData.visitorName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim() || undefined,
          adults: formData.adults,
          children: formData.children,
          bookingDate: format(formData.bookingDate, 'yyyy-MM-dd'),
          bookingTime: formData.bookingTime,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking');
      }

      // Show success state
      setBookingId(data.booking.id);
      setShowSuccess(true);

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Show success toast
      toast.success('Booking created successfully!', {
        description: `Booking ID: ${data.booking.id.slice(0, 8)}... for ${formData.visitorName}`,
      });

      // Auto-close modal after 2 seconds
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Failed to create booking', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookAnother = () => {
    setFormData({
      visitorName: '',
      phone: '',
      email: '',
      adults: formData.adults, // Keep same guest count
      children: formData.children,
      bookingDate: new Date(),
      bookingTime: '16:30:00',
    });
    setErrors({});
    setShowSuccess(false);
    setBookingId('');
  };

  if (showSuccess) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-white shadow-xl border-0">
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <div className="w-16 h-16 rounded-full bg-[#E8F5E9] flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-[#2E7D32]" />
            </div>
            <h3 className="text-xl font-bold text-[#212121] mb-2" style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}>
              Booking Created!
            </h3>
            <p className="text-sm text-[#616161] text-center mb-4">
              Booking for <span className="font-semibold">{formData.visitorName}</span> has been successfully created.
            </p>
            <div className="bg-[#F5F5F5] rounded-xl p-4 w-full mb-6">
              <div className="text-xs text-[#616161] mb-1">Booking ID</div>
              <div className="text-sm font-mono text-[#212121] break-all">{bookingId}</div>
            </div>
            <div className="flex gap-3 w-full">
              <Button
                type="button"
                onClick={handleBookAnother}
                variant="outline"
                className="flex-1 h-12"
              >
                Book Another
              </Button>
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-12 bg-[#2E7D32] hover:bg-[#1B5E20]"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-xl border-0">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#212121]" style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}>
            New Booking
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* General Error */}
          {errors.general && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}

          {/* Returning visitor alert */}
          {visitorMatch && (
            <div
              className="flex items-start gap-3 p-3 rounded-lg border"
              style={visitorMatch.isVip
                ? { backgroundColor: '#FFF8EC', borderColor: '#FF8C00' }
                : { backgroundColor: '#EFF6FF', borderColor: '#93C5FD' }
              }
            >
              {visitorMatch.isVip
                ? <Crown className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#FF8C00' }} />
                : <User className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
              }
              <p className="text-sm font-medium" style={{ color: visitorMatch.isVip ? '#B45309' : '#1D4ED8' }}>
                {visitorMatch.isVip
                  ? `⭐ Returning VIP — ${visitorMatch.name} — ${visitorMatch.totalVisits} visit${visitorMatch.totalVisits !== 1 ? 's' : ''}`
                  : `↩ Returning visitor — ${visitorMatch.name} — ${visitorMatch.totalVisits} visit${visitorMatch.totalVisits !== 1 ? 's' : ''}`
                }
              </p>
            </div>
          )}

          {/* Visitor Information */}
          <div className="space-y-4">

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="visitorName" className="text-sm font-medium text-[#212121]">
                Visitor Name *
              </Label>
              <Input
                id="visitorName"
                type="text"
                value={formData.visitorName}
                onChange={(e) => {
                  setFormData({ ...formData, visitorName: e.target.value });
                  if (errors.visitorName) {
                    setErrors({ ...errors, visitorName: undefined });
                  }
                }}
                placeholder="Enter visitor name"
                className={cn(
                  'h-11 border',
                  errors.visitorName && 'border-red-500 focus-visible:ring-red-500'
                )}
                disabled={isSubmitting}
              />
              {errors.visitorName && (
                <p className="text-xs text-red-600">{errors.visitorName}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-[#212121]">
                Phone Number *
              </Label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#616161]" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const phone = e.target.value;
                    setFormData(prev => ({ ...prev, phone }));
                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                    triggerLookup(phone, formData.email);
                  }}
                  placeholder="Enter phone number"
                  className={cn(
                    'h-11 pl-10 border',
                    errors.phone && 'border-red-500 focus-visible:ring-red-500'
                  )}
                  disabled={isSubmitting}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Email (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-[#212121]">
                Email <span className="text-[#9E9E9E]">(Optional)</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#616161]" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    const email = e.target.value;
                    setFormData(prev => ({ ...prev, email }));
                    if (errors.email) setErrors({ ...errors, email: undefined });
                    triggerLookup(formData.phone, email);
                  }}
                  placeholder="Enter email address (optional)"
                  className={cn(
                    'h-11 pl-10 border',
                    errors.email && 'border-red-500 focus-visible:ring-red-500'
                  )}
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Guest Count */}
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h4 className="text-sm font-semibold text-[#212121] uppercase tracking-wide" style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}>
                Number of Guests
              </h4>
              <span className={cn(
                'text-sm font-medium',
                totalGuests > 10 ? 'text-red-600' : 'text-[#616161]'
              )}>
                Total: {totalGuests} / 10
              </span>
            </div>

            <div className="space-y-3">
              <GuestCounter
                label="Adults (13+)"
                value={formData.adults}
                onChange={(value) => {
                  setFormData({ ...formData, adults: value });
                  if (errors.adults || errors.general) {
                    setErrors({ ...errors, adults: undefined, general: undefined });
                  }
                }}
                min={1}
                max={10}
                icon={<User className="w-4 h-4" />}
                disabled={isSubmitting}
              />
              <GuestCounter
                label="Children (0-12)"
                value={formData.children}
                onChange={(value) => {
                  setFormData({ ...formData, children: value });
                  if (errors.children || errors.general) {
                    setErrors({ ...errors, children: undefined, general: undefined });
                  }
                }}
                min={0}
                max={10}
                icon={<Baby className="w-4 h-4" />}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-[#212121] uppercase tracking-wide" style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}>
              Visit Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#212121]">
                  Booking Date *
                </Label>
                <DatePicker
                  value={formData.bookingDate}
                  onChange={(date) => setFormData({ ...formData, bookingDate: date })}
                  showText={true}
                  outline={true}
                  disabled={isSubmitting ? () => true : undefined}
                />
              </div>

              {/* Time */}
              <div>
                <TimePicker
                  value={formData.bookingTime}
                  onChange={(value) => setFormData({ ...formData, bookingTime: value })}
                  label="Session Time *"
                  description="Default: 4:30 PM (Session start)"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1 h-12"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || totalGuests > 10}
              className="flex-1 h-12 bg-[#2E7D32] hover:bg-[#1B5E20] text-white disabled:bg-[#E0E0E0] disabled:text-[#9E9E9E]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Booking'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
