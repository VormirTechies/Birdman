import postgres from 'postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

// Indian names for realistic test data
const FIRST_NAMES = [
  'Arjun', 'Priya', 'Rahul', 'Anjali', 'Karthik', 'Divya', 'Vikram', 'Meera',
  'Suresh', 'Lakshmi', 'Arun', 'Kavya', 'Rajesh', 'Shalini', 'Manoj', 'Deepa',
  'Venkat', 'Nisha', 'Kumar', 'Ranjani', 'Harish', 'Pooja', 'Ramesh', 'Sangeetha',
  'Ashwin', 'Mythili', 'Naveen', 'Vaishnavi', 'Balaji', 'Sowmya'
];

const LAST_NAMES = [
  'Kumar', 'Sharma', 'Patel', 'Reddy', 'Krishnan', 'Iyer', 'Nair', 'Das',
  'Singh', 'Rao', 'Mukherjee', 'Pillai', 'Menon', 'Chatterjee', 'Joshi',
  'Murthy', 'Venkatesh', 'Subramanian', 'Bose', 'Agarwal'
];

// Generate random Indian phone number
function generatePhone(): string {
  const digits = Math.floor(Math.random() * 9000000000) + 1000000000;
  return `+91-${digits}`;
}

// Generate random email
function generateEmail(firstName: string, lastName: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const random = Math.floor(Math.random() * 100);
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${random > 50 ? random : ''}@${domain}`;
}

// Generate random date between start and end
function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

// Generate random time (morning or evening slots)
function randomTime(): string {
  const isMorning = Math.random() > 0.5;
  if (isMorning) {
    // Morning: 08:00 - 11:00
    const hour = Math.floor(Math.random() * 4) + 8;
    const minute = Math.random() > 0.5 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}:00`;
  } else {
    // Evening: 16:00 - 19:00
    const hour = Math.floor(Math.random() * 4) + 16;
    const minute = Math.random() > 0.5 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}:00`;
  }
}

async function seedBookings() {
  try {
    console.log('🌱 Seeding bookings table with dummy data...\n');

    // Date ranges
    const today = new Date();
    const pastStart = new Date(today);
    pastStart.setDate(today.getDate() - 60); // 60 days ago
    
    const futureEnd = new Date(today);
    futureEnd.setDate(today.getDate() + 60); // 60 days ahead

    const bookingsData = [];

    // Generate 50 dummy bookings
    for (let i = 0; i < 50; i++) {
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const visitorName = `${firstName} ${lastName}`;
      
      const phone = generatePhone();
      const email = generateEmail(firstName, lastName); // Always include email
      const numberOfGuests = Math.floor(Math.random() * 5) + 1; // 1-5 guests
      
      // Distribute bookings across past, present, and future
      let bookingDate: string;
      let status: string;
      let confirmationSent: boolean;
      let reminderSent: boolean;
      let reminderSentAt: string | null = null;
      
      const dateCategory = Math.random();
      
      if (dateCategory < 0.3) {
        // 30% Past bookings (completed or cancelled)
        bookingDate = randomDate(pastStart, today);
        status = Math.random() > 0.2 ? 'completed' : 'cancelled';
        confirmationSent = true;
        reminderSent = status === 'completed' ? true : false;
        if (reminderSent) {
          const reminderDate = new Date(bookingDate);
          reminderDate.setDate(reminderDate.getDate() - 1);
          reminderSentAt = reminderDate.toISOString();
        }
      } else if (dateCategory < 0.4) {
        // 10% Today's bookings (confirmed)
        bookingDate = today.toISOString().split('T')[0];
        status = 'confirmed';
        confirmationSent = true;
        reminderSent = Math.random() > 0.5;
        if (reminderSent) {
          const reminderDate = new Date(today);
          reminderDate.setDate(reminderDate.getDate() - 1);
          reminderSentAt = reminderDate.toISOString();
        }
      } else {
        // 60% Future bookings (mostly confirmed, some cancelled)
        bookingDate = randomDate(today, futureEnd);
        status = Math.random() > 0.1 ? 'confirmed' : 'cancelled';
        confirmationSent = true;
        reminderSent = false;
      }
      
      const bookingTime = randomTime();
      
      bookingsData.push({
        visitorName,
        phone,
        email,
        numberOfGuests,
        bookingDate,
        bookingTime,
        confirmationSent,
        reminderSent,
        reminderSentAt,
        status,
      });
    }

    // Insert bookings
    for (const booking of bookingsData) {
      await sql`
        INSERT INTO bookings (
          visitor_name,
          phone,
          email,
          number_of_guests,
          booking_date,
          booking_time,
          confirmation_sent,
          reminder_sent,
          reminder_sent_at,
          status,
          created_at,
          updated_at
        ) VALUES (
          ${booking.visitorName},
          ${booking.phone},
          ${booking.email},
          ${booking.numberOfGuests},
          ${booking.bookingDate},
          ${booking.bookingTime},
          ${booking.confirmationSent},
          ${booking.reminderSent},
          ${booking.reminderSentAt},
          ${booking.status},
          NOW(),
          NOW()
        )
      `;
      
      console.log(`✅ Created: ${booking.visitorName} - ${booking.bookingDate} ${booking.bookingTime} (${booking.status})`);
    }

    // Show summary
    console.log('\n📊 Summary:');
    const stats = await sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM bookings
      GROUP BY status
    `;
    
    console.table(stats);

    const total = await sql`SELECT COUNT(*) as total FROM bookings`;
    console.log(`\n🎉 Total bookings in database: ${total[0].total}`);
    
    await sql.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding bookings:', error);
    await sql.end();
    process.exit(1);
  }
}

seedBookings();
