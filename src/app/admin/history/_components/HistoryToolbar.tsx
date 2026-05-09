'use client';

import { X, Filter, ArrowUpDown } from 'lucide-react';
import { SearchBar } from '@/app/admin/_components/SearchBar';
import { DatePicker } from '@/app/admin/_components/DatePicker';
import { Select } from '@/app/admin/_components/Select';

export type VisitedFilter = 'all' | 'visited' | 'not-visited' | 'yet-to-visit';
export type SortBy = 'name' | 'email' | 'date' | 'guestCount';
export type SortDir = 'asc' | 'desc';

interface HistoryToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  date: Date | undefined;
  onDateChange: (d: Date | undefined) => void;
  visitedFilter: VisitedFilter;
  onVisitedFilterChange: (f: VisitedFilter) => void;
  sortBy: SortBy;
  sortDir: SortDir;
  onSortChange: (by: SortBy, dir: SortDir) => void;
}

const FILTER_OPTIONS: { label: string; value: VisitedFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Visited', value: 'visited' },
  { label: 'Not Visited', value: 'not-visited' },
  { label: 'Not Yet', value: 'yet-to-visit' },
];

const SORT_OPTIONS = [
  { label: 'Name A→Z',        value: 'name:asc'        },
  { label: 'Name Z→A',        value: 'name:desc'       },
  { label: 'Email A→Z',       value: 'email:asc'       },
  { label: 'Email Z→A',       value: 'email:desc'      },
  { label: 'Date Newest',     value: 'date:desc'       },
  { label: 'Date Oldest',     value: 'date:asc'        },
  { label: 'Guests High→Low', value: 'guestCount:desc' },
  { label: 'Guests Low→High', value: 'guestCount:asc'  },
] as const;

const FONT = 'var(--font-work-sans, Work Sans, sans-serif)';

export function HistoryToolbar({
  search,
  onSearchChange,
  date,
  onDateChange,
  visitedFilter,
  onVisitedFilterChange,
  sortBy,
  sortDir,
  onSortChange,
}: HistoryToolbarProps) {
  return (
    <div
      className="sticky top-16 z-20 bg-[#FAFAFA] border-b border-[#E0E0E0] px-4 py-3 lg:px-8 rounded-xl shadow-sm"
      style={{ fontFamily: FONT }}
    >
      {/* Desktop: single row */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Search */}
        <SearchBar value={search} onChange={onSearchChange} id='history-search' placeholder="Search by name, email or mobile…" />

        {/* Date Picker */}
        <div className="flex items-center gap-1">
          <DatePicker value={date ?? new Date()} onChange={onDateChange} />
          {date && (
            <button
              onClick={() => onDateChange(undefined)}
              className="p-1 text-[#9E9E9E] hover:text-[#616161] transition-colors"
              aria-label="Clear date filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter */}
        <Select
          options={FILTER_OPTIONS}
          value={visitedFilter}
          onChange={onVisitedFilterChange}
          icon={<Filter className="w-4 h-4" />}
          defaultValue="all"
          align="end"
          popoverWidth="w-44"
        />

        {/* Sort */}
        <Select
          options={SORT_OPTIONS}
          value={`${sortBy}:${sortDir}` as `${SortBy}:${SortDir}`}
          onChange={(v) => {
            const [by, dir] = v.split(':') as [SortBy, SortDir];
            onSortChange(by, dir);
          }}
          icon={<ArrowUpDown className="w-4 h-4" />}
          align="end"
          popoverWidth="w-48"
        />
      </div>

      {/* Mobile: two fixed rows */}
      <div className="lg:hidden flex flex-col gap-2">
        {/* Row 1: Search + Date picker */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchBar
              value={search}
              onChange={onSearchChange}
              placeholder="Search by name, email or mobile…"
              alwaysExpanded
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <DatePicker value={date ?? new Date()} onChange={onDateChange} showText={false} />
            {date && (
              <button
                onClick={() => onDateChange(undefined)}
                className="text-[#9E9E9E] hover:text-[#616161] transition-colors"
                aria-label="Clear date filter"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Filter + Sort */}
        <div className="flex items-center gap-2">
          <Select
            options={FILTER_OPTIONS}
            value={visitedFilter}
            onChange={onVisitedFilterChange}
            icon={<Filter className="w-3.5 h-3.5" />}
            defaultValue="all"
            size="sm"
            align="start"
            popoverWidth="w-44"
          />
          <Select
            options={SORT_OPTIONS}
            value={`${sortBy}:${sortDir}` as `${SortBy}:${SortDir}`}
            onChange={(v) => {
              const [by, dir] = v.split(':') as [SortBy, SortDir];
              onSortChange(by, dir);
            }}
            icon={<ArrowUpDown className="w-3.5 h-3.5" />}
            size="sm"
            align="start"
            popoverWidth="w-48"
          />
        </div>
      </div>
    </div>
  );
}
