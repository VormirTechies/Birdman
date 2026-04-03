'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, Lock, Loader2, X, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface AdminSecurityProps {
  isOpen: boolean;
  onClose: () => void;
  isEmbed?: boolean;
}

export function AdminSecurity({ isOpen, onClose, isEmbed = false }: AdminSecurityProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'password'>('email');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form states
  const [newEmail, setNewEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const supabase = createClient();

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/admin/profile/update-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStep('verify');
      setMessage({ type: 'success', text: 'Verification code sent to your new email!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/admin/profile/verify-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: 'Email updated! Redirecting to login...' });
      setTimeout(() => window.location.href = '/admin/login', 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setMessage({ type: 'success', text: 'Password updated! Redirecting to login...' });
      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/admin/login';
      }, 2000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen && !isEmbed) return null;

  const ContentWrapper = isEmbed 
    ? ({ children }: { children: ReactNode }) => <div>{children}</div> 
    : ({ children }: { children: ReactNode }) => (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-canopy-dark/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {children}
      </motion.div>
    </div>
  );

  return (
    <ContentWrapper>
        {/* Header - Only in Modal */}
        {!isEmbed && (
          <div className="p-6 border-b border-canopy-dark/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sanctuary-green/10 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-sanctuary-green" />
              </div>
              <div>
                <h2 className="font-display font-bold text-xl text-canopy-dark">Security Settings</h2>
                <p className="text-xs text-canopy-dark/40">Manage your administrative credentials</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-canopy-dark/5 rounded-full transition-colors text-canopy-dark/30 hover:text-canopy-dark">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className={cn("flex border-b border-canopy-dark/5", isEmbed && "mt-0")}>
          <button
            onClick={() => { setActiveTab('email'); setStep('request'); setMessage({type:'', text:''}); }}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'email' ? 'border-sanctuary-green text-sanctuary-green bg-sanctuary-green/[0.02]' : 'border-transparent text-canopy-dark/40 hover:text-canopy-dark'}`}
          >
            Change Email
          </button>
          <button
            onClick={() => { setActiveTab('password'); setMessage({type:'', text:''}); }}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'password' ? 'border-sanctuary-green text-sanctuary-green bg-sanctuary-green/[0.02]' : 'border-transparent text-canopy-dark/40 hover:text-canopy-dark'}`}
          >
            Change Password
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'email' ? (
              <motion.div
                key="email-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                {step === 'request' ? (
                  <form onSubmit={handleRequestEmailChange} className="space-y-5">
                    <p className="text-sm text-canopy-dark/60 leading-relaxed">
                      Enter your new email address. We will send a 6-digit verification code to ensure you have access to it.
                    </p>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-canopy-dark/40">New Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-canopy-dark/30" />
                        <Input
                          type="email"
                          required
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="new-admin@birdmanofchennai.com"
                          className="pl-11 h-12 rounded-xl border-canopy-dark/10"
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full bg-sanctuary-green h-12 rounded-xl text-base gap-2">
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Request Verification Code'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-5">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-12 h-12 bg-sanctuary-green/10 rounded-full flex items-center justify-center">
                        <Mail className="w-6 h-6 text-sanctuary-green" />
                      </div>
                      <h3 className="font-bold text-lg text-canopy-dark">Enter 6-Digit Code</h3>
                      <p className="text-sm text-canopy-dark/60">We sent a verification code to <strong>{newEmail}</strong></p>
                    </div>
                    <Input
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="text-center text-3xl font-bold tracking-[0.5em] h-16 rounded-xl border-sanctuary-green/30"
                      placeholder="000000"
                    />
                    <Button type="submit" disabled={isLoading} className="w-full bg-sanctuary-green h-12 rounded-xl text-base gap-2">
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Update Email'}
                    </Button>
                    <button type="button" onClick={() => setStep('request')} className="w-full text-xs text-canopy-dark/40 hover:text-sanctuary-green transition-colors">
                      Didn&apos;t receive the code? Try another email.
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="password-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-5"
              >
                <p className="text-sm text-canopy-dark/60 leading-relaxed">
                  Update your dashboard password. You will be signed out immediately after a successful update.
                </p>
                <form onSubmit={handlePasswordChange} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-canopy-dark/40">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-canopy-dark/30" />
                      <Input
                        type="password"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min 8 characters"
                        className="pl-11 h-12 rounded-xl border-canopy-dark/10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-canopy-dark/40">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-canopy-dark/30" />
                      <Input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="pl-11 h-12 rounded-xl border-canopy-dark/10"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full bg-canopy-dark h-12 rounded-xl text-base gap-2">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password & Sign Out'}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mt-6 p-4 rounded-xl flex items-center gap-3 text-sm",
                message.type === 'success' ? 'bg-sanctuary-green/10 text-sanctuary-green' : 'bg-red-50 text-red-600'
              )}
            >
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
              {message.text}
            </motion.div>
          )}
        </div>
    </ContentWrapper>
  );
}
