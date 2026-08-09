'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, CheckCircle2, Feather, Loader2, MessageCircle, Quote } from 'lucide-react';
import { toast } from 'sonner';
import { feedbackSubmissionSchema, type PublicFeedback } from '@/models/firestore/feedback';

type FormState = { name: string; email: string; feedback: string; website: string };
type FieldErrors = Partial<Record<keyof FormState, string>>;
const EMPTY_FORM: FormState = { name: '', email: '', feedback: '', website: '' };

export function FeedbackClient({
  initialFeedback,
  initialNextCursor = null,
}: {
  initialFeedback: PublicFeedback[];
  initialNextCursor?: string | null;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [feedbackItems, setFeedbackItems] = useState(initialFeedback);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    const parsed = feedbackSubmissionSchema.safeParse(form);
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      setErrors({
        name: fields.name?.[0],
        email: fields.email?.[0],
        feedback: fields.feedback?.[0],
        website: fields.website?.[0],
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          response.status === 429
            ? 'You have shared several responses recently. Please try again later.'
            : result.error || 'We could not submit your feedback.'
        );
      }
      setForm(EMPTY_FORM);
      setErrors({});
      setIsSubmitted(true);
      toast.success('Thank you for sharing your experience.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function loadMoreFeedback() {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const response = await fetch(
        `/api/feedback?limit=12&cursor=${encodeURIComponent(nextCursor)}`,
        { cache: 'no-store' }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to load more feedback');
      setFeedbackItems((current) => [...current, ...result.feedback]);
      setNextCursor(result.pagination.nextCursor);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load more feedback');
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <main className="min-h-screen bg-feather-cream">
      <section className="relative overflow-hidden bg-canopy-dark px-4 pb-20 pt-32 text-white md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(62,176,140,0.18),transparent_35%)]" />
        <div className="container-wide relative">
          <div className="max-w-3xl">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/70">
              <MessageCircle className="h-4 w-4 text-sanctuary-green-light" /> Visitor voices
            </span>
            <h1 className="font-display text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              Every visit leaves a <span className="text-sanctuary-green-light">story.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/65 md:text-xl">
              Tell us what stayed with you after the sky filled with green. Your words help this sanctuary grow with care.
            </p>
          </div>
        </div>
      </section>

      <section className="container-wide -mt-10 relative z-10 pb-20">
        <div className="grid overflow-hidden rounded-[2rem] border border-canopy-dark/5 bg-white shadow-2xl lg:grid-cols-[0.75fr_1.25fr]">
          <div className="bg-sanctuary-green p-8 text-white md:p-12">
            <Feather className="h-10 w-10" />
            <h2 className="mt-8 font-display text-3xl font-bold">Share a few honest words</h2>
            <p className="mt-4 leading-relaxed text-white/75">
              Feedback is reviewed before it appears publicly. Your email is kept private and is only used if we need to follow up.
            </p>
            <div className="mt-10 rounded-2xl border border-white/15 bg-white/10 p-5 text-sm leading-relaxed text-white/80">
              Please keep feedback between 20 and 500 characters. For a longer story with photographs, use the story option below.
            </div>
          </div>

          <div className="p-6 md:p-12">
            {isSubmitted ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center" role="status">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sanctuary-green/10">
                  <CheckCircle2 className="h-10 w-10 text-sanctuary-green" />
                </div>
                <h2 className="mt-6 font-display text-3xl font-bold text-canopy-dark">Feedback received</h2>
                <p className="mt-3 max-w-md text-canopy-dark/60">
                  Thank you. Your feedback is awaiting review and will appear here after approval.
                </p>
                <button type="button" onClick={() => setIsSubmitted(false)} className="mt-8 rounded-full bg-canopy-dark px-7 py-3 font-semibold text-white hover:bg-sanctuary-green">
                  Share another response
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Full name" id="feedback-name" error={errors.name}>
                    <input id="feedback-name" name="name" autoComplete="name" required maxLength={100} value={form.name} onChange={(e) => updateField('name', e.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'feedback-name-error' : undefined} className="field-control" placeholder="Your name" />
                  </Field>
                  <Field label="Email address" id="feedback-email" error={errors.email} hint="Kept private; never shown publicly.">
                    <input id="feedback-email" name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={(e) => updateField('email', e.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'feedback-email-error' : 'feedback-email-hint'} className="field-control" placeholder="you@example.com" />
                  </Field>
                </div>

                <Field label="Your feedback" id="feedback-message" error={errors.feedback}>
                  <textarea id="feedback-message" name="feedback" required minLength={20} maxLength={500} rows={7} value={form.feedback} onChange={(e) => updateField('feedback', e.target.value)} aria-invalid={Boolean(errors.feedback)} aria-describedby="feedback-message-help" className="field-control min-h-44 resize-y" placeholder="What did your visit mean to you?" />
                  <div id="feedback-message-help" className="mt-2 flex justify-between text-xs text-canopy-dark/45">
                    <span>{errors.feedback ?? 'Minimum 20 characters'}</span>
                    <span className={form.feedback.length > 500 ? 'text-red-600' : ''}>{form.feedback.length}/500</span>
                  </div>
                </Field>

                <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                  <label htmlFor="feedback-website">Website</label>
                  <input id="feedback-website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => updateField('website', e.target.value)} />
                </div>

                <button type="submit" disabled={isSubmitting} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-canopy-dark px-6 font-bold text-white transition hover:bg-sanctuary-green disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Sending feedback</> : <>Send feedback <ArrowRight className="h-5 w-5" /></>}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-5 rounded-2xl border border-sanctuary-green/15 bg-morning-mist p-6 md:flex-row md:items-center md:p-8">
          <div><h2 className="font-display text-xl font-bold text-canopy-dark">Have a longer story with photos to share?</h2><p className="mt-1 text-sm text-canopy-dark/60">Our community story submissions are opening soon.</p></div>
          <Link href="/blog/submit" className="inline-flex items-center gap-2 font-bold text-sanctuary-green hover:gap-3">Write your story <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="container-wide">
          <div className="mb-12 max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-sanctuary-green">From our visitors</p><h2 className="mt-3 font-display text-4xl font-black text-canopy-dark md:text-5xl">Shared moments</h2></div>
          {feedbackItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-canopy-dark/15 bg-feather-cream px-6 py-20 text-center"><Feather className="mx-auto h-10 w-10 text-sanctuary-green/40" /><h3 className="mt-5 font-display text-2xl font-bold text-canopy-dark">Be the first to share</h3><p className="mt-2 text-canopy-dark/55">Approved visitor feedback will appear here.</p></div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {feedbackItems.map((item) => <article key={item.id} className="flex flex-col rounded-3xl border border-canopy-dark/5 bg-feather-cream p-7"><Quote className="h-8 w-8 text-sanctuary-green/30" /><p className="mt-5 flex-1 leading-relaxed text-canopy-dark/75">&ldquo;{item.message}&rdquo;</p><div className="mt-7 border-t border-canopy-dark/10 pt-5"><p className="font-bold text-canopy-dark">{item.name}</p><time className="text-xs text-canopy-dark/45" dateTime={item.createdAt}>{new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(item.createdAt))}</time></div></article>)}
            </div>
          )}
          {nextCursor && (
            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => void loadMoreFeedback()}
                disabled={isLoadingMore}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-sanctuary-green/25 px-7 font-bold text-sanctuary-green transition hover:bg-morning-mist disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                {isLoadingMore ? 'Loading feedback' : 'Load more feedback'}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Field({ label, id, error, hint, children }: { label: string; id: string; error?: string; hint?: string; children: React.ReactNode }) {
  return <div><label htmlFor={id} className="mb-2 block text-sm font-bold text-canopy-dark">{label} <span className="text-red-600">*</span></label>{children}{error ? <p id={`${id}-error`} className="mt-2 text-xs text-red-600">{error}</p> : hint ? <p id={`${id}-hint`} className="mt-2 text-xs text-canopy-dark/45">{hint}</p> : null}</div>;
}
