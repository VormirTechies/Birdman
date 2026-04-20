const fs = require('fs');
const path = require('path');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const sqlQuery = postgres(process.env.DATABASE_URL);

async function main() {
  try {
    const file = path.join(__dirname, 'custom-migration.sql');
    const queries = fs.readFileSync(file, 'utf-8');
    
    // Some postgres clients cannot handle multiple statements in one go successfully or safely,
    // but the `postgres` library supports template literals mostly. Unsafe might execute raw.
    console.log('Applying migrations...');
    await sqlQuery.unsafe(queries);
    console.log('Migrations applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

main();
