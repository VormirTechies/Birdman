'use client';

import { useState } from 'react';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authenticatedFetch } from '@/lib/firebase/authenticated-fetch';
import { createFirebaseUserSchema } from '@/models/firebase/auth-user';

type FieldName = 'displayName' | 'email' | 'password';
type FieldErrors = Partial<Record<FieldName, string>>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => Promise<void> | void;
}

export function CreateUserDialog({ open, onOpenChange, onCreated }: CreateUserDialogProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setDisplayName('');
    setEmail('');
    setPassword('');
    setIsAdmin(false);
    setShowPassword(false);
    setErrors({});
    setApiError('');
  }

  function handleOpenChange(nextOpen: boolean) {
    if (submitting) return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setApiError('');
    setErrors({});

    const parsed = createFirebaseUserSchema.safeParse({ displayName, email, password, isAdmin });
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      setErrors({
        displayName: fields.displayName?.[0],
        email: fields.email?.[0],
        password: fields.password?.[0],
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await authenticatedFetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json() as {
        error?: string;
        fields?: Record<string, string[]>;
      };
      if (!response.ok) {
        setApiError(result.error ?? 'Unable to create the user.');
        if (result.fields) {
          setErrors({
            displayName: result.fields.displayName?.[0],
            email: result.fields.email?.[0],
            password: result.fields.password?.[0],
          });
        }
        return;
      }

      toast.success(isAdmin ? 'Administrator created successfully' : 'User created successfully');
      reset();
      onOpenChange(false);
      await onCreated();
    } catch {
      setApiError('Unable to create the user. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const fieldClass = 'h-11 border border-[#E0E0E0] bg-white px-3 py-2 text-sm focus:border-[#2E7D32]';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-white p-6 sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F5E9] text-[#2E7D32]">
            <UserPlus className="h-5 w-5" />
          </div>
          <DialogTitle className="text-xl font-semibold text-[#212121]">Add Firebase user</DialogTitle>
          <DialogDescription>Create a sign-in account and optionally grant administrator access.</DialogDescription>
        </DialogHeader>

        {apiError && <p role="alert" className="rounded-lg bg-[#ffdad6] p-3 text-sm text-[#ba1a1a]">{apiError}</p>}

        <form id="create-user-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="new-user-display-name">Display Name</Label>
            <Input id="new-user-display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" aria-invalid={Boolean(errors.displayName)} aria-describedby={errors.displayName ? 'display-name-error' : undefined} className={fieldClass} />
            {errors.displayName && <p id="display-name-error" className="text-xs text-[#ba1a1a]">{errors.displayName}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-user-email">Email</Label>
            <Input id="new-user-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} className={fieldClass} />
            {errors.email && <p id="email-error" className="text-xs text-[#ba1a1a]">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-user-password">Password</Label>
            <div className="relative">
              <Input id="new-user-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" aria-invalid={Boolean(errors.password)} aria-describedby="new-user-password-help" className={`${fieldClass} pr-11`} />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#616161]">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p id="new-user-password-help" className={errors.password ? 'text-xs text-[#ba1a1a]' : 'text-xs text-[#757575]'}>{errors.password ?? 'At least 8 characters, one uppercase letter, and one number.'}</p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#E0E0E0] p-4">
            <div>
              <Label htmlFor="new-user-admin">Administrator access</Label>
              <p className="mt-1 text-xs text-[#757575]">Allows access to the admin dashboard and protected APIs.</p>
            </div>
            <button
              id="new-user-admin"
              type="button"
              role="switch"
              aria-checked={isAdmin}
              aria-label="Administrator access"
              onClick={() => setIsAdmin((value) => !value)}
              className={`relative ml-4 h-7 w-12 shrink-0 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 ${
                isAdmin
                  ? 'border-[#2E7D32] bg-[#2E7D32]'
                  : 'border-[#9E9E9E] bg-[#E0E0E0]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`absolute left-0 top-0.5 h-5.5 w-5.5 rounded-full bg-white shadow-sm transition-transform ${
                  isAdmin ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </form>

        <DialogFooter className="mt-2 -mx-6 -mb-6 px-6">
          <button type="button" onClick={() => handleOpenChange(false)} disabled={submitting} className="h-10 rounded-lg border border-[#D0D0D0] px-4 text-sm font-semibold text-[#616161] disabled:opacity-50">Cancel</button>
          <button type="submit" form="create-user-form" disabled={submitting} className="h-10 rounded-lg bg-[#2E7D32] px-4 text-sm font-semibold text-white disabled:opacity-60">{submitting ? 'Creating...' : 'Create user'}</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
