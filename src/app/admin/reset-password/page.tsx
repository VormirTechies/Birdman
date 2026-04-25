'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Carousel from '../_components/Carousel';

// Gallery images for carousel (same as login page)
const GALLERY_IMAGES = [
  '/images/gallery/001.jpeg',
  '/images/gallery/002.jpeg',
  '/images/gallery/003.jpeg',
  '/images/gallery/004.jpeg',
  '/images/gallery/005.jpeg',
  '/images/gallery/006.jpeg',
  '/images/gallery/007.jpeg',
  '/images/gallery/008.jpeg',
  '/images/gallery/009.jpeg',
  '/images/gallery/010.jpeg',
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    // Check for valid session from magic link
    const checkSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          // No valid session, redirect to login
          router.push('/admin/login');
          return;
        }
        
        setIsCheckingSession(false);
      } catch (err) {
        console.error('Session check error:', err);
        router.push('/admin/login');
      }
    };

    checkSession();
  }, [router, supabase]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Success - show success state
      setIsSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/admin/login?reset=success');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/admin/login');
  };

  // Show loading state while checking session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#2E7D32] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#616161]">Verifying your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white overflow-hidden">
      {/* Left Side - Carousel (Desktop) / Background (Mobile) */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <Carousel images={GALLERY_IMAGES} interval={4000} />
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-[#1B5E20] to-[#2E7D32] z-10 opacity-50" />
        
        {/* Content overlay */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-12">
          {/* Main content */}
          <div className="max-w-md">
            <h1 
              className="text-4xl lg:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
            >
              Where the sky turns green.
            </h1>
            <p className="text-lg text-white/90 leading-relaxed">
              The administrative heart of Chennai&apos;s urban bird sanctuary. Manage the daily miracle and protect the legacy of a 16-year bond with nature.
            </p>
          </div>

          {/* Indicators moved to bottom of carousel content */}
          <div className="h-8" />
        </div>
      </div>

      {/* Right Side - Reset Password Form (Desktop) / Full screen with background (Mobile) */}
      <div className="w-full lg:w-1/2 relative flex items-center justify-center p-6 lg:p-12">
        {/* Mobile background carousel */}
        <div className="lg:hidden absolute inset-0 z-0">
          <Carousel images={GALLERY_IMAGES} interval={4000} />
          <div className="absolute inset-0 bg-linear-to-br from-[#1B5E20] to-[#2E7D32] opacity-75" />
        </div>

        {/* Card Container */}
        <div className="w-full max-w-md relative z-10">
          {!isSuccess ? (
            /* RESET PASSWORD CARD */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
                {/* Header */}
                <div className="text-center mb-6">
                  {/* Icon */}
                  <div className="flex justify-center items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#2E7D32]/10 flex items-center justify-center">
                      <Lock className="w-6 h-6 text-[#2E7D32]" />
                    </div>
                  </div>
                  
                  <h2 
                    className="text-xl lg:text-2xl font-bold text-[#212121] mb-1.5"
                    style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                  >
                    Reset Password
                  </h2>
                  <p className="text-xs lg:text-sm text-[#616161]">
                    Please enter your new password below.
                  </p>
                </div>

                {/* Error message */}
                {error && (
                  <div className="mb-4 p-2.5 rounded-lg bg-[#ffdad6] text-[#ba1a1a] text-xs lg:text-sm">
                    {error}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {/* New Password field */}
                  <div>
                    <label 
                      htmlFor="new-password" 
                      className="block text-xs lg:text-sm font-semibold text-[#212121] mb-1.5"
                      style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#616161]" />
                      <input
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-10 pr-11 py-2.5 bg-[#F5F5F5] border-2 border-transparent rounded-xl text-sm text-[#212121] placeholder:text-[#9E9E9E] focus:outline-none focus:border-transparent focus:bg-white transition-colors"
                        style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                        suppressHydrationWarning
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#616161] hover:text-[#212121] transition-colors cursor-pointer"
                        suppressHydrationWarning
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-[#616161] mt-1">
                      At least 8 characters with a mix of letters and numbers.
                    </p>
                  </div>

                  {/* Confirm Password field */}
                  <div>
                    <label 
                      htmlFor="confirm-password" 
                      className="block text-xs lg:text-sm font-semibold text-[#212121] mb-1.5"
                      style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#616161]" />
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full pl-10 pr-11 py-2.5 bg-[#F5F5F5] border-2 border-transparent rounded-xl text-sm text-[#212121] placeholder:text-[#9E9E9E] focus:outline-none focus:border-transparent focus:bg-white transition-colors"
                        style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                        suppressHydrationWarning
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#616161] hover:text-[#212121] transition-colors cursor-pointer"
                        suppressHydrationWarning
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] disabled:bg-[#BDBDBD] text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm text-sm cursor-pointer disabled:cursor-not-allowed"
                    style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                    suppressHydrationWarning
                  >
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </button>

                  {/* Back to login */}
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="w-full flex items-center justify-center gap-2 text-xs lg:text-sm font-medium text-[#616161] hover:text-[#212121] transition-colors cursor-pointer"
                    style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                    suppressHydrationWarning
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </button>
                </form>
              </div>
            </motion.div>
          ) : (
            /* SUCCESS CARD */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
                {/* Success Icon */}
                <div className="text-center mb-6">
                  <div className="flex justify-center items-center mb-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                      className="w-16 h-16 rounded-full bg-[#2E7D32]/10 flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-10 h-10 text-[#2E7D32]" />
                    </motion.div>
                  </div>
                  
                  <h2 
                    className="text-xl lg:text-2xl font-bold text-[#212121] mb-1.5"
                    style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                  >
                    Password Reset Successful!
                  </h2>
                  <p className="text-xs lg:text-sm text-[#616161]">
                    Your password has been successfully reset.
                  </p>
                </div>

                {/* Redirecting message */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2E7D32]/10 text-[#2E7D32] text-xs lg:text-sm">
                    <div className="w-3 h-3 border-2 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
                    Redirecting to login...
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
