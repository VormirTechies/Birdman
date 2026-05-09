/**
 * Seed 100 confirmed bookings to today's date for checklist development/testing.
 * Run: npx tsx scripts/seed-checklist.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/lib/db/schema';
import { bookings } from '../src/lib/db/schema';

const client = postgres(process.env.DATABASE_URL!, { ssl: 'require' });
const db = drizzle(client, { schema });

const TODAY = '2026-04-28';

const FIRST_NAMES = [
  'Aarav', 'Aditi', 'Arun', 'Bhavana', 'Chitra', 'Deepak', 'Divya', 'Ganesh',
  'Harini', 'Ishaan', 'Janani', 'Karthik', 'Kavya', 'Lakshmi', 'Manoj', 'Meena',
  'Nandini', 'Nikhil', 'Parvathi', 'Pradeep', 'Priya', 'Rahul', 'Rajesh', 'Ravi',
  'Rekha', 'Rohan', 'Sanjay', 'Sangeeta', 'Saravanan', 'Senthil', 'Shanthi',
  'Shiva', 'Shruti', 'Sindhu', 'Siva', 'Smitha', 'Suresh', 'Swetha', 'Tamil',
  'Usha', 'Vignesh', 'Vijay', 'Vijayalakshmi', 'Vinodh', 'Yamuna',
];

const LAST_NAMES = [
  'Anand', 'Arumugam', 'Balaji', 'Chandran', 'Durai', 'Gopal', 'Iyer',
  'Krishnan', 'Kumar', 'Mani', 'Murugan', 'Natarajan', 'Pandian', 'Pillai',
  'Raja', 'Rajan', 'Ramachandran', 'Ramamurthy', 'Selvam', 'Shankar',
  'Subramanian', 'Sundaram', 'Venkatesh', 'Venkatesan',
];

const TIME_SLOTS = ['09:00:00', '09:30:00', '10:00:00', '10:30:00', '11:00:00', '16:00:00', '16:30:00', '17:00:00'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone(): string {
  const n = Math.floor(6000000000 + Math.random() * 3999999999);
  return `+91${n}`;
}

function randomEmail(name: string, index: number): string {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
  const slug = name.toLowerCase().replace(/\s+/g, '.') + index;
  return `${slug}@${pick(domains)}`;
}

async function seed() {
  console.log(`Seeding 100 confirmed bookings to ${TODAY}...`);

  const rows = Array.from({ length: 100 }, (_, i) => {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    return {
      visitorName: fullName,
      phone: randomPhone(),
      email: randomEmail(fullName, i),
      numberOfGuests: Math.floor(1 + Math.random() * 4),  // 1-4 guests
      bookingDate: TODAY,
      bookingTime: pick(TIME_SLOTS),
      status: 'confirmed' as const,
      visited: Math.random() < 0.25, // ~25% already visited
      confirmationSent: true,
      reminderSent: false,
    };
  });

  const inserted = await db.insert(bookings).values(rows).returning({ id: bookings.id });
  console.log(`✓ Inserted ${inserted.length} bookings for ${TODAY}`);
  console.log(`  Visited: ${rows.filter(r => r.visited).length}  |  Not visited: ${rows.filter(r => !r.visited).length}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
