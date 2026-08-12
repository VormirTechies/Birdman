'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bird, CheckCircle2, Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, firebaseConfigError } from '@/firebase';
import Carousel from '../_components/Carousel';

type CardView = 'login' | 'forgot' | 'sent';

const GALLERY_IMAGES = Array.from(
  { length: 10 },
  (_, index) => `/images/gallery/${String(index + 1).padStart(3, '0')}.jpeg`
);

const PERMISSION_MESSAGE =
  "You don't have permission to enter this page. Please contact your admin.";

export default function AdminLoginPage() {
  const router = useRouter();
  const [view, setView] = useState<CardView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get('reason');
    const reset = new URLSearchParams(window.location.search).get('reset');
    if (reason === 'forbidden') setError(PERMISSION_MESSAGE);
    if (reset === 'success') setError('Password reset complete. Sign in with your new password.');
  }, []);

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (firebaseConfigError) throw new Error(firebaseConfigError);
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );
      const token = await credential.user.getIdToken();
      const response = await fetch('/api/admin/session', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        await signOut(auth);
        setError(response.status === 403 ? PERMISSION_MESSAGE : 'Unable to verify administrator access.');
        return;
      }

      router.replace('/admin');
      router.refresh();
    } catch {
      setError('Unable to sign in. Check your email and password and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleForgotPassword(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (firebaseConfigError) throw new Error(firebaseConfigError);
      const normalizedEmail = forgotEmail.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        setError('Enter a valid email address.');
        return;
      }
      await sendPasswordResetEmail(auth, normalizedEmail, {
        url: `${window.location.origin}/admin/login?reset=success`,
      });
      setView('sent');
    } catch {
      // Keep the response generic so the form does not disclose registered emails.
      setView('sent');
    } finally {
      setIsLoading(false);
    }
  }

  function backToLogin() {
    setView('login');
    setError('');
    setForgotEmail('');
  }

  const slide = {
    initial: { x: 40, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -40, opacity: 0 },
  };

  return (
    <div className="flex min-h-screen overflow-hidden bg-white">
      <div className="relative hidden lg:block lg:w-1/2">
        <Carousel images={GALLERY_IMAGES} interval={4000} />
        <div className="absolute inset-0 z-10 bg-linear-to-br from-[#1B5E20] to-[#2E7D32] opacity-50" />
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-12 text-white">
          <h1 className="max-w-md text-5xl font-bold">Where the sky turns green.</h1>
          <p className="mt-4 max-w-md text-lg text-white/90">
            The administrative heart of Chennai&apos;s urban bird sanctuary.
          </p>
        </div>
      </div>

      <div className="relative flex w-full items-center justify-center p-6 lg:w-1/2 lg:p-12">
        <div className="absolute inset-0 z-0 lg:hidden">
          <Carousel images={GALLERY_IMAGES} interval={4000} />
          <div className="absolute inset-0 bg-linear-to-br from-[#1B5E20] to-[#2E7D32] opacity-75" />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <AnimatePresence mode="wait">
            <motion.div key={view} {...slide} transition={{ duration: 0.25 }}>
              <div className="rounded-2xl bg-white p-6 shadow-2xl lg:p-8">
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2E7D32]">
                    {view === 'login' ? <Bird className="h-7 w-7 text-white" /> : view === 'forgot' ? <KeyRound className="h-6 w-6 text-white" /> : <CheckCircle2 className="h-7 w-7 text-white" />}
                  </div>
                  <h2 className="text-2xl font-bold text-[#212121]">
                    {view === 'login' ? 'Birdman of Chennai' : view === 'forgot' ? 'Forgot Password' : 'Check your email'}
                  </h2>
                  <p className="mt-1 text-sm text-[#616161]">
                    {view === 'login'
                      ? 'Sign in to manage the sanctuary'
                      : view === 'forgot'
                        ? 'We will send a secure password-reset link.'
                        : 'If an account exists, a password-reset link has been sent.'}
                  </p>
                </div>

                {error && <div role="alert" className="mb-4 rounded-lg bg-[#ffdad6] p-3 text-sm text-[#ba1a1a]">{error}</div>}

                {view === 'login' && (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <Field id="email" label="Email Address" icon={<Mail className="h-4 w-4" />}>
                      <input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl bg-[#F5F5F5] py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#2E7D32]/30" />
                    </Field>
                    <Field id="password" label="Password" icon={<Lock className="h-4 w-4" />} action={<button type="button" onClick={() => { setError(''); setForgotEmail(email); setView('forgot'); }} className="text-xs font-medium text-[#2E7D32]">Forgot password?</button>}>
                      <input id="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl bg-[#F5F5F5] py-2.5 pl-10 pr-11 text-sm outline-none focus:ring-2 focus:ring-[#2E7D32]/30" />
                      <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#616161]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                    </Field>
                    <Submit loading={isLoading} label="Log In" loadingLabel="Signing in..." />
                  </form>
                )}

                {view === 'forgot' && (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <Field id="forgot-email" label="Email Address" icon={<Mail className="h-4 w-4" />}>
                      <input id="forgot-email" type="email" required autoComplete="email" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} className="w-full rounded-xl bg-[#F5F5F5] py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#2E7D32]/30" />
                    </Field>
                    <Submit loading={isLoading} label="Send reset link" loadingLabel="Sending..." />
                    <BackButton onClick={backToLogin} />
                  </form>
                )}

                {view === 'sent' && <BackButton onClick={backToLogin} />}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function Field({ id, label, icon, action, children }: { id: string; label: string; icon: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return <div><div className="mb-1.5 flex items-center justify-between"><label htmlFor={id} className="text-sm font-semibold text-[#212121]">{label}</label>{action}</div><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#616161]">{icon}</span>{children}</div></div>;
}

function Submit({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return <button type="submit" disabled={loading} className="w-full rounded-lg bg-[#2E7D32] py-2.5 text-sm font-bold text-white hover:bg-[#1B5E20] disabled:cursor-not-allowed disabled:bg-[#BDBDBD]">{loading ? loadingLabel : label}</button>;
}

function BackButton({ onClick }: { onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center justify-center gap-2 text-sm font-medium text-[#616161] hover:text-[#212121]"><ArrowLeft className="h-4 w-4" />Back to Login</button>;
}
