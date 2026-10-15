import 'server-only';
import { assertContactDateLimit, BookingContactMismatchError, matchesBookingContact } from '@/lib/booking-policy';

import {
  Timestamp,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  type Transaction,
} from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { formatBookingNumber } from '@/lib/booking-number';
import { stageNotificationEvents } from './notifications';
import { bookingChangeEvent, capacityFullEvent, nextNotificationRevision } from './booking-notifications';
import {
  DEFAULT_CALENDAR_CAPACITY,
  DEFAULT_CALENDAR_START_TIME,
  normalizeCalendarSetting,
} from '@/lib/firebase/calendar-settings';
import {
  BookingCounterIntegrityError,
  BookingCutoffError,
  BookingDateClosedError,
  BookingNotEditableError,
  BookingNotFoundError,
  applyCapacityDelta,
  assertValidCounter,
  capacityChangesForTransition,
  capacityContribution,
  hasBookingCutoffPassed,
  isPastBookingDate,
} from '@/lib/firebase/booking-capacity';
import { bookingDocumentFromInput, toAdminBooking } from '@/lib/firebase/booking-mappers';
import {
  bookingMutationSchema,
  BOOKING_SCHEMA_VERSION,
  type AdminBooking,
  type AdminBookingCreation,
  type BookingDocument,
  type BookingMutation,
  type BookingSource,
  type PublicBookingSubmission,
} from '@/models/firestore/booking';

export const BOOKINGS_COLLECTION = 'bookings';
export const BOOKING_DAYS_COLLECTION = 'bookingDays';
export const BOOKING_COUNTERS_COLLECTION = '_counters';
export const BOOKING_COUNTER_DOCUMENT = 'bookings';
export const CALENDAR_SETTINGS_COLLECTION = 'calendar_settings';

interface TransactionOptions {
  actorUid?: string | null;
  now?: Date;
  enforceCutoff?: boolean;
  requireConfirmed?: boolean;
  requireEditableVisit?: boolean;
  requireNonPastVisit?: boolean;
  requireNonPastTarget?: boolean;
  enforceContactLimit?: boolean;
  verifiedContact?: string;
  verifiedBookingNumber?: number;
}

export interface CreateBookingOptions extends TransactionOptions {
  source: BookingSource;
  visitorId?: string | null;
}

export type UpdateBookingOptions = TransactionOptions;

interface TransactionCalendarSetting {
  date: string;
  maxCapacity: number;
  startTime: string;
  isOpen: boolean;
}

export function bookingsCollection() {
  return getAdminDb().collection(BOOKINGS_COLLECTION);
}

export function bookingDaysCollection() {
  return getAdminDb().collection(BOOKING_DAYS_COLLECTION);
}

export function bookingCounterReference() {
  return getAdminDb()
    .collection(BOOKING_COUNTERS_COLLECTION)
    .doc(BOOKING_COUNTER_DOCUMENT);
}

function timestampValue(value: unknown, fallback: Timestamp) {
  if (value instanceof Timestamp) return value;
  if (value instanceof Date) return Timestamp.fromDate(value);
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return Timestamp.fromDate(parsed);
  }
  return fallback;
}

