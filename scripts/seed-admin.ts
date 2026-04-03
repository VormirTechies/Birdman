import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function seedAdmin() {
  const email = 'admin@birdmanofchennai.com';
  const password = 'birdman2026';

  console.log(`Creating initial admin user: ${email}...`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    if (error.message.includes('User already registered')) {
      console.log('Admin user already exists. Skipping...');
    } else {
      console.error('Failed to create admin:', error.message);
    }
  } else {
    console.log('Admin user created successfully!');
    console.log('Credentials:');
    console.log(`- Email: ${email}`);
    console.log(`- Password: [Placeholder: birdman2026]`);
  }
}

seedAdmin();
