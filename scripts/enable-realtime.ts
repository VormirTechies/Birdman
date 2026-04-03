import postgres from 'postgres';
import { config } from 'dotenv';

config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL!, { ssl: 'require' });

async function main() {
  try {
    console.log('Enabling Supabase Realtime for bookings and feedback...');
    
    // Check if publication exists
    const pubExists = await sql`SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'`;
    
    if (pubExists.length === 0) {
      await sql`CREATE PUBLICATION supabase_realtime`;
    }

    // Add tables to publication
    await sql`ALTER PUBLICATION supabase_realtime ADD TABLE bookings, feedback`;
    
    console.log('Realtime enabled successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to enable Realtime:', err);
    process.exit(1);
  }
}

main();
