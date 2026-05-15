'use client';

import { format } from 'date-fns';
import { Phone, Calendar, User, Baby } from 'lucide-react';
import type { Booking } from './BookingsTable';

interface BookingsListProps {
  data: Booking[];
}

const AVATAR_COLORS: Record<string, { bg: string; text: string }> = {
  green: { bg: '#C8E6C9', text: '#2E7D32' },
  orange: { bg: '#FFE0B2', text: '#E65100' },
  pink: { bg: '#F8BBD0', text: '#C2185B' },
  blue: { bg: '#BBDEFB', text: '#1976D2' },
  purple: { bg: '#E1BEE7', text: '#7B1FA2' },
};

export function BookingsList({ data }: BookingsListProps) {
  return (
    <div className="space-y-3">
      {data.map((booking) => {
        const colors = AVATAR_COLORS[booking.avatarColor] || AVATAR_COLORS.blue;
        return (
          <div
            key={booking.id}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            {/* Top row: Avatar + Name + Email */}
            <div className="flex items-start gap-3 mb-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                style={{
                  background: colors.bg,
                  color: colors.text,
                  fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)',
                }}
              >
                {booking.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold text-[#212121] truncate"
                  style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                >
                  {booking.guestName}
                </p>
                <p
                  className="text-xs text-[#616161] truncate"
                  style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                >
                  {booking.email}
                </p>
              </div>
            </div>

            {/* Bottom row: Phone + Guests + Date */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E0E0E0]">
              <div className="flex items-center gap-2 text-[#616161]">
                <Phone className="w-4 h-4 shrink-0" />
                <span
                  className="text-xs"
                  style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                >
                  {booking.mobile}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[#616161]">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span
                    className="text-xs font-medium"
                    style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                  >
                    {booking.adults}
                  </span>
                </div>
                {booking.children > 0 && (
                  <div className="flex items-center gap-1 text-[#616161]">
                    <Baby className="w-3.5 h-3.5 shrink-0" />
                    <span
                      className="text-xs font-medium"
                      style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                    >
                      {booking.children}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-[#616161]">
                <Calendar className="w-4 h-4 shrink-0" />
                <span
                  className="text-xs"
                  style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                >
                  {format(booking.checkInDate, 'MMM dd')}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
