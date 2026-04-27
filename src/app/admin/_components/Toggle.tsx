'use client';

import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
}

/**
 * Custom Toggle Switch Component
 * 
 * A reusable toggle switch matching the design system
 * Used for Open/Closed states in calendar settings
 */
export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  description,
}: ToggleProps) {
  return (
    <div className="flex items-center justify-between">
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <h4 className="font-semibold font-family-body text-gray-900">{label}</h4>
          )}
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
      )}
      
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2',
          checked ? 'bg-[#2E7D32]' : 'bg-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        suppressHydrationWarning
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  );
}
