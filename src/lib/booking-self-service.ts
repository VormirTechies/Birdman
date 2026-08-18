export function availablePartySizeForSelfService(options: {
  calendarRemaining: number;
  currentBookingDate: string;
  draftDate: string;
  currentGuests: number;
  status: string;
}) {
  const reservedByCurrentBooking =
    options.status === 'confirmed' &&
    options.draftDate === options.currentBookingDate
      ? options.currentGuests
      : 0;

  return Math.max(0, options.calendarRemaining + reservedByCurrentBooking);
}
