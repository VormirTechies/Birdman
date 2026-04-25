'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { DatePicker } from './DatePicker';
import { BookingsTable } from './BookingsTable';
import { BookingsList } from './BookingsList';
import type { Booking } from './BookingsTable';

// Mock data
const MOCK_BOOKINGS: Booking[] = [
  {
    id: '1',
    guestName: 'Eleanor Woods',
    mobile: '+1 (555) 012-3456',
    email: 'eleanor.w@example.com',
    checkInDate: new Date(2023, 9, 24),
    initials: 'EW',
    avatarColor: 'green',
  },
  {
    id: '2',
    guestName: 'Marcus Reed',
    mobile: '+1 (555) 098-7654',
    email: 'm.reed@example.com',
    checkInDate: new Date(2023, 9, 25),
    initials: 'MR',
    avatarColor: 'orange',
  },
  {
    id: '3',
    guestName: 'Sarah Jenkins',
    mobile: '+1 (555) 456-7890',
    email: 'sarah.j@example.com',
    checkInDate: new Date(2023, 9, 26),
    initials: 'SJ',
    avatarColor: 'pink',
  },
  {
    id: '4',
    guestName: 'David Thompson',
    mobile: '+1 (555) 234-5678',
    email: 'david.t@example.com',
    checkInDate: new Date(2023, 9, 27),
    initials: 'DT',
    avatarColor: 'blue',
  },
  {
    id: '5',
    guestName: 'Lisa Anderson',
    mobile: '+1 (555) 876-5432',
    email: 'lisa.a@example.com',
    checkInDate: new Date(2023, 9, 28),
    initials: 'LA',
    avatarColor: 'purple',
  },
  {
    id: '6',
    guestName: 'Michael Chen',
    mobile: '+1 (555) 345-6789',
    email: 'michael.c@example.com',
    checkInDate: new Date(2023, 9, 29),
    initials: 'MC',
    avatarColor: 'green',
  },
];

const ITEMS_PER_PAGE = 3;

export function RecentBookings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);

  // Filter bookings based on search query
  const filteredBookings = useMemo(() => {
    if (!searchQuery) return MOCK_BOOKINGS;
    const query = searchQuery.toLowerCase();
    return MOCK_BOOKINGS.filter(
      (booking) =>
        booking.guestName.toLowerCase().includes(query) ||
        booking.email.toLowerCase().includes(query) ||
        booking.mobile.includes(query)
    );
  }, [searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const totalEntries = filteredBookings.length;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalEntries);
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Section header */}
      <h2
        className="text-xl font-bold text-[#212121] mb-4"
        style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
      >
        Recent Bookings
      </h2>

      {/* Card wrapper */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        {/* Search + Date Picker row */}
        <div className="flex items-center gap-3 mb-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <DatePicker value={selectedDate} onChange={setSelectedDate} />
        </div>

        {/* Desktop: Table */}
          <div className="hidden lg:block">
          <BookingsTable data={paginatedBookings} />
        </div>

        {/* Mobile: List/Cards */}
        <div className="lg:hidden">
          <BookingsList data={paginatedBookings} />
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
        <p
          className="text-sm text-[#616161]"
          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
        >
          Showing {startIndex + 1} to {endIndex} of {totalEntries} entries
        </p>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5 text-[#616161]" />
          </button>

          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 3) {
              pageNum = i + 1;
            } else if (currentPage === 1) {
              pageNum = i + 1;
            } else if (currentPage === totalPages) {
              pageNum = totalPages - 2 + i;
            } else {
              pageNum = currentPage - 1 + i;
            }

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`min-w-9 h-9 px-3 rounded-lg text-sm font-semibold transition-colors ${
                  currentPage === pageNum
                    ? 'bg-[#2E7D32] text-white'
                    : 'text-[#616161] hover:bg-white'
                }`}
                style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
              >
                {pageNum}
              </button>
            );
          })}

          {totalPages > 3 && currentPage < totalPages - 1 && (
            <div className="px-2">
              <MoreHorizontal className="w-5 h-5 text-[#616161]" />
            </div>
          )}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5 text-[#616161]" />
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
