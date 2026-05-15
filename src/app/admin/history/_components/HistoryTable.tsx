'use client';

import { cn, formatLocalDate } from '@/lib/utils';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, User, Baby } from 'lucide-react';
import { Select } from '@/app/admin/_components/Select';

const FONT = 'var(--font-work-sans, Work Sans, sans-serif)';

export interface HistoryBooking {
  id: string;
  visitorName: string;
  phone: string;
  email: string | null;
  adults: number;
  children: number;
  numberOfGuests: number; // Deprecated
  bookingDate: string;
  bookingTime: string;
  visited: boolean;
  status: string;
}

function getVisitedStatus(booking: HistoryBooking): 'visited' | 'no-show' | 'upcoming' {
  if (booking.visited) return 'visited';
  const today = formatLocalDate(new Date());
  return booking.bookingDate < today ? 'no-show' : 'upcoming';
}

function VisitedBadge({ booking }: { booking: HistoryBooking }) {
  const vstatus = getVisitedStatus(booking);
  if (vstatus === 'visited') {
    return (
      <span
        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F5E9] text-[#2E7D32]"
        style={{ fontFamily: FONT }}
      >
        Visited
      </span>
    );
  }
  if (vstatus === 'no-show') {
    return (
      <span
        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F5F5F5] text-[#616161]"
        style={{ fontFamily: FONT }}
      >
        No Show
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF8E1] text-[#F57F17]"
      style={{ fontFamily: FONT }}
    >
      Not Yet
    </span>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
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

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100];

interface HistoryTableProps {
  bookings: HistoryBooking[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  loading?: boolean;
}

export function HistoryTable({
  bookings,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading,
}: HistoryTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // Page window: show up to 5 page buttons around current page
  const pageWindow = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#F0F0F0]">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E0E0E0] bg-[#FAFAFA]">
              {['User Name', 'Mobile', 'Email', 'Guest Count', 'Visited Status'].map((col) => (
                <th
                  key={col}
                  className="text-left px-6 py-3.5 text-xs font-semibold text-[#616161] uppercase tracking-wider"
                  style={{ fontFamily: FONT }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} className="border-b border-[#F0F0F0] last:border-0">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-[#F5F5F5] rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <p className="text-sm text-[#9E9E9E]" style={{ fontFamily: FONT }}>
                    No bookings found
                  </p>
                </td>
              </tr>
            ) : (
              bookings.map((b) => {
                const colors = avatarColor(b.visitorName);
                const initials = getInitials(b.visitorName);
                return (
                  <tr
                    key={b.id}
                    className="border-b border-[#F0F0F0] last:border-0 hover:bg-[#F9FBF9] transition-colors"
                  >
                    {/* User Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                          style={{ background: colors.bg, color: colors.text, fontFamily: FONT }}
                        >
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#212121]" style={{ fontFamily: FONT }}>
                            {b.visitorName}
                          </p>
                          <p className="text-xs text-[#9E9E9E]" style={{ fontFamily: FONT }}>
                            {format(new Date(`${b.bookingDate}T00:00:00`), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Mobile */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#616161]" style={{ fontFamily: FONT }}>
                        {b.phone}
                      </span>
                    </td>
                    {/* Email */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-[#616161]" style={{ fontFamily: FONT }}>
                        {b.email ?? '—'}
                      </span>
                    </td>
                    {/* Guest Count */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <User className="w-4 h-4 text-[#616161]" />
                          <span className="text-sm font-medium text-[#212121]" style={{ fontFamily: FONT }}>
                            {b.adults}
                          </span>
                        </div>
                        {b.children > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Baby className="w-4 h-4 text-[#616161]" />
                            <span className="text-sm font-medium text-[#212121]" style={{ fontFamily: FONT }}>
                              {b.children}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* Visited Status */}
                    <td className="px-6 py-4">
                      <VisitedBadge booking={b} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-[#F0F0F0]">
        {/* Entry count */}
        <p className="text-sm text-[#616161] shrink-0" style={{ fontFamily: FONT }}>
          {total === 0 ? 'No entries' : `Showing ${from} to ${to} of ${total} entries`}
        </p>

        {/* Page numbers + Page size */}
        <div className="flex items-center gap-3">
          {/* Prev */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors',
              page <= 1 ? 'text-[#BDBDBD] cursor-not-allowed' : 'text-[#616161] hover:bg-[#F5F5F5]'
            )}
            suppressHydrationWarning
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page buttons */}
          {pageWindow().map((p, i) =>
            p === '...' ? (
              <span key={`dots-${i}`} className="text-[#9E9E9E] text-sm select-none">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={cn(
                  'w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                  page === p
                    ? 'bg-[#2E7D32] text-white'
                    : 'text-[#616161] hover:bg-[#F5F5F5]'
                )}
                style={{ fontFamily: FONT }}
                suppressHydrationWarning
              >
                {p}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors',
              page >= totalPages ? 'text-[#BDBDBD] cursor-not-allowed' : 'text-[#616161] hover:bg-[#F5F5F5]'
            )}
            suppressHydrationWarning
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-[#E0E0E0]" />

          {/* Page size selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#9E9E9E]" style={{ fontFamily: FONT }}>
              Per page:
            </span>
            <Select
              options={PAGE_SIZE_OPTIONS.map((s) => ({ label: String(s), value: String(s) }))}
              value={String(pageSize)}
              onChange={(v) => { onPageSizeChange(Number(v)); onPageChange(1); }}
              size="sm"
              align="end"
              popoverWidth="w-20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
