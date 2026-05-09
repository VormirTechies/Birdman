'use client';

import { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const FONT = 'var(--font-work-sans, Work Sans, sans-serif)';

interface PasswordFieldState {
  value: string;
  show: boolean;
}

function PasswordInput({
  id,
  label,
  value,
  show,
  onChange,
  onToggleShow,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  show: boolean;
  onChange: (v: string) => void;
  onToggleShow: () => void;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-semibold text-[#9E9E9E] tracking-wider uppercase"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          autoComplete={autoComplete}
          className="w-full h-11 px-4 pr-12 rounded-xl border border-[#E0E0E0] bg-white text-sm text-[#212121] placeholder-[#BDBDBD] focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/30 focus:border-[#2E7D32] transition-colors"
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9E9E] hover:text-[#616161] transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

interface Requirement {
  label: string;
  check: (pw: string) => boolean;
}

const REQUIREMENTS: Requirement[] = [
  { label: 'Minimum 8 characters long', check: (pw) => pw.length >= 8 },
  { label: 'At least one uppercase letter', check: (pw) => /[A-Z]/.test(pw) },
  { label: 'At least one number', check: (pw) => /[0-9]/.test(pw) },
  { label: "Don't use previous passwords", check: () => true },
];

export function ChangePasswordForm() {
  const [current, setCurrent] = useState<PasswordFieldState>({ value: '', show: false });
  const [newPw, setNewPw] = useState<PasswordFieldState>({ value: '', show: false });
  const [confirmPw, setConfirmPw] = useState<PasswordFieldState>({ value: '', show: false });
  const [submitting, setSubmitting] = useState(false);

  const passwordsMatch = confirmPw.value.length > 0 && newPw.value === confirmPw.value;
  const requirementsMet = REQUIREMENTS.slice(0, 3).every((r) => r.check(newPw.value));
  const canSubmit =
    current.value.length > 0 && passwordsMatch && requirementsMet && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: current.value,
          newPassword: newPw.value,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Password updated successfully');
        setCurrent({ value: '', show: false });
        setNewPw({ value: '', show: false });
        setConfirmPw({ value: '', show: false });
      } else {
        toast.error((data as { error?: string }).error ?? 'Failed to update password');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl" style={{ fontFamily: FONT }}>
      <div className="bg-white rounded-2xl border border-[#E0E0E0] p-6 lg:p-8">
        {/* Card header */}
        <div className="mb-6">
          <h2 className="text-lg font-family-body text-[#212121]">Change Password</h2>
          <h3 className="text-sm font-family-body text-[#616161] mt-0.5">Update Credentials</h3>
          <p className="text-sm font-family-body text-[#9E9E9E] mt-1">
            For your security, choose a strong password you haven&apos;t used before.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <PasswordInput
            id="current-password"
            label="Current Password"
            value={current.value}
            show={current.show}
            onChange={(v) => setCurrent((p) => ({ ...p, value: v }))}
            onToggleShow={() => setCurrent((p) => ({ ...p, show: !p.show }))}
            autoComplete="current-password"
          />

          <PasswordInput
            id="new-password"
            label="New Password"
            value={newPw.value}
            show={newPw.show}
            onChange={(v) => setNewPw((p) => ({ ...p, value: v }))}
            onToggleShow={() => setNewPw((p) => ({ ...p, show: !p.show }))}
            autoComplete="new-password"
          />

          <PasswordInput
            id="confirm-password"
            label="Confirm New Password"
            value={confirmPw.value}
            show={confirmPw.show}
            onChange={(v) => setConfirmPw((p) => ({ ...p, value: v }))}
            onToggleShow={() => setConfirmPw((p) => ({ ...p, show: !p.show }))}
            autoComplete="new-password"
          />

          {/* Password requirements */}
          <div className="bg-[#F5F5F5] rounded-xl p-4 flex flex-col gap-2.5">
            <p className="text-xs font-semibold text-[#616161] tracking-wider uppercase mb-0.5">
              Password Requirements
            </p>
            {REQUIREMENTS.map((req) => {
              const met = req.check(newPw.value);
              return (
                <div key={req.label} className="flex items-center gap-2">
                  <CheckCircle
                    className={cn('w-4 h-4 shrink-0', met ? 'text-[#2E7D32]' : 'text-[#BDBDBD]')}
                  />
                  <span className={cn('text-sm', met ? 'text-[#2E7D32]' : 'text-[#9E9E9E]')}>
                    {req.label}
                  </span>
                </div>
              );
            })}

            {/* Passwords match indicator */}
            {confirmPw.value.length > 0 && (
              <div className="flex items-center gap-2 mt-1 border-t border-[#E0E0E0] pt-2.5">
                <CheckCircle
                  className={cn(
                    'w-4 h-4 shrink-0',
                    passwordsMatch ? 'text-[#2E7D32]' : 'text-[#E53935]',
                  )}
                />
                <span
                  className={cn('text-sm', passwordsMatch ? 'text-[#2E7D32]' : 'text-[#E53935]')}
                >
                  {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                </span>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex items-center gap-2 h-11 px-4 py-2 text-sm font-medium text-white bg-[#2E7D32] rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4" />
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