function asBookingDocument(
  data: DocumentData,
  fallbackTimestamp = Timestamp.now()
): BookingDocument {
  const visitorName = String(data.visitorName ?? data.visitor_name ?? '').trim();
  const phone = String(data.phone ?? '').trim();
  const emailValue = typeof data.email === 'string' ? data.email.trim() : '';
  const email = emailValue || null;
  const adults = Number(data.adults ?? 1);
  const children = Number(data.children ?? 0);
  const numberOfGuests = Number(
    data.numberOfGuests ?? data.number_of_guests ?? adults + children
  );
  const status = ['confirmed', 'cancelled', 'completed'].includes(data.status)
    ? data.status
    : 'confirmed';
  const source = ['public', 'admin', 'migration'].includes(data.source)
    ? data.source
    : 'migration';

  const bookingNumber = Number(data.bookingNumber ?? data.booking_number ?? 0);

  return {
    ...data,
    bookingNumber,
    bookingCode: formatBookingNumber(bookingNumber),
    visitorId: typeof data.visitorId === 'string' ? data.visitorId : null,
    visitorName,
    visitorNameLowercase: visitorName.toLowerCase(),
    phone,
    phoneNormalized: phone.replace(/\D/g, ''),
    email,
    emailLowercase: email?.toLowerCase() ?? null,
    adults,
    children,
    numberOfGuests,
    bookingDate: String(data.bookingDate ?? data.booking_date ?? ''),
    bookingTime: String(data.bookingTime ?? data.booking_time ?? DEFAULT_CALENDAR_START_TIME),
    status,
    visited: data.visited === true,
    source,
    confirmationSent: data.confirmationSent === true,
    reminderSent: data.reminderSent === true,
    reminderSentAt: data.reminderSentAt
      ? timestampValue(data.reminderSentAt, fallbackTimestamp)
      : null,
    reminderClaimedAt: data.reminderClaimedAt
      ? timestampValue(data.reminderClaimedAt, fallbackTimestamp)
      : null,
    createdAt: timestampValue(data.createdAt ?? data.created_at, fallbackTimestamp),
    updatedAt: timestampValue(data.updatedAt ?? data.updated_at, fallbackTimestamp),
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : null,
    updatedBy: typeof data.updatedBy === 'string' ? data.updatedBy : null,
    cancelledAt: data.cancelledAt
      ? timestampValue(data.cancelledAt, fallbackTimestamp)
      : null,
    cancelledBy: typeof data.cancelledBy === 'string' ? data.cancelledBy : null,
    isVip: data.isVip === true,
    vipNotes: typeof data.vipNotes === 'string' ? data.vipNotes : null,
    schemaVersion: BOOKING_SCHEMA_VERSION,
  };
}

function transactionTimestamp(options: TransactionOptions) {
  return Timestamp.fromDate(options.now ?? new Date());
}

async function calendarSettingInTransaction(
  transaction: Transaction,
  date: string
): Promise<TransactionCalendarSetting> {
  const collection = getAdminDb().collection(CALENDAR_SETTINGS_COLLECTION);
  const directSnapshot = await transaction.get(collection.doc(date));
  let data = directSnapshot.exists
    ? normalizeCalendarSetting(directSnapshot.id, directSnapshot.data() ?? {})
    : null;

  if (!data) {
    const fallback = await transaction.get(
      collection.where('date', '==', date).limit(1)
    );
    const document = fallback.docs[0];
    if (document) data = normalizeCalendarSetting(document.id, document.data());
  }

  return {
    date,
    maxCapacity: data?.maxCapacity ?? DEFAULT_CALENDAR_CAPACITY,
    startTime: data?.startTime ?? DEFAULT_CALENDAR_START_TIME,
    isOpen: data?.isOpen ?? true,
  };
}

function assertCalendarAllowsBooking(
  setting: TransactionCalendarSetting,
  options: TransactionOptions
) {
  if (!setting.isOpen) throw new BookingDateClosedError(setting.date);
  if (
    options.enforceCutoff !== false &&
    hasBookingCutoffPassed(setting.date, setting.startTime, options.now ?? new Date())
  ) {
    throw new BookingCutoffError(setting.date);
  }
}

function setDayCapacity(
  transaction: Transaction,
  reference: DocumentReference,
  confirmedGuests: number,
  now: Timestamp
) {
  transaction.set(reference, { confirmedGuests, updatedAt: now }, { merge: true });
}

function bookingGuestCount(data: DocumentData) {
  const stored = data.numberOfGuests ?? data.number_of_guests;
  const value = stored ?? Number(data.adults ?? 0) + Number(data.children ?? 0);
  return assertValidCounter(value, 'Confirmed booking guest count');
}

async function confirmedGuestsInTransaction(
  transaction: Transaction,
  date: string,
  daySnapshot: DocumentSnapshot
) {
  if (daySnapshot.exists) {
    return assertValidCounter(
      daySnapshot.data()?.confirmedGuests,
      'Daily confirmed guest counter'
    );
  }

  // Bootstrap counters for dates containing bookings created before bookingDays
  // was introduced. Once written, every Firebase-backed mutation locks this
  // single day document, preventing concurrent overbooking.
  const bookings = await transaction.get(
    getAdminDb()
      .collection(BOOKINGS_COLLECTION)
      .where('bookingDate', '==', date)
      .where('status', '==', 'confirmed')
  );

  return bookings.docs.reduce(
    (total, document) => total + bookingGuestCount(document.data()),
    0
  );
}

