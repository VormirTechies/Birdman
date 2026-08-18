import type { BookingStatus } from '@/models/firestore/booking';

export const INDIA_TIME_OFFSET_MINUTES = 330;
export const BOOKING_CUTOFF_MINUTES = 60;

export class BookingCapacityExceededError extends Error {
  readonly code = 'BOOKING_CAPACITY_EXCEEDED';

  constructor(
    readonly requestedGuests: number,
    readonly availableGuests: number,
    readonly maxCapacity: number
  ) {
    super(`Only ${availableGuests} booking spaces are available`);
    this.name = 'BookingCapacityExceededError';
  }
}

export class BookingCounterIntegrityError extends Error {
  readonly code = 'BOOKING_COUNTER_INTEGRITY_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'BookingCounterIntegrityError';
  }
}

export class BookingDateClosedError extends Error {
  readonly code = 'BOOKING_DATE_CLOSED';

  constructor(readonly bookingDate: string) {
    super(`Bookings are closed for ${bookingDate}`);
    this.name = 'BookingDateClosedError';
  }
}

export class BookingCutoffError extends Error {
  readonly code = 'BOOKING_CUTOFF_REACHED';

  constructor(readonly bookingDate: string) {
    super(`The booking cutoff has passed for ${bookingDate}`);
    this.name = 'BookingCutoffError';
  }
}

export class BookingNotFoundError extends Error {
  readonly code = 'BOOKING_NOT_FOUND';

  constructor(readonly bookingId: string) {
    super('Booking not found');
    this.name = 'BookingNotFoundError';
  }
}

export class BookingNotEditableError extends Error {
  readonly code = 'BOOKING_NOT_EDITABLE';

  constructor(message = 'This booking can no longer be changed online') {
    super(message);
    this.name = 'BookingNotEditableError';
  }
}

export function capacityContribution(status: BookingStatus, guests: number) {
  return status === 'confirmed' ? guests : 0;
}

export interface BookingCapacityState {
  bookingDate: string;
  status: BookingStatus;
  numberOfGuests: number;
}

export interface BookingCapacityChange {
  bookingDate: string;
  delta: number;
}

export function capacityChangesForTransition(
  previous: BookingCapacityState,
  next: BookingCapacityState
): BookingCapacityChange[] {
  const previousContribution = capacityContribution(
    previous.status,
    previous.numberOfGuests
  );
  const nextContribution = capacityContribution(next.status, next.numberOfGuests);

  if (previous.bookingDate === next.bookingDate) {
    const delta = nextContribution - previousContribution;
    return delta === 0 ? [] : [{ bookingDate: next.bookingDate, delta }];
  }

  return [
    ...(previousContribution === 0
      ? []
      : [{ bookingDate: previous.bookingDate, delta: -previousContribution }]),
    ...(nextContribution === 0
      ? []
      : [{ bookingDate: next.bookingDate, delta: nextContribution }]),
  ];
}

export function assertValidCounter(value: unknown, label: string) {
  const counter = Number(value ?? 0);
  if (!Number.isSafeInteger(counter) || counter < 0) {
    throw new BookingCounterIntegrityError(`${label} must be a non-negative integer`);
  }
  return counter;
}

export function applyCapacityDelta(
  currentGuests: unknown,
  delta: number,
  maxCapacity: number
) {
  const current = assertValidCounter(currentGuests, 'Daily confirmed guest counter');
  if (!Number.isSafeInteger(delta)) {
    throw new BookingCounterIntegrityError('Daily capacity delta must be an integer');
  }
  if (!Number.isSafeInteger(maxCapacity) || maxCapacity < 0) {
    throw new BookingCounterIntegrityError('Calendar capacity must be a non-negative integer');
  }

  const next = current + delta;
  if (next < 0) {
    throw new BookingCounterIntegrityError('Daily confirmed guest counter would become negative');
  }
  if (next > maxCapacity) {
    throw new BookingCapacityExceededError(
      Math.max(delta, 0),
      Math.max(maxCapacity - current, 0),
      maxCapacity
    );
  }
  return next;
}

export function bookingStartInstant(
  bookingDate: string,
  startTime: string
) {
  const [year, month, day] = bookingDate.split('-').map(Number);
  const [hour, minute, second = 0] = startTime.split(':').map(Number);
  return new Date(
    Date.UTC(year, month - 1, day, hour, minute, second) -
      INDIA_TIME_OFFSET_MINUTES * 60_000
  );
}

export function indiaCalendarDate(now: Date) {
  return new Date(
    now.getTime() + INDIA_TIME_OFFSET_MINUTES * 60_000
  ).toISOString().slice(0, 10);
}

export function isPastBookingDate(bookingDate: string, now: Date) {
  return bookingDate < indiaCalendarDate(now);
}

export function hasBookingCutoffPassed(
  bookingDate: string,
  startTime: string,
  now: Date,
  cutoffMinutes = BOOKING_CUTOFF_MINUTES
) {
  const cutoff = bookingStartInstant(bookingDate, startTime).getTime() -
    cutoffMinutes * 60_000;
  return now.getTime() >= cutoff;
}
