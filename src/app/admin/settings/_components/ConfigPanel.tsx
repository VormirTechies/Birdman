'use client';

import { AlertTriangle, Clock3, Users, CalendarCheck2, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import type { CalendarSettings } from '../page';

interface ConfigPanelProps {
  settings: CalendarSettings;
  setSettings: (settings: CalendarSettings) => void;
  currentSettings?: CalendarSettings;
  isLoading?: boolean;
}

function ChangeToggle({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode }) {
  return <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-between gap-3 text-sm font-medium text-[#354d3c]">
    {children}
    <span className="relative inline-flex shrink-0">
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer opacity-0 disabled:cursor-not-allowed" />
      <span aria-hidden="true" className="h-6 w-10 rounded-full bg-[#dae2d8] transition-colors peer-checked:bg-[#4d7d51] peer-focus-visible:ring-2 peer-focus-visible:ring-[#4d7d51] peer-focus-visible:ring-offset-2 peer-disabled:opacity-50" />
      <span aria-hidden="true" className="pointer-events-none absolute left-1 top-1 size-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4 motion-reduce:transition-none" />
    </span>
  </label>;
}

const inputStyle = 'w-full min-w-0 rounded-xl border border-[#dce5d9] bg-white px-3.5 py-3 text-sm text-[#294134] outline-none transition-colors focus:border-[#72956f] focus:ring-2 focus:ring-[#e3eddf]';

export function ConfigPanel({ settings, setSettings, currentSettings, isLoading }: ConfigPanelProps) {
  const select = <K extends keyof CalendarSettings>(key: K, enabled: boolean, initial: CalendarSettings[K]) => {
    const next = { ...settings };
    if (enabled) next[key] = initial;
    else delete next[key];
    setSettings(next);
  };

  return (
    <section className="space-y-5 rounded-2xl border border-[#e2e8e1] bg-white p-5 sm:p-6" aria-labelledby="configuration-title">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#edf3ec] text-xs font-semibold text-[#48714e]">02</span>
          <div><h2 id="configuration-title" className="text-base font-semibold text-[#294134]" style={{ fontFamily: 'inherit' }}>Configuration</h2>
            <p className="mt-1 text-xs leading-5 text-[#849086]">Enable a setting to include it in your update.</p></div>
        </div>
        <button type="button" onClick={() => setSettings({})} className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs text-[#7d8d7d] transition-colors hover:bg-[#f1f5ee] hover:text-[#355a39]">
          <RotateCcw className="size-3" aria-hidden="true" /> Reset changes
        </button>
      </div>
      {isLoading && <p role="status" className="text-xs text-[#7d8d7d]">Loading settings...</p>}

      <div className={`rounded-xl border p-4 ${settings.maxCapacity !== undefined ? 'border-[#bfd2b8] bg-[#f8fbf5]' : 'border-[#e9eee6]'}`}>
        <div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef3ea] text-[#6c8764]"><Users className="size-4" aria-hidden="true" /></span>
          <ChangeToggle checked={settings.maxCapacity !== undefined} onChange={enabled => select('maxCapacity', enabled, currentSettings?.maxCapacity ?? 100)}>Change capacity</ChangeToggle>
        </div>
        {settings.maxCapacity !== undefined ? (
          <div className="mt-4 space-y-2 sm:pl-12">
            <label htmlFor="settings-capacity" className="block text-xs text-[#75856e]">Maximum Capacity</label>
            <div className="relative">
            <input id="settings-capacity" type="number" min={0} max={200} step={1}
              value={Number.isNaN(settings.maxCapacity) ? '' : settings.maxCapacity}
              onChange={(event) => setSettings({ ...settings, maxCapacity: event.target.valueAsNumber })}
              className={`${inputStyle} pr-24`} />
              <span className="pointer-events-none absolute right-9 top-3.5 text-xs text-[#8a9782]">visitors</span>
            </div>
            <p className="text-[11px] text-[#8a9782]">Total guests, including children. Up to 200 per day.</p>
          </div>
        ) : <p className="pl-12 text-xs leading-5 text-[#8c9887]">Capacity: leave unchanged</p>}
      </div>

      <div className={`rounded-xl border p-4 ${settings.startTime !== undefined ? 'border-[#bfd2b8] bg-[#f8fbf5]' : 'border-[#e9eee6]'}`}>
        <div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef3ea] text-[#6c8764]"><Clock3 className="size-4" aria-hidden="true" /></span>
          <ChangeToggle checked={settings.startTime !== undefined} onChange={enabled => select('startTime', enabled, currentSettings?.startTime ?? '16:30:00')}>Change visiting time</ChangeToggle>
        </div>
        {settings.startTime !== undefined ? (
          <div className="mt-4 space-y-2 sm:pl-12">
            <label htmlFor="settings-time" className="block text-xs text-[#75856e]">Visiting Hour (India time)</label>
            <input id="settings-time" type="time" step={1} value={settings.startTime}
              onChange={(event) => setSettings({ ...settings, startTime: event.target.value.length === 5 ? `${event.target.value}:00` : event.target.value })}
              className={inputStyle} />
          </div>
        ) : <p className="pl-12 text-xs leading-5 text-[#8c9887]">Visiting time: leave unchanged</p>}
      </div>

      <div className={`rounded-xl border p-4 ${settings.isOpen !== undefined ? 'border-[#bfd2b8] bg-[#f8fbf5]' : 'border-[#e9eee6]'}`}>
        <div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef3ea] text-[#6c8764]"><CalendarCheck2 className="size-4" aria-hidden="true" /></span>
          <ChangeToggle checked={settings.isOpen !== undefined} onChange={enabled => select('isOpen', enabled, currentSettings?.isOpen ?? true)}>Change booking availability</ChangeToggle>
        </div>
        {settings.isOpen !== undefined ? (
          <label htmlFor="settings-open-bookings" className="mt-4 flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl bg-white px-3.5 py-2 text-sm sm:ml-12">
            <Checkbox id="settings-open-bookings" checked={settings.isOpen}
              onCheckedChange={(checked) => setSettings({ ...settings, isOpen: checked === true })}
              className="border-[#bfd2b8] focus-visible:ring-[#4d7d51]/30 data-[state=checked]:border-[#4d7d51] data-[state=checked]:bg-[#4d7d51]" />
            Open for Bookings
          </label>
        ) : <p className="pl-12 text-xs leading-5 text-[#8c9887]">Booking availability: leave unchanged</p>}
      </div>

      {settings.isOpen === false && (
        <div role="alert" className="flex gap-2.5 rounded-xl border border-amber-200/70 bg-amber-50 p-4">
          <AlertTriangle className="w-4 h-4 text-[#ba1a1a] shrink-0 mt-0.5" />
          <p className="text-xs leading-5 text-amber-900">Closing these dates will cancel existing confirmed bookings. Review the affected bookings before applying.</p>
        </div>
      )}
    </section>
  );
}
