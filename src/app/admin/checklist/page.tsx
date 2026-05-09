'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { DatePicker } from '@/app/admin/_components/DatePicker';
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
          numberOfGuests: (b.number_of_guests ?? b.numberOfGuests ?? 1) as number,
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

  const dateLabel = (() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const sel = format(selectedDate, 'yyyy-MM-dd');
    if (sel === today) return `Today, ${format(selectedDate, 'MMMM do, yyyy')}`;
    return format(selectedDate, 'EEEE, MMMM do, yyyy');
  })();

  const monthLabel = format(selectedDate, 'MMM dd').toUpperCase();

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
    </div>
  );
}
