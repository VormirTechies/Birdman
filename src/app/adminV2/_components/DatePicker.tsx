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
}

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
      setIsOpen(false);
    }
  };

  // Disable dates outside the current month (today's month)
  const disabledDates = (date: Date) => {
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
            'flex items-center gap-2 bg-[#F5F5F5] rounded-xl px-4 py-2.5 hover:bg-[#E0E0E0] transition-colors text-sm font-medium text-[#212121] whitespace-nowrap',
          )}
          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
        >
          <CalendarIcon className="w-4 h-4 text-[#616161]" />
          {format(value, 'MM/dd/yyyy')}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white shadow-xl rounded-2xl border border-[#E0E0E0]" align="end">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          disabled={disabledDates}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
