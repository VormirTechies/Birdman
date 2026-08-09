'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, MessageSquareText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { authenticatedFetch } from '@/lib/firebase/authenticated-fetch';
import type { AdminFeedback } from '@/models/firestore/feedback';

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<AdminFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch('/api/admin/feedback', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load feedback');
      setItems(await response.json());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load feedback');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function update(id: string, method: 'PATCH' | 'DELETE') {
    setWorkingId(id);
    try {
      const response = await authenticatedFetch(`/api/admin/feedback/${id}`, { method });
      if (!response.ok) throw new Error(method === 'PATCH' ? 'Approval failed' : 'Deletion failed');
      setItems((current) => current.filter((item) => item.id !== id));
      toast.success(method === 'PATCH' ? 'Feedback approved' : 'Feedback deleted');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    } finally {
      setWorkingId(null);
    }
  }

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-semibold text-[#212121]">Feedback</h1><p className="mt-1 text-sm text-[#757575]">Review visitor feedback before it appears publicly.</p></div>
    {loading ? <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-[#2E7D32]" /></div> : items.length === 0 ? <div className="rounded-2xl border border-dashed border-[#D8D8D8] bg-white py-20 text-center"><MessageSquareText className="mx-auto h-10 w-10 text-[#A0A0A0]" /><h2 className="mt-4 font-semibold text-[#212121]">Nothing waiting for review</h2></div> : <div className="grid gap-4 lg:grid-cols-2">{items.map((item) => <article key={item.id} className="rounded-2xl border border-[#E5E5E5] bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-[#212121]">{item.name}</h2><a className="text-sm text-[#2E7D32] hover:underline" href={`mailto:${item.email}`}>{item.email}</a></div><time className="text-xs text-[#888]" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleDateString('en-IN')}</time></div><p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-[#555]">{item.message}</p><div className="mt-6 flex justify-end gap-2"><button disabled={workingId === item.id} onClick={() => void update(item.id, 'DELETE')} className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 px-4 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /> Delete</button><button disabled={workingId === item.id} onClick={() => void update(item.id, 'PATCH')} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#2E7D32] px-4 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">{workingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve</button></div></article>)}</div>}
  </div>;
}
