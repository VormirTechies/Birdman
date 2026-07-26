'use client';

import Link from 'next/link';
import { ArrowRight, CalendarDays, Clock, Crown, Users } from 'lucide-react';

export interface RecentBooking {
  id: string;
  visitorName: string;
  numberOfGuests: number;
  bookingDate: string;
  bookingTime: string;
  status: string;
  isVip: boolean;
}

interface RecentBookingsProps {
  bookings: RecentBooking[];
  isLoading?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-[#E8F5E9] text-[#2E7D32]',
  completed: 'bg-[#E3F2FD] text-[#1565C0]',
  cancelled: 'bg-[#FFEBEE] text-[#C62828]',
};

function displayDate(value: string) {
  if (!value) return 'Date unavailable';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function displayTime(value: string) {
  if (!value) return 'Time unavailable';
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function RecentBookings({ bookings, isLoading = false }: RecentBookingsProps) {
  return (
    <section aria-labelledby="recent-bookings-heading">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2
          id="recent-bookings-heading"
          className="text-xl font-bold text-[#212121]"
          style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
        >
          Recent Bookings
        </h2>
        <Link
          href="/admin/history"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2E7D32] transition-colors hover:text-[#1B5E20]"
        >
          View More Bookings
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {isLoading ? (
          <div className="divide-y divide-[#EEEEEE]" aria-label="Loading recent bookings">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex animate-pulse items-center gap-4 p-4">
                <div className="h-10 w-10 rounded-full bg-[#EEEEEE]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-36 rounded bg-[#EEEEEE]" />
                  <div className="h-3 w-52 rounded bg-[#F5F5F5]" />
                </div>
              </div>
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <CalendarDays className="mx-auto mb-3 h-8 w-8 text-[#BDBDBD]" />
            <p className="font-medium text-[#424242]">No recent bookings</p>
            <p className="mt-1 text-sm text-[#757575]">
              New bookings will appear here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#EEEEEE]">
            {bookings.slice(0, 5).map((booking) => {
              const initial = booking.visitorName.trim().charAt(0).toUpperCase() || '?';
              const status = booking.status.toLowerCase();

              return (
                <li
                  key={booking.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F5E9] font-semibold text-[#2E7D32]">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate font-semibold text-[#212121]">
                          {booking.visitorName || 'Unknown visitor'}
                        </p>
                        {booking.isVip && (
                          <Crown
                            className="h-4 w-4 shrink-0 text-[#FF8C00]"
                            aria-label="VIP visitor"
                          />
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#616161]">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {booking.numberOfGuests} {booking.numberOfGuests === 1 ? 'guest' : 'guests'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {displayDate(booking.bookingDate)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {displayTime(booking.bookingTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                      STATUS_STYLES[status] ?? 'bg-[#F5F5F5] text-[#616161]'
                    }`}
                  >
                    {booking.status}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
