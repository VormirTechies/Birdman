'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { FormField } from '@/components/molecules/FormField';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loading } from '@/components/atoms/Loading';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { BookingFormData } from '@/types';

export default function BookingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<BookingFormData>({
    visitorName: '',
    phone: '',
    email: '',
    numberOfVisitors: 1,
    date: '',
    time: '',
    rulesAccepted: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BookingFormData, string>> = {};

    if (formData.visitorName.length < 2) {
      newErrors.visitorName = 'Name must be at least 2 characters';
    }

    if (formData.phone.length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (formData.numberOfVisitors < 1 || formData.numberOfVisitors > 10) {
      newErrors.numberOfVisitors = 'Number of visitors must be between 1 and 10';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    if (!formData.time) {
      newErrors.time = 'Please select a time';
    }

    if (!formData.rulesAccepted) {
      setError('You must accept the sanctuary rules to proceed');
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Mock API call - replace with actual endpoint
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // In a real implementation:
      // const response = await fetch('/api/bookings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      // if (!response.ok) throw new Error('Booking failed');

      router.push('/book/confirmation');
    } catch (err) {
      setError('Failed to create booking. Please try again.');
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof BookingFormData>(
    field: K,
    value: BookingFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-parchment py-24 md:py-32">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="font-serif font-bold text-4xl md:text-5xl text-deep-night mb-4">
              Book Your Visit
            </h1>
            <p className="text-deep-night/70 text-lg">
              Experience the daily miracle of thousands of parakeets
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormField
                label="Visitor Name"
                name="visitorName"
                value={formData.visitorName}
                onChange={(value) => updateField('visitorName', value as string)}
                error={errors.visitorName}
                placeholder="Enter your full name"
                required
              />

              <FormField
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(value) => updateField('phone', value as string)}
                error={errors.phone}
                placeholder="+91 98765 43210"
                required
              />

              <FormField
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={(value) => updateField('email', value as string)}
                error={errors.email}
                placeholder="your@email.com (optional)"
              />

              <FormField
                label="Number of Visitors"
                name="numberOfVisitors"
                type="number"
                value={formData.numberOfVisitors}
                onChange={(value) => updateField('numberOfVisitors', value as number)}
                error={errors.numberOfVisitors}
                min={1}
                max={10}
                required
              />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  label="Visit Date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={(value) => updateField('date', value as string)}
                  error={errors.date}
                  required
                />

                <FormField
                  label="Preferred Time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={(value) => updateField('time', value as string)}
                  error={errors.time}
                  required
                />
              </div>

              {/* Sanctuary Rules */}
              <div className="bg-mist-white p-6 rounded-xl space-y-3">
                <h3 className="font-serif font-bold text-lg text-deep-night">
                  Sanctuary Guidelines
                </h3>
                <ul className="text-sm text-deep-night/80 space-y-2 list-disc list-inside">
                  <li>Maintain silence during feeding sessions</li>
                  <li>No flash photography</li>
                  <li>Do not touch or chase the birds</li>
                  <li>Follow guide instructions at all times</li>
                  <li>Children must be supervised</li>
                </ul>

                <label className="flex items-start gap-3 cursor-pointer pt-3">
                  <input
                    type="checkbox"
                    checked={formData.rulesAccepted}
                    onChange={(e) => updateField('rulesAccepted', e.target.checked)}
                    className="mt-1 w-4 h-4 text-parakeet-green focus:ring-parakeet-green border-chennai-earth rounded"
                  />
                  <span className="text-sm text-deep-night">
                    I accept and will follow the sanctuary guidelines
                  </span>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-error/10 border border-error rounded-lg text-error">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loading size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </Button>
            </form>
          </Card>

          {/* Help Text */}
          <div className="mt-8 text-center text-sm text-deep-night/60">
            <p>
              Need help? Contact us at{' '}
              <a
                href="tel:+919876543210"
                className="text-parakeet-green hover:underline"
              >
                +91 98765 43210
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
