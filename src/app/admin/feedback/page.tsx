'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Loader2, MessageSquareText, Star, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch } from '@/lib/firebase/authenticated-fetch';
import type { AdminFeedback } from '@/models/firestore/feedback';

type FeedbackTab = 'pending' | 'approved';
type Cursor = string | null;
interface TabPageState {
  items: AdminFeedback[];
  cursor: Cursor;
  nextCursor: Cursor;
  hasMore: boolean;
  history: Cursor[];
  loaded: boolean;
  loading: boolean;
}

const PAGE_SIZE = 10;
const emptyPage = (): TabPageState => ({
  items: [], cursor: null, nextCursor: null, hasMore: false,
  history: [], loaded: false, loading: false,
});

export default function AdminFeedbackPage() {
  const [tabs, setTabs] = useState<Record<FeedbackTab, TabPageState>>({
    pending: emptyPage(), approved: emptyPage(),
  });
  const [activeTab, setActiveTab] = useState<FeedbackTab>('pending');
  const [recommendedCount, setRecommendedCount] = useState(0);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const loadPage = useCallback(async (status: FeedbackTab, cursor: Cursor = null) => {
    setTabs((current) => ({
      ...current,
      [status]: { ...current[status], loading: true },
    }));
    try {
      const params = new URLSearchParams({ status, limit: String(PAGE_SIZE) });
      if (cursor) params.set('cursor', cursor);
      const response = await authenticatedFetch(`/api/admin/feedback?${params}`, { cache: 'no-store' });
      const result = await response.json() as {
        error?: string;
        feedback?: AdminFeedback[];
        pagination?: { hasMore: boolean; nextCursor: Cursor };
        recommendedCount?: number;
      };
      if (!response.ok) throw new Error(result.error ?? 'Unable to load feedback');
      setTabs((current) => ({
        ...current,
        [status]: {
          ...current[status],
          items: result.feedback ?? [],
          cursor,
          nextCursor: result.pagination?.nextCursor ?? null,
          hasMore: result.pagination?.hasMore ?? false,
          loaded: true,
          loading: false,
        },
      }));
      setRecommendedCount(result.recommendedCount ?? 0);
      return result.feedback ?? [];
    } catch (error) {
      setTabs((current) => ({
        ...current,
        [status]: { ...current[status], loading: false, loaded: true },
      }));
      toast.error(error instanceof Error ? error.message : 'Unable to load feedback');
      return null;
    }
  }, []);

  useEffect(() => {
    if (!tabs[activeTab].loaded && !tabs[activeTab].loading) {
      void loadPage(activeTab);
    }
  }, [activeTab, loadPage, tabs]);

  async function goNext() {
    const page = tabs[activeTab];
    if (!page.nextCursor || page.loading) return;
    setTabs((current) => ({
      ...current,
      [activeTab]: {
        ...current[activeTab],
        history: [...current[activeTab].history, current[activeTab].cursor],
      },
    }));
    const loaded = await loadPage(activeTab, page.nextCursor);
    if (loaded) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function goPrevious() {
    const page = tabs[activeTab];
    if (page.history.length === 0 || page.loading) return;
    const previousCursor = page.history.at(-1) ?? null;
    setTabs((current) => ({
      ...current,
      [activeTab]: {
        ...current[activeTab],
        history: current[activeTab].history.slice(0, -1),
      },
    }));
    const loaded = await loadPage(activeTab, previousCursor);
    if (loaded) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function requestAction(
    item: AdminFeedback,
    action: 'approve' | 'delete' | 'recommend',
    isRecommended?: boolean
  ) {
    setWorkingId(item.id);
    try {
      const response = await authenticatedFetch(`/api/admin/feedback/${item.id}`, {
        method: action === 'delete' ? 'DELETE' : 'PATCH',
        headers: action === 'delete' ? undefined : { 'Content-Type': 'application/json' },
        body: action === 'delete'
          ? undefined
          : JSON.stringify(action === 'approve'
              ? { action: 'approve' }
              : { action: 'recommend', isRecommended }),
      });
      const result = await response.json() as { error?: string; message?: string };
      if (!response.ok) throw new Error(result.error ?? 'Feedback action failed');
      toast.success(result.message ?? 'Feedback updated');

      if (action === 'approve') {
        setTabs((current) => ({
          ...current,
          approved: { ...current.approved, loaded: false, history: [], cursor: null },
        }));
      }
      const refreshed = await loadPage(activeTab, tabs[activeTab].cursor);
      if (refreshed?.length === 0 && tabs[activeTab].history.length > 0) {
        await goPrevious();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Feedback action failed');
    } finally {
      setWorkingId(null);
    }
  }

  const page = tabs[activeTab];
  const pageNumber = page.history.length + 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-2xl font-semibold text-[#212121]">Feedback</h1><p className="mt-1 text-sm text-[#757575]">Moderate submissions and choose up to five homepage reviews.</p></div>
        <div className="inline-flex items-center gap-2 text-sm text-[#616161]"><Star className="h-4 w-4 fill-[#F9A825] text-[#F9A825]" />{recommendedCount}/5 recommended</div>
      </div>

      <div role="tablist" aria-label="Feedback status" className="flex border-b border-[#E0E0E0]">
        <TabButton active={activeTab === 'pending'} onClick={() => setActiveTab('pending')}>Pending</TabButton>
        <TabButton active={activeTab === 'approved'} onClick={() => setActiveTab('approved')}>Approved</TabButton>
      </div>

      <section role="tabpanel" aria-label={`${activeTab} feedback`}>
        {page.loading && !page.loaded ? (
          <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-[#2E7D32]" /></div>
        ) : page.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D8D8D8] bg-white py-20 text-center"><MessageSquareText className="mx-auto h-10 w-10 text-[#A0A0A0]" /><h2 className="mt-4 font-semibold text-[#212121]">{activeTab === 'pending' ? 'Nothing waiting for review' : 'No approved feedback yet'}</h2></div>
        ) : (
          <div className={`grid gap-4 lg:grid-cols-2 ${page.loading ? 'opacity-60' : ''}`}>
            {page.items.map((item) => <FeedbackCard key={item.id} item={item} tab={activeTab} busy={workingId === item.id} recommendationDisabled={recommendedCount >= 5 && !item.isRecommended} onAction={requestAction} />)}
          </div>
        )}

        {page.loaded && (page.history.length > 0 || page.hasMore) && (
          <nav aria-label={`${activeTab} feedback pagination`} className="mt-6 flex items-center justify-between rounded-xl border border-[#E5E5E5] bg-white px-4 py-3">
            <button type="button" onClick={() => void goPrevious()} disabled={page.history.length === 0 || page.loading} className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#D8D8D8] px-3 text-sm font-medium text-[#616161] disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Previous</button>
            <span className="text-sm text-[#757575]">Page {pageNumber} · {PAGE_SIZE} per page</span>
            <button type="button" onClick={() => void goNext()} disabled={!page.hasMore || page.loading} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#2E7D32] px-3 text-sm font-medium text-white disabled:opacity-40">Next <ChevronRight className="h-4 w-4" /></button>
          </nav>
        )}
      </section>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`border-b-2 px-5 py-3 text-sm font-semibold ${active ? 'border-[#2E7D32] text-[#2E7D32]' : 'border-transparent text-[#757575] hover:text-[#212121]'}`}>{children}</button>;
}

function FeedbackCard({ item, tab, busy, recommendationDisabled, onAction }: { item: AdminFeedback; tab: FeedbackTab; busy: boolean; recommendationDisabled: boolean; onAction: (item: AdminFeedback, action: 'approve' | 'delete' | 'recommend', isRecommended?: boolean) => void }) {
  return <article className="rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-[#212121]">{item.name}</h2><a className="text-sm text-[#2E7D32] hover:underline" href={`mailto:${item.email}`}>{item.email}</a></div><time className="text-xs text-[#888]" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString('en-IN')}</time></div><p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-[#555]">{item.message}</p>{tab === 'pending' ? <div className="mt-6 flex justify-end gap-2"><button disabled={busy} onClick={() => onAction(item, 'delete')} className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"><X className="h-4 w-4" /> Reject</button><button disabled={busy} onClick={() => onAction(item, 'approve')} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2E7D32] px-4 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Accept</button></div> : <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#EEEEEE] pt-4"><div className="flex items-center gap-3"><button type="button" role="switch" aria-checked={item.isRecommended} aria-label={`Recommend feedback from ${item.name}`} disabled={busy || recommendationDisabled} onClick={() => onAction(item, 'recommend', !item.isRecommended)} className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${item.isRecommended ? 'border-[#2E7D32] bg-[#2E7D32]' : 'border-[#9E9E9E] bg-[#E0E0E0]'}`}><span aria-hidden="true" className={`absolute left-0 top-0.5 h-5.5 w-5.5 rounded-full bg-white shadow-sm transition-transform ${item.isRecommended ? 'translate-x-5' : 'translate-x-0.5'}`} /></button><span className="text-sm font-medium text-[#424242]">Recommended</span></div><button disabled={busy} onClick={() => onAction(item, 'delete')} className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /> Delete</button></div>}</article>;
}
