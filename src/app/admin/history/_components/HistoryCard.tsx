'use client';

import { Clock, Phone, Mail, Users } from 'lucide-react';
import { format } from 'date-fns';
import { formatLocalDate } from '@/lib/utils';
import type { HistoryBooking } from './HistoryTable';

const FONT = 'var(--font-work-sans, Work Sans, sans-serif)';

function getVisitedStatus(b: HistoryBooking): 'visited' | 'no-show' | 'upcoming' {
  if (b.visited) return 'visited';
  const today = formatLocalDate(new Date());
  return b.bookingDate < today ? 'no-show' : 'upcoming';
}

const AVATAR_PALETTE = [
  { bg: '#C8E6C9', text: '#2E7D32' },
  { bg: '#FFE0B2', text: '#E65100' },
  { bg: '#F8BBD0', text: '#C2185B' },
  { bg: '#BBDEFB', text: '#1976D2' },
  { bg: '#E1BEE7', text: '#7B1FA2' },
];

function avatarColor(name: string) {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatTime(time: string) {
  const [h, m] = time.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour < 12 ? 'AM' : 'PM';
  const display = hour % 12 || 12;
  return `${display}:${m} ${ampm}`;
}

interface HistoryCardProps {
  booking: HistoryBooking;
}

export function HistoryCard({ booking: b }: HistoryCardProps) {
  const vstatus = getVisitedStatus(b);
  const colors = avatarColor(b.visitorName);
  const initials = getInitials(b.visitorName);

  const badgeConfig = {
    visited: { label: 'Visited', cls: 'bg-[#E8F5E9] text-[#2E7D32]' },
    'no-show': { label: 'No Show', cls: 'bg-[#F5F5F5] text-[#616161]' },
    upcoming: { label: 'Yet to Visit', cls: 'bg-[#FFF8E1] text-[#F57F17]' },
  }[vstatus];

  return (
    <div
      className="bg-white rounded-2xl p-4 shadow-sm border border-[#F0F0F0]"
      style={{ fontFamily: FONT }}
    >
      {/* Top: avatar + name + date + badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
            style={{ background: colors.bg, color: colors.text, fontFamily: FONT }}
          >
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#212121]" style={{ fontFamily: FONT }}>
              {b.visitorName}
            </p>
            <div className="flex items-center gap-1 mt-0.5 text-[#9E9E9E]">
              <Clock className="w-3 h-3" />
              <span className="text-xs" style={{ fontFamily: FONT }}>
                {format(new Date(`${b.bookingDate}T00:00:00`), 'MMM dd, yyyy')} · {formatTime(b.bookingTime)}
              </span>
            </div>
          </div>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${badgeConfig.cls}`}
          style={{ fontFamily: FONT }}
        >
          {badgeConfig.label}
        </span>
      </div>

      {/* Details grid */}
      <div className="space-y-2 pt-3 border-t border-[#F0F0F0]">
        {/* Mobile */}
        <div className="flex items-center gap-2 text-[#616161]">
          <Phone className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs" style={{ fontFamily: FONT }}>
            {b.phone}
          </span>
        </div>

        {/* Email */}
        {b.email && (
          <div className="flex items-center gap-2 text-[#616161]">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs truncate" style={{ fontFamily: FONT }}>
              {b.email}
            </span>
          </div>
        )}

        {/* Guest Count */}
        <div className="flex items-center gap-2 text-[#616161]">
          <Users className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs" style={{ fontFamily: FONT }}>
            {b.children > 0 
              ? `${b.adults} Adult${b.adults !== 1 ? 's' : ''} + ${b.children} Child${b.children !== 1 ? 'ren' : ''}`
              : `${b.adults} ${b.adults === 1 ? 'Adult' : 'Adults'}`
            }
          </span>
        </div>
      </div>
    </div>
  );
}
