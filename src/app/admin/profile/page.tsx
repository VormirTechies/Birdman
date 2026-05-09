'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  Lock,
  UserPlus,
  MoreVertical,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select } from '@/app/admin/_components/Select';
import { SearchBar } from '@/app/admin/_components/SearchBar';
import { ChangePasswordForm } from './_components/ChangePasswordForm';

const FONT = 'var(--font-work-sans, Work Sans, sans-serif)';
const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

type ActiveTab = 'users' | 'change-password';

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
  { bg: '#C8E6C9', text: '#2E7D32' },
  { bg: '#FFE0B2', text: '#E65100' },
  { bg: '#F8BBD0', text: '#C2185B' },
  { bg: '#BBDEFB', text: '#1976D2' },
  { bg: '#E1BEE7', text: '#7B1FA2' },
];

function avatarColor(identifier: string) {
  let hash = 0;
  for (const c of identifier) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ─── Desktop Users Table ──────────────────────────────────────────────────────

function UsersTable({
  users,
  total,
  page,
  pageSize,
  search,
  onSearch,
  onPageChange,
  onPageSizeChange,
  loading,
}: {
  users: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  onSearch: (v: string) => void;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
  loading: boolean;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

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
    <div className="hidden lg:block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#F0F0F0]">
        {/* Table header: search bar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-[#F0F0F0]">
          <div className="flex-1">
            <SearchBar
              value={search}
              onChange={onSearch}
              placeholder="Search by name or email…"
              id="profile-search"
              name="profile-search"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E0E0E0] bg-[#FAFAFA]">
                {['User Name', 'Email', 'Action'].map((col) => (
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
                    {Array.from({ length: 3 }).map((_c, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-[#F5F5F5] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center">
                    <p className="text-sm text-[#9E9E9E]" style={{ fontFamily: FONT }}>
                      No users found
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const colors = avatarColor(user.email);
                  const initials = getInitials(user.name);
                  return (
                    <tr
                      key={user.id}
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
                              {user.name}
                            </p>
                            <p className="text-xs text-[#9E9E9E]" style={{ fontFamily: FONT }}>
                              Joined {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Email */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-[#616161]" style={{ fontFamily: FONT }}>
                          {user.email}
                        </span>
                      </td>
                      {/* Action */}
                      <td className="px-6 py-4">
                        <button className="p-1.5 rounded-full hover:bg-[#F5F5F5] transition-colors">
                          <MoreVertical className="w-4 h-4 text-[#9E9E9E]" />
                        </button>
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
          <p className="text-sm text-[#616161] shrink-0" style={{ fontFamily: FONT }}>
            {total === 0 ? 'No entries' : `Showing ${from} to ${to} of ${total} entries`}
          </p>
          <div className="flex items-center gap-3">
            {/* Prev */}
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors',
                page <= 1 ? 'text-[#BDBDBD] cursor-not-allowed' : 'text-[#616161] hover:bg-[#F5F5F5]',
              )}
              suppressHydrationWarning
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {/* Page buttons */}
            {pageWindow().map((p, i) =>
              p === '...' ? (
                <span key={`dots-${i}`} className="text-[#9E9E9E] text-sm select-none">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange(p as number)}
                  className={cn(
                    'w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors',
                    page === p ? 'bg-[#2E7D32] text-white' : 'text-[#616161] hover:bg-[#F5F5F5]',
                  )}
                  style={{ fontFamily: FONT }}
                  suppressHydrationWarning
                >
                  {p}
                </button>
              ),
            )}
            {/* Next */}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors',
                page >= totalPages ? 'text-[#BDBDBD] cursor-not-allowed' : 'text-[#616161] hover:bg-[#F5F5F5]',
              )}
              suppressHydrationWarning
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-[#E0E0E0]" />
            {/* Per-page selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#9E9E9E]" style={{ fontFamily: FONT }}>Per page:</span>
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
    </div>
  );
}

// ─── Mobile User Card ─────────────────────────────────────────────────────────

function UserCard({ user }: { user: AdminUser }) {
  const colors = avatarColor(user.email);
  const initials = getInitials(user.name);
  return (
    <div className="bg-white rounded-2xl p-4 flex items-start gap-4 border border-[#E8E8E8]">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold shrink-0"
        style={{ background: colors.bg, color: colors.text, fontFamily: FONT }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#212121] truncate">{user.name}</p>
        <p className="text-sm text-[#2E7D32] truncate mt-0.5">{user.email}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <Calendar className="w-3.5 h-3.5 text-[#9E9E9E] shrink-0" />
          <span className="text-xs text-[#9E9E9E]">
            Joined on {format(new Date(user.createdAt), 'MMM d, yyyy')}
          </span>
        </div>
      </div>
      <button className="p-1.5 rounded-full hover:bg-[#F5F5F5] transition-colors shrink-0 mt-0.5">
        <MoreVertical className="w-4 h-4 text-[#9E9E9E]" />
      </button>
    </div>
  );
}

// ─── Mobile Card Skeleton ─────────────────────────────────────────────────────

function UserCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-[#E8E8E8] animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-[#F0F0F0] shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 bg-[#F0F0F0] rounded w-3/5" />
          <div className="h-3 bg-[#F0F0F0] rounded w-4/5" />
          <div className="h-3 bg-[#F0F0F0] rounded w-2/5" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Profile Page ────────────────────────────────────────────────────────

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('users');
  const [search, setSearch] = useState('');
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { users: AdminUser[] };
        setAllUsers(data.users ?? []);
      }
    } catch {
      // silently fail — empty state shown
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Client-side filtering
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) => u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q),
    );
  }, [allUsers, search]);

  // Reset to page 1 whenever search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

  // Paginated slice for desktop table
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const TABS = [
    { key: 'users' as const, label: 'Users List', Icon: Users },
    { key: 'change-password' as const, label: 'Change Password', Icon: Lock },
  ];

  return (
    <div className="flex flex-col" style={{ fontFamily: FONT }}>
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-family-body text-[#212121]">
            Profile
          </h1>
        </div>

        {/* Desktop add user button (disabled) */}
        {activeTab === 'users' && (
          <div className="flex items-center gap-2 shrink-0">
            {/* Mobile: icon only */}
            <button
              disabled
              aria-disabled="true"
              title="Add User — coming soon"
              className="lg:hidden w-10 h-10 rounded-full bg-[#2E7D32] text-white flex items-center justify-center opacity-40 cursor-not-allowed"
            >
              <UserPlus className="w-4 h-4" />
            </button>
            {/* Desktop: icon + label */}
            <button
              disabled
              aria-disabled="true"
              title="Add User — coming soon"
              className="hidden lg:flex items-center gap-2 h-10 px-4 rounded-full bg-[#2E7D32] text-white text-sm font-semibold opacity-40 cursor-not-allowed"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Sticky tabs + search ── */}
      {/* top-16 accounts for the 64px fixed admin header */}
      <div className="sticky top-16 z-10 bg-[#f8f8f8] -mx-4 lg:-mx-8 px-4 lg:px-8 pb-3">
        {/* Tab bar */}
        <div className="flex border-b border-[#E0E0E0]">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === key
                  ? 'text-[#2E7D32] border-[#2E7D32]'
                  : 'text-[#9E9E9E] border-transparent hover:text-[#212121]',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* no extra row needed on mobile — add button is in the header */}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'users' ? (
        <>
          {/* Desktop table */}
          <UsersTable
            users={paginatedUsers}
            total={filtered.length}
            page={page}
            pageSize={pageSize}
            search={search}
            onSearch={setSearch}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            loading={loading}
          />

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 lg:hidden">
            {/* Mobile search */}
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-[#F0F0F0]">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by name or email…"
                id="profile-search-mobile"
                name="profile-search-mobile"
                alwaysExpanded
              />
            </div>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <UserCardSkeleton key={i} />)
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-[#9E9E9E]">
                <Users className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              filtered.map((user) => <UserCard key={user.id} user={user} />)
            )}
          </div>
        </>
      ) : (
        <ChangePasswordForm />
      )}
    </div>
  );
}
