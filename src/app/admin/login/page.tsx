'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bird, Lock, Loader2, ArrowRight, ShieldCheck, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-zinc-50 blur-[120px] rounded-full -z-10 pointer-events-none opacity-50" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-zinc-50 blur-[100px] rounded-full -z-10 pointer-events-none opacity-50" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] relative z-10"
      >
        {/* Logo Section */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.9, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.1 }}
            className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-black/[0.05] border border-black/[0.03] relative group"
          >
            <Bird className="w-12 h-12 text-zinc-900 transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-sanctuary-green rounded-full border-4 border-white flex items-center justify-center shadow-lg">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            </div>
          </motion.div>
          <h1 className="font-display font-black text-4xl text-zinc-900 tracking-tight mb-3">
            Sanctuary <span className="text-zinc-400">HQ</span>
          </h1>
          <p className="text-zinc-400 text-[10px] font-black tracking-[0.2em] uppercase">
            Administrative Control Interface
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-10 md:p-12 rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-black/[0.03] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 -z-10" />
          
          <form onSubmit={handleLogin} className="space-y-8 relative">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-5">
                Identity
              </label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bridge.com"
                  required
                  className="rounded-3xl h-16 bg-zinc-50 border-transparent text-zinc-900 placeholder:text-zinc-300 pl-14 focus:bg-white focus:border-zinc-900/10 focus:ring-4 focus:ring-zinc-900/5 transition-all text-base font-bold shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-5">
                Access Key
              </label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="rounded-3xl h-16 bg-zinc-50 border-transparent text-zinc-900 placeholder:text-zinc-300 pl-14 focus:bg-white focus:border-zinc-900/10 focus:ring-4 focus:ring-zinc-900/5 transition-all text-base font-bold shadow-inner"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="bg-red-50/50 border border-red-100 px-5 py-4 rounded-2xl flex items-center gap-3 overflow-hidden"
                >
                  <ShieldCheck className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-red-900 text-xs font-black uppercase tracking-tighter leading-tight">
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-[2rem] h-16 text-sm font-black uppercase tracking-[0.1em] gap-3 shadow-2xl shadow-zinc-900/20 transition-all active:scale-[0.98] mt-4"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Establish Connection
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center mt-12 text-zinc-300 text-[10px] font-black tracking-[0.3em] uppercase">
          &copy; {new Date().getFullYear()} Birdman Terminal
        </p>
      </motion.div>
    </div>
  );
}
