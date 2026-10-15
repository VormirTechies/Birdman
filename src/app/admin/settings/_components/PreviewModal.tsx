'use client';

import { ArrowRight, X, AlertTriangle, CalendarDays, Users, Clock3, Eye, Loader2, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import type { PreviewData, ApplyMode, CalendarSettings } from '../page';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: PreviewData;
  onConfirm: () => void;
  isApplying: boolean;
  applyMode: ApplyMode;
  settings: CalendarSettings;
}

const displayDate = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata',
});

export function PreviewModal({ isOpen, onClose, previewData, onConfirm, isApplying, applyMode, settings }: PreviewModalProps) {
  const { affectedDatesCount, affectedDates, existingBookingsCount, bookingsByDate, sampleCurrentSettings, willBlock, scope } = previewData;
  const changes = [
    { label: 'Daily capacity', icon: Users, value: settings.maxCapacity !== undefined ? `${settings.maxCapacity} visitors` : null },
    { label: 'Visiting time', icon: Clock3, value: settings.startTime !== undefined ? `${settings.startTime.slice(0, 5)} IST` : null },
    { label: 'Booking availability', icon: CalendarDays, value: settings.isOpen !== undefined ? settings.isOpen ? 'Open for bookings' : 'Closed for bookings' : null },
  ];
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !isApplying) onClose(); }}>
      <DialogContent showCloseButton={false}
        onEscapeKeyDown={event => { if (isApplying) event.preventDefault(); }}
        onPointerDownOutside={event => { if (isApplying) event.preventDefault(); }}
        onCloseAutoFocus={event => { event.preventDefault(); requestAnimationFrame(() => document.getElementById('settings-preview')?.focus()); }}
        className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden rounded-2xl border border-[#e1e9dd] bg-white p-0 text-[#294134] shadow-2xl sm:max-w-2xl"
        style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}>
        <div className="flex items-start justify-between gap-3 border-b border-[#edf1e9] p-5 sm:px-7 sm:py-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#edf4e9] text-[#57794d]"><Eye className="size-5" aria-hidden="true" /></span>
            <div><DialogTitle className="text-lg font-semibold" style={{ fontFamily: 'inherit' }}>Preview Changes</DialogTitle>
              <DialogDescription className="mt-1 text-xs text-[#819078]">One final look before updating your calendar.</DialogDescription></div>
          </div>
          <button type="button" aria-label="Close preview" disabled={isApplying} onClick={onClose}
            className="rounded-lg p-2 text-[#8a9782] transition-colors hover:bg-[#f2f5ef] disabled:opacity-40"><X className="size-4" aria-hidden="true" /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
          <div className="rounded-xl bg-[#f2f6ee] p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a9070]">{applyMode === 'all_days' ? 'All Days' : applyMode === 'one_day' ? 'One Day' : 'Date Range'} · India time</p>
            <p className="text-sm font-medium">{displayDate(scope.startDate)} <span className="mx-1 text-[#a1af98]">—</span> {displayDate(scope.endDate)}</p>
            <p className="mt-1.5 text-[11px] leading-5 text-[#829278]">Exact date range: {scope.startDate} through {scope.endDate}, inclusive.</p>
          </div>
          {willBlock && existingBookingsCount > 0 && <div role="alert" className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
            <div><p className="text-sm font-medium text-amber-900">{existingBookingsCount} booking(s) will be cancelled</p>
              <p className="mt-1 text-xs leading-5 text-amber-800">Closing these dates cancels their confirmed bookings. Cancellation emails will be attempted for visitors with an email address.</p></div>
          </div>}
          <div className="grid grid-cols-2 divide-x divide-[#e7ede2] rounded-xl border border-[#e7ede2]">
            <div className="p-4"><p className="text-[11px] text-[#8a9782]">Affected dates</p><p className="mt-1 text-2xl font-semibold tracking-tight">{affectedDatesCount} <span className="text-xs font-normal text-[#8a9782]">{affectedDatesCount === 1 ? 'Date' : 'Dates'}</span></p></div>
            <div className="p-4"><p className="text-[11px] text-[#8a9782]">Confirmed bookings</p><p className="mt-1 text-2xl font-semibold tracking-tight">{existingBookingsCount}</p></div>
          </div>
          <section aria-label="Settings to apply">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#829278]">Settings to apply</p>
            <div className="divide-y divide-[#edf1e9]">{changes.map(({ label, icon: Icon, value }) => <div key={label} className="flex items-center gap-3 py-3 text-sm">
              <Icon className={`size-4 shrink-0 ${value === null ? 'text-[#b0b9a9]' : 'text-[#65865a]'}`} aria-hidden="true" />
              <span className="flex-1 text-xs text-[#7e8b75]">{label}</span><span className={`text-right text-xs ${value === null ? 'text-[#a2ad9b]' : 'font-medium text-[#365c38]'}`}>{value ?? 'Unchanged'}</span>
            </div>)}</div>
          </section>
          {bookingsByDate.length > 0 && <details className="rounded-xl border border-[#e7ede2] px-4 py-3">
            <summary className="cursor-pointer text-xs font-medium">Bookings by date</summary>
            <div className="mt-3 space-y-2">{bookingsByDate.map(item => <div key={item.date} className="flex justify-between gap-3 text-xs text-[#7e8b75]"><span>{displayDate(item.date)}</span><span>{item.count} bookings</span></div>)}</div>
          </details>}
          {sampleCurrentSettings.length > 0 && <details className="rounded-xl border border-[#e7ede2] px-4 py-3">
            <summary className="cursor-pointer text-xs font-medium">Current settings · sample dates</summary>
            <div className="mt-3 space-y-3">{sampleCurrentSettings.map(item => <div key={item.date} className="text-xs">
              <p className="font-medium">{displayDate(item.date)}</p><p className="mt-1 leading-5 text-[#7e8b75]">{item.maxCapacity ?? 'Default'} visitors · {item.startTime?.slice(0, 5) ?? 'Default time'} · {item.isOpen ? 'Open' : 'Closed'}</p>
            </div>)}</div>
          </details>}
          {affectedDates.length > 0 && <details className="text-xs text-[#8a9782]"><summary className="cursor-pointer">Affected dates · {affectedDates.length < affectedDatesCount ? 'first 10 shown' : 'all dates'}</summary>
            <p className="mt-2 leading-6">{affectedDates.map(displayDate).join(' · ')}</p></details>}
        </div>
        <div className="border-t border-[#edf1e9] bg-[#fafcf8] p-5 sm:px-7">
          <p className="mb-4 flex items-center gap-2 text-[11px] text-[#87977d]"><ShieldCheck className="size-3.5" aria-hidden="true" /> Unselected settings stay unchanged.</p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={isApplying} className="rounded-xl border border-[#dfe7d9] bg-white px-4 py-3 text-xs font-medium text-[#75856b] hover:bg-[#f1f5ed] disabled:opacity-40">Cancel</button>
            <button type="button" onClick={onConfirm} disabled={isApplying} className="flex items-center gap-2 rounded-xl bg-[#2e6d40] px-4 py-3 text-xs font-medium text-white hover:bg-[#245832] disabled:cursor-not-allowed disabled:opacity-60">
              {isApplying ? <><Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Applying...</> : <>Confirm &amp; Apply <ArrowRight className="size-3.5" aria-hidden="true" /></>}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
