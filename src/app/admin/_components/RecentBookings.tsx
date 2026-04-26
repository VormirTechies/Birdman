'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { DatePicker } from './DatePicker';
import { BookingsTable } from './BookingsTable';
import { BookingsList } from './BookingsList';
import type { Booking } from './BookingsTable';

interface RecentBookingsProps {
  refreshKey?: number;
}

const ITEMS_PER_PAGE = 5;

export function RecentBookings({ refreshKey }: RecentBookingsProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch bookings from API with server-side pagination
  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const today = new Date().toISOString().split('T')[0];
        const params = new URLSearchParams({
          limit: ITEMS_PER_PAGE.toString(),
          offset: ((currentPage - 1) * ITEMS_PER_PAGE).toString(),
          minDate: today, // Only show today and upcoming bookings
          status: 'confirmed', // Only show confirmed bookings (not completed/cancelled)
        });

        // Add search filter (server-side)
        if (searchQuery) {
          params.append('search', searchQuery);
        }

        // Add date filter if selected
        if (selectedDate) {
          const dateStr = selectedDate.toISOString().split('T')[0];
          params.append('date', dateStr);
        }

        const response = await fetch(`/api/bookings?${params.toString()}`, {
          cache: 'no-cache',
        });

        const data = await response.json();

        if (data.success && Array.isArray(data.bookings)) {
          // Transform API data to match Booking interface
          const transformedBookings: Booking[] = data.bookings.map((b: any) => ({
            id: b.id,
            guestName: b.visitor_name || b.visitorName,
            mobile: b.phone,
            email: b.email || '',
            checkInDate: new Date(b.booking_date || b.bookingDate),
            initials: (b.visitor_name || b.visitorName || 'XX')
              .split(' ')
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2),
            avatarColor: ['green', 'orange', 'pink', 'blue', 'purple'][
              Math.floor(Math.random() * 5)
            ] as 'green' | 'orange' | 'pink' | 'blue' | 'purple',
          }));

          setBookings(transformedBookings);
          setTotalCount(data.total || transformedBookings.length);
        }
      } catch (error) {
        console.error('[RecentBookings] Error fetching bookings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [currentPage, selectedDate, refreshKey, searchQuery]);

  // All filtering is now server-side, no client-side filtering needed
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const totalEntries = totalCount;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalEntries);
  const paginatedBookings = bookings;

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Reset to page 1 when search query or date changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDate]);

  // Skeleton loader component
  const TableSkeleton = () => (
    <>
      {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
        <tr key={i} className="border-b border-[#E0E0E0] last:border-0">
          <td className="py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#F5F5F5] animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-32 bg-[#F5F5F5] rounded animate-pulse" />
                <div className="h-3 w-40 bg-[#F5F5F5] rounded animate-pulse" />
              </div>
            </div>
          </td>
          <td className="py-3 px-4 hidden lg:table-cell">
            <div className="h-4 w-24 bg-[#F5F5F5] rounded animate-pulse" />
          </td>
        </tr>
      ))}
    </>
  );

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
          <DatePicker value={selectedDate || new Date()} onChange={setSelectedDate} />
        </div>

        {paginatedBookings.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <p className="text-[#616161]">No upcoming bookings found</p>
          </div>
        ) : (
          <>
            {/* Desktop: Table */}
            <div className="hidden lg:block">
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E0E0E0]">
                      <th
                        className="text-left px-6 py-3.5 text-xs font-semibold text-[#616161] uppercase tracking-wider"
                        style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                      >
                        Guest Name
                      </th>
                      <th
                        className="text-left px-6 py-3.5 text-xs font-semibold text-[#616161] uppercase tracking-wider"
                        style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                      >
                        Check-in Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <TableSkeleton />
                    ) : (
                      paginatedBookings.map((booking) => {
                        const avatarColors: Record<string, { bg: string; text: string }> = {
                          green: { bg: '#C8E6C9', text: '#2E7D32' },
                          orange: { bg: '#FFE0B2', text: '#E65100' },
                          pink: { bg: '#F8BBD0', text: '#C2185B' },
                          blue: { bg: '#BBDEFB', text: '#1976D2' },
                          purple: { bg: '#E1BEE7', text: '#7B1FA2' },
                        };
                        const colors = avatarColors[booking.avatarColor] || avatarColors.green;

                        return (
                          <tr key={booking.id} className="border-b border-[#E0E0E0] last:border-0 hover:bg-[#F5F5F5] transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
                                  style={{ backgroundColor: colors.bg, color: colors.text }}
                                >
                                  {booking.initials}
                                </div>
                                <div>
                                  <p className="font-medium text-[#212121]" style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}>
                                    {booking.guestName}
                                  </p>
                                  <p className="text-sm text-[#616161]">{booking.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm text-[#212121]" style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}>
                                {booking.checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile: List/Cards */}
            <div className="lg:hidden">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(ITEMS_PER_PAGE)].map((_, i) => (
                    <div key={i} className="p-4 border border-[#E0E0E0] rounded-xl">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-[#F5F5F5] animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 bg-[#F5F5F5] rounded animate-pulse" />
                          <div className="h-3 w-40 bg-[#F5F5F5] rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="h-3 w-24 bg-[#F5F5F5] rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <BookingsList data={paginatedBookings} />
              )}
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#E0E0E0]">
        <p
          className="text-sm font-medium text-[#424242]"
          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
        >
          {startIndex + 1} to {endIndex} of {totalEntries}
        </p>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
            suppressHydrationWarning
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
                suppressHydrationWarning
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
            suppressHydrationWarning
          >
            <ChevronRight className="w-5 h-5 text-[#616161]" />
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
