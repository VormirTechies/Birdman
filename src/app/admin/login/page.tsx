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
    <div className="min-h-screen bg-feather-cream/50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sanctuary-green/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-canopy-light/5 blur-[100px] rounded-full -z-10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[440px] relative z-10"
      >
        {/* Logo Section */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, y: -10 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-canopy-dark/[0.02] border border-canopy-dark/5 relative"
          >
            <Bird className="w-12 h-12 text-sanctuary-green" />
            <div className="absolute -top-2 -right-2 w-7 h-7 bg-amber-400 rounded-full border-4 border-feather-cream flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            </div>
          </motion.div>
          <h1 className="font-display font-bold text-3xl text-canopy-dark tracking-tight mb-2">
            Administrator Access
          </h1>
          <p className="text-canopy-dark/40 text-sm font-bold tracking-widest uppercase">
            Birdman Sanctuary Control
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-canopy-dark/[0.04] border border-canopy-dark/5 relative">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-canopy-dark/40 ml-2">
                Identity
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-canopy-dark/30" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bridge.com"
                  required
                  className="rounded-2xl h-14 bg-canopy-dark/[0.02] border-canopy-dark/10 text-canopy-dark placeholder:text-canopy-dark/20 pl-12 focus:bg-white focus:ring-2 focus:ring-sanctuary-green/20 transition-all text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-canopy-dark/40 ml-2">
                Access Key
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-canopy-dark/30" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="rounded-2xl h-14 bg-canopy-dark/[0.02] border-canopy-dark/10 text-canopy-dark placeholder:text-canopy-dark/20 pl-12 focus:bg-white focus:ring-2 focus:ring-sanctuary-green/20 transition-all text-base"
                />
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50 border border-red-100 px-4 py-3 rounded-2xl flex items-center gap-3 overflow-hidden"
                >
                  <ShieldCheck className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-red-600 text-sm font-medium leading-tight">
                    {error}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sanctuary-green hover:bg-canopy-dark text-white rounded-2xl h-14 text-lg font-bold gap-3 shadow-xl shadow-sanctuary-green/20 transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Enter Dashboard
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer Link */}
        <p className="text-center mt-8 text-canopy-dark/30 text-xs font-bold tracking-widest uppercase">
          &copy; {new Date().getFullYear()} Birdman of Chennai
        </p>
      </motion.div>
    </div>
  );
}
