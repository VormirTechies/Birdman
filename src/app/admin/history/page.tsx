'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { HistoryToolbar, type VisitedFilter, type SortBy, type SortDir } from './_components/HistoryToolbar';
import { HistoryTable, type HistoryBooking } from './_components/HistoryTable';
import { HistoryCard } from './_components/HistoryCard';
import { format } from 'date-fns';

// ─── Debounce Hook ────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── API Response Shape ───────────────────────────────────────────────────────
interface ApiBooking {
  id: string;
  visitor_name?: string;
  visitorName?: string;
  phone: string;
  email: string | null;
  adults?: number;
  children?: number;
  number_of_guests?: number;
  numberOfGuests?: number;
  booking_date?: string;
  bookingDate?: string;
  booking_time?: string;
  bookingTime?: string;
  visited: boolean;
  status: string;
}

function normalise(b: ApiBooking): HistoryBooking {
  return {
    id: b.id,
    visitorName: b.visitor_name ?? b.visitorName ?? '',
    phone: b.phone,
    email: b.email,
    adults: b.adults ?? 1,
    children: b.children ?? 0,
    numberOfGuests: b.number_of_guests ?? b.numberOfGuests ?? 1,
    bookingDate: b.booking_date ?? b.bookingDate ?? '',
    bookingTime: b.booking_time ?? b.bookingTime ?? '00:00',
    visited: b.visited,
    status: b.status,
  };
}

// ─── Build URL params ─────────────────────────────────────────────────────────
function buildParams(opts: {
  search: string;
  date: Date | undefined;
  visitedFilter: VisitedFilter;
  sortBy: SortBy;
  sortDir: SortDir;
  limit: number;
  offset: number;
}): URLSearchParams {
  const p = new URLSearchParams();
  if (opts.search.length >= 2) p.set('search', opts.search);
  if (opts.date) p.set('date', format(opts.date, 'yyyy-MM-dd'));
  if (opts.visitedFilter !== 'all') p.set('visitedFilter', opts.visitedFilter);
  p.set('sortBy', opts.sortBy);
  p.set('sortDir', opts.sortDir);
  p.set('limit', String(opts.limit));
  p.set('offset', String(opts.offset));
  return p;
}

