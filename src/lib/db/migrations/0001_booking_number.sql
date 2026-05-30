CREATE SEQUENCE IF NOT EXISTS bookings_booking_number_seq;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS booking_number integer;

WITH base AS (
  SELECT COALESCE(MAX(booking_number), 0) AS max_number
  FROM bookings
  WHERE booking_number IS NOT NULL
),
numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) AS row_number
  FROM bookings
  WHERE booking_number IS NULL
)
UPDATE bookings
SET booking_number = base.max_number + numbered.row_number
FROM base, numbered
WHERE bookings.id = numbered.id;

SELECT setval(
  'bookings_booking_number_seq',
  GREATEST((SELECT COALESCE(MAX(booking_number), 0) FROM bookings), 1),
  true
);

ALTER TABLE bookings
  ALTER COLUMN booking_number SET DEFAULT nextval('bookings_booking_number_seq'),
  ALTER COLUMN booking_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_booking_number_unique_idx
  ON bookings (booking_number);