function resultingBooking(
  existing: BookingDocument,
  mutation: BookingMutation,
  actorUid: string | null,
  now: Timestamp
): BookingDocument {
  const adults = mutation.adults ?? existing.adults;
  const children = mutation.children ?? existing.children;
  const numberOfGuests = adults + children;
  if (numberOfGuests < 1 || numberOfGuests > 10) {
    throw new BookingCounterIntegrityError('Total guests must be between 1 and 10');
  }

  const hasEmail = Object.prototype.hasOwnProperty.call(mutation, 'email');
  const email = hasEmail ? mutation.email ?? null : existing.email;
  const status = mutation.status ?? existing.status;
  const isReschedule = mutation.bookingDate !== undefined ||
    mutation.bookingTime !== undefined;

  return {
    ...existing,
    ...mutation,
    email,
    emailLowercase: email?.toLowerCase() ?? null,
    visitorNameLowercase: (mutation.visitorName ?? existing.visitorName).toLowerCase(),
    phoneNormalized: mutation.phone ?? existing.phoneNormalized,
    adults,
    children,
    numberOfGuests,
    status,
    reminderSent: isReschedule ? false : existing.reminderSent,
    reminderSentAt: isReschedule ? null : existing.reminderSentAt,
    updatedAt: now,
    updatedBy: actorUid,
    cancelledAt: status === 'cancelled' ? existing.cancelledAt ?? now : null,
    cancelledBy: status === 'cancelled' ? existing.cancelledBy ?? actorUid : null,
  };
}

export async function createFirestoreBooking(
  input: PublicBookingSubmission | AdminBookingCreation,
  options: CreateBookingOptions
): Promise<AdminBooking> {
  if (
    options.requireNonPastVisit &&
    isPastBookingDate(input.bookingDate, options.now ?? new Date())
  ) {
    throw new BookingNotEditableError('Past booking dates are not allowed');
  }
  const database = getAdminDb();
  const bookingReference = database.collection(BOOKINGS_COLLECTION).doc();
  const counterReference = database
    .collection(BOOKING_COUNTERS_COLLECTION)
    .doc(BOOKING_COUNTER_DOCUMENT);
  const dayReference = database
    .collection(BOOKING_DAYS_COLLECTION)
    .doc(input.bookingDate);

  const document = await database.runTransaction(async (transaction) => {
    const [counterSnapshot, daySnapshot] = await Promise.all([
      transaction.get(counterReference),
      transaction.get(dayReference),
    ]);
    const currentConfirmedGuests = await confirmedGuestsInTransaction(
      transaction,
      input.bookingDate,
      daySnapshot
    );
    const setting = await calendarSettingInTransaction(transaction, input.bookingDate);
    assertCalendarAllowsBooking(setting, options);
    if (options.source === 'public') {
      const peers = await transaction.get(database.collection(BOOKINGS_COLLECTION).where('bookingDate', '==', input.bookingDate));
      assertContactDateLimit(peers.docs.map(doc => doc.data()), { ...input, status: 'confirmed', numberOfGuests: input.adults + input.children });
    }

    const currentBookingNumber = assertValidCounter(
      counterSnapshot.data()?.value,
      'Booking number counter'
    );
    if (currentBookingNumber >= Number.MAX_SAFE_INTEGER) {
      throw new BookingCounterIntegrityError('Booking number counter is exhausted');
    }

    const bookingNumber = currentBookingNumber + 1;
    const now = transactionTimestamp(options);
    const booking = bookingDocumentFromInput(input, {
      bookingNumber,
      source: options.source,
      now,
      actorUid: options.actorUid,
      visitorId: options.visitorId,
    });
    const confirmedGuests = applyCapacityDelta(
      currentConfirmedGuests,
      booking.numberOfGuests,
      setting.maxCapacity
    );

    booking.notificationRevision = 1;
    const event = bookingChangeEvent(bookingReference.id, null, booking)!;
    const fullRevision = nextNotificationRevision(daySnapshot.data()?.notificationFullRevision);
    const full = capacityFullEvent(input.bookingDate, currentConfirmedGuests, confirmedGuests, setting.maxCapacity, fullRevision);
    await stageNotificationEvents(transaction, database, full ? [event, full] : [event], now);
    if (full) transaction.set(dayReference, { notificationFullRevision: fullRevision }, { merge: true });

    transaction.set(
      counterReference,
      { value: bookingNumber, updatedAt: now },
      { merge: true }
    );
    setDayCapacity(transaction, dayReference, confirmedGuests, now);
    transaction.create(bookingReference, booking);
    return booking;
  });

  return toAdminBooking(bookingReference.id, document);
}

