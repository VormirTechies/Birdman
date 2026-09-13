'use client';

import { useEffect, useRef, useState } from 'react';
import { authenticatedFetch } from '@/lib/firebase/authenticated-fetch';

type Report = { inserts: number; duplicates: number; counter: number; dryRun: boolean; dayTotals: { date: string; confirmedGuests: number }[] };

export default function BookingImportPage() {
  const [target, setTarget] = useState('emulator');
  const [offset, setOffset] = useState('+05:30');
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const locked = useRef(false);
  useEffect(() => {
    let active = true;
    setReport(null); setError(''); setConfirmation('');
    authenticatedFetch(`/api/admin/booking-import?target=${target}`)
      .then(async response => { const data = await response.json(); if (active && !response.ok) setError(data.error || 'Target unavailable. Check your admin session and emulator.'); })
      .catch(() => { if (active) setError('Cannot connect. Check your admin session and start the local emulators if needed.'); });
    return () => { active = false; };
  }, [target]);
  async function submit(dryRun: boolean) {
    if (!file || locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try {
      if (file.size > 500_000) throw new Error('Select a CSV smaller than 500 KB.');
      const response = await authenticatedFetch('/api/admin/booking-import', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv: await file.text(), target, offset, dryRun, confirmation }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Import failed');
      setReport(data.report); setConfirmation('');
    } catch (error) { setReport(null); setError(error instanceof Error ? error.message : 'Import failed'); }
    finally { locked.current = false; setBusy(false); }
  }
  const inputClass = 'w-full rounded-lg border border-gray-300 bg-white p-3';
  return <section className="mx-auto max-w-3xl space-y-6 rounded-2xl bg-white p-6 shadow-sm">
    <h1 className="text-3xl font-semibold">Booking CSV migration</h1>
    <p>Temporary administrator tool. Preview Supabase bookings before importing. Bookings, booking-number counter and affected-day guest totals are updated together.</p>
    <fieldset disabled={busy} className="space-y-4 disabled:opacity-60">
      <label className="block">Database<select className={inputClass} value={target} onChange={e => setTarget(e.target.value)}><option value="emulator">Local emulator — (default)</option><option value="production">Live database — birdman-db</option></select></label>
      {target === 'production' && <p className="rounded-lg bg-amber-50 p-3 text-amber-900">Live imports affect production bookings. Use your production administrator session.</p>}
      <label className="block">Source timestamp timezone<select className={inputClass} value={offset} onChange={e => { setOffset(e.target.value); setReport(null); }}><option value="+05:30">India time (UTC+05:30)</option><option value="Z">UTC</option></select></label>
      <label className="block">Booking CSV<input className={inputClass} type="file" accept=".csv,text/csv" onChange={e => { setFile(e.target.files?.[0] || null); setReport(null); setConfirmation(''); }} /></label>
      <button type="button" className="rounded-lg bg-green-800 px-5 py-3 text-white disabled:opacity-50" disabled={!file} onClick={() => submit(true)}>{busy ? 'Processing…' : 'Preview migration'}</button>
    </fieldset>
    {error && <p role="alert" className="whitespace-pre-wrap rounded-lg bg-red-50 p-4 text-red-800">{error}</p>}
    {report && <div className="space-y-4" aria-live="polite">
      <h2 className="text-xl font-semibold">{report.dryRun ? 'Migration preview' : 'Import completed'}</h2>
      <p>{report.inserts} {report.dryRun ? 'to insert' : 'inserted'} · {report.duplicates} duplicates skipped · Booking counter: {report.counter}</p>
      <table className="w-full text-left"><thead><tr><th>Date</th><th>Confirmed guests after import</th></tr></thead><tbody>{report.dayTotals.map(day => <tr key={day.date}><td className="py-2">{day.date}</td><td>{day.confirmedGuests}</td></tr>)}</tbody></table>
      {report.dryRun && <><label className="block">Type {target === 'production' ? 'IMPORT LIVE' : 'IMPORT'} to confirm<input disabled={busy} className={inputClass} value={confirmation} onChange={e => setConfirmation(e.target.value)} autoComplete="off" /></label><button disabled={busy || confirmation !== (target === 'production' ? 'IMPORT LIVE' : 'IMPORT')} className="rounded-lg bg-green-800 px-5 py-3 text-white disabled:opacity-50" onClick={() => submit(false)}>{busy ? 'Importing…' : 'Import bookings'}</button></>}
    </div>}
  </section>;
}
