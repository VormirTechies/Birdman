'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuestCounterProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function GuestCounter({
  label,
  value,
  onChange,
  min,
  max,
  icon,
  disabled = false,
}: GuestCounterProps) {
  const handleDecrement = () => {
    if (value > min && !disabled) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max && !disabled) {
      onChange(value + 1);
    }
  };

  const isDecrementDisabled = disabled || value <= min;
  const isIncrementDisabled = disabled || value >= max;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && <div className="text-[#616161]">{icon}</div>}
        <label className="text-sm font-medium text-[#212121]" style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}>
          {label}
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={isDecrementDisabled}
          className={cn(
            'w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-colors',
            isDecrementDisabled
              ? 'border-[#E0E0E0] bg-[#F5F5F5] text-[#9E9E9E] cursor-not-allowed'
              : 'border-[#2E7D32] bg-white text-[#2E7D32] hover:bg-[#F1F8F4] active:bg-[#E8F5E9]'
          )}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center text-base font-semibold text-[#212121]" style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}>
          {value}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={isIncrementDisabled}
          className={cn(
            'w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-colors',
            isIncrementDisabled
              ? 'border-[#E0E0E0] bg-[#F5F5F5] text-[#9E9E9E] cursor-not-allowed'
              : 'border-[#2E7D32] bg-white text-[#2E7D32] hover:bg-[#F1F8F4] active:bg-[#E8F5E9]'
          )}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
