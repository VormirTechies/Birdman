'use client';

import { Suspense, useEffect, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth, firebaseConfigError } from '@/firebase';

type LinkState = 'checking' | 'valid' | 'invalid' | 'success';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  const [linkState, setLinkState] = useState<LinkState>('checking');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (firebaseConfigError || mode !== 'resetPassword' || !oobCode) {
      setLinkState('invalid');
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then(() => active && setLinkState('valid'))
      .catch(() => active && setLinkState('invalid'));
    return () => { active = false; };
  }, [mode, oobCode]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Use at least 8 characters, one uppercase letter, and one number.');
      return;
    }
    if (password !== confirmation) {
      setError('Passwords do not match.');
      return;
    }
    if (!oobCode || linkState !== 'valid') return;

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setLinkState('success');
      window.setTimeout(() => router.replace('/admin/login?reset=success'), 1500);
    } catch {
      setLinkState('invalid');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-[#1B5E20] to-[#2E7D32] flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 lg:p-8 shadow-2xl">
        {linkState === 'checking' && (
          <div className="py-10 text-center" role="status">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#2E7D32] border-t-transparent" />
            <p className="text-sm text-[#616161]">Checking your reset link...</p>
          </div>
        )}

        {linkState === 'invalid' && (
          <div className="text-center">
            <Lock className="mx-auto mb-4 h-12 w-12 text-[#BA1A1A]" />
            <h1 className="text-2xl font-bold text-[#212121]">Link expired or invalid</h1>
            <p className="mt-2 text-sm text-[#616161]">Request a new password reset link from the admin sign-in page.</p>
            <button onClick={() => router.replace('/admin/login')} className="mt-6 w-full rounded-lg bg-[#2E7D32] py-3 font-semibold text-white">Back to sign in</button>
          </div>
        )}

        {linkState === 'success' && (
          <div className="py-6 text-center" role="status">
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-[#2E7D32]" />
            <h1 className="text-2xl font-bold text-[#212121]">Password updated</h1>
            <p className="mt-2 text-sm text-[#616161]">Redirecting you to sign in...</p>
          </div>
        )}

        {linkState === 'valid' && (
          <>
            <div className="mb-6 text-center">
              <Lock className="mx-auto mb-3 h-10 w-10 text-[#2E7D32]" />
              <h1 className="text-2xl font-bold text-[#212121]">Reset password</h1>
              <p className="mt-1 text-sm text-[#616161]">Choose a secure password for your admin account.</p>
            </div>
            {error && <p className="mb-4 rounded-lg bg-[#ffdad6] p-3 text-sm text-[#ba1a1a]" role="alert">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-sm font-semibold text-[#212121]" htmlFor="new-password">New password</label>
              <div className="relative">
                <input id="new-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required className="w-full rounded-xl border border-[#E0E0E0] px-4 py-3 pr-12" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#616161]">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
              <p className="text-xs text-[#616161]">At least 8 characters, one uppercase letter, and one number.</p>
              <label className="block text-sm font-semibold text-[#212121]" htmlFor="confirm-password">Confirm password</label>
              <input id="confirm-password" type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" required className="w-full rounded-xl border border-[#E0E0E0] px-4 py-3" />
              <button type="submit" disabled={submitting} className="w-full rounded-lg bg-[#2E7D32] py-3 font-semibold text-white disabled:opacity-60">{submitting ? 'Updating...' : 'Update password'}</button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="min-h-screen bg-white" />}><ResetPasswordContent /></Suspense>;
}
