import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from '../src/lib/db/index';
import { sql } from 'drizzle-orm';

async function main() {
  const result = await db.execute(sql`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_name IN ('bookings','visitors') 
    AND table_schema = 'public'
    ORDER BY table_name, column_name
  `);

  const rows = (result as any).rows ?? result;
  console.log('Tables & columns:');
  for (const row of rows as any[]) {
    console.log(`  ${row.table_name}.${row.column_name}`);
  }
  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
