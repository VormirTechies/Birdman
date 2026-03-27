// ═══════════════════════════════════════════════════════════════════════════
// DATABASE SEED SCRIPT
// Run with: tsx src/lib/db/seed.ts (after installing tsx: npm i -D tsx)
// ═══════════════════════════════════════════════════════════════════════════

import { db } from './index';
import { bookings, galleryImages, feedback, adminUsers } from './schema';
import * as bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...\n');

  // ─── Clear existing data (optional, comment out if you want to preserve data) ───

  console.log('🗑️  Clearing existing data...');
  await db.delete(bookings);
  await db.delete(galleryImages);
  await db.delete(feedback);
  await db.delete(adminUsers);
  console.log('✅ Cleared.\n');

  // ─── Seed Admin User ─────────────────────────────────────────────────────────

  console.log('👤 Creating admin user...');
  const passwordHash = await bcrypt.hash('admin123', 12);
  await db.insert(adminUsers).values({
    username: 'admin',
    passwordHash,
  });
  console.log('   ✓ Username: admin');
  console.log('   ✓ Password: admin123');
  console.log('   ⚠️  CHANGE THIS IN PRODUCTION!\n');

  // ─── Seed Bookings ───────────────────────────────────────────────────────────

  console.log('📅 Creating sample bookings...');
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const sampleBookings = [
    {
      visitorName: 'Rajesh Kumar',
      phone: '+91-9876543210',
      email: 'rajesh.kumar@example.com',
      numberOfGuests: 2,
      bookingDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
      bookingTime: '06:00:00', // Morning slot
      confirmationSent: true,
      status: 'confirmed',
    },
    {
      visitorName: 'Priya Sharma',
      phone: '+91-8765432109',
      email: 'priya.sharma@example.com',
      numberOfGuests: 4,
      bookingDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
      bookingTime: '17:30:00', // Evening slot
      confirmationSent: true,
      status: 'confirmed',
    },
    {
      visitorName: 'Arun Krishnan',
      phone: '+91-7654321098',
      email: 'arun.k@example.com',
      numberOfGuests: 1,
      bookingDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days from now
      bookingTime: '06:30:00',
      confirmationSent: true,
      reminderSent: true,
      reminderSentAt: new Date(),
      status: 'confirmed',
    },
    {
      visitorName: 'Lakshmi Narayanan',
      phone: '+91-6543210987',
      email: 'lakshmi.n@example.com',
      numberOfGuests: 3,
      bookingDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
      bookingTime: '18:00:00',
      confirmationSent: true,
      status: 'confirmed',
    },
    {
      visitorName: 'Vikram Singh',
      phone: '+91-5432109876',
      email: 'vikram.singh@example.com',
      numberOfGuests: 2,
      bookingDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days ago
      bookingTime: '06:00:00',
      confirmationSent: true,
      status: 'completed',
    },
  ];

  await db.insert(bookings).values(sampleBookings);
  console.log(`   ✓ Created ${sampleBookings.length} sample bookings\n`);

  // ─── Seed Gallery Images ─────────────────────────────────────────────────────

  console.log('🖼️  Creating gallery images...');
  const sampleImages = [
    {
      url: 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=800',
      caption: 'Rose-ringed parakeets gathering at sunset',
      altText: 'Green parakeets perched on branches',
      order: 1,
    },
    {
      url: 'https://images.unsplash.com/photo-1606567595334-d39972c85dbe?w=800',
      caption: 'A parakeet enjoying fresh millet',
      altText: 'Close-up of a green parakeet eating',
      order: 2,
    },
    {
      url: 'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800',
      caption: 'The flock arrives every evening',
      altText: 'Multiple parakeets flying in formation',
      order: 3,
    },
    {
      url: 'https://images.unsplash.com/photo-1606048943778-65a138e56b9d?w=800',
      caption: 'Mr. Sudarson feeding the birds',
      altText: 'Person feeding parakeets from hand',
      order: 4,
    },
    {
      url: 'https://images.unsplash.com/photo-1552728089-4e6f5e8c9a32?w=800',
      caption: 'Morning feeding session',
      altText: 'Parakeets eating from feeding tray',
      order: 5,
    },
    {
      url: 'https://images.unsplash.com/photo-1606048779153-9c75b07f4c35?w=800',
      caption: 'A curious parakeet',
      altText: 'Parakeet looking at camera',
      order: 6,
    },
    {
      url: 'https://images.unsplash.com/photo-1501706362039-c06b2d715385?w=800',
      caption: 'The sanctuary at dawn',
      altText: 'Trees with parakeets at sunrise',
      order: 7,
    },
    {
      url: 'https://images.unsplash.com/photo-1551739440-5dd934d3a94a?w=800',
      caption: 'Parakeets in their natural habitat',
      altText: 'Green parakeets on tree branches',
      order: 8,
    },
    {
      url: 'https://images.unsplash.com/photo-1606567595334-d39972c85dbe?w=800',
      caption: 'Feeding time',
      altText: 'Parakeets gathering for food',
      order: 9,
    },
    {
      url: 'https://images.unsplash.com/photo-1606048943985-f0c235d12fd2?w=800',
      caption: 'A moment of tranquility',
      altText: 'Single parakeet perched peacefully',
      order: 10,
    },
  ];

  await db.insert(galleryImages).values(sampleImages);
  console.log(`   ✓ Created ${sampleImages.length} gallery images\n`);

  // ─── Seed Feedback ───────────────────────────────────────────────────────────

  console.log('💬 Creating feedback entries...');
  const sampleFeedback = [
    {
      visitorName: 'Ananya Reddy',
      rating: 5,
      message:
        'What an incredible experience! Watching 6,000 parakeets arrive at sunset was magical. Mr. Sudarson is a true guardian of nature. Highly recommend!',
      visitDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isApproved: true,
    },
    {
      visitorName: 'John Smith',
      rating: 5,
      message:
        'I traveled from the UK specifically for this. Worth every mile. The dedication and love shown by Mr. Sah is inspiring. A must-visit for bird lovers.',
      visitDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isApproved: true,
    },
    {
      visitorName: 'Meera Iyer',
      rating: 5,
      message:
        'Brought my kids and they were absolutely mesmerized. Educational and beautiful. Thank you Mr. Sudarson for preserving this wonder!',
      visitDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isApproved: true,
    },
    {
      visitorName: null, // Anonymous feedback
      rating: 4,
      message:
        'Beautiful sanctuary. Only minor issue was parking space, but the experience made up for it. Will definitely return!',
      visitDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isApproved: true,
    },
    {
      visitorName: 'Karthik Mohan',
      rating: null, // Text-only feedback
      message:
        'Thank you for creating this sanctuary. As a Chennai native, I am proud that we have someone like you protecting our local wildlife. Respect!',
      visitDate: null, // No visit date provided
      isApproved: true,
    },
  ];

  await db.insert(feedback).values(sampleFeedback);
  console.log(`   ✓ Created ${sampleFeedback.length} feedback entries\n`);

  // ─────────────────────────────────────────────────────────────────────────────

  console.log('✅ Seeding complete!\n');
  console.log('📊 Summary:');
  console.log(`   • Admin users: 1`);
  console.log(`   • Bookings: ${sampleBookings.length}`);
  console.log(`   • Gallery images: ${sampleImages.length}`);
  console.log(`   • Feedback: ${sampleFeedback.length}`);
  console.log('\n🚀 You can now run: npm run db:studio');
  console.log('   Visit https://local.drizzle.studio to view your data\n');
}

// ─── Execute Seed ────────────────────────────────────────────────────────────

seed()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
