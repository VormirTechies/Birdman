'use client';

import { format } from 'date-fns';
import { Calendar } from 'lucide-react';

export interface Booking {
  id: string;
  guestName: string;
  mobile: string;
  email: string;
  checkInDate: Date;
  initials: string;
  avatarColor: string;
}

interface BookingsTableProps {
  data: Booking[];
}

const AVATAR_COLORS: Record<string, { bg: string; text: string }> = {
  green: { bg: '#C8E6C9', text: '#2E7D32' },
  orange: { bg: '#FFE0B2', text: '#E65100' },
  pink: { bg: '#F8BBD0', text: '#C2185B' },
  blue: { bg: '#BBDEFB', text: '#1976D2' },
  purple: { bg: '#E1BEE7', text: '#7B1FA2' },
};

export function BookingsTable({ data }: BookingsTableProps) {
  return (
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
              Mobile Number
            </th>
            <th
              className="text-left px-6 py-3.5 text-xs font-semibold text-[#616161] uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
            >
              Email
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
          {data.map((booking) => {
            const colors = AVATAR_COLORS[booking.avatarColor] || AVATAR_COLORS.blue;
            return (
              <tr key={booking.id} className="border-b border-[#E0E0E0] last:border-0 hover:bg-[#F5F5F5] transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                      style={{
                        background: colors.bg,
                        color: colors.text,
                        fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)',
                      }}
                    >
                      {booking.initials}
                    </div>
                    <span
                      className="text-sm font-medium text-[#212121]"
                      style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                    >
                      {booking.guestName}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className="text-sm text-[#616161]"
                    style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                  >
                    {booking.mobile}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className="text-sm text-[#616161]"
                    style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                  >
                    {booking.email}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-[#616161]">
                    <Calendar className="w-4 h-4" />
                    <span style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}>
                      {format(booking.checkInDate, 'MMM dd, yyyy')}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
