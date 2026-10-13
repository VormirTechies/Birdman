'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bird, Clock, Leaf } from 'lucide-react';

interface MaintenancePageProps {
  endsAt: string;
  initialSecondsRemaining: number;
}

export function MaintenancePage({ endsAt, initialSecondsRemaining }: MaintenancePageProps) {
  const router = useRouter();
  const [secondsRemaining, setSecondsRemaining] = useState(initialSecondsRemaining);

  useEffect(() => {
    const deadline = Date.parse(endsAt);
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0) {
        window.clearInterval(interval);
        router.refresh();
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [endsAt, router]);

  const countdown = [
    { label: 'Hours', value: Math.floor(secondsRemaining / 3600) },
    { label: 'Minutes', value: Math.floor((secondsRemaining % 3600) / 60) },
    { label: 'Seconds', value: secondsRemaining % 60 },
  ];

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-feather-cream px-5 py-12 text-canopy-dark">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-sanctuary-green/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-golden-hour/10 blur-3xl" />
      <section className="relative w-full max-w-2xl text-center">
        <div className="mb-10 flex items-center justify-center gap-3 text-sm font-semibold tracking-wide">
          <Bird aria-hidden="true" className="h-7 w-7 text-sanctuary-green" />
          <span>Birdman of Chennai</span>
        </div>
        <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full border border-sanctuary-green/15 bg-white shadow-card">
          <Leaf aria-hidden="true" className="h-11 w-11 text-sanctuary-green" strokeWidth={1.5} />
        </div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-sanctuary-green">Scheduled maintenance · 12 hours</p>
        <h1 className="font-display text-4xl leading-tight sm:text-6xl">A little pause.<br />A better experience.</h1>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-canopy-dark/70 sm:text-lg">
          We’re updating our website to make planning your visit smoother.
          Thank you for your patience. Please return after maintenance.
        </p>
        <div className="mx-auto mt-9 max-w-md rounded-3xl border border-canopy-dark/10 bg-white/80 p-6 shadow-card sm:p-8">
          <p className="mb-5 flex items-center justify-center gap-2 text-sm text-canopy-dark/70">
            <Clock aria-hidden="true" className="h-4 w-4" />
            Returning in
          </p>
          <div role="timer" aria-label="Time remaining until scheduled maintenance ends" className="grid grid-cols-3 gap-4">
            {countdown.map(({ label, value }) => (
              <div key={label}>
                <span className="block font-display text-4xl font-bold tabular-nums sm:text-5xl">{String(value).padStart(2, '0')}</span>
                <span className="mt-2 block text-xs uppercase tracking-widest text-canopy-dark/55">{label}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 border-t border-canopy-dark/10 pt-5 text-sm text-canopy-dark/70">
            Scheduled return: <time dateTime={endsAt} className="font-semibold text-canopy-dark">14 October, 8:57 AM IST</time>
          </p>
        </div>
        <p className="mt-8 text-sm text-canopy-dark/55">Thank you for supporting Sudarson and the parakeets.</p>
      </section>
    </main>
  );
}
