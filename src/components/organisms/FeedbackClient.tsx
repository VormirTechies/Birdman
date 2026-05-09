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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Counter } from '@/components/ui/counter';
import {
  AnimatedSection,
  StaggerContainer,
  StaggerItem,
} from '@/components/ui/animated-section';
import { toast } from 'sonner';

interface FeedbackItem {
  id: string;
  name: string;
  rating: number;
  message: string;
  visitDate: string;
}

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
          className="p-1 transition-transform hover:scale-110"
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          suppressHydrationWarning
        >
          <Star
            className={`w-8 h-8 transition-colors ${
              star <= (hover || value)
                ? 'text-golden-hour fill-golden-hour'
                : 'text-canopy-dark/10'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function FeedbackClient({ initialFeedback }: { initialFeedback: FeedbackItem[] }) {
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
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error();
      
      setIsSubmitted(true);
      toast.success('Feedback received!', {
          description: 'Thank you for sharing your experience. We will review and approve it shortly.'
      });
    } catch (err) {
      toast.error('Submission failed', { description: 'Please try again later' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgRating = initialFeedback.length > 0
    ? initialFeedback.reduce((sum, f) => sum + f.rating, 0) / initialFeedback.length
    : 5;

  return (
    <main className="min-h-screen bg-feather-cream">
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-20 bg-canopy-dark relative overflow-hidden">
        {/* Background Aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sanctuary-green/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="container-wide text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white/60 text-xs font-bold uppercase tracking-widest px-6 py-2 rounded-full mb-8 backdrop-blur-md">
              <MessageSquare className="w-3.5 h-3.5 text-sanctuary-green" />
              Community Voices
            </span>
            <h1 className="font-display font-black text-white text-5xl md:text-8xl mb-8 tracking-tighter leading-[0.85]">
              Visions of <span className="text-sanctuary-green">Emerald</span>
            </h1>

            {/* Stats Display */}
            <div className="flex items-center justify-center gap-12 mt-12 bg-white/5 backdrop-blur-2xl border border-white/5 p-8 rounded-[3rem] w-fit mx-auto shadow-2xl">
              <div className="text-center group">
                <div className="flex items-center gap-2 justify-center mb-1">
                  <Star className="w-6 h-6 text-golden-hour fill-golden-hour group-hover:scale-125 transition-transform" />
                  <span className="font-display font-black text-4xl text-white">
                    {avgRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Sanctuary Rating</span>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center group">
                <div className="font-display font-black text-4xl text-white mb-1">
                  <Counter target={initialFeedback.length} />
                </div>
                <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Testimonials</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── REVIEWS MASONRY ──────────────────────────────────────────────── */}
      <section className="py-20 md:py-32">
        <div className="container-wide">
          {initialFeedback.length === 0 ? (
             <div className="text-center py-40 bg-white/50 rounded-[4rem] border border-dashed border-canopy-dark/10">
                <Bird className="w-16 h-16 text-canopy-dark/10 mx-auto mb-6" />
                <h3 className="font-display font-bold text-2xl text-canopy-dark">Be the first to share</h3>
                <p className="text-canopy-dark/40 mt-2 max-w-sm mx-auto">Your experience at the sanctuary is valuable. Share it with the community below.</p>
             </div>
          ) : (
            <StaggerContainer className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 md:gap-8">
              {initialFeedback.map((review) => (
                <StaggerItem key={review.id} className="break-inside-avoid mb-6 md:mb-8">
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-white p-10 rounded-[3rem] shadow-xl border border-canopy-dark/5 hover:border-sanctuary-green/20 transition-all active:scale-95 cursor-default relative overflow-hidden"
                  >
                    <Quote className="absolute top-8 right-8 w-12 h-12 text-sanctuary-green/5" />
                    
                    {/* Stars */}
                    <div className="flex gap-0.5 mb-6">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? 'text-golden-hour fill-golden-hour'
                              : 'text-canopy-dark/5'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-canopy-dark/80 text-base leading-relaxed mb-8 font-medium italic">
                      &ldquo;{review.message}&rdquo;
                    </p>

                    <div className="flex items-center gap-4 pt-8 border-t border-canopy-dark/5">
                      <div className="w-12 h-12 bg-gradient-to-br from-sanctuary-green/10 to-canopy-dark/5 text-sanctuary-green rounded-2xl flex items-center justify-center text-lg font-black shrink-0 shadow-inner">
                        {review.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-black text-canopy-dark tracking-tight leading-none mb-1">
                          {review.name}
                        </div>
                        <div className="text-[10px] text-canopy-dark/30 font-bold uppercase tracking-widest leading-none">
                          {review.visitDate}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>

      {/* ── SUBMIT FORM ──────────────────────────────────────────────────── */}
      <section className="py-24 bg-canopy-dark relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(62,176,140,0.05),transparent_60%)] pointer-events-none" />
        
        <div className="container-wide max-w-2xl relative z-10">
          <AnimatedSection className="text-center mb-12">
            <h2 className="font-display text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
              Honoring the <span className="text-sanctuary-green">Bond</span>
            </h2>
            <p className="text-white/40 text-lg max-w-md mx-auto">
              Did the emerald flight touch your heart? Please share your story of arrival with us.
            </p>
          </AnimatedSection>

          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/[0.03] backdrop-blur-3xl p-16 rounded-[4rem] border border-white/5 text-center shadow-2xl"
              >
                <div className="w-24 h-24 bg-sanctuary-green/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                  <CheckCircle2 className="w-10 h-10 text-sanctuary-green" />
                </div>
                <h3 className="font-display font-black text-3xl text-white mb-4 tracking-tight">
                  Story Recorded
                </h3>
                <p className="text-white/40 text-lg mb-10 leading-relaxed">
                  Your testimony has been sent for archival. It will join the emerald collective shortly.
                </p>
                <Button
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="rounded-full px-12 h-14 border-white/10 text-white hover:bg-white hover:text-canopy-dark transition-all text-base font-bold shadow-2xl"
                >
                  Share Another Perspective
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit}
                className="bg-white p-12 rounded-[4rem] space-y-8 shadow-2xl border border-canopy-dark/5 relative group"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-canopy-dark/30 ml-4">
                    Full Name (Official or Alias)
                  </label>
                  <Input
                    placeholder="e.g. A Friend of the Sanctuary"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="rounded-[1.5rem] h-14 border-canopy-dark/5 bg-canopy-dark/[0.02] focus:bg-white transition-all text-base px-6 font-medium"
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-canopy-dark/30 ml-4">
                    The Intensity of Flight
                  </label>
                  <StarRatingSelector
                    value={formData.rating}
                    onChange={(v) =>
                      setFormData((prev) => ({ ...prev, rating: v }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-canopy-dark/30 ml-4">
                    Your Testimonial
                  </label>
                  <Textarea
                    placeholder="Describe the moment the sky turned green..."
                    value={formData.message}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    rows={5}
                    className="rounded-[1.5rem] border-canopy-dark/5 bg-canopy-dark/[0.02] focus:bg-white transition-all text-base p-6 resize-none font-medium"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={
                    isSubmitting || formData.rating === 0 || !formData.message
                  }
                  className="w-full bg-sanctuary-green hover:bg-canopy-dark text-white rounded-[1.5rem] h-16 text-lg font-black gap-4 shadow-xl shadow-sanctuary-green/20 transition-all active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Bird className="w-6 h-6 animate-spin" />
                      Archiving...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      Submit to the Wall
                    </>
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}