export async function updateFirestoreBooking(
  bookingId: string,
  input: unknown,
  options: UpdateBookingOptions = {}
): Promise<AdminBooking> {
  const mutation = bookingMutationSchema.parse(input);
  const database = getAdminDb();
  const bookingReference = database.collection(BOOKINGS_COLLECTION).doc(bookingId);

  const updated = await database.runTransaction(async (transaction) => {
    const bookingSnapshot = await transaction.get(bookingReference);
    if (!bookingSnapshot.exists) throw new BookingNotFoundError(bookingId);

    const now = transactionTimestamp(options);
    const existing = asBookingDocument(bookingSnapshot.data() ?? {}, now);
    if (options.verifiedContact !== undefined && (
      !matchesBookingContact(existing, options.verifiedContact) || existing.bookingNumber !== options.verifiedBookingNumber
    )) throw new BookingContactMismatchError('Booking ID and email/phone do not match. Please check your details.');
    if (options.requireConfirmed && existing.status !== 'confirmed') {
      throw new BookingNotEditableError('Only confirmed bookings can be changed');
    }
    if (
      options.requireEditableVisit &&
      hasBookingCutoffPassed(
        existing.bookingDate,
        existing.bookingTime,
        options.now ?? new Date()
      )
    ) {
      throw new BookingNotEditableError('The booking change cutoff has passed');
    }
    if (
      options.requireNonPastVisit &&
      isPastBookingDate(existing.bookingDate, options.now ?? new Date())
    ) {
      throw new BookingNotEditableError('Past bookings cannot be changed');
    }
    const next = resultingBooking(existing, mutation, options.actorUid ?? null, now);
    if (
      options.requireNonPastTarget &&
      isPastBookingDate(next.bookingDate, options.now ?? new Date())
    ) {
      throw new BookingNotEditableError('Past booking dates are not allowed');
    }
    const changes = capacityChangesForTransition(existing, next);
    const oldContribution = capacityContribution(existing.status, existing.numberOfGuests);
    const nextContribution = capacityContribution(next.status, next.numberOfGuests);
    const oldDayReference = database
      .collection(BOOKING_DAYS_COLLECTION)
      .doc(existing.bookingDate);
    const nextDayReference = database
      .collection(BOOKING_DAYS_COLLECTION)
      .doc(next.bookingDate);
    const sameDay = existing.bookingDate === next.bookingDate;

    const oldDaySnapshot = await transaction.get(oldDayReference);
    const nextDaySnapshot = sameDay
      ? oldDaySnapshot
      : await transaction.get(nextDayReference);
    const oldConfirmedGuests = await confirmedGuestsInTransaction(
      transaction,
      existing.bookingDate,
      oldDaySnapshot
    );
    const nextConfirmedGuests = sameDay
      ? oldConfirmedGuests
      : await confirmedGuestsInTransaction(
          transaction,
          next.bookingDate,
          nextDaySnapshot
        );
    const targetDelta = changes.find((change) => change.bookingDate === next.bookingDate)?.delta ?? 0;
    const targetSetting = targetDelta > 0
      ? await calendarSettingInTransaction(transaction, next.bookingDate)
      : null;

    if (targetSetting) assertCalendarAllowsBooking(targetSetting, options);
    if (mutation.bookingDate !== undefined && targetSetting) {
      next.bookingTime = targetSetting.startTime;
    }
    if (options.enforceContactLimit) {
      const peers = await transaction.get(database.collection(BOOKINGS_COLLECTION).where('bookingDate', '==', next.bookingDate));
      assertContactDateLimit(peers.docs.filter(doc => doc.id !== bookingId).map(doc => doc.data()), next, sameDay ? existing : undefined);
    }

    const targetGuests = sameDay
      ? targetDelta === 0 ? oldConfirmedGuests : applyCapacityDelta(oldConfirmedGuests, targetDelta, targetSetting?.maxCapacity ?? Number.MAX_SAFE_INTEGER)
      : nextContribution === 0 ? nextConfirmedGuests : applyCapacityDelta(nextConfirmedGuests, nextContribution, targetSetting?.maxCapacity ?? DEFAULT_CALENDAR_CAPACITY);
    const oldGuests = sameDay ? targetGuests
      : oldContribution === 0 ? oldConfirmedGuests : applyCapacityDelta(oldConfirmedGuests, -oldContribution, Number.MAX_SAFE_INTEGER);
    next.notificationRevision = nextNotificationRevision(existing.notificationRevision);
    const event = bookingChangeEvent(bookingId, existing, next);
    if (!event) next.notificationRevision = existing.notificationRevision ?? 0;
    const fullRevision = nextNotificationRevision(nextDaySnapshot.data()?.notificationFullRevision);
    const full = targetSetting
      ? capacityFullEvent(next.bookingDate, nextConfirmedGuests, targetGuests, targetSetting.maxCapacity, fullRevision) : null;
    const events = [...(event ? [event] : []), ...(full ? [full] : [])];
    await stageNotificationEvents(transaction, database, events, now);
    if (full) transaction.set(nextDayReference, { notificationFullRevision: fullRevision }, { merge: true });
    // Serialize all contact/status changes with creates, even without a seat delta.
    setDayCapacity(transaction, oldDayReference, oldGuests, now);
    if (!sameDay) setDayCapacity(transaction, nextDayReference, targetGuests, now);

    transaction.update(bookingReference, next);
    return next;
  });

  return toAdminBooking(bookingId, updated);
}

