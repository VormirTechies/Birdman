import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { LocalAnalyticsQA } from './LocalAnalyticsQA';
import { trackQABooking } from '@/lib/local-analytics-qa';

const route = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => route.pathname }));

const browser = window as Window & {
  birdmanQaData?: IArguments[];
  'ga-disable-G-6CGCY64H6C'?: boolean;
};
const events = () => browser.birdmanQaData?.map(item => Array.from(item))
  .filter(item => item[0] === 'event') ?? [];
const tag = () => document.getElementById('birdman-ga4-qa');

beforeEach(() => {
  route.pathname = '/';
  history.replaceState(null, '', '/?private=synthetic#token');
  vi.stubEnv('NEXT_PUBLIC_GA4_LOCAL_QA', 'true');
});

afterEach(() => {
  cleanup();
  tag()?.remove();
  delete browser.birdmanQaData;
  delete browser['ga-disable-G-6CGCY64H6C'];
  vi.unstubAllEnvs();
});

it('does not load or queue the tag before opt-in, or without the flag', () => {
  const view = render(<LocalAnalyticsQA />);
  expect(screen.getByRole('button', { name: 'Enable QA Analytics' })).toBeTruthy();
  expect(tag()).toBeNull();
  expect(browser.birdmanQaData).toBeUndefined();
  vi.stubEnv('NEXT_PUBLIC_GA4_LOCAL_QA', 'false');
  view.rerender(<LocalAnalyticsQA />);
  expect(screen.queryByRole('button')).toBeNull();
  expect(tag()).toBeNull();
});

it('only emits booking events while opted in on the booking page', () => {
  route.pathname = '/book';
  history.replaceState(null, '', '/book');
  render(<LocalAnalyticsQA />);
  trackQABooking('booking_confirmed');
  expect(events()).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Enable QA Analytics' }));
  trackQABooking('booking_confirm_attempt');
  expect(events().map(event => event[1])).toEqual(['page_view', 'booking_confirm_attempt']);
  history.replaceState(null, '', '/booking-status');
  trackQABooking('booking_confirmed');
  history.replaceState(null, '', '/book');
  fireEvent.click(screen.getByRole('button', { name: 'Disable QA Analytics' }));
  trackQABooking('booking_confirmed');
  expect(events()).toHaveLength(2);
});

it('queues one sanitized page view per public route and disables collection on excluded routes or withdrawal', () => {
  const view = render(<LocalAnalyticsQA />);
  fireEvent.click(screen.getByRole('button', { name: 'Enable QA Analytics' }));
  expect((tag() as HTMLScriptElement).src).toContain('id=G-6CGCY64H6C');
  expect(events()).toHaveLength(1);
  expect(events()[0][2]).toMatchObject({ page_location: location.origin + '/', page_referrer: location.origin + '/', debug_mode: true });
  expect(JSON.stringify(browser.birdmanQaData)).not.toMatch(/private|synthetic|token/);

  history.replaceState(null, '', '/?another=value');
  view.rerender(<LocalAnalyticsQA />);
  expect(events()).toHaveLength(1);

  route.pathname = '/book';
  view.rerender(<LocalAnalyticsQA />);
  expect(events()).toHaveLength(2);
  expect(events()[1][2]).toMatchObject({ page_location: location.origin + '/book' });

  route.pathname = '/admin/calendar';
  view.rerender(<LocalAnalyticsQA />);
  expect(events()).toHaveLength(2);
  expect(browser['ga-disable-G-6CGCY64H6C']).toBe(true);

  route.pathname = '/book';
  view.rerender(<LocalAnalyticsQA />);
  expect(events()).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: 'Disable QA Analytics' }));
  expect(browser['ga-disable-G-6CGCY64H6C']).toBe(true);
  route.pathname = '/gallery';
  view.rerender(<LocalAnalyticsQA />);
  expect(events()).toHaveLength(3);
});
