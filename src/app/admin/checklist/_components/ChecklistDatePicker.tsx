'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ChecklistDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

export function ChecklistDatePicker({ value, onChange }: ChecklistDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-2 bg-[#F5F5F5] rounded-xl px-3 py-2 hover:bg-[#E0E0E0] transition-colors text-sm font-medium text-[#212121] whitespace-nowrap',
          )}
          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
          suppressHydrationWarning
        >
          <CalendarIcon className="w-4 h-4 text-[#616161]" />
          <span className="hidden sm:inline">Select Date</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white shadow-xl rounded-2xl border border-[#E0E0E0]" align="end">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
