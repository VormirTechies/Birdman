'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  MessageSquare,
  Send,
  CheckCircle2,
  Bird,
  Quote,
} from 'lucide-react';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Counter } from '@/components/ui/counter';
import {
  AnimatedSection,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/animated-section';

/* ════════════════════════════════════════════════════════════════════════════
   FEEDBACK PAGE — Testimonial Wall + Submit Form
   ════════════════════════════════════════════════════════════════════════════ */

const mockFeedback = [
  { id: '1', name: 'Priya Sundaram', rating: 5, message: 'An absolutely magical experience! Watching thousands of parakeets arrive at feeding time is something I will never forget. Mr. Sah is truly an inspiration to everyone who visits.', visitDate: 'March 2026' },
  { id: '2', name: 'Raj Krishnamurthy', rating: 5, message: 'We visited during the evening session and it was breathtaking. The birds know him by heart. A must-visit for anyone in Chennai.', visitDate: 'February 2026' },
  { id: '3', name: 'Sarah Mitchell', rating: 5, message: 'I traveled from London specifically to see this. It exceeded all expectations. The connection between Mr. Sah and these birds is truly extraordinary and deeply moving.', visitDate: 'January 2026' },
  { id: '4', name: 'Anand Rajan', rating: 4, message: 'Beautiful experience. The morning session was incredible — the sky literally turning green with parakeets. Highly recommend arriving early.', visitDate: 'December 2025' },
  { id: '5', name: 'Meera Venkatesh', rating: 5, message: 'Brought my children here and they were absolutely mesmerized! Mr. Sah is so kind and patient. He explained everything about the birds with such love.', visitDate: 'November 2025' },
  { id: '6', name: 'David Chen', rating: 5, message: 'As a wildlife photographer, I\'ve seen many things. But 14,000 parakeets gathering on one rooftop? That\'s something else entirely. Pure magic.', visitDate: 'October 2025' },
  { id: '7', name: 'Lakshmi Narayan', rating: 5, message: 'சென்னையின் சிறந்த அனுபவம்! பறவைகளின் அழகை வார்த்தைகளால் விவரிக்க இயலாது. நிச்சயம் மீண்டும் வருவேன்.', visitDate: 'September 2025' },
  { id: '8', name: 'Thomas Wright', rating: 4, message: 'Wonderful experience. The only reason for 4 stars is that it can get quite crowded during weekends. Try to visit on a weekday morning for the best experience.', visitDate: 'August 2025' },
  { id: '9', name: 'Kavitha Subramanian', rating: 5, message: 'This man has dedicated his entire life to these birds. The love and care is evident in every grain of rice he lays out. A humbling experience.', visitDate: 'July 2025' },
];

function StarRatingSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 transition-transform hover:scale-110"
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              star <= (hover || value)
                ? 'text-golden-hour fill-golden-hour'
                : 'text-canopy-dark/20'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    name: '',
    rating: 0,
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.rating === 0 || !formData.message) return;
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsSubmitted(true);
    setIsSubmitting(false);
  };

  const avgRating =
    mockFeedback.reduce((sum, f) => sum + f.rating, 0) / mockFeedback.length;

  return (
    <>
      <Header />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-20 bg-canopy-dark">
        <div className="container-wide py-16 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-sm font-medium px-4 py-1.5 rounded-full mb-5">
              <MessageSquare className="w-4 h-4" />
              Visitor Reviews
            </span>
            <h1 className="font-display font-black text-white text-4xl md:text-5xl lg:text-6xl mb-4">
              What Visitors{' '}
              <span className="text-golden-hour">Say</span>
            </h1>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mt-8">
              <div className="text-center">
                <div className="flex items-center gap-1.5 justify-center">
                  <Star className="w-5 h-5 text-golden-hour fill-golden-hour" />
                  <span className="font-display font-bold text-2xl text-white">
                    {avgRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-white/50 text-sm">Average Rating</span>
              </div>
              <div className="w-px h-10 bg-white/20" />
              <div className="text-center">
                <div className="font-display font-bold text-2xl text-white">
                  <Counter target={mockFeedback.length} />
                </div>
                <span className="text-white/50 text-sm">Total Reviews</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── REVIEWS GRID ─────────────────────────────────────────────────── */}
      <section className="py-12 md:py-20 bg-feather-cream">
        <div className="container-wide">
          <StaggerContainer className="columns-1 md:columns-2 lg:columns-3 gap-5">
            {mockFeedback.map((review) => (
              <StaggerItem key={review.id} className="break-inside-avoid mb-5">
                <div className="bg-white p-6 rounded-2xl shadow-card hover:shadow-card-hover transition-shadow duration-300">
                  <Quote className="w-8 h-8 text-sanctuary-green/15 mb-3" />

                  {/* Stars */}
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? 'text-golden-hour fill-golden-hour'
                            : 'text-canopy-dark/10'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-canopy-dark/70 text-sm leading-relaxed mb-4">
                    &ldquo;{review.message}&rdquo;
                  </p>

                  <div className="flex items-center gap-3 pt-3 border-t border-canopy-dark/5">
                    <div className="w-9 h-9 bg-sanctuary-green/10 text-sanctuary-green rounded-full flex items-center justify-center text-sm font-semibold shrink-0">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-canopy-dark">
                        {review.name}
                      </div>
                      <div className="text-xs text-canopy-dark/40">
                        {review.visitDate}
                      </div>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── SUBMIT FORM ──────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-morning-mist">
        <div className="container-wide max-w-xl">
          <AnimatedSection className="text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-canopy-dark mb-3">
              Share Your Experience
            </h2>
            <p className="text-canopy-dark/60">
              Visited the sanctuary? We&apos;d love to hear from you.
            </p>
          </AnimatedSection>

          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white p-10 rounded-2xl shadow-card text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-sanctuary-green mx-auto mb-4" />
                </motion.div>
                <h3 className="font-display font-bold text-2xl text-canopy-dark mb-2">
                  Thank You!
                </h3>
                <p className="text-canopy-dark/60 mb-6">
                  Your feedback has been submitted and will appear shortly.
                </p>
                <Button
                  onClick={() => {
                    setIsSubmitted(false);
                    setFormData({ name: '', rating: 0, message: '' });
                  }}
                  variant="outline"
                  className="rounded-full"
                >
                  Submit Another Review
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="bg-white p-8 rounded-2xl shadow-card space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-canopy-dark mb-2">
                    Your Name
                  </label>
                  <Input
                    placeholder="Enter your name (optional)"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="rounded-xl h-11 border-canopy-dark/10 focus:border-sanctuary-green"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-canopy-dark mb-2">
                    Your Rating <span className="text-error">*</span>
                  </label>
                  <StarRatingSelector
                    value={formData.rating}
                    onChange={(v) =>
                      setFormData((prev) => ({ ...prev, rating: v }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-canopy-dark mb-2">
                    Your Experience <span className="text-error">*</span>
                  </label>
                  <Textarea
                    placeholder="Tell us about your visit to the sanctuary..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    rows={4}
                    className="rounded-xl border-canopy-dark/10 focus:border-sanctuary-green resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={
                    isSubmitting || formData.rating === 0 || !formData.message
                  }
                  className="w-full bg-sanctuary-green hover:bg-canopy-dark text-white rounded-xl h-12 text-base gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Bird className="w-5 h-5 animate-bounce" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Review
                    </>
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>

      <Footer />
    </>
  );
}
