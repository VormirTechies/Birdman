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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-black/[0.03] overflow-hidden"
      >
        {children}
      </motion.div>
    </div>
  );

  return (
    <ContentWrapper>
        {/* Header - Only in Modal */}
        {!isEmbed && (
          <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-display font-black text-xl text-zinc-900 tracking-tight">Security Access</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-0.5">Credential Management</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 hover:bg-zinc-100 rounded-full transition-colors text-zinc-300 hover:text-zinc-900 border border-transparent hover:border-zinc-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className={cn("flex border-b border-zinc-100", isEmbed && "mt-0")}>
          <button
            onClick={() => { setActiveTab('email'); setStep('request'); setMessage({type:'', text:''}); }}
            className={`flex-1 py-5 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'email' ? 'border-zinc-900 text-zinc-900 bg-zinc-50/50' : 'border-transparent text-zinc-300 hover:text-zinc-500'}`}
          >
            Email Migration
          </button>
          <button
            onClick={() => { setActiveTab('password'); setMessage({type:'', text:''}); }}
            className={`flex-1 py-5 text-xs font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'password' ? 'border-zinc-900 text-zinc-900 bg-zinc-50/50' : 'border-transparent text-zinc-300 hover:text-zinc-500'}`}
          >
            Access Key
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'email' ? (
              <motion.div
                key="email-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                {step === 'request' ? (
                  <form onSubmit={handleRequestEmailChange} className="space-y-6">
                    <p className="text-sm text-zinc-500 font-medium leading-relaxed bg-zinc-50 p-5 rounded-2xl border border-black/[0.02]">
                      Initiate credentials migration by entering your new target identity. A 6-digit verification code will be dispatched.
                    </p>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">New Identity</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300" />
                        <Input
                          type="email"
                          required
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="admin@sanctuary.com"
                          className="pl-12 h-14 rounded-2xl bg-zinc-50 border-transparent text-zinc-900 placeholder:text-zinc-200 focus:bg-white focus:border-zinc-900/10 focus:ring-4 focus:ring-zinc-900/5 transition-all text-sm font-bold"
                        />
                      </div>
                    </div>
                    <Button type="submit" disabled={isLoading} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-14 rounded-2xl text-xs font-black uppercase tracking-widest gap-2 shadow-xl shadow-black/10 active:scale-[0.98]">
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Dispatch Verification'}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-14 h-14 bg-sanctuary-green/10 rounded-[1.25rem] flex items-center justify-center shadow-inner">
                        <Mail className="w-7 h-7 text-sanctuary-green" />
                      </div>
                      <h3 className="font-black text-xl text-zinc-900 tracking-tight">Identity Verification</h3>
                      <p className="text-sm text-zinc-400 font-medium">Verify code dispatched to <strong>{newEmail}</strong></p>
                    </div>
                    <Input
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="text-center text-3xl font-black bg-zinc-50 border-black/5 tracking-[0.4em] h-20 rounded-2xl focus:bg-white focus:border-sanctuary-green/30"
                      placeholder="000000"
                    />
                    <Button type="submit" disabled={isLoading} className="w-full bg-sanctuary-green hover:bg-zinc-900 text-white h-14 rounded-2xl text-xs font-black uppercase tracking-widest gap-2 shadow-xl shadow-green-900/10 active:scale-[0.98]">
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm & Re-Authenticate'}
                    </Button>
                    <button type="button" onClick={() => setStep('request')} className="w-full text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-zinc-900 transition-colors">
                      Retry Migration
                    </button>
                  </form>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="password-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <p className="text-sm text-zinc-500 font-medium leading-relaxed bg-zinc-50 p-5 rounded-2xl border border-black/[0.02]">
                  Recalibrate your access key. Successful update will trigger a global session termination for security.
                </p>
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">New Access Key</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300" />
                      <Input
                        type="password"
                        required
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-12 h-14 rounded-2xl bg-zinc-50 border-transparent text-zinc-900 placeholder:text-zinc-200 focus:bg-white focus:border-zinc-900/10 focus:ring-4 focus:ring-zinc-900/5 transition-all text-sm font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-4">Confirm Connection Key</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300" />
                      <Input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-12 h-14 rounded-2xl bg-zinc-50 border-transparent text-zinc-900 placeholder:text-zinc-200 focus:bg-white focus:border-zinc-900/10 focus:ring-4 focus:ring-zinc-900/5 transition-all text-sm font-bold"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-14 rounded-2xl text-xs font-black uppercase tracking-widest gap-2 shadow-xl shadow-black/10 active:scale-[0.98]">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Execute Recalibration'}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mt-8 p-5 rounded-2xl flex items-center gap-4 text-xs font-black uppercase tracking-tight shadow-sm border",
                message.type === 'success' ? 'bg-zinc-900 text-white border-transparent shadow-zinc-900/10' : 'bg-red-50 text-red-600 border-red-100'
              )}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", message.type === 'success' ? 'bg-white/10' : 'bg-red-600/10')}>
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-white" /> : <XCircle className="w-4 h-4 text-red-600" />}
              </div>
              <p className="flex-1 leading-snug">{message.text}</p>
            </motion.div>
          )}
        </div>
    </ContentWrapper>
  );
}
