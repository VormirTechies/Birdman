'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Search, X, Plus, Crown, Star } from 'lucide-react';
import { toast } from 'sonner';
import { DatePicker } from '@/app/admin/_components/DatePicker';
import { InstantBookingModal } from '@/app/admin/_components/InstantBookingModal';
import { VisitorChecklistList } from './_components/VisitorChecklistList';
import type { ChecklistVisitor } from './_components/VisitorChecklistItem';

const PAGE_SIZE = 20;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function ChecklistPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const [visitors, setVisitors] = useState<ChecklistVisitor[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // VIP confirmation modal state
  const [pendingVip, setPendingVip] = useState<{ bookingId: string; visitorName: string; newIsVip: boolean } | null>(null);
  const [vipNotes, setVipNotes] = useState('');
  const [isVipUpdating, setIsVipUpdating] = useState(false);

  // Refs for IntersectionObserver (avoid stale closures)
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(false);
  const isFetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(async (
    date: Date,
    search: string,
    currentOffset: number,
    append: boolean,
  ) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (append) setIsLoadingMore(true);
    else setIsLoading(true);

    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const params = new URLSearchParams({
        date: dateStr,
        status: 'confirmed',
        limit: String(PAGE_SIZE),
        offset: String(currentOffset),
        sort: 'checklist',
      });
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/bookings?${params}`, { cache: 'no-cache' });
      const data = await res.json();

      if (data.success && Array.isArray(data.bookings)) {
        const mapped: ChecklistVisitor[] = data.bookings.map((b: Record<string, unknown>) => ({
          id: b.id as string,
          visitorName: (b.visitor_name ?? b.visitorName) as string,
          phone: b.phone as string,
          visited: (b.visited ?? false) as boolean,
          adults: (b.adults ?? 1) as number,
          children: (b.children ?? 0) as number,
          numberOfGuests: (b.number_of_guests ?? b.numberOfGuests ?? 1) as number,
          isVip: ((b.visitor as Record<string, unknown> | null)?.isVip ?? false) as boolean,
          totalVisits: ((b.visitor as Record<string, unknown> | null)?.totalVisits ?? 1) as number,
          visitorId: ((b.visitor as Record<string, unknown> | null)?.id) as string | undefined,
        }));

        const newOffset = currentOffset + mapped.length;
        const more = data.total > newOffset;

        setVisitors(prev => append ? [...prev, ...mapped] : mapped);
        setTotal(data.total);
        offsetRef.current = newOffset;
        hasMoreRef.current = more;
        setHasMore(more);
      }
    } catch {
      toast.error('Failed to load visitors');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, []);

  // Reset + fetch on date or debounced search change
  useEffect(() => {
    offsetRef.current = 0;
    hasMoreRef.current = false;
    setHasMore(false);
    setVisitors([]);
    setTotal(0);
    fetchPage(selectedDate, debouncedSearch, 0, false);
  }, [selectedDate, debouncedSearch, fetchPage]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !isFetchingRef.current) {
          fetchPage(selectedDate, debouncedSearch, offsetRef.current, true);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [selectedDate, debouncedSearch, fetchPage]);

  const handleToggle = async (id: string, visited: boolean) => {
    setVisitors(prev => prev.map(v => v.id === id ? { ...v, visited } : v));
    setUpdatingId(id);

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visited }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Update failed');
    } catch {
      setVisitors(prev => prev.map(v => v.id === id ? { ...v, visited: !visited } : v));
      toast.error('Failed to update visitor status');
    } finally {
      setUpdatingId(null);
    }
  };

  const visitedCount = visitors.filter(v => v.visited).length;

  // Open modal instead of immediately updating
  const handleVipToggle = useCallback((bookingId: string, newIsVip: boolean) => {
    const visitor = visitors.find(v => v.id === bookingId);
    if (!visitor) return;
    setVipNotes('');
    setPendingVip({ bookingId, visitorName: visitor.visitorName, newIsVip });
  }, [visitors]);

  // Called when the user confirms the modal
  const confirmVipToggle = useCallback(async (notes?: string) => {
    if (!pendingVip) return;
    const { bookingId, newIsVip } = pendingVip;
    setPendingVip(null);
    setIsVipUpdating(true);
    setVisitors(prev => prev.map(v => v.id === bookingId ? { ...v, isVip: newIsVip } : v));
    try {
      const body: Record<string, unknown> = { isVip: newIsVip };
      if (newIsVip && notes?.trim()) body.vipNotes = notes.trim();
      if (!newIsVip) body.vipNotes = '';
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      if (data.visitor?.id) {
        setVisitors(prev => prev.map(v => v.id === bookingId ? { ...v, visitorId: data.visitor.id } : v));
      }
      toast.success(newIsVip ? '⭐ Marked as VIP' : 'VIP status removed');
    } catch {
      setVisitors(prev => prev.map(v => v.id === bookingId ? { ...v, isVip: !newIsVip } : v));
      toast.error('Failed to update VIP status');
    } finally {
      setIsVipUpdating(false);
    }
  }, [pendingVip]);

  const dateLabel = (() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const sel = format(selectedDate, 'yyyy-MM-dd');
    if (sel === today) return `Today, ${format(selectedDate, 'MMMM do, yyyy')}`;
    return format(selectedDate, 'EEEE, MMMM do, yyyy');
  })();

  const monthLabel = format(selectedDate, 'MMM dd').toUpperCase();

  // Handle successful booking creation
  const handleBookingSuccess = () => {
    // Refresh the checklist
    offsetRef.current = 0;
    hasMoreRef.current = false;
    setHasMore(false);
    setVisitors([]);
    setTotal(0);
    fetchPage(selectedDate, debouncedSearch, 0, false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#F0F0F0]">

        {/* Header band */}
        <div className="px-5 pt-5 pb-4 border-b border-[#F5F5F5]">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p
                className="text-[10px] font-bold text-[#2E7D32] tracking-widest uppercase"
                style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
              >
                {monthLabel}
              </p>
            </div>
            <div className="w-px h-8 bg-[#E0E0E0]" />
            <div className="flex-1">
              <h1
                className="text-base font-bold text-[#212121] leading-tight"
                style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
              >
                Daily Checklist
              </h1>
              <p
                className="text-xs text-[#757575] mt-0.5"
                style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
              >
                {dateLabel}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p
                className="text-xs text-[#757575]"
                style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
              >
                {visitedCount}/{total} visited
              </p>
            </div>
          </div>
        </div>

        {/* Controls — sticky below the fixed admin header (h-16 = top-16) */}
        <div className="sticky top-16 z-20 bg-white px-5 py-3 flex items-center gap-2 border-b border-[#F5F5F5] shadow-[0_2px_8px_0_rgba(0,0,0,0.04)]">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9E9E9E] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email or mobile..."
              className="w-full pl-9 pr-8 py-2 text-sm text-[#212121] placeholder:text-[#9E9E9E] bg-[#F5F5F5] rounded-xl border-2 border-transparent focus:border-[#2E7D32] outline-none transition-colors"
              style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
              suppressHydrationWarning
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[#E0E0E0] rounded-lg transition-colors"
                aria-label="Clear search"
                suppressHydrationWarning
              >
                <X className="w-3.5 h-3.5 text-[#616161]" />
              </button>
            )}
          </div>

          {/* Date nav */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setSelectedDate(d => subDays(d, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] transition-colors"
              aria-label="Previous day"
              suppressHydrationWarning
            >
              <ChevronLeft className="w-4 h-4 text-[#424242]" />
            </button>
            <button
              onClick={() => setSelectedDate(d => addDays(d, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#F5F5F5] hover:bg-[#E0E0E0] transition-colors"
              aria-label="Next day"
              suppressHydrationWarning
            >
              <ChevronRight className="w-4 h-4 text-[#424242]" />
            </button>
            <DatePicker value={selectedDate} onChange={setSelectedDate} hideTextOnMobile />
          </div>
        </div>

        {/* List */}
        <div className="px-5 py-4 min-h-48">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <VisitorChecklistList
                visitors={visitors}
                updatingId={updatingId}
                onToggle={handleToggle}
                onVipToggle={handleVipToggle}
              />

              {/* Loading more spinner */}
              {isLoadingMore && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-[#2E7D32] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* End-of-list indicator */}
              {!hasMore && visitors.length > 0 && total > PAGE_SIZE && (
                <p
                  className="text-center text-xs text-[#BDBDBD] py-3"
                  style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
                >
                  All {total} visitors loaded
                </p>
              )}
            </>
          )}

          {/* Sentinel must always stay in DOM so the observer ref remains valid */}
          <div ref={sentinelRef} className="h-1" />
        </div>
      </div>

      {/* FAB (Floating Action Button) for New Booking */}
      <button
        onClick={() => setIsBookingModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center z-30"
        title="New Booking"
        aria-label="Create new booking"
        suppressHydrationWarning
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Instant Booking Modal */}
      <InstantBookingModal
        open={isBookingModalOpen}
        onOpenChange={setIsBookingModalOpen}
        onSuccess={handleBookingSuccess}
      />

      {/* ── VIP Add Modal ─────────────────────────────────────────────── */}
      {pendingVip && pendingVip.newIsVip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={() => !isVipUpdating && setPendingVip(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF3E0] flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 fill-[#FF8C00] text-[#FF8C00]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-[#212121] leading-tight">
                  Mark as VIP?
                </h2>
                <p className="text-sm text-[#757575] mt-0.5">
                  <span className="font-semibold text-[#212121]">{pendingVip.visitorName}</span> will be given VIP status.
                </p>
              </div>
              <button
                onClick={() => !isVipUpdating && setPendingVip(null)}
                className="p-1 rounded-lg hover:bg-[#F5F5F5] transition-colors text-[#9E9E9E]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notes input */}
            <div className="px-6 pb-5">
              <label className="block text-xs font-semibold text-[#616161] mb-1.5 uppercase tracking-wide">
                VIP Private Note <span className="font-normal normal-case text-[#9E9E9E]">(optional)</span>
              </label>
              <textarea
                autoFocus
                rows={3}
                value={vipNotes}
                onChange={(e) => setVipNotes(e.target.value)}
                placeholder="e.g. Allergic to noise, prefers morning slots…"
                maxLength={500}
                disabled={isVipUpdating}
                className="w-full px-3 py-2.5 text-sm text-[#212121] placeholder:text-[#BDBDBD] bg-[#F5F5F5] rounded-xl border-2 border-transparent focus:border-[#FF8C00] outline-none transition-colors resize-none disabled:opacity-50"
              />
              <p className="text-right text-[10px] text-[#BDBDBD] mt-1">{vipNotes.length}/500</p>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-2">
              <button
                onClick={() => !isVipUpdating && setPendingVip(null)}
                disabled={isVipUpdating}
                className="flex-1 py-2.5 rounded-2xl border-2 border-[#E0E0E0] text-sm font-semibold text-[#424242] hover:bg-[#F5F5F5] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmVipToggle(vipNotes)}
                disabled={isVipUpdating}
                className="flex-1 py-2.5 rounded-2xl bg-[#FF8C00] hover:bg-[#E07B00] text-sm font-bold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isVipUpdating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    Make VIP
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIP Remove Modal ───────────────────────────────────────────── */}
      {pendingVip && !pendingVip.newIsVip && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
          onClick={() => !isVipUpdating && setPendingVip(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
            style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-5 flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FFF3E0] flex items-center justify-center shrink-0">
                <Star className="w-5 h-5 text-[#FF8C00]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-[#212121] leading-tight">
                  Remove VIP Status?
                </h2>
                <p className="text-sm text-[#757575] mt-1">
                  <span className="font-semibold text-[#212121]">{pendingVip.visitorName}</span> will no longer have VIP privileges.
                </p>
              </div>
              <button
                onClick={() => !isVipUpdating && setPendingVip(null)}
                className="p-1 rounded-lg hover:bg-[#F5F5F5] transition-colors text-[#9E9E9E]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 flex gap-2">
              <button
                onClick={() => !isVipUpdating && setPendingVip(null)}
                disabled={isVipUpdating}
                className="flex-1 py-2.5 rounded-2xl border-2 border-[#E0E0E0] text-sm font-semibold text-[#424242] hover:bg-[#F5F5F5] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmVipToggle()}
                disabled={isVipUpdating}
                className="flex-1 py-2.5 rounded-2xl bg-[#EF5350] hover:bg-[#C62828] text-sm font-bold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isVipUpdating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Remove VIP'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
