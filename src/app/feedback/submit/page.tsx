'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { FormField } from '@/components/molecules/FormField';
import { StarRating } from '@/components/atoms/StarRating';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loading } from '@/components/atoms/Loading';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { FeedbackFormData } from '@/types';

export default function SubmitFeedbackPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FeedbackFormData>({
    name: '',
    rating: 0,
    message: '',
    visitDate: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FeedbackFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FeedbackFormData, string>> = {};

    if (formData.rating === 0) {
      setError('Please select a rating');
      return false;
    }

    if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    if (!formData.visitDate) {
      newErrors.visitDate = 'Please select your visit date';
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
      // const response = await fetch('/api/feedback', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData),
      // });
      // if (!response.ok) throw new Error('Feedback submission failed');

      setSubmitSuccess(true);
      
      // Redirect after showing success message
      setTimeout(() => {
        router.push('/feedback');
      }, 2000);
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
      setIsSubmitting(false);
    }
  };

  const updateField = <K extends keyof FeedbackFormData>(
    field: K,
    value: FeedbackFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    if (error) setError(null);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-parchment py-24 md:py-32">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="font-serif font-bold text-4xl md:text-5xl text-deep-night mb-4">
              Share Your Experience
            </h1>
            <p className="text-deep-night/70 text-lg">
              Help others discover the magic of the Birdman Sanctuary
            </p>
          </div>

          <Card className="p-8">
            {submitSuccess ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-success/10 rounded-full mb-4">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </div>
                <h2 className="font-serif font-bold text-2xl text-deep-night mb-2">
                  Thank You!
                </h2>
                <p className="text-deep-night/70">
                  Your feedback has been submitted successfully.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <FormField
                  label="Your Name (Optional)"
                  name="name"
                  value={formData.name}
                  onChange={(value) => updateField('name', value as string)}
                  placeholder="Leave blank for anonymous feedback"
                />

                {/* Rating */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-deep-night">
                    Rating <span className="text-error" aria-label="required">*</span>
                  </Label>
                  <div className="flex items-center gap-4">
                    <StarRating
                      rating={formData.rating}
                      size="lg"
                      interactive
                      onChange={(rating) => updateField('rating', rating)}
                    />
                    {formData.rating > 0 && (
                      <span className="text-sm text-deep-night/70">
                        {formData.rating} out of 5
                      </span>
                    )}
                  </div>
                </div>

                <FormField
                  label="Visit Date"
                  name="visitDate"
                  type="date"
                  value={formData.visitDate}
                  onChange={(value) => updateField('visitDate', value as string)}
                  error={errors.visitDate}
                  required
                />

                <FormField
                  label="Your Feedback"
                  name="message"
                  type="textarea"
                  value={formData.message}
                  onChange={(value) => updateField('message', value as string)}
                  error={errors.message}
                  placeholder="Share your experience at the sanctuary..."
                  required
                />

                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-3 p-4 bg-error/10 border border-error rounded-lg text-error">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loading size="sm" className="mr-2" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Feedback'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => router.back()}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </Card>

          {/* Note */}
          {!submitSuccess && (
            <div className="mt-8 text-center text-sm text-deep-night/60">
              <p>
                Your feedback helps us improve the visitor experience and supports conservation efforts.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
