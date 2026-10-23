export const PUBLIC_BOOKING_WINDOW_DAYS = 45;

export function publicBookingWindow(now = new Date()) {
  const today = new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
  const maxDate = new Date(Date.parse(`${today}T00:00:00Z`) + PUBLIC_BOOKING_WINDOW_DAYS * 86_400_000)
    .toISOString().slice(0, 10);
  return { today, maxDate };
}

export function isWithinPublicBookingWindow(date: string, now = new Date()) {
  const { today, maxDate } = publicBookingWindow(now);
  return date >= today && date <= maxDate;
}
