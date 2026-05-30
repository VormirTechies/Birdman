const fs = require('fs');
const path = require('path');
const postgres = require('postgres');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.production' });

const migrationPath = path.join(
  process.cwd(),
  'src',
  'lib',
  'db',
  'migrations',
  '0001_booking_number.sql'
);

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing in .env.production');
  process.exit(1);
}

const db = postgres(process.env.DATABASE_URL, { prepare: false });

async function main() {
  const beforeColumn = await db.unsafe(`
    select exists(
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'bookings'
        and column_name = 'booking_number'
    ) as has_column
  `);

  const beforeTotal = await db.unsafe(`select count(*)::int as total from bookings`);
  let beforeNumbered = [{ numbered: null }];

  if (beforeColumn[0].has_column) {
    beforeNumbered = await db.unsafe(`
      select count(booking_number)::int as numbered
      from bookings
    `);
  }

  console.log('Before:', {
    hasColumn: beforeColumn[0].has_column,
    totalBookings: beforeTotal[0].total,
    numberedBookings: beforeNumbered[0].numbered,
  });

  const sql = fs.readFileSync(migrationPath, 'utf8');
  const statements = sql
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await db.unsafe(statement);
  }

  const after = await db.unsafe(`
    select
      count(*)::int as total,
      count(booking_number)::int as numbered,
      min(booking_number)::int as min_number,
      max(booking_number)::int as max_number
    from bookings
  `);

  const sequence = await db.unsafe(`
    select last_value::int as last_value
    from bookings_booking_number_seq
  `);

  console.log('After:', {
    totalBookings: after[0].total,
    numberedBookings: after[0].numbered,
    minBookingNumber: after[0].min_number,
    maxBookingNumber: after[0].max_number,
    sequenceLastValue: sequence[0].last_value,
  });
}

main()
  .catch((error) => {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
