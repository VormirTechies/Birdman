'use client';

import { Feather } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarCellProps {
  date: Date;
  bookingCount: number;
  maxCapacity: number;
  percentage: number;
  isOpen: boolean;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  onClick: () => void;
}

/**
 * CalendarCell Component
 * 
 * Individual date cell in the calendar grid
 * Features:
 * - Color-coded by capacity (white: 0, light green: 1-70%, dark green: 71-100%)
 * - Feather icon for booking count indicator
 * - Mini progress bar
 * - Click to open day details modal
 */
export function CalendarCell({
  date,
  bookingCount,
  maxCapacity,
  percentage,
  isOpen,
  isCurrentMonth,
  isToday,
  isPast,
  onClick,
}: CalendarCellProps) {
  const day = date.getDate();
  const isDisabled = isPast || !isOpen;

  // Determine background color based on capacity
  const getCellBackground = () => {
    if (isDisabled) return 'bg-gray-300';
    if (bookingCount === 0) return 'bg-white';
    if (percentage <= 70) return 'bg-green-100';
    return 'bg-green-700';
  };

  // Text color for readability
  const getTextColor = () => {
    if (isDisabled) return 'text-gray-500';
    if (percentage > 70) return 'text-white';
    return 'text-gray-900';
  };

  // Progress bar color
  const getProgressColor = () => {
    if (isDisabled) return 'bg-gray-400';
    if (percentage <= 70) return 'bg-green-500';
    return 'bg-green-900';
  };

  return (
    <button
      onClick={onClick}
      disabled={!isCurrentMonth}
      className={cn(
        'relative min-h-[100px] p-3 border rounded-lg transition-all',
        'flex flex-col items-start justify-between',
        'hover:shadow-md hover:scale-105',
        getCellBackground(),
        isCurrentMonth ? 'cursor-pointer' : 'cursor-default opacity-40',
        isToday && 'ring-2 ring-blue-500',
        !isCurrentMonth && 'pointer-events-none'
      )}
      suppressHydrationWarning
    >
      {/* Date Number */}
      <div className="flex items-center justify-between w-full">
        <span 
          className={cn(
            'text-sm font-semibold',
            getTextColor()
          )}
        >
          {day}
        </span>

        {/* Booking Count Indicator (Feather Icon) */}
        {isCurrentMonth && bookingCount > 0 && (
          <div className="flex items-center gap-1">
            <Feather 
              className={cn('h-3 w-3', getTextColor())} 
              strokeWidth={2.5}
            />
            <span className={cn('text-xs font-medium', getTextColor())}>
              {bookingCount}
            </span>
          </div>
        )}
      </div>

      {/* Capacity Info */}
      {isCurrentMonth && !isDisabled && (
        <div className="w-full space-y-1">
          {/* Mini Progress Bar */}
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={cn('h-full transition-all', getProgressColor())}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          {/* Percentage Text */}
          <p className={cn('text-xs', getTextColor())}>
            {bookingCount}/{maxCapacity}
          </p>
        </div>
      )}

      {/* Disabled Overlay */}
      {isCurrentMonth && isDisabled && (
        <p className="text-xs text-gray-500 mt-auto">
          {isPast ? 'Past' : 'Closed'}
        </p>
      )}
    </button>
  );
}
