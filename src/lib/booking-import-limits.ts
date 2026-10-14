export const BOOKING_CSV_MAX_BYTES = 2_000_000;
// JSON can encode one CSV character as a six-byte escape, plus metadata.
export const BOOKING_IMPORT_MAX_REQUEST_BYTES = BOOKING_CSV_MAX_BYTES * 6 + 4096;