export async function cancelFirestoreBooking(
  bookingId: string,
  options: UpdateBookingOptions = {}
) {
  return updateFirestoreBooking(bookingId, { status: 'cancelled' }, options);
}

export async function deleteFirestoreBooking(
  bookingId: string,
  options: TransactionOptions = {}
) {
  const database = getAdminDb();
  const bookingReference = database.collection(BOOKINGS_COLLECTION).doc(bookingId);

  await database.runTransaction(async (transaction) => {
    const bookingSnapshot = await transaction.get(bookingReference);
    if (!bookingSnapshot.exists) throw new BookingNotFoundError(bookingId);

    const booking = asBookingDocument(
      bookingSnapshot.data() ?? {},
      transactionTimestamp(options)
    );
    const contribution = capacityContribution(booking.status, booking.numberOfGuests);
    const dayReference = database
      .collection(BOOKING_DAYS_COLLECTION)
      .doc(booking.bookingDate);
    const daySnapshot = await transaction.get(dayReference);

    if (daySnapshot) {
      const currentConfirmedGuests = await confirmedGuestsInTransaction(
        transaction,
        booking.bookingDate,
        daySnapshot
      );
      const confirmedGuests = applyCapacityDelta(
        currentConfirmedGuests,
        -contribution,
        Number.MAX_SAFE_INTEGER
      );
      // Deleting a live confirmed booking is an administrative cancellation.
      if (booking.status === 'confirmed') {
        const cancelled = { ...booking, status: 'cancelled' as const,
          notificationRevision: nextNotificationRevision(booking.notificationRevision) };
        await stageNotificationEvents(transaction, database, [bookingChangeEvent(bookingId, booking, cancelled)!], transactionTimestamp(options));
      }
      setDayCapacity(
        transaction,
        dayReference,
        confirmedGuests,
        transactionTimestamp(options)
      );
    }
    transaction.delete(bookingReference);
  });

  return { id: bookingId };
}
