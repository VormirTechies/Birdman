'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  showText?: boolean;
  hideTextOnMobile?: boolean;
  disabled?: (date: Date) => boolean;
  outline?: boolean;
}

export function DatePicker({ 
  value, 
  onChange, 
  showText = true, 
  hideTextOnMobile = false,
  disabled,
  outline = false
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
      setIsOpen(false);
    }
  };

  // Default: Disable dates outside the current month (today's month)
  const defaultDisabledDates = (date: Date) => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    return date < monthStart || date > monthEnd;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 rounded-xl h-11 transition-colors text-sm font-medium text-[#212121] whitespace-nowrap',
            outline 
              ? 'bg-white border-2 border-[#E0E0E0] hover:border-[#2E7D32] hover:bg-[#F1F8F4]'
              : 'bg-[#F5F5F5] hover:bg-[#E0E0E0]',
            // icon-only: perfect square; mobile-hide-text: square on mobile, pill on sm+
            !showText
              ? 'w-11 justify-center'
              : hideTextOnMobile
                ? 'w-11 justify-center sm:w-auto sm:px-4'
                : 'px-4',
          )}
          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
          suppressHydrationWarning
        >
          <CalendarIcon className="w-4 h-4 text-[#616161]" suppressHydrationWarning />
          <span 
            className={cn(
              !showText && 'sr-only',
              hideTextOnMobile && 'hidden sm:inline'
            )}
            suppressHydrationWarning
          >
            {format(value, 'MM/dd/yyyy')}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white shadow-xl rounded-2xl border border-[#E0E0E0]" align="end">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          disabled={disabled || defaultDisabledDates}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