const FONT = 'var(--font-work-sans, Work Sans, sans-serif)';

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  // ─ Shared filter state ─
  const [search, setSearch] = useState('');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [visitedFilter, setVisitedFilter] = useState<VisitedFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const debouncedSearch = useDebounce(search, 300);

  // ─ Desktop pagination state ─
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [desktopData, setDesktopData] = useState<HistoryBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [desktopLoading, setDesktopLoading] = useState(false);

  // ─ Mobile infinite scroll state ─
  const [mobileData, setMobileData] = useState<HistoryBooking[]>([]);
  const [mobileLoading, setMobileLoading] = useState(false);
  const [mobileLoadingMore, setMobileLoadingMore] = useState(false);
  const mobileOffsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const isFetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const MOBILE_PAGE_SIZE = 20;

  // ─────────────────────────────────────────────────────────────────────────
  // Desktop fetch — refetches when any filter/sort/page/pageSize changes
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return; // skip on mobile

    const params = buildParams({
      search: debouncedSearch,
      date,
      visitedFilter,
      sortBy,
      sortDir,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });

    let cancelled = false;
    setDesktopLoading(true);
    fetch(`/api/bookings?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success) {
          setDesktopData((data.bookings as ApiBooking[]).map(normalise));
          setTotal(data.total ?? data.pagination?.total ?? 0);
        }
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setDesktopLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, date, visitedFilter, sortBy, sortDir, page, pageSize]);

  // ─────────────────────────────────────────────────────────────────────────
  // Mobile: reset + initial load when filters change
  // ─────────────────────────────────────────────────────────────────────────
  const fetchMobileReset = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setMobileLoading(true);
    mobileOffsetRef.current = 0;
    hasMoreRef.current = true;

    const params = buildParams({
      search: debouncedSearch,
      date,
      visitedFilter,
      sortBy,
      sortDir,
      limit: MOBILE_PAGE_SIZE,
      offset: 0,
    });

    try {
      const res = await fetch(`/api/bookings?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        const items = (data.bookings as ApiBooking[]).map(normalise);
        setMobileData(items);
        setTotal(data.total ?? data.pagination?.total ?? 0);
        mobileOffsetRef.current = items.length;
        hasMoreRef.current = items.length < (data.total ?? 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      isFetchingRef.current = false;
      setMobileLoading(false);
    }
  }, [debouncedSearch, date, visitedFilter, sortBy, sortDir]);

  const fetchMobileMore = useCallback(async () => {
    if (isFetchingRef.current || !hasMoreRef.current) return;
    isFetchingRef.current = true;
    setMobileLoadingMore(true);

    const params = buildParams({
      search: debouncedSearch,
      date,
      visitedFilter,
      sortBy,
      sortDir,
      limit: MOBILE_PAGE_SIZE,
      offset: mobileOffsetRef.current,
    });

    try {
      const res = await fetch(`/api/bookings?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        const items = (data.bookings as ApiBooking[]).map(normalise);
        setMobileData((prev) => {
          const seen = new Set(prev.map((b) => b.id));
          return [...prev, ...items.filter((b) => !seen.has(b.id))];
        });
        mobileOffsetRef.current += items.length;
        hasMoreRef.current = items.length === MOBILE_PAGE_SIZE;
      }
    } catch (e) {
      console.error(e);
    } finally {
      isFetchingRef.current = false;
      setMobileLoadingMore(false);
    }
  }, [debouncedSearch, date, visitedFilter, sortBy, sortDir]);

  // Reset mobile list when filters change
  useEffect(() => {
    fetchMobileReset();
  }, [fetchMobileReset]);

  // IntersectionObserver for infinite scroll (sentinel always in DOM)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchMobileMore();
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchMobileMore]);

  // Reset desktop to page 1 when filters change
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, date, visitedFilter, sortBy, sortDir]);

  const handleSortChange = (by: SortBy, dir: SortDir) => {
    setSortBy(by);
    setSortDir(dir);
  };

  return (
    <div className="min-h-full bg-[#F8F8F8]" style={{ fontFamily: FONT }}>
      {/* Desktop Title — scrolls with page, sits above toolbar */}
      <div className="hidden lg:block pb-5">
        <h1
          className="text-2xl font-bold text-[#212121]"
          style={{ fontFamily: FONT }}
        >
          Booking History
        </h1>
        <p className="text-sm text-[#616161] mt-1" style={{ fontFamily: FONT }}>
          Manage and review past reservations.
        </p>
      </div>

      {/* Mobile Title */}
      <div className="lg:hidden pb-2">
        <h1 className="text-lg font-bold text-[#212121]" style={{ fontFamily: FONT }}>
          Booking History
        </h1>
        {!mobileLoading && (
          <p className="text-xs text-[#9E9E9E] mt-0.5" style={{ fontFamily: FONT }}>
            {total} {total === 1 ? 'booking' : 'bookings'}
          </p>
        )}
      </div>

      {/* Sticky Toolbar */}
      <HistoryToolbar
        search={search}
        onSearchChange={setSearch}
        date={date}
        onDateChange={setDate}
        visitedFilter={visitedFilter}
        onVisitedFilterChange={setVisitedFilter}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={handleSortChange}
      />

      {/* ── DESKTOP CONTENT ── */}
      <div className="hidden lg:block pt-6 pb-8">
        <HistoryTable
          bookings={desktopData}
          total={total}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          loading={desktopLoading}
        />
      </div>


      {/* ── MOBILE CONTENT ── */}
      <div className="lg:hidden">
        <div className="py-4 space-y-3">
          {mobileLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-[#F0F0F0]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#F5F5F5] animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#F5F5F5] rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-[#F5F5F5] rounded animate-pulse w-1/2" />
                  </div>
                </div>
              </div>
            ))
          ) : mobileData.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-[#9E9E9E]" style={{ fontFamily: FONT }}>
                No bookings found
              </p>
            </div>
          ) : (
            mobileData.map((b) => <HistoryCard key={b.id} booking={b} />)
          )}

          {/* Load-more skeletons — inline in list, not pinned to bottom */}
          {mobileLoadingMore && (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={`skeleton-more-${i}`} className="bg-white rounded-2xl p-4 border border-[#F0F0F0]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#F5F5F5] animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#F5F5F5] rounded animate-pulse w-2/3" />
                    <div className="h-3 bg-[#F5F5F5] rounded animate-pulse w-1/2" />
                  </div>
                </div>
              </div>
            ))
          )}

          {/* End of list — shown when all data is loaded */}
          {!mobileLoading && !mobileLoadingMore && mobileData.length > 0 && !hasMoreRef.current && (
            <p className="py-6 text-center text-xs text-[#BDBDBD]" style={{ fontFamily: FONT }}>
              All {total} {total === 1 ? 'booking' : 'bookings'} loaded
            </p>
          )}

          {/* Sentinel — always rendered, outside conditionals */}
          <div ref={sentinelRef} className="h-1" />
        </div>
      </div>
    </div>
  );
}
