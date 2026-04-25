'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Bird, Mail, Lock, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Carousel from '../_components/Carousel';
import OTPInput from '../_components/OTPInput';

type CardView = 'login' | 'forgot' | 'verify' | 'reset' | 'success';

// Gallery images for carousel
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

export default function AdminLoginPage() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<CardView>('login');
  
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // OTP state
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  // Reset password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Slide animation variants
  const slideVariants = {
    enter: {
      x: '100%',
      opacity: 0,
    },
    center: {
      x: 0,
      opacity: 1,
    },
    exit: {
      x: '-100%',
      opacity: 0,
    },
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient();
      
      // Validate inputs
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Successful login - redirect to dashboard
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotLoading(true);

    try {
      const supabase = createClient();

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(forgotEmail)) {
        throw new Error('Please enter a valid email address');
      }

      // Send magic link for password reset
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        forgotEmail,
        {
          redirectTo: `${window.location.origin}/admin/reset-password`,
        }
      );

      if (resetError) throw resetError;

      // Show success state
      setCurrentView('success');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);

    if (otp.length !== 6) {
      setOtpError('Please enter the complete 6-digit code');
      setOtpLoading(false);
      return;
    }

    // TODO: Verify OTP
    setTimeout(() => {
      setOtpLoading(false);
      setCurrentView('reset');
    }, 1000);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);

    // Validate passwords
    if (newPassword.length < 8) {
      setResetError('Password must be at least 8 characters');
      setResetLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      setResetLoading(false);
      return;
    }

    // TODO: Reset password
    setTimeout(() => {
      setResetLoading(false);
      setCurrentView('success');
    }, 1000);
  };

  const handleBackToLogin = () => {
    setCurrentView('login');
    // Reset all states
    setForgotEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setForgotError('');
    setOtpError('');
    setResetError('');
  };

  const handleResendOTP = () => {
    // TODO: Resend OTP
    setOtpError('');
    setOtp('');
  };

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

      {/* Right Side - Login Form (Desktop) / Full screen with background (Mobile) */}
      <div className="w-full lg:w-1/2 relative flex items-center justify-center p-6 lg:p-12">
        {/* Mobile background carousel */}
        <div className="lg:hidden absolute inset-0 z-0">
          <Carousel images={GALLERY_IMAGES} interval={4000} />
          <div className="absolute inset-0 bg-linear-to-br from-[#1B5E20] to-[#2E7D32] opacity-75" />
        </div>

        {/* Card container with AnimatePresence */}
        <div className="relative z-10 w-full max-w-sm">
          <AnimatePresence mode="wait">
            {/* LOGIN CARD */}
            {currentView === 'login' && (
              <motion.div
                key="login"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
                  {/* Header */}
                  <div className="text-center mb-6">
                    {/* Logo */}
                    <div className="flex justify-center items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#2E7D32] flex items-center justify-center">
                        <Bird className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    
                    <h2 
                      className="text-xl lg:text-2xl font-bold text-[#212121] mb-1.5"
                      style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                    >
                      Birdman of Chennai
                    </h2>
                    <p className="text-xs lg:text-sm text-[#616161]">
                      Sign in to manage your properties
                    </p>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="mb-4 p-2.5 rounded-lg bg-[#ffdad6] text-[#ba1a1a] text-xs lg:text-sm">
                      {error}
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Email field */}
                    <div>
                      <label 
                        htmlFor="email" 
                        className="block text-xs lg:text-sm font-semibold text-[#212121] mb-1.5"
                        style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#616161]" />
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@example.com"
                          required
                          className="w-full pl-10 pr-3 py-2.5 bg-[#F5F5F5] border-2 border-transparent rounded-xl text-sm text-[#212121] placeholder:text-[#9E9E9E] focus:outline-none focus:border-transparent focus:bg-white transition-colors"
                          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                          suppressHydrationWarning
                        />
                      </div>
                    </div>

                    {/* Password field */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label 
                          htmlFor="password" 
                          className="text-xs lg:text-sm font-semibold text-[#212121]"
                          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                        >
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setCurrentView('forgot')}
                          className="text-xs lg:text-sm font-medium text-[#2E7D32] hover:text-[#1B5E20] transition-colors cursor-pointer"
                          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                          suppressHydrationWarning
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#616161]" />
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full pl-10 pr-11 py-2.5 bg-[#F5F5F5] border-2 border-transparent rounded-xl text-sm text-[#212121] placeholder:text-[#9E9E9E] focus:outline-none focus:border-transparent focus:bg-white transition-colors"
                          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                          suppressHydrationWarning
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#616161] hover:text-[#212121] transition-colors cursor-pointer"
                          suppressHydrationWarning
                        >
                          {showPassword ? (
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
                      {isLoading ? 'Logging in...' : 'Log In'}
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* FORGOT PASSWORD CARD */}
            {currentView === 'forgot' && (
              <motion.div
                key="forgot"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
                  {/* Header */}
                  <div className="text-center mb-6">
                    {/* Icon */}
                    <div className="flex justify-center items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-[#2E7D32]/10 flex items-center justify-center">
                        <KeyRound className="w-6 h-6 text-[#2E7D32]" />
                      </div>
                    </div>
                    
                    <h2 
                      className="text-xl lg:text-2xl font-bold text-[#212121] mb-1.5"
                      style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                    >
                      Forgot Password
                    </h2>
                    <p className="text-xs lg:text-sm text-[#616161]">
                      Enter your email address to receive a 6-digit OTP.
                    </p>
                  </div>

                  {/* Error message */}
                  {forgotError && (
                    <div className="mb-4 p-2.5 rounded-lg bg-[#ffdad6] text-[#ba1a1a] text-xs lg:text-sm">
                      {forgotError}
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    {/* Email field */}
                    <div>
                      <label 
                        htmlFor="forgot-email" 
                        className="block text-xs lg:text-sm font-semibold text-[#212121] mb-1.5"
                        style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                      >
                        Email address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#616161]" />
                        <input
                          id="forgot-email"
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="e.g. manager@hotel.com"
                          required
                          className="w-full pl-10 pr-3 py-2.5 bg-[#F5F5F5] border-2 border-transparent rounded-xl text-sm text-[#212121] placeholder:text-[#9E9E9E] focus:outline-none focus:border-transparent focus:bg-white transition-colors"
                          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                          suppressHydrationWarning
                        />
                      </div>
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] disabled:bg-[#BDBDBD] text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm text-sm cursor-pointer disabled:cursor-not-allowed"
                      style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                      suppressHydrationWarning
                    >
                      {forgotLoading ? 'Sending...' : 'Get OTP'}
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
            )}

            {/* VERIFY OTP CARD */}
            {currentView === 'verify' && (
              <motion.div
                key="verify"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
                  {/* Header */}
                  <div className="text-center mb-6">
                    {/* Icon */}
                    <div className="flex justify-center items-center mb-4">
                      <div className="w-12 h-12 rounded-full bg-[#2E7D32]/10 flex items-center justify-center">
                        <Mail className="w-6 h-6 text-[#2E7D32]" />
                      </div>
                    </div>
                    
                    <h2 
                      className="text-xl lg:text-2xl font-bold text-[#212121] mb-1.5"
                      style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                    >
                      Verify OTP
                    </h2>
                    <p className="text-xs lg:text-sm text-[#616161]">
                      Enter the 6-digit code sent to your email.
                    </p>
                    {forgotEmail && (
                      <p className="text-xs lg:text-sm text-[#2E7D32] font-medium mt-1">
                        {forgotEmail}
                      </p>
                    )}
                  </div>

                  {/* Error message */}
                  {otpError && (
                    <div className="mb-4 p-2.5 rounded-lg bg-[#ffdad6] text-[#ba1a1a] text-xs lg:text-sm">
                      {otpError}
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    {/* OTP Input */}
                    <div className="py-2">
                      <OTPInput 
                        length={6}
                        value={otp}
                        onChange={setOtp}
                        onComplete={(code) => setOtp(code)}
                      />
                    </div>

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={otpLoading}
                      className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] disabled:bg-[#BDBDBD] text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm text-sm cursor-pointer disabled:cursor-not-allowed"
                      style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                      suppressHydrationWarning
                    >
                      {otpLoading ? 'Verifying...' : 'Verify OTP'}
                    </button>

                    {/* Resend code */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        className="text-xs lg:text-sm font-medium text-[#2E7D32] hover:text-[#1B5E20] transition-colors cursor-pointer"
                        style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                        suppressHydrationWarning
                      >
                        Resend Code
                      </button>
                    </div>

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
            )}

            {/* RESET PASSWORD CARD */}
            {currentView === 'reset' && (
              <motion.div
                key="reset"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
                  {resetError && (
                    <div className="mb-4 p-2.5 rounded-lg bg-[#ffdad6] text-[#ba1a1a] text-xs lg:text-sm">
                      {resetError}
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
                      disabled={resetLoading}
                      className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] disabled:bg-[#BDBDBD] text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm text-sm cursor-pointer disabled:cursor-not-allowed"
                      style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                      suppressHydrationWarning
                    >
                      {resetLoading ? 'Resetting...' : 'Submit'}
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
            )}

            {/* SUCCESS CARD */}
            {currentView === 'success' && (
              <motion.div
                key="success"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
                  {/* Header */}
                  <div className="text-center mb-6">
                    {/* Icon */}
                    <div className="flex justify-center items-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-[#2E7D32] flex items-center justify-center">
                        <CheckCircle2 className="w-9 h-9 text-white" />
                      </div>
                    </div>
                    
                    <h2 
                      className="text-xl lg:text-2xl font-bold text-[#212121] mb-1.5"
                      style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                    >
                      Check Your Email
                    </h2>
                    <p className="text-xs lg:text-sm text-[#616161]">
                      We&apos;ve sent a password reset link to your email. Click the link in the email to reset your password.
                    </p>
                  </div>

                  {/* Log In button */}
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold py-2.5 rounded-lg transition-colors shadow-sm text-sm cursor-pointer"
                    style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                    suppressHydrationWarning
                  >
                    Log In
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Copyright */}
          <p className="text-center text-xs text-[#616161] lg:text-[#9E9E9E] mt-4">
            © 2026 Vormir Techies. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
