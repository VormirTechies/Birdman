# Database Setup Guide

## Supabase + Drizzle ORM Configuration

This project uses **Supabase** for PostgreSQL database hosting and **Drizzle ORM** for type-safe database queries.

---

## 🚀 Setup Steps

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Create a new project
3. Wait for the database to be provisioned (~2 minutes)

### 2. Get Your Credentials

From your Supabase project dashboard:

**Settings → API:**
- Copy `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- Copy `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

**Settings → Database:**
- Copy `Connection string` (Pooler) → `DATABASE_URL`
- Format: `postgresql://postgres:[YOUR-PASSWORD]@[HOST]:[PORT]/postgres`

### 3. Configure Environment Variables

Create `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Database
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/postgres

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin Auth
NEXTAUTH_SECRET=run: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

### 4. Push Schema to Database

```bash
# Push the schema to Supabase (for development)
npm run db:push

# OR generate and run migrations (for production)
npm run db:generate
npm run db:migrate
```

### 5. Verify Setup

```bash
# Open Drizzle Studio to view your database
npm run db:studio
```

Visit `https://local.drizzle.studio` to see your tables.

---

## 📊 Database Schema

### Tables

| Table | Purpose |
|---|---|
| `sessions` | Morning/Evening feeding sessions with capacity |
| `bookings` | Visitor bookings linked to sessions |
| `admin_users` | Admin credentials (bcrypt hashed passwords) |
| `blackout_dates` | Days when sanctuary is closed |
| `visitor_feedback` | Ratings and comments from visitors |
| `donations` | Visitor contributions for bird feed |

### Key Features

- ✅ **UUID Primary Keys** — Secure, non-guessable IDs
- ✅ **Foreign Key Constraints** — Referential integrity
- ✅ **Cascade Deletes** — Cleanup bookings when sessions deleted
- ✅ **Timestamps** — Created/Updated tracking
- ✅ **Enums** — Type-safe session types, booking statuses, locales

---

## 🛠️ Available Commands

```bash
# Generate migration files from schema changes
npm run db:generate

# Run migrations against the database
npm run db:migrate

# Push schema directly (development only - no migrations)
npm run db:push

# Open Drizzle Studio (visual database browser)
npm run db:studio
```

---

## 🔐 Security Notes

- **Never commit** `.env.local` to git
- Use `.env.example` as a template
- `service_role` key bypasses Row Level Security — use only in API routes
- Use `anon` key for client-side queries (RLS enforced)

---

## 📦 Storage Setup (Images)

In Supabase Dashboard → Storage:

1. Create a new bucket: `sanctuary-images`
2. Set it to **Public** (or configure RLS policies)
3. Upload images via:
   - Supabase Dashboard (manual)
   - API routes using `supabaseAdmin.storage.from('sanctuary-images').upload()`

---

## 🧪 Sample Data (Optional)

To seed the database with test data, create `src/lib/db/seed.ts` and run:

```typescript
import { db } from '@/lib/db';
import { sessions, adminUsers } from '@/lib/db/schema';
import bcrypt from 'bcryptjs';

async function seed() {
  // Create admin user
  const passwordHash = await bcrypt.hash('sudarson2024', 10);
  await db.insert(adminUsers).values({
    username: 'sudarson',
    email: 'sudarson@birdman.com',
    passwordHash,
  });

  // Create sessions for next 7 days
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    await db.insert(sessions).values([
      { date, type: 'morning', capacity: 20, isAvailable: true },
      { date, type: 'evening', capacity: 20, isAvailable: true },
    ]);
  }
}

seed();
```

Run: `tsx src/lib/db/seed.ts`

---

## 📖 Usage Examples

### Query Bookings with Session Details

```typescript
import { db } from '@/lib/db';
import { bookings, sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const bookingsWithSessions = await db
  .select()
  .from(bookings)
  .leftJoin(sessions, eq(bookings.sessionId, sessions.id))
  .where(eq(sessions.date, new Date('2024-01-15')));
```

### Create Booking with Capacity Check (Transaction)

```typescript
import { db } from '@/lib/db';
import { bookings, sessions } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';

await db.transaction(async (tx) => {
  // Check capacity
  const [session] = await tx
    .select({ capacity: sessions.capacity })
    .from(sessions)
    .where(eq(sessions.id, sessionId));

  const [{ value: bookedCount }] = await tx
    .select({ value: count() })
    .from(bookings)
    .where(eq(bookings.sessionId, sessionId));

  if (bookedCount >= session.capacity) {
    throw new Error('Session full');
  }

  // Create booking
  await tx.insert(bookings).values({
    sessionId,
    visitorName: 'John Doe',
    phone: '+919876543210',
    locale: 'en',
    numberOfVisitors: 2,
    rulesAccepted: true,
  });
});
```

---

## 🐛 Troubleshooting

**Connection Error:**
- Verify `DATABASE_URL` is correct (use the **Pooler** connection string)
- Check Supabase project is active

**Migration Fails:**
- Ensure no manual changes were made to the database
- Try `npm run db:push` for development

**Type Errors:**
- Run `npm run db:generate` after schema changes
- Restart TypeScript server in VS Code

---

For more help, consult:
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Supabase Docs](https://supabase.com/docs)
