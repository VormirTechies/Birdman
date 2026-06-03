'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, Loader2, Search, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BookingStatus = {
  bookingCode: string;
  visitorName: string;
  phone: string;
  email: string | null;
  bookingDate: string;
  bookingTime: string;
  adults: number;
  children: number;
  numberOfGuests: number;
  status: 'confirmed' | 'cancelled' | 'completed' | string;
  createdAt: string;
};

type CalendarDay = {
  date: string;
  bookingCount: number;
  maxCapacity: number;
  isOpen: boolean;
  startTime: string;
  percentage: number;
  remaining: number;
};

function todayString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(time: string) {
  const [hourText, minute = '00'] = time.split(':');
  const hour = Number(hourText);
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${displayHour}:${minute} ${period}`;
}

async function readJson(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong. Please try again.');
  }
  return data;
}

export function BookingStatusClient() {
  const [bookingCode, setBookingCode] = useState('');
  const [contact, setContact] = useState('');
  const [booking, setBooking] = useState<BookingStatus | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dateDraft, setDateDraft] = useState('');
  const [adultsDraft, setAdultsDraft] = useState(1);
  const [childrenDraft, setChildrenDraft] = useState(0);
  const [calendarDay, setCalendarDay] = useState<CalendarDay | null>(null);
  const [checkingDate, setCheckingDate] = useState(false);

  const editable = booking?.status === 'confirmed' && booking.bookingDate >= todayString();
  const totalDraftGuests = adultsDraft + childrenDraft;

  const normalizedCode = useMemo(
    () => bookingCode.replace(/^#/, '').trim().toUpperCase(),
    [bookingCode]
  );

  const lookupPayload = {
    bookingCode: normalizedCode,
    contact: contact.trim(),
  };

  const resetNotice = () => {
    setError('');
    setMessage('');
  };

  const loadBooking = async () => {
    resetNotice();
    setLoading(true);
    try {
      const data = await readJson(
        await fetch('/api/bookings/self-service', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lookupPayload),
        })
      );
      const nextBooking = data.booking as BookingStatus;
      setBooking(nextBooking);
      setDateDraft(nextBooking.bookingDate);
      setAdultsDraft(nextBooking.adults);
      setChildrenDraft(nextBooking.children);
    } catch (err) {
      setBooking(null);
      setError(err instanceof Error ? err.message : 'Unable to find booking.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!dateDraft) {
      setCalendarDay(null);
      return;
    }

    const controller = new AbortController();
    const month = dateDraft.slice(0, 7);
    setCheckingDate(true);

    fetch(`/api/calendar?month=${month}`, { signal: controller.signal })
      .then(readJson)
      .then((days: CalendarDay[]) => {
        setCalendarDay(days.find((day) => day.date === dateDraft) ?? null);
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setCalendarDay(null);
      })
      .finally(() => setCheckingDate(false));

    return () => controller.abort();
  }, [dateDraft]);

  const updateBooking = async () => {
    resetNotice();
    setSaving(true);
    try {
      const data = await readJson(
        await fetch('/api/bookings/self-service', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...lookupPayload,
            bookingDate: dateDraft,
            adults: adultsDraft,
            children: childrenDraft,
          }),
        })
      );
      setBooking(data.booking);
      setMessage('Booking updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update booking.');
    } finally {
      setSaving(false);
    }
  };

  const cancelBooking = async () => {
    const confirmed = window.confirm('Cancel this booking? This cannot be undone.');
    if (!confirmed) return;

    resetNotice();
    setSaving(true);
    try {
      const data = await readJson(
        await fetch('/api/bookings/self-service', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(lookupPayload),
        })
      );
      setBooking(data.booking);
      setMessage('Booking cancelled successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel booking.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="bg-feather-cream min-h-screen pt-28 pb-20">
      <div className="container-wide max-w-5xl">
        <section className="mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-sanctuary-green/10 px-4 py-1.5 text-sm font-semibold text-sanctuary-green">
            <Search className="w-4 h-4" />
            Booking Status
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-canopy-dark mt-4">
            Manage Your Visit
          </h1>
          <p className="text-canopy-dark/65 mt-3 max-w-2xl">
            Enter the booking ID from your confirmation and the phone number or email used for booking.
          </p>
        </section>

        <section className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6 items-start">
          <div className="bg-white rounded-2xl shadow-card border border-sanctuary-green/10 p-6">
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-canopy-dark">Booking ID</span>
                <input
                  value={bookingCode}
                  onChange={(event) => setBookingCode(event.target.value)}
                  placeholder="Example: #002001"
                  className="mt-2 w-full rounded-xl border border-canopy-dark/10 px-4 py-3 text-sm outline-none focus:border-sanctuary-green"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-canopy-dark">Phone or Email</span>
                <input
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder="Phone number or email address"
                  className="mt-2 w-full rounded-xl border border-canopy-dark/10 px-4 py-3 text-sm outline-none focus:border-sanctuary-green"
                />
              </label>

              <Button
                type="button"
                onClick={loadBooking}
                disabled={loading || normalizedCode.length < 6 || contact.trim().length < 5}
                className="w-full rounded-full bg-sanctuary-green hover:bg-sanctuary-green-light text-white gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Find Booking
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-xl border border-sanctuary-green/20 bg-sanctuary-green/10 px-4 py-3 text-sm text-sanctuary-green flex gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                {message}
              </div>
            )}

            {!booking && (
              <div className="bg-white rounded-2xl shadow-card border border-sanctuary-green/10 p-8 text-center text-canopy-dark/55">
                Your booking details will appear here after verification.
              </div>
            )}

            {booking && (
              <div className="bg-white rounded-2xl shadow-card border border-sanctuary-green/10 overflow-hidden">
                <div className="p-6 border-b border-canopy-dark/5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-canopy-dark/45">
                      {booking.bookingCode}
                    </p>
                    <h2 className="font-display text-2xl font-bold text-canopy-dark mt-1">
                      {booking.visitorName}
                    </h2>
                    <p className="text-sm text-canopy-dark/55 mt-1">
                      {booking.phone}
                      {booking.email ? ` • ${booking.email}` : ''}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-sanctuary-green/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-sanctuary-green">
                    {booking.status}
                  </span>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 p-6">
                  <div className="rounded-xl bg-morning-mist p-4">
                    <CalendarDays className="w-5 h-5 text-sanctuary-green mb-2" />
                    <p className="text-xs uppercase font-bold text-canopy-dark/45">Visit Date</p>
                    <p className="text-sm font-semibold text-canopy-dark mt-1">
                      {formatDate(booking.bookingDate)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-morning-mist p-4">
                    <p className="text-xs uppercase font-bold text-canopy-dark/45">Session</p>
                    <p className="text-sm font-semibold text-canopy-dark mt-1">
                      {formatTime(booking.bookingTime)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-morning-mist p-4">
                    <Users className="w-5 h-5 text-sanctuary-green mb-2" />
                    <p className="text-xs uppercase font-bold text-canopy-dark/45">Guests</p>
                    <p className="text-sm font-semibold text-canopy-dark mt-1">
                      {booking.adults} adult{booking.adults !== 1 ? 's' : ''}
                      {booking.children > 0 ? `, ${booking.children} child${booking.children !== 1 ? 'ren' : ''}` : ''}
                    </p>
                  </div>
                </div>

                {editable ? (
                  <div className="p-6 pt-0 space-y-5">
                    <div className="grid sm:grid-cols-3 gap-4">
                      <label className="sm:col-span-1">
                        <span className="text-sm font-semibold text-canopy-dark">New Date</span>
                        <input
                          type="date"
                          min={todayString()}
                          value={dateDraft}
                          onChange={(event) => setDateDraft(event.target.value)}
                          className="mt-2 w-full rounded-xl border border-canopy-dark/10 px-4 py-3 text-sm outline-none focus:border-sanctuary-green"
                        />
                      </label>

                      <label>
                        <span className="text-sm font-semibold text-canopy-dark">Adults</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={adultsDraft}
                          onChange={(event) => setAdultsDraft(Number(event.target.value))}
                          className="mt-2 w-full rounded-xl border border-canopy-dark/10 px-4 py-3 text-sm outline-none focus:border-sanctuary-green"
                        />
                      </label>

                      <label>
                        <span className="text-sm font-semibold text-canopy-dark">Children</span>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={childrenDraft}
                          onChange={(event) => setChildrenDraft(Number(event.target.value))}
                          className="mt-2 w-full rounded-xl border border-canopy-dark/10 px-4 py-3 text-sm outline-none focus:border-sanctuary-green"
                        />
                      </label>
                    </div>

                    <div className="rounded-xl bg-feather-cream border border-canopy-dark/5 px-4 py-3 text-sm text-canopy-dark/65">
                      {checkingDate
                        ? 'Checking date availability...'
                        : calendarDay
                          ? calendarDay.isOpen
                            ? `${calendarDay.remaining} slot(s) currently available on ${formatDate(dateDraft)}.`
                            : 'This date is currently closed for bookings.'
                          : 'Choose a date to check availability.'}
                      <span className="block mt-1 font-medium text-canopy-dark">
                        Selected total: {totalDraftGuests} visitor{totalDraftGuests !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="button"
                        onClick={updateBooking}
                        disabled={saving || totalDraftGuests < 1 || totalDraftGuests > 10}
                        className="rounded-full bg-sanctuary-green hover:bg-sanctuary-green-light text-white gap-2"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        onClick={cancelBooking}
                        disabled={saving}
                        variant="outline"
                        className="rounded-full border-red-200 text-red-600 hover:bg-red-50 gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Cancel Booking
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 pt-0 text-sm text-canopy-dark/60">
                    This booking can no longer be changed online.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
