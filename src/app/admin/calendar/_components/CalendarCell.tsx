'use client';

import { Ban, Feather } from 'lucide-react';
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

  return (
    <button
      onClick={onClick}
      disabled={!isCurrentMonth}
      className={cn(
        'relative h-24 md:h-28 lg:h-32 p-2 md:p-3 border border-gray-200 transition-all',
        'flex flex-col items-start justify-between',
        'hover:shadow-md',
        getCellBackground(),
        isCurrentMonth ? 'cursor-pointer' : 'cursor-default opacity-40',
        // isToday && 'ring-2 ring-blue-500',
        !isCurrentMonth && 'pointer-events-none'
      )}
      suppressHydrationWarning
    >
      {/* Date Number */}
      <span 
        className={cn(
          'text-lg md:text-xl font-bold',
          getTextColor()
        )}
      >
        {day}
      </span>

      {/* Bottom Section: Booking Count */}
      {isCurrentMonth && !isDisabled && (
        <div className="w-full flex items-center justify-between mt-auto">
          {/* Booking Count with Feather Icon */}
          {bookingCount > 0 && (
            <div className="flex items-center gap-1">
              <span className={cn('text-sm md:text-base font-bold', getTextColor())}>
                {bookingCount}
              </span>
              <Feather 
                className={cn('h-3 w-3 md:h-4 md:w-4', getTextColor())} 
                strokeWidth={2}
              />
            </div>
          )}
          
          {/* Capacity Indicator for Full/Almost Full */}
          {percentage >= 90 && (
            <span className={cn('text-xs md:text-sm font-medium', getTextColor())}>
              {bookingCount}/{maxCapacity}
            </span>
          )}
        </div>
      )}

      {/* Disabled Overlay */}
      {isCurrentMonth && isDisabled && (
        <div className="flex items-center justify-center">
          <span className="text-lg md:text-lg text-gray-400">
            <Ban className="h-5 w-5" />
          </span>
        </div>
      )}
    </button>
  );
}
