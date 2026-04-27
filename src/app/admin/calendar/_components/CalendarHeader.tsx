'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../_components/Button';
import { CalendarLegend } from './CalendarLegend';

interface CalendarHeaderProps {
  currentMonth: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

/**
 * CalendarHeader Component
 * 
 * Displays the current month/year with navigation arrows
 * Includes the CalendarLegend for color-coded reference
 */
export function CalendarHeader({
  currentMonth,
  onPreviousMonth,
  onNextMonth,
}: CalendarHeaderProps) {
  // Format month and year for display
  const monthName = currentMonth.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">

        <h1 className='text-3xl font-bold hidden md:block'>Calendar</h1>

        <h2 className="text-xl font-family-body text-gray-900">
          {monthName}
        </h2>
        
        <div className="flex items-center">
          <button
            onClick={onPreviousMonth}
            aria-label="Previous month"
            className="flex items-center justify-center h-10 px-3 text-sm font-medium text-gray-700 bg-[#EEE] rounded-l-lg hover:bg-gray-200 transition-colors cursor-pointer"
            suppressHydrationWarning
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          
          <button
            onClick={onNextMonth}
            aria-label="Next month"
            className="flex items-center justify-center h-10 px-3 text-sm font-medium text-gray-700 bg-[#EEE] rounded-r-lg hover:bg-gray-200 transition-colors cursor-pointer"
            suppressHydrationWarning
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
