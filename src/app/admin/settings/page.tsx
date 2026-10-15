'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { ArrowRight, CalendarDays, Check, Clock3, Eye, Loader2, ShieldCheck, Users } from 'lucide-react';
import { ApplyModeSelector } from './_components/ApplyModeSelector';
import { ConfigPanel } from './_components/ConfigPanel';
import { PreviewModal } from './_components/PreviewModal';
import { authenticatedFetch } from '@/lib/firebase/authenticated-fetch';
import { calendarSettingsRequestSchema, type CalendarScope, type CalendarSettingsRequest } from '@/lib/calendar-settings-request';

export type ApplyMode = 'all_days' | 'one_day' | 'date_range';
export interface CalendarSettings {
  maxCapacity?: number;
  startTime?: string;
  isOpen?: boolean;
}
export interface PreviewData {
  scope: CalendarScope;
  affectedDatesCount: number;
  affectedDates: string[];
  existingBookingsCount: number;
  bookingsByDate: { date: string; count: number }[];
  sampleCurrentSettings: Array<{ date: string; maxCapacity: number | null; startTime: string | null; isOpen: boolean }>;
  willBlock: boolean;
}

export default function SettingsPage() {
  const [applyMode, setApplyMode] = useState<ApplyMode>('all_days');
  const [selectedDate, setSelectedDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [settings, setSettings] = useState<CalendarSettings>({});
  const [daySettings, setDaySettings] = useState<{ date: string; settings?: CalendarSettings; error?: string } | null>(null);
  const [settingsRevision, setSettingsRevision] = useState(0);
  const currentDay = applyMode === 'one_day' && daySettings?.date === selectedDate ? daySettings : null;
  const currentSettings = currentDay?.settings;
  const settingsLoadError = currentDay?.error ?? '';
  const isLoadingSettings = applyMode === 'one_day' && !!selectedDate && !currentDay;
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [review, setReview] = useState<{ data: PreviewData; request: CalendarSettingsRequest } | null>(null);
  const previewInFlight = useRef(false);
  const applyInFlight = useRef(false);
  const changeSelectedDate = useCallback((date: string) => {
    if (date !== selectedDate) { setDaySettings(null); setSelectedDate(date); }
  }, [selectedDate]);

  useEffect(() => {
    let active = true;
    if (applyMode !== 'one_day' || !selectedDate) return;
    authenticatedFetch(`/api/calendar/day/${selectedDate}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load settings');
        const data = await response.json();
        if (!data.success || !data.settings) throw new Error('Invalid settings response');
        // Loading current values must never opt fields into the proposed changes.
        if (active) setDaySettings({ date: selectedDate, settings: { maxCapacity: data.settings.maxCapacity,
          startTime: data.settings.startTime, isOpen: data.settings.isOpen } });
      })
      .catch(() => {
        if (active) setDaySettings({ date: selectedDate, error: 'Could not load this date’s settings. Select another date and try again.' });
      });
    return () => { active = false; };
  }, [selectedDate, applyMode, settingsRevision]);

  const handlePreview = async () => {
    if (previewInFlight.current || isLoadingSettings || settingsLoadError || review) return;
    const parsed = calendarSettingsRequestSchema.safeParse({
      applyMode, settings,
      ...(applyMode === 'one_day' ? { date: selectedDate } : {}),
      ...(applyMode === 'date_range' ? { startDate, endDate } : {}),
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    previewInFlight.current = true;
    setIsLoadingPreview(true);
    try {
      const response = await authenticatedFetch('/api/admin/settings/preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data),
      });
      const data = await response.json();
      if (!response.ok) { toast.error(data.error || 'Failed to load preview'); return; }
      if (!data.success || !data.scope?.startDate || !data.scope?.endDate) throw new Error('Invalid preview response');
      // Store the exact reviewed dates and selected changes, not the live form state.
      setReview({ data, request: { ...parsed.data, scope: data.scope } });
    } catch {
      toast.error('Failed to load preview');
    } finally {
      previewInFlight.current = false;
      setIsLoadingPreview(false);
    }
  };

  const handleConfirmApply = async () => {
    if (!review || applyInFlight.current) return;
    applyInFlight.current = true;
    setIsApplying(true);
    try {
      const response = await authenticatedFetch('/api/admin/settings/bulk-update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(review.request),
      });
      const data = await response.json();
      if (!response.ok) { toast.error(data.error || 'Failed to apply settings'); return; }
      let message = `Updated ${data.affectedCount} date(s)`;
      if (data.cancelledBookingsCount > 0) message += `\nCancelled ${data.cancelledBookingsCount} booking(s)\nSent ${data.emailsSent} email(s)`;
      if (data.emailsFailed > 0) message += `\n${data.emailsFailed} email(s) failed to send`;
      toast.success(message, { duration: 5000 });
      setReview(null);
      setSettings({});
      setDaySettings(null);
      setSettingsRevision((revision) => revision + 1);
    } catch {
      toast.error('Failed to apply settings');
    } finally {
      applyInFlight.current = false;
      setIsApplying(false);
    }
  };

  const selectedCount = Object.values(settings).filter(value => value !== undefined).length;
  const summaryRows = [
    { label: 'Capacity', icon: Users, selected: settings.maxCapacity !== undefined, value: Number.isFinite(settings.maxCapacity) ? `${settings.maxCapacity} visitors` : 'Set a value' },
    { label: 'Visiting time', icon: Clock3, selected: settings.startTime !== undefined, value: settings.startTime?.slice(0, 5) || 'Set a time' },
    { label: 'Availability', icon: CalendarDays, selected: settings.isOpen !== undefined, value: settings.isOpen ? 'Open for bookings' : 'Close bookings' },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-24 text-[#233c32]" style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#73867b]">Visitor operations</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl" style={{ fontFamily: 'inherit' }}>Calendar Settings</h1>
          <p className="mt-2 text-sm leading-6 text-[#758079]">Set the rhythm of your visiting days. Change only what you need.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#e2e9e3] bg-white px-3 py-2 text-xs text-[#63776b]">
          <Clock3 className="size-3.5" aria-hidden="true" /> India time <span className="text-[#a0aaa3]">UTC+05:30</span>
        </span>
      </header>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <fieldset disabled={isLoadingPreview || isApplying || !!review} className="min-w-0 space-y-5">
        <ApplyModeSelector applyMode={applyMode} setApplyMode={(mode) => {
          if (mode !== applyMode) { setDaySettings(null); setApplyMode(mode); }
        }}
          selectedDate={selectedDate} setSelectedDate={changeSelectedDate}
          startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} />
        {settingsLoadError && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{settingsLoadError}</p>}
        <fieldset disabled={isLoadingSettings || !!settingsLoadError}>
          <ConfigPanel settings={settings} setSettings={setSettings} currentSettings={currentSettings} isLoading={isLoadingSettings} />
        </fieldset>
      </fieldset>
      <aside className="space-y-4 xl:sticky xl:top-24" aria-label="Change summary">
        <div className="overflow-hidden rounded-2xl border border-[#dce5dd] bg-white shadow-[0_4px_24px_-16px_rgba(24,63,42,0.18)]">
          <div className="bg-[#203e30] p-5 text-white">
            <div className="mb-5 flex items-center justify-between"><span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[#c4d4c7]">Ready for review</span><Eye className="size-4 text-[#bed5b7]" aria-hidden="true" /></div>
            <p className="text-xl font-medium">Your changes</p>
            <p className="mt-1 text-xs leading-5 text-[#c4d4c7]">{selectedCount === 0 ? 'Select a setting to build your update.' : `${selectedCount} ${selectedCount === 1 ? 'setting' : 'settings'} selected. Nothing is saved yet.`}</p>
          </div>
          <div className="space-y-5 p-5">
            <div className="flex items-start gap-3 border-b border-[#edf1ec] pb-5">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-[#6c8270]" aria-hidden="true" />
              <div className="min-w-0 text-sm"><p className="font-medium">{applyMode === 'all_days' ? 'All Days · 181 dates' : applyMode === 'one_day' ? 'One Day' : 'Date Range'}</p>
                <p className="mt-1 break-words text-xs leading-5 text-[#7b877d]">{applyMode === 'all_days' ? 'Today through 180 days ahead' : applyMode === 'one_day' ? selectedDate || 'Choose a date' : `${startDate || 'Start date'} → ${endDate || 'End date'}`}</p>
              </div>
            </div>
            <ul className="space-y-4" aria-live="polite">
              {summaryRows.map(({ label, icon: Icon, selected, value }) => <li key={label} className="flex items-start gap-3 text-sm">
                <Icon className={`mt-0.5 size-4 shrink-0 ${selected ? 'text-[#3d7950]' : 'text-[#a5b0a6]'}`} aria-hidden="true" />
                <div className="min-w-0 flex-1"><p className="text-xs text-[#7b877d]">{label}</p><p className={`mt-0.5 font-medium ${selected ? 'text-[#294a34]' : 'text-[#a0aaa3]'}`}>{selected ? value : 'Unchanged'}</p></div>
                {selected && <Check className="mt-1 size-3.5 text-[#3d7950]" aria-hidden="true" />}
              </li>)}
            </ul>
            <button id="settings-preview" onClick={handlePreview}
          disabled={isLoadingPreview || isLoadingSettings || isApplying || !!review || !!settingsLoadError}
          className="mt-1 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2e6d40] px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-[#245832] disabled:cursor-not-allowed disabled:opacity-50">
          {isLoadingPreview ? <><Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" /> Loading...</> : <>Preview Changes <ArrowRight className="size-4" aria-hidden="true" /></>}
        </button>
            <p className="text-center text-[11px] text-[#88958a]">Review first. Apply when you’re ready.</p>
          </div>
        </div>
        <div className="flex gap-3 rounded-2xl bg-[#edf3ec] p-4">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#5c7a5e]" aria-hidden="true" />
          <p className="text-xs leading-5 text-[#627664]">Unselected settings stay as they are. Closing dates cancels their confirmed bookings—review the impact before applying.</p>
        </div>
      </aside>
      </div>
      {review && <PreviewModal isOpen onClose={() => { if (!applyInFlight.current) setReview(null); }}
        previewData={review.data} onConfirm={handleConfirmApply} isApplying={isApplying}
        applyMode={review.request.applyMode} settings={review.request.settings} />}
    </div>
  );
}
