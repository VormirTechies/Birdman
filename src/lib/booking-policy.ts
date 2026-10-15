export const MAX_GUESTS_PER_BOOKING = 10;
export const MAX_GUESTS_PER_CONTACT_DATE = 25;

export function canonicalBookingPhone(value: unknown) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
}
export function canonicalBookingEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}
export function matchesBookingContact(booking: { phone?: unknown; email?: unknown }, contact: string) {
  if (contact.includes('@')) return Boolean(canonicalBookingEmail(booking.email)) && canonicalBookingEmail(booking.email) === canonicalBookingEmail(contact);
  const phone = canonicalBookingPhone(contact);
  return /^\d{10,15}$/.test(phone) && phone === canonicalBookingPhone(booking.phone);
}

type Party = { phone?: unknown; email?: unknown; status?: unknown; numberOfGuests?: unknown; adults?: unknown; children?: unknown };
export function partyGuests(booking: Party) {
  if (booking.status !== 'confirmed' && booking.status !== 'completed') return 0;
  const guests = Number(booking.numberOfGuests ?? Number(booking.adults ?? 0) + Number(booking.children ?? 0));
  if (!Number.isSafeInteger(guests) || guests < 0) throw new Error('Invalid booking guest total');
  return guests;
}
export class BookingContactLimitError extends Error {
  readonly code = 'BOOKING_CONTACT_LIMIT';
  constructor(readonly alreadyBooked: number, readonly requestedGuests: number) {
    super(`You can book up to 25 guests per date across bookings, including children. You already have ${alreadyBooked} guests booked. For larger groups, please contact Vithya mam by phone.`);
    this.name = 'BookingContactLimitError';
  }
}
export class BookingContactMismatchError extends Error {}

export function assertContactDateLimit(others: Party[], next: Party, previous?: Party) {
  const requested = partyGuests(next);
  if (!requested) return;
  const phone = canonicalBookingPhone(next.phone);
  const email = canonicalBookingEmail(next.email);
  const matches = (booking: Party) => Boolean(
    (phone && canonicalBookingPhone(booking.phone) === phone) ||
    (email && canonicalBookingEmail(booking.email) === email)
  );
  const total = others.filter(matches).reduce((sum, booking) => sum + partyGuests(booking), 0);
  const oldGuests = previous && matches(previous) ? partyGuests(previous) : 0;
  if (total + requested > MAX_GUESTS_PER_CONTACT_DATE && requested > oldGuests) throw new BookingContactLimitError(total, requested);
}
