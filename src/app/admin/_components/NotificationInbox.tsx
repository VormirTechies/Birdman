'use client';

import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, Bell, CalendarCheck, CalendarClock, CalendarX, Check, CheckCheck,
  ChevronLeft, ChevronRight, LoaderCircle, RefreshCw, Users, X } from 'lucide-react';
import { useNotifications } from '@/components/providers/NotificationProvider';
import { cn } from '@/lib/utils';

const eventIcons = {
  booking_confirmed: CalendarCheck,
  booking_changed: CalendarClock,
  booking_cancelled: CalendarX,
  capacity_full: Users,
};
const actionStyle = 'inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors hover:bg-[#F5F5F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]/40 disabled:cursor-not-allowed disabled:opacity-40';

export function NotificationInbox({ onNavigate }: { onNavigate?: () => void } = {}) {
  const inbox = useNotifications();
  return (
    <section aria-label="Admin notification inbox" aria-busy={inbox.loading}
      className="flex max-h-[min(36rem,calc(100dvh-7rem))] flex-col text-[#212121]"
      style={{ fontFamily: 'var(--font-work-sans, Work Sans, sans-serif)' }}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#E0E0E0] px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold leading-5" style={{ fontFamily: 'inherit' }}>Notifications</h2>
          <p className="mt-0.5 text-xs text-[#757575]">{inbox.unreadCount ? `${inbox.unreadCount} unread` : 'You’re all caught up'}</p>
        </div>
        <div className="flex items-center gap-0.5">
          <button className={cn(actionStyle, 'text-[#2E7D32]')} title="Mark this page read"
            disabled={inbox.busy || inbox.loading || !inbox.notifications.some(item => !item.read)}
            onClick={() => void inbox.act(inbox.notifications.filter(item => !item.read).map(item => item.id), 'read')}>
            <CheckCheck className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Mark page read</span>
          </button>
          <button className={cn(actionStyle, 'text-[#616161]')} title="Show latest notifications" disabled={inbox.loading || inbox.busy} onClick={inbox.latest}>
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only">Latest</span>
          </button>
        </div>
      </div>

      {inbox.error && <div role="alert" className="flex shrink-0 items-start gap-2 border-b border-[#E0E0E0] bg-[#fff8f7] px-4 py-3 text-xs text-[#ba1a1a]">
        <p className="flex-1 leading-relaxed">{inbox.error}</p><button className={actionStyle} onClick={inbox.refresh}>Retry</button>
      </div>}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-1" key={inbox.notifications[0]?.id ?? 'empty'}>
        {inbox.loading && <div role="status" className="flex items-center justify-center gap-2 px-4 py-2 text-xs text-[#757575]">
          <LoaderCircle className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />Loading notifications…
        </div>}
        {!inbox.loading && !inbox.error && !inbox.notifications.length && <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F5F5F5] text-[#9E9E9E]"><Bell className="h-5 w-5" aria-hidden="true" /></div>
          <div><p className="text-sm font-medium">No notifications on this page.</p><p className="mt-1 text-xs leading-relaxed text-[#757575]">Booking updates will appear here.</p></div>
        </div>}
        {inbox.notifications.map(item => {
          const Icon = eventIcons[item.type];
          return <article key={item.id} className="group flex gap-3 px-4 py-3 transition-colors hover:bg-[#F5F5F5]">
            <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
              item.read ? 'bg-[#F5F5F5] text-[#9E9E9E]' : 'bg-[#E8F5E9] text-[#2E7D32]')}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <h3 className={cn('min-w-0 flex-1 break-words text-sm leading-5', item.read ? 'font-medium text-[#616161]' : 'font-semibold')}
                  style={{ fontFamily: 'inherit' }}>{item.title}{!item.read && <span className="sr-only"> (Unread)</span>}</h3>
                {!item.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2E7D32]" aria-hidden="true" />}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#616161]">{item.body}</p>
              <p className="mt-1.5 flex flex-wrap gap-x-1.5 text-[11px] leading-4 text-[#616161]">
                <span>{format(new Date(`${item.bookingDate}T12:00:00`), 'dd MMM yyyy')}</span><span aria-hidden="true">·</span>
                <time dateTime={item.createdAt}>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</time>
              </p>
              {item.type !== 'capacity_full' && !item.bookingExists && <p className="mt-1 text-[11px] text-[#616161]">The booking is no longer available.</p>}
              <div className="-ml-2 mt-1 flex flex-wrap items-center gap-0.5">
                <Link href="/admin" onClick={onNavigate} className={cn(actionStyle, 'text-[#2E7D32]')}>
                  Open dashboard<ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                </Link>
                {!item.read && <button className={cn(actionStyle, 'text-[#616161]')} disabled={inbox.busy || inbox.loading} onClick={() => void inbox.act([item.id], 'read')}>
                  <Check className="h-3 w-3" aria-hidden="true" />Mark read
                </button>}
                <button className={cn(actionStyle, 'text-[#757575] hover:bg-[#ffdad6] hover:text-[#ba1a1a]')} disabled={inbox.busy || inbox.loading} onClick={() => void inbox.act([item.id], 'dismiss')}>
                  <X className="h-3 w-3" aria-hidden="true" />Dismiss
                </button>
              </div>
            </div>
          </article>;
        })}
      </div>

      <nav aria-label="Notification pagination" className="flex shrink-0 items-center justify-between border-t border-[#E0E0E0] px-3 py-2">
        <button className={cn(actionStyle, 'text-[#616161]')} disabled={!inbox.canPrevious || inbox.loading || inbox.busy} onClick={inbox.previous}>
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />Previous
        </button>
        <span className="text-[11px] text-[#757575]">{inbox.notifications.length} on this page</span>
        <button className={cn(actionStyle, 'text-[#616161]')} disabled={!inbox.pagination.hasMore || inbox.loading || inbox.busy} onClick={inbox.next}>
          Next<ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </nav>
    </section>
  );
}
