'use client';

import { useEffect } from 'react';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
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
    <div className="bg-white rounded-lg border border-[#E0E0E0] p-6 space-y-6">
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-5 h-5 text-[#2E7D32]" />
        <h2 className="text-lg font-semibold text-[#212121]">Select Date Range</h2>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setApplyMode('all_days')}
          className={`p-4 rounded-lg border-2 transition-all ${
            applyMode === 'all_days'
              ? 'border-[#2E7D32] bg-[#E8F5E9]'
              : 'border-[#E0E0E0] hover:border-[#BDBDBD]'
          }`}
        >
          <div className="font-medium text-[#212121]">All Days</div>
          <div className="text-sm text-[#616161] mt-1">Apply to all future dates</div>
        </button>

        <button
          onClick={() => setApplyMode('one_day')}
          className={`p-4 rounded-lg border-2 transition-all ${
            applyMode === 'one_day'
              ? 'border-[#2E7D32] bg-[#E8F5E9]'
              : 'border-[#E0E0E0] hover:border-[#BDBDBD]'
          }`}
        >
          <div className="font-medium text-[#212121]">One Day</div>
          <div className="text-sm text-[#616161] mt-1">Apply to a specific date</div>
        </button>

        <button
          onClick={() => setApplyMode('date_range')}
          className={`p-4 rounded-lg border-2 transition-all ${
            applyMode === 'date_range'
              ? 'border-[#2E7D32] bg-[#E8F5E9]'
              : 'border-[#E0E0E0] hover:border-[#BDBDBD]'
          }`}
        >
          <div className="font-medium text-[#212121]">Date Range</div>
          <div className="text-sm text-[#616161] mt-1">Apply to a range of dates</div>
        </button>
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
        <div className="flex gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            Changes will be applied to all dates in the calendar (today to next 180 days)
          </p>
        </div>
      )}
    </div>
  );
}
