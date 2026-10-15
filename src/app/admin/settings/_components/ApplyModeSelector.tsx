'use client';

import { useEffect } from 'react';
import { CalendarDays, CalendarRange, CalendarCheck2, Check, Info } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { DatePicker } from '../../_components/DatePicker';
import type { ApplyMode } from '../page';

interface ApplyModeSelectorProps {
  applyMode: ApplyMode;
  setApplyMode: (mode: ApplyMode) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
}

export function ApplyModeSelector({
  applyMode,
  setApplyMode,
  selectedDate,
  setSelectedDate,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: ApplyModeSelectorProps) {
  // Helper: Convert Date to local YYYY-MM-DD string
  const toLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper: Parse YYYY-MM-DD string as local Date
  const fromLocalDateString = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Initialize dates when mode changes
  useEffect(() => {
    const today = toLocalDateString(new Date());
    
    // Set default date for one_day mode
    if (applyMode === 'one_day' && !selectedDate) {
      setSelectedDate(today);
    }
    
    // Set default dates for date_range mode
    if (applyMode === 'date_range') {
      if (!startDate) {
        setStartDate(today);
      }
      if (!endDate) {
        setEndDate(today);
      }
    }
  }, [applyMode, selectedDate, startDate, endDate, setSelectedDate, setStartDate, setEndDate]);

  // Disable past dates (dates before today)
  const disablePastDates = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // For end date, also disable dates before start date
  const disableBeforeStartDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    
    if (startDate) {
      const start = fromLocalDateString(startDate);
      start.setHours(0, 0, 0, 0);
      return date < start;
    }
    return false;
  };

  return (
    <section className="space-y-5 rounded-2xl border border-[#e2e8e1] bg-white p-5 sm:p-6" aria-labelledby="settings-dates-title">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#edf3ec] text-xs font-semibold text-[#48714e]">01</span>
        <div><h2 id="settings-dates-title" className="text-base font-semibold text-[#294134]" style={{ fontFamily: 'inherit' }}>Select Date Range</h2>
          <p className="mt-1 text-xs leading-5 text-[#849086]">Choose where your changes should apply.</p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {([
          { mode: 'all_days', title: 'All Days', subtitle: 'The full booking window', icon: CalendarDays },
          { mode: 'one_day', title: 'One Day', subtitle: 'One specific date', icon: CalendarCheck2 },
          { mode: 'date_range', title: 'Date Range', subtitle: 'A custom date window', icon: CalendarRange },
        ] as const).map(({ mode, title, subtitle, icon: Icon }) => (
          <button key={mode} type="button" aria-pressed={applyMode === mode} onClick={() => setApplyMode(mode)}
            className={`relative flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors sm:block sm:p-4 ${applyMode === mode ? 'border-[#81a384] bg-[#f0f6ee] text-[#2b5536]' : 'border-[#e7ece6] text-[#738076] hover:border-[#b6c9b5] hover:bg-[#fafcf9]'}`}>
            <Icon className="size-5 shrink-0 sm:mb-4" aria-hidden="true" />
            <span className="block text-sm font-medium">{title}<span className="mt-1 block text-[11px] font-normal leading-4 text-[#849086]">{subtitle}</span></span>
            {applyMode === mode && <Check className="absolute right-3 top-3 size-3.5 text-[#48794c]" aria-hidden="true" />}
          </button>
        ))}
      </div>

      {/* Date Inputs Based on Mode */}
      {applyMode === 'one_day' && (
        <div className="space-y-2">
          <Label className="text-[#212121] font-medium">
            Select Date
          </Label>
          <div>
            <DatePicker
              value={selectedDate ? fromLocalDateString(selectedDate) : new Date()}
              onChange={(date) => {
                const formatted = toLocalDateString(date);
                setSelectedDate(formatted);
              }}
              showText={true}
              hideTextOnMobile={false}
              disabled={disablePastDates}
              outline={true}
            />
          </div>
        </div>
      )}

      {applyMode === 'date_range' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[#212121] font-medium">
              Start Date
            </Label>
            <div>
              <DatePicker
                value={startDate ? fromLocalDateString(startDate) : new Date()}
                onChange={(date) => {
                  const formatted = toLocalDateString(date);
                  setStartDate(formatted);
                }}
                showText={true}
                hideTextOnMobile={false}
                disabled={disablePastDates}
                outline={true}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[#212121] font-medium">
              End Date
            </Label>
            <div>
              <DatePicker
                value={endDate ? fromLocalDateString(endDate) : new Date()}
                onChange={(date) => {
                  const formatted = toLocalDateString(date);
                  setEndDate(formatted);
                }}
                showText={true}
                hideTextOnMobile={false}
                disabled={disableBeforeStartDate}
                outline={true}
              />
            </div>
          </div>
        </div>
      )}

      {applyMode === 'all_days' && (
        <div className="flex gap-2.5 rounded-xl bg-[#f6f8f4] p-3.5">
          <Info className="mt-0.5 size-3.5 shrink-0 text-[#7c947b]" aria-hidden="true" />
          <p className="text-xs leading-5 text-[#7b897a]">
            Changes apply to today through 180 days ahead (181 dates, inclusive), using India time. Dates outside this window stay unchanged.
          </p>
        </div>
      )}
    </section>
  );
}
