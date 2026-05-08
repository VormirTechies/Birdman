'use client';

import { useState } from 'react';
import { CalendarHeader } from './_components/CalendarHeader';
import { CalendarGrid } from './_components/CalendarGrid';
import { DayDetailsModal } from './_components/DayDetailsModal';
import { CalendarLegend } from './_components/CalendarLegend';

interface DayData {
  date: string;
  bookingCount: number;
  maxCapacity: number;
  isOpen: boolean;
  startTime: string;
  percentage: number;
}

/**
 * Calendar Page
 * 
 * Main calendar view for managing daily booking capacity and settings
 * Features:
 * - Month-by-month view with color-coded cells
 * - Click any date to open settings modal
 * - Manage capacity, operating hours, and open/close status
 */
export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle month navigation
  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  // Handle day click
  const handleDayClick = (date: string, dayData: DayData) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDate(null);
  };

  // Handle save - refresh calendar data
  const handleSave = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      {/* <div>
        <h1 className="text-3xl font-bold text-gray-900">Calendar Management</h1>
        <p className="text-gray-600 mt-1">
          Manage daily capacity, operating hours, and booking availability
        </p>
      </div> */}

      <div className="bg-white rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
        
        {/* Calendar Header with Navigation */}
        <CalendarHeader
          currentMonth={currentMonth}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
        />

        {/* Calendar Grid */}
        <CalendarGrid
          key={refreshKey} // Force refresh when settings change
          currentMonth={currentMonth}
          onDayClick={handleDayClick}
        />

        {/* Legend */}
        <CalendarLegend />

      </div>

      
      

      {/* Day Details Modal */}
      <DayDetailsModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        date={selectedDate}
        onSave={handleSave}
      />
    </div>
  );
}
