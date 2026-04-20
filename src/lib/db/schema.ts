import { pgTable, uuid, varchar, text, timestamp, integer, boolean, date, time, index, uniqueIndex } from 'drizzle-orm/pg-core';

// ═══════════════════════════════════════════════════════════════════════════
// BIRDMAN OF CHENNAI - DATABASE SCHEMA v2.0
// Admin Panel v2.0: Dynamic scheduling, capacity management, visitor tracking
// ═══════════════════════════════════════════════════════════════════════════

// ─── Bookings Table ──────────────────────────────────────────────────────────
// Stores visitor reservations with confirmation & reminder tracking

export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    visitorName: varchar('visitor_name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(), // Indian format: +91-XXXXXXXXXX
    email: varchar('email', { length: 255 }),
    numberOfGuests: integer('number_of_guests').notNull().default(1),
    bookingDate: date('booking_date').notNull(),
    bookingTime: time('booking_time').notNull(), // Dynamic — fetched from day_settings or global default
    category: varchar('category', { length: 50 }).notNull().default('individual'), // individual | school | organisation
    organisationName: varchar('organisation_name', { length: 255 }), // Required when category ≠ individual
    visited: boolean('visited').notNull().default(false), // Checked off in the daily checklist
    confirmationSent: boolean('confirmation_sent').notNull().default(false),
    reminderSent: boolean('reminder_sent').notNull().default(false),
    reminderSentAt: timestamp('reminder_sent_at'),
    status: varchar('status', { length: 50 }).notNull().default('confirmed'), // confirmed | cancelled | completed
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    // Performance indexes for common queries
    bookingDateIdx: index('bookings_booking_date_idx').on(table.bookingDate),
    statusIdx: index('bookings_status_idx').on(table.status),
  })
);

// ─── Gallery Images Table ────────────────────────────────────────────────────
// Stores parakeet photos displayed on the website

export const galleryImages = pgTable(
  'gallery_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    url: text('url').notNull().unique(), // Vercel Blob Storage or Cloudinary CDN URL
    caption: text('caption'), // Nullable: optional description
    altText: varchar('alt_text', { length: 255 }), // Nullable: for accessibility
    category: text('category').array(), // Categories like ['parakeets', 'birdman']
    aspect: varchar('aspect', { length: 50 }).default('square'), // square | portrait | landscape
    order: integer('order').notNull().default(0), // Display order (lower = shown first)
    uploadedAt: timestamp('uploaded_at').notNull().defaultNow(),
  },
  (table) => ({
    // Index for sorted retrieval
    orderIdx: index('gallery_images_order_idx').on(table.order),
  })
);

// ─── Feedback Table ──────────────────────────────────────────────────────────
// Visitor testimonials and ratings (anonymous submissions allowed)

export const feedback = pgTable(
  'feedback',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    visitorName: varchar('visitor_name', { length: 255 }), // Nullable: anonymous allowed
    rating: integer('rating'), // Nullable: 1-5 stars (visitor can give text-only feedback)
    message: text('message').notNull(), // Required: the feedback content
    visitDate: date('visit_date'), // Nullable: when they visited (if provided)
    isApproved: boolean('is_approved').notNull().default(false), // Moderation flag (default: review required)
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    // Indexes for filtering approved feedback by recency
    isApprovedIdx: index('feedback_is_approved_idx').on(table.isApproved),
    createdAtIdx: index('feedback_created_at_idx').on(table.createdAt),
  })
);

// ─── Admin Users Table ───────────────────────────────────────────────────────
// Credentials for Sudarson Sah's dashboard access (bcrypt-secured)

export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 100 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(), // bcrypt hash (12+ rounds)
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Verification Codes Table ────────────────────────────────────────────────
// Stores temporary OTPs for secure admin profile updates (email change)

export const verificationCodes = pgTable(
  'verification_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(), // Links to Supabase Auth User ID
    code: varchar('code', { length: 6 }).notNull(), // 6-digit OTP
    newEmail: varchar('new_email', { length: 255 }).notNull(), // The pending email address
    expiresAt: timestamp('expires_at').notNull(), // 15-minute window
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('verification_codes_user_id_idx').on(table.userId),
  })
);

// ─── Push Subscriptions Table ────────────────────────────────────────────────
// Stores administrative push tokens for real-time browser notifications

export const pushSubscriptions = pgTable(
  'push_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(), // Links to Supabase Auth User ID
    subscription: text('subscription').notNull(), // JSON stringified subscription object
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('push_subscriptions_user_id_idx').on(table.userId),
  })
);

// ─── Day Settings Table ──────────────────────────────────────────────────────
// Per-day overrides for slot time, guest capacity, and date blocking.
// If no row exists for a date, global defaults from app_config apply.

export const daySettings = pgTable(
  'day_settings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    date: date('date').notNull(),              // The specific date this setting applies to
    slotTime: time('slot_time'),               // Override time (null = use global default)
    maxGuests: integer('max_guests'),           // Override capacity (null = use global default)
    isBlocked: boolean('is_blocked').notNull().default(false), // Block this entire day
    blockReason: text('block_reason'),          // Optional reason shown in cancellation email
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    dateUniq: uniqueIndex('day_settings_date_uniq').on(table.date),
  })
);

// ─── App Config Table ────────────────────────────────────────────────────────
// Key-value store for global application settings.
// Seeds: default_slot_time = '16:30', default_max_guests = '100'

export const appConfig = pgTable('app_config', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// TYPE EXPORTS - TypeScript inference from Drizzle schema
// ─────────────────────────────────────────────────────────────────────────────

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;

export type GalleryImage = typeof galleryImages.$inferSelect;
export type NewGalleryImage = typeof galleryImages.$inferInsert;

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;

export type DaySetting = typeof daySettings.$inferSelect;
export type NewDaySetting = typeof daySettings.$inferInsert;

export type AppConfig = typeof appConfig.$inferSelect;
