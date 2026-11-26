export const measurementId = 'G-6CGCY64H6C';
export const disableKey = 'ga-disable-G-6CGCY64H6C';
export type QAWindow = Window & {
  [disableKey]?: boolean;
  birdmanQaData?: IArguments[];
};

export const isLocalAnalyticsHost = () =>
  ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname);

export function createQATag(queue: IArguments[]): (...command: unknown[]) => void {
  return function () {
    // Preserve the Google tag queue format.
    // eslint-disable-next-line prefer-rest-params
    queue.push(arguments);
  };
}

export function bookingFailureCategory(status?: number, code?: string) {
  if (status === 429) return 'rate_limit';
  if (code === 'BOOKING_CAPACITY_EXCEEDED') return 'capacity';
  if (code === 'BOOKING_CONTACT_LIMIT') return 'contact_limit';
  if (status === 400 || status === 422) return 'validation';
  return 'unavailable';
}

type BookingEvent =
  | [name: 'booking_review_view' | 'booking_confirm_attempt' | 'booking_confirmed']
  | [name: 'booking_confirm_failed', category: ReturnType<typeof bookingFailureCategory>];

export function trackQABooking(...event: BookingEvent): void {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.NEXT_PUBLIC_GA4_LOCAL_QA !== 'true' ||
    typeof window === 'undefined' || !isLocalAnalyticsHost() ||
    window.location.pathname !== '/book'
  ) return;

  const browser: QAWindow = window;
  const queue = browser.birdmanQaData;
  if (browser[disableKey] !== false || !queue) return;

  try {
    createQATag(queue)('event', event[0], {
      page_location: new URL('/book', browser.location.origin).href,
      page_title: 'Book a Visit',
      send_to: measurementId,
      debug_mode: true,
      ...(event[0] === 'booking_confirm_failed' && { failure_category: event[1] }),
    });
  } catch {
    // Analytics must not interrupt booking if the tag fails.
  }
}
