'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createQATag, disableKey, isLocalAnalyticsHost, measurementId, type QAWindow } from '@/lib/local-analytics-qa';

const scriptId = 'birdman-ga4-qa';
const publicPages = new Map([
  ['/', 'Home'], ['/book', 'Book a Visit'], ['/booking-status', 'Manage Booking'],
  ['/gallery', 'Gallery'], ['/feedback', 'Visitor Reviews'], ['/story', 'Story'],
  ['/visit', 'Visitor Guide'], ['/meiyazhagan', 'Meiyazhagan'],
  ['/blog', 'Blog'], ['/blog/submit', 'Submit a Story'],
]);

const subscribe = () => () => {};
const serverSnapshot = () => false;

export function LocalAnalyticsQA() {
  const pathname = usePathname();
  const [optedIn, setOptedIn] = useState(false);
  const lastPage = useRef<string | null>(null);
  const title = publicPages.get(pathname ?? '');
  const localHost = useSyncExternalStore(subscribe, isLocalAnalyticsHost, serverSnapshot);
  const allowed = process.env.NODE_ENV !== 'production'
    && process.env.NEXT_PUBLIC_GA4_LOCAL_QA === 'true'
    && localHost;

  useEffect(() => {
    if (!allowed) return;
    const browser: QAWindow = window;
    if (!optedIn || !title || !pathname) {
      browser[disableKey] = true;
      lastPage.current = null;
      return;
    }
    if (lastPage.current === pathname) return;

    const safePage = {
      page_location: new URL(pathname, window.location.origin).href,
      page_title: title,
      page_referrer: lastPage.current
        ? new URL(lastPage.current, window.location.origin).href
        : window.location.origin + '/',
    };
    lastPage.current = pathname;
    browser[disableKey] = false;
    const queue = browser.birdmanQaData ??= [];
    const tag = createQATag(queue);
    const firstLoad = !document.getElementById(scriptId);
    if (firstLoad) {
      tag('js', new Date());
      tag('config', measurementId, {
        ...safePage,
        send_page_view: false,
        debug_mode: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    }
    tag('set', safePage);
    tag('event', 'page_view', { ...safePage, send_to: measurementId, debug_mode: true });
    if (firstLoad) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.referrerPolicy = 'no-referrer';
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}&l=birdmanQaData`;
      document.head.append(script);
    }
  }, [allowed, optedIn, pathname, title]);

  if (!allowed || !title) return null;

  return (
    <aside aria-label="Local analytics testing" className="border-t px-4 py-3 text-sm">
      <p>Local QA only: enabling Analytics sends test page views and booking events to Birdman QA until you disable it or reload.</p>
      <button
        type="button"
        className="mt-2 underline"
        onClick={() => {
          if (optedIn) (window as QAWindow)[disableKey] = true;
          setOptedIn(!optedIn);
        }}
      >
        {optedIn ? 'Disable QA Analytics' : 'Enable QA Analytics'}
      </button>
    </aside>
  );
}
