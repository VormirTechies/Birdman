# Sprint 1: Database Schema Setup ✅

## Schema Overview

The MVP schema has been simplified to **4 core tables**:

### 1. **Bookings** 📅
Direct date/time bookings (no session management overhead)
- Visitor details (name, phone, email)
- Booking date & time (simplified: no sessions table)
- Guest count
- WhatsApp notification tracking (confirmationSent, reminderSent)
- Status tracking (confirmed | cancelled | completed)

### 2. **Gallery Images** 🖼️
Photo gallery for the website
- CDN URLs (Vercel Blob or Cloudinary)
- Captions and alt text
- Display ordering

### 3. **Feedback** 💬
Visitor testimonials
- Anonymous submissions allowed
- Optional rating (1-5 stars)
- Moderation flag (isApproved)

### 4. **Admin Users** 👤
Dashboard authentication
- bcrypt-secured passwords
- Single admin account for Sudarson Sah

---

## Quick Start Commands

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Setup Environment Variables
Create `.env.local`:
```env
# Get these from: https://supabase.com/dashboard → Your Project → Settings
DATABASE_URL=postgresql://postgres:[password]@[host]:[port]/postgres
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 3️⃣ Push Schema to Supabase
```bash
npm run db:push
```
This creates all tables in your Supabase database.

### 4️⃣ Seed Sample Data
```bash
npm run db:seed
```
This populates:
- ✅ 1 admin user (username: `admin`, password: `admin123`)
- ✅ 5 sample bookings
- ✅ 10 gallery images (Unsplash placeholders)
- ✅ 5 feedback entries

### 5️⃣ View Your Data
```bash
npm run db:studio
```
Opens Drizzle Studio at `https://local.drizzle.studio`

---

## TypeScript Types

All tables export type-safe interfaces:

```typescript
import { Booking, NewBooking } from '@/lib/db/schema';
import { GalleryImage, Feedback, AdminUser } from '@/lib/db/schema';

// Use NewBooking for inserts
const booking: NewBooking = {
  visitorName: 'John Doe',
  phone: '+91-9876543210',
  email: 'john@example.com',
  bookingDate: '2026-04-01',
  bookingTime: '06:00:00',
  numberOfGuests: 2,
};
```

---

## Performance Indexes

The schema includes optimized indexes for:
- **Bookings**: Fast lookup by date and status
- **Feedback**: Fast filtering by approval status and recency
- **Gallery**: Fast sorted retrieval by display order

---

## Next Steps

✅ Schema complete  
⬜ Create booking API endpoints (`/api/bookings`)  
⬜ Create admin API endpoints (`/api/admin/...`)  
⬜ Add Zod validation schemas (`src/lib/validations/`)  
⬜ Integrate Twilio WhatsApp API

---

## Database Commands Reference

| Command | Purpose |
|---|---|
| `npm run db:push` | Push schema changes to database (dev) |
| `npm run db:generate` | Generate migration files (production) |
| `npm run db:migrate` | Run migrations (production) |
| `npm run db:studio` | Open visual database browser |
| `npm run db:seed` | Populate with sample data |

---

## Schema Changes

If you need to modify the schema:
1. Edit `src/lib/db/schema.ts`
2. Run `npm run db:push` (dev) or `npm run db:generate` (prod)
3. Verify in Drizzle Studio

---

**Parrot-Backend Sprint 1 Status: COMPLETE** ✅
