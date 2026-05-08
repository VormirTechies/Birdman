'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const FONT = 'var(--font-work-sans, Work Sans, sans-serif)';

export interface SelectOption<T extends string = string> {
  label: string;
  value: T;
}

interface SelectProps<T extends string = string> {
  options: ReadonlyArray<SelectOption<T>>;
  value: T;
  onChange: (value: T) => void;
  /** Icon rendered before the label */
  icon?: React.ReactNode;
  /**
   * When provided, if `value !== defaultValue` the trigger turns green
   * to indicate an active (non-default) selection.
   */
  defaultValue?: T;
  /**
   * 'md' — desktop pill  (rounded-xl, px-4 py-2.5, text-sm)
   * 'sm' — mobile chip   (rounded-full, px-3 py-1.5, text-xs)
   * @default 'md'
   */
  size?: 'sm' | 'md';
  /** Popover content alignment */
  align?: 'start' | 'end' | 'center';
  /** Popover min-width class, e.g. 'w-44' */
  popoverWidth?: string;
  className?: string;
}

export function Select<T extends string = string>({
  options,
  value,
  onChange,
  icon,
  defaultValue,
  size = 'md',
  align = 'end',
  popoverWidth = 'w-44',
  className,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);

  const current = options.find((o) => o.value === value) ?? options[0];
  const isActive = defaultValue !== undefined && value !== defaultValue;

  const triggerSize =
    size === 'sm'
      ? 'rounded-xl px-3 h-11 text-sm'
      : 'rounded-xl px-4 h-11 text-sm';

  const triggerColor = isActive
    ? 'bg-[#2E7D32] text-white'
    : 'bg-[#F5F5F5] text-[#616161] hover:bg-[#E0E0E0]';

  const chevronSize = 'w-3.5 h-3.5';
  const iconSize = 'w-4 h-4';
  const gap = 'gap-2';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center whitespace-nowrap font-medium transition-colors shrink-0',
            gap,
            triggerSize,
            triggerColor,
            className,
          )}
          style={{ fontFamily: FONT }}
          suppressHydrationWarning
        >
          {icon && (
            <span className={cn('shrink-0', iconSize, isActive ? 'text-white' : 'text-[#616161]')}>
              {icon}
            </span>
          )}
          {current.label}
          <ChevronDown className={cn('shrink-0', chevronSize)} />
        </button>
      </PopoverTrigger>

      <PopoverContent className={cn('p-1 bg-white shadow-xl rounded-2xl border border-[#E0E0E0]', popoverWidth)} align={align}>
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { onChange(opt.value); setOpen(false); }}
            className={cn(
              'w-full text-left px-3 py-2 text-sm rounded-lg transition-colors',
              opt.value === value
                ? 'bg-[#E8F5E9] text-[#2E7D32] font-semibold'
                : 'text-[#212121] hover:bg-[#F5F5F5]',
            )}
            style={{ fontFamily: FONT }}
          >
            {opt.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
