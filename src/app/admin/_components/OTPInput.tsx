'use client';

import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react';

interface OTPInputProps {
  length?: number;
  onComplete?: (otp: string) => void;
  value?: string;
  onChange?: (otp: string) => void;
}

export default function OTPInput({ 
  length = 6, 
  onComplete,
  value = '',
  onChange 
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(
    value.split('').concat(Array(length - value.length).fill(''))
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, val: string) => {
    // Only allow single digit
    const newValue = val.slice(-1);
    
    if (!/^\d*$/.test(newValue)) return;

    const newOtp = [...otp];
    newOtp[index] = newValue;
    setOtp(newOtp);

    const otpString = newOtp.join('');
    onChange?.(otpString);

    // Auto-focus next input
    if (newValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger onComplete when all digits are entered
    if (otpString.length === length && !otpString.includes('')) {
      onComplete?.(otpString);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // If current input is empty, focus previous and clear it
        inputRefs.current[index - 1]?.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        onChange?.(newOtp.join(''));
      } else if (otp[index]) {
        // Clear current input
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
        onChange?.(newOtp.join(''));
      }
    }

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(Array(length - pastedData.length).fill(''));
    setOtp(newOtp);
    onChange?.(pastedData);

    // Focus the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();

    // Trigger onComplete if all digits are filled
    if (pastedData.length === length) {
      onComplete?.(pastedData);
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otp[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className="w-12 h-12 text-center text-lg font-bold bg-[#F5F5F5] border-2 border-transparent rounded-xl text-[#212121] focus:outline-none focus:border-[#2E7D32] focus:bg-white transition-colors"
          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
        />
      ))}
    </div>
  );
}
