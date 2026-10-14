// Booking maintenance stays enabled until explicitly reopened after migration.
export function isBookingMaintenanceEnabled() {
  return process.env.MAINTENANCE_MODE !== 'false';
}

export const BOOKING_MAINTENANCE_MESSAGE =
  'Visit bookings are temporarily unavailable while we upgrade our booking system. Please check back soon.';
