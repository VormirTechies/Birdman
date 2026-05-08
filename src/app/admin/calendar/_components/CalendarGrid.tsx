'use client';

import { useState, useEffect } from 'react';
import { CalendarCell } from './CalendarCell';
import { toast } from 'sonner';

interface DayData {
  date: string;
  bookingCount: number;
  maxCapacity: number;
  isOpen: boolean;
  startTime: string;
  percentage: number;
}

interface CalendarGridProps {
  currentMonth: Date;
  onDayClick: (date: string, dayData: DayData) => void;
}

/**
 * CalendarGrid Component
 * 
 * Renders the 7-column calendar grid (SUN-SAT)
 * Features:
 * - Fetches monthly booking stats from API
 * - Handles month state and data mapping
 * - Generates all days including padding for week alignment
 */
export function CalendarGrid({ currentMonth, onDayClick }: CalendarGridProps) {
  const [daysData, setDaysData] = useState<Record<string, DayData>>({});
  const [loading, setLoading] = useState(true);

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  
  // Helper to format date in local timezone as YYYY-MM-DD
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const today = formatLocalDate(new Date());

  // Fetch monthly data whenever currentMonth changes
  useEffect(() => {
    const fetchMonthData = async () => {
      setLoading(true);
      try {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1; // JavaScript months are 0-indexed

        const response = await fetch(
          `/api/calendar/month?year=${year}&month=${month}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch calendar data');
        }

        const data = await response.json();

        // Convert array to map for quick lookup
        const dataMap: Record<string, DayData> = {};
        data.days.forEach((day: DayData) => {
          dataMap[day.date] = day;
        });

        setDaysData(dataMap);
      } catch (error) {
        console.error('[CalendarGrid] Error fetching data:', error);
        toast.error('Failed to load calendar data');
      } finally {
        setLoading(false);
      }
    };

    fetchMonthData();
  }, [currentMonth]);

  // Generate calendar grid days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday

    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const lastDate = lastDay.getDate();

    const days = [];

    // Previous month padding
    const prevMonth = new Date(year, month, 0);
    const prevMonthLastDate = prevMonth.getDate();

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDate - i);
      days.push({
        date,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let date = 1; date <= lastDate; date++) {
      const day = new Date(year, month, date);
      days.push({
        date: day,
        isCurrentMonth: true,
      });
    }

    // Next month padding (to fill remaining slots)
    const remainingSlots = 42 - days.length; // 6 rows × 7 columns = 42 cells
    for (let date = 1; date <= remainingSlots; date++) {
      const day = new Date(year, month + 1, date);
      days.push({
        date: day,
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();

  if (loading) {
    return (
      <div className="space-y-2">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-gray-300/50 border border-gray-300 rounded-t-md">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-bold text-gray-600 uppercase py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Loading Skeleton */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <div
              key={i}
              className="h-24 md:h-28 lg:h-32 bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 bg-gray-300/50 border border-gray-300 rounded-t-md">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-bold text-gray-600 uppercase py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 rounded-b-md">
        {calendarDays.map((dayInfo, index) => {
          const dateStr = formatLocalDate(dayInfo.date);
          const dayData = daysData[dateStr];
          const isPast = dateStr < today;
          const isToday = dateStr === today;

          return (
            <CalendarCell
              key={index}
              date={dayInfo.date}
              bookingCount={dayData?.bookingCount ?? 0}
              maxCapacity={dayData?.maxCapacity ?? 100}
              percentage={dayData?.percentage ?? 0}
              isOpen={dayData?.isOpen ?? true}
              isCurrentMonth={dayInfo.isCurrentMonth}
              isToday={isToday}
              isPast={isPast}
              onClick={() => {
                if (dayInfo.isCurrentMonth) {
                  onDayClick(dateStr, dayData ?? { bookingCount: 0, maxCapacity: 100, percentage: 0, isOpen: true, startTime: '16:30:00' });
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
