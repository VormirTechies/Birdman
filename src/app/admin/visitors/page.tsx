'use client';

import { useCallback, useEffect, useState } from 'react';
import { Crown, Search, Star, StarOff, Pencil, Trash2, ChevronLeft, ChevronRight, Users, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { authenticatedFetch } from '@/lib/firebase/authenticated-fetch';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Visitor {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  isVip: boolean;
  vipNotes: string | null;
  totalVisits: number;
  firstVisitDate: string | null;
  lastVisitDate: string | null;
  createdAt: string;
}

interface VisitorBooking {
  id: string;
  bookingDate: string;
  bookingTime: string;
  adults: number;
  children: number;
  status: string;
  visited: boolean;
}

interface ApiResponse {
  visitors: Visitor[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function ordinal(n: number) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// ─── Visitor Detail Drawer ────────────────────────────────────────────────────

function VisitorDrawer({
  visitor,
  onClose,
  onUpdate,
}: {
  visitor: Visitor;
  onClose: () => void;
  onUpdate: (updated: Visitor) => void;
}) {
  const [isVip, setIsVip] = useState(visitor.isVip);
  const [notes, setNotes] = useState(visitor.vipNotes ?? '');
  const [name, setName] = useState(visitor.name);
  const [bookings, setBookings] = useState<VisitorBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setLoadingBookings(true);
    authenticatedFetch(`/api/admin/visitors/${visitor.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.bookings) setBookings(data.bookings);
      })
      .catch(() => {})
      .finally(() => setLoadingBookings(false));
  }, [visitor.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authenticatedFetch(`/api/admin/visitors/${visitor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVip, vipNotes: notes, name }),
      });
      if (!res.ok) throw new Error('Save failed');
      const updated: Visitor = { ...visitor, isVip, vipNotes: notes, name };
      onUpdate(updated);
      setDirty(false);
      toast.success('Visitor updated');
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-md bg-white shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {isVip && <Crown className="w-5 h-5" style={{ color: '#FF8C00' }} />}
            <h2 className="font-semibold text-[#212121] text-base">{name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-[#F5F5F5] rounded-lg">
              <p className="text-xl font-bold text-[#212121]">{visitor.totalVisits}</p>
              <p className="text-xs text-gray-500 mt-0.5">Visits</p>
            </div>
            <div className="text-center p-3 bg-[#F5F5F5] rounded-lg">
              <p className="text-xs font-semibold text-[#212121]">{formatDate(visitor.firstVisitDate)}</p>
              <p className="text-xs text-gray-500 mt-0.5">First Visit</p>
            </div>
            <div className="text-center p-3 bg-[#F5F5F5] rounded-lg">
              <p className="text-xs font-semibold text-[#212121]">{formatDate(visitor.lastVisitDate)}</p>
              <p className="text-xs text-gray-500 mt-0.5">Last Visit</p>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-1.5 text-sm text-gray-600">
            {visitor.phone && <p>📞 {visitor.phone}</p>}
            {visitor.email && <p>✉️ {visitor.email}</p>}
          </div>

          {/* Name edit */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Display Name
            </label>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setDirty(true); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A36C]/30 focus:border-[#00A36C]"
            />
          </div>

          {/* VIP toggle */}
          <div className="flex items-center justify-between py-2 border-t border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4" style={{ color: '#FF8C00' }} />
              <span className="text-sm font-medium text-[#212121]">VIP Status</span>
            </div>
            <button
              onClick={() => { setIsVip(v => !v); setDirty(true); }}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                isVip ? 'bg-[#FF8C00]' : 'bg-gray-200'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                  isVip ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* VIP Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Private Notes
            </label>
            <textarea
              value={notes}
              onChange={e => { setNotes(e.target.value); setDirty(true); }}
              rows={3}
              placeholder="Add private notes about this visitor (not visible to them)..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A36C]/30 focus:border-[#00A36C] resize-none"
            />
          </div>

          {/* Save button */}
          {dirty && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60"
              style={{ backgroundColor: '#00A36C' }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          )}

          {/* Booking history */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Booking History
            </h3>
            {loadingBookings ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-sm text-gray-400">No bookings found.</p>
            ) : (
              <div className="space-y-2">
                {bookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#F9F9F9] text-sm">
                    <div>
                      <p className="font-medium text-[#212121]">{formatDate(b.bookingDate)}</p>
                      <p className="text-xs text-gray-500">
                        {b.adults}A{b.children > 0 ? ` + ${b.children}C` : ''} · {b.status}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded-full',
                        b.visited ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      )}
                    >
                      {b.visited ? 'Visited' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── VIP Badge ────────────────────────────────────────────────────────────────

function VipBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ backgroundColor: '#FFF3E0', color: '#FF8C00', border: '1px solid #FF8C00' }}
    >
      <Crown className="w-2.5 h-2.5" />
      VIP
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const FONT = 'var(--font-work-sans, Work Sans, sans-serif)';

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [vipOnly, setVipOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Visitor | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const LIMIT = 20;

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (search.length >= 2) params.set('search', search);
      if (vipOnly) params.set('vip', 'true');

      const res = await authenticatedFetch(`/api/admin/visitors?${params.toString()}`);
      if (!res.ok) throw new Error('Fetch failed');
      const data: ApiResponse = await res.json();
      setVisitors(data.visitors);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Failed to load visitors');
    } finally {
      setLoading(false);
    }
  }, [page, search, vipOnly]);

  useEffect(() => {
    const t = setTimeout(fetchVisitors, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [fetchVisitors, search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from visitor records? Their booking history will be preserved.`)) return;
    setDeleting(id);
    try {
      const res = await authenticatedFetch(`/api/admin/visitors/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setVisitors(vs => vs.filter(v => v.id !== id));
      setTotal(t => t - 1);
      toast.success(`${name} removed`);
    } catch {
      toast.error('Failed to remove visitor');
    } finally {
      setDeleting(null);
    }
  };

  const handleUpdate = (updated: Visitor) => {
    setVisitors(vs => vs.map(v => v.id === updated.id ? updated : v));
    setSelected(updated);
  };

  const handleVipToggleInline = async (visitor: Visitor) => {
    const newIsVip = !visitor.isVip;
    // Optimistic update
    setVisitors(vs => vs.map(v => v.id === visitor.id ? { ...v, isVip: newIsVip } : v));
    try {
      const res = await authenticatedFetch(`/api/admin/visitors/${visitor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVip: newIsVip }),
      });
      if (!res.ok) throw new Error();
      toast.success(newIsVip ? `${visitor.name} marked as VIP ⭐` : `VIP status removed from ${visitor.name}`);
    } catch {
      // Revert
      setVisitors(vs => vs.map(v => v.id === visitor.id ? visitor : v));
      toast.error('Failed to update VIP status');
    }
  };

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-[#2E7D32]" />
          <h1 className="text-xl font-bold text-[#212121]">Visitors</h1>
        </div>
        <p className="text-sm text-gray-500">
          Manage visitor profiles, VIP status, and booking history
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, phone, or email…"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00A36C]/30 focus:border-[#00A36C] bg-white"
          />
        </div>

        {/* VIP filter toggle */}
        <button
          onClick={() => { setVipOnly(v => !v); setPage(1); }}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-all whitespace-nowrap',
            vipOnly
              ? 'text-[#FF8C00] border-[#FF8C00] bg-[#FFF3E0]'
              : 'text-gray-600 border-gray-200 bg-white hover:bg-gray-50'
          )}
        >
          <Crown className="w-4 h-4" />
          VIP Only
        </button>
      </div>

      {/* Stats bar */}
      <div className="mb-4 text-sm text-gray-500">
        {loading ? 'Loading…' : `${total} visitor${total !== 1 ? 's' : ''}${vipOnly ? ' (VIP)' : ''}`}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8F8F8] border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Contact</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Visits</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Last Visit</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">VIP</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {[1, 2, 3, 4, 5, 6].map(j => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : visitors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No visitors found
                  </td>
                </tr>
              ) : (
                visitors.map(v => (
                  <tr
                    key={v.id}
                    className={cn(
                      'hover:bg-[#FAFAFA] transition-colors',
                      v.isVip && 'bg-[#FFFBF5]'
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#212121]">{v.name}</span>
                        {v.isVip && <VipBadge />}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">
                      <div>{v.phone ?? '—'}</div>
                      {v.email && <div className="text-xs">{v.email}</div>}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-semibold text-[#212121]">{v.totalVisits}</span>
                      <span className="text-xs text-gray-400 ml-1">
                        ({ordinal(v.totalVisits)})
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">{formatDate(v.lastVisitDate)}</td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleVipToggleInline(v)}
                        title={v.isVip ? 'Remove VIP' : 'Mark as VIP'}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {v.isVip
                          ? <Star className="w-4 h-4 fill-[#FF8C00] text-[#FF8C00]" />
                          : <StarOff className="w-4 h-4 text-gray-300" />
                        }
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelected(v)}
                          className="p-1.5 rounded-lg hover:bg-[#E8F5E9] text-gray-400 hover:text-[#2E7D32] transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(v.id, v.name)}
                          disabled={deleting === v.id}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-40"
                          title="Remove visitor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-40" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-28" />
              </div>
            ))
          ) : visitors.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No visitors found</div>
          ) : (
            visitors.map(v => (
              <div
                key={v.id}
                className={cn(
                  'p-4 flex items-start justify-between',
                  v.isVip && 'bg-[#FFFBF5]'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[#212121] truncate">{v.name}</span>
                    {v.isVip && <VipBadge />}
                  </div>
                  <p className="text-xs text-gray-500">{v.phone ?? v.email ?? '—'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {v.totalVisits} visit{v.totalVisits !== 1 ? 's' : ''} · Last: {formatDate(v.lastVisitDate)}
                  </p>
                </div>
                <div className="flex items-center gap-1 ml-3 shrink-0">
                  <button onClick={() => handleVipToggleInline(v)} className="p-1.5">
                    {v.isVip
                      ? <Star className="w-4 h-4 fill-[#FF8C00] text-[#FF8C00]" />
                      : <StarOff className="w-4 h-4 text-gray-300" />
                    }
                  </button>
                  <button onClick={() => setSelected(v)} className="p-1.5 text-gray-400">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(v.id, v.name)}
                    disabled={deleting === v.id}
                    className="p-1.5 text-gray-300 disabled:opacity-40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <VisitorDrawer
          visitor={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
