# Birdman of Chennai — Visitor Booking System

> A free, multilingual booking portal built for Mr. Sudarson Sah — the man who turned his Chennai rooftop into a sanctuary for over 14,000 wild parakeets.

---

## The Story of Sudarson Sah

Mr. Sudarson Sah is a retired resident of Chintadripet, Chennai, Tamil Nadu. In 2008 he began leaving a handful of rice on his rooftop for a few stray parakeets. Over 16 years that simple act of kindness grew into one of the most remarkable human–wildlife relationships in India: every sunrise, thousands of wild Alexandrine and Rose-ringed parakeets descend from the Chennai sky to eat from his hands.

He spends his own pension money on rice and peanuts, feeds the birds twice daily, and asks for nothing in return. Word spread, visitors arrived, and the Birdman of Chennai was born. This application exists to help him share that experience with the world — peacefully, organically, and for free.

---

## Features

### Visitor-Facing
- **Session booking** — Morning and evening feeding-session slots with per-slot capacity limits
- **Real-time availability** — Slot counts update live; full slots are automatically blocked
- **Bilingual UI** — Full English and Tamil (தமிழ்) support via `next-intl`
- **Booking confirmation email** — Sent instantly after booking via Resend
- **Daily reminder email** — Sent at 10 AM IST the day before the visit (Vercel Cron)
- **Visitor guidelines** — Clearly displayed rules before booking is confirmed
- **Feedback** — Post-visit rating and comment submission
- **Photo gallery** — Bento-grid gallery of sanctuary moments with infinite scroll
- **Story page** — Sudarson's biography with hero crossfade (image → video after 15 s, returns to image on end)
- **Mobile-first design** — Fully responsive; optimised for budget Android handsets

### Admin Dashboard (`/admin`)
- Overview of today's bookings and session fill-rates
- Booking list with search, filter by date, and status management (confirm / cancel / no-show)
- Session calendar — create, edit, and delete sessions and capacity
- Blackout date management — mark sanctuary-closed days
- Visitor feedback viewer
- Gallery image upload, reorder, and delete
- Password-protected with JWT session auth

### Technical
- **Cron job** — `/api/cron/send-reminders` runs daily at 04:30 UTC (10 AM IST)
- **Push notifications** — Web-push via VAPID keys for opt-in booking reminders
- **Supabase Realtime** — Admin dashboard receives live booking updates via WebSocket
- **ISR** — Gallery and story pages statically generated with on-demand revalidation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4, Framer Motion |
| UI Components | Shadcn/UI (Radix UI), Lucide Icons |
| Database | Supabase PostgreSQL + Drizzle ORM |
| Email | Resend + React Email |
| Storage | Supabase Storage (images, videos) |
| Auth | Custom JWT (bcrypt passwords, HttpOnly cookies) |
| Forms | React Hook Form + Zod |
| i18n | next-intl |
| Testing | Vitest (unit), Playwright (E2E) |
| Hosting | Vercel (Edge Functions, Cron, Blob) |
| **Monthly cost** | **$0** (100 % free-tier) |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Homepage
│   ├── book/                 # Visitor booking flow
│   ├── story/                # Sudarson's biography page
│   ├── gallery/              # Photo gallery
│   ├── feedback/             # Post-visit feedback
│   └── admin/                # Admin dashboard (JWT-protected)
│       ├── page.tsx          # Overview / today's bookings
│       ├── calendar/         # Session management
│       ├── history/          # Past bookings
│       ├── gallery/          # Image management
│       ├── checklist/        # Visitor checklist
│       └── login/            # Admin login
├── api/
│   ├── bookings/             # CRUD for visitor bookings
│   ├── admin/                # Admin-only endpoints
│   ├── calendar/             # Session + blackout date management
│   ├── gallery/              # Image upload / listing
│   ├── feedback/             # Feedback submission
│   └── cron/
│       └── send-reminders/   # Daily email cron
├── components/
│   ├── organisms/            # Header, Footer, GalleryClient, FeedbackClient
│   ├── ui/                   # Shadcn base components + AnimatedSection
│   ├── providers/            # Theme, toast, i18n providers
│   └── templates/            # Page layout wrappers
├── lib/
│   ├── db/                   # Drizzle schema, queries, migrations
│   ├── auth.ts               # JWT helpers
│   ├── email.ts              # Resend email sender
│   └── validations/          # Zod schemas
├── i18n.ts                   # next-intl config
└── middleware.ts             # i18n routing + auth guard
messages/
├── en.json                   # English strings
└── ta.json                   # Tamil strings
```

---

## Database Schema

Six tables managed via Drizzle ORM:

| Table | Purpose |
|---|---|
| `sessions` | Morning / evening slots with date, type, and capacity |
| `bookings` | Visitor reservations linked to a session |
| `admin_users` | Admin credentials (bcrypt-hashed passwords) |
| `blackout_dates` | Dates when the sanctuary is closed |
| `visitor_feedback` | Post-visit star ratings and comments |
| `gallery_images` | Image metadata (URL, alt text, aspect ratio, order) |

All tables use UUID primary keys. Foreign keys cascade on delete. Drizzle generates type-safe query builders from the schema.

---

## Design System

**Philosophy:** "Documentary-Organic" — cinematic, intimate, and respectful of Sudarson's story.

### Colour Tokens (Tailwind CSS v4 custom properties)

| Token | Hex | Usage |
|---|---|---|
| `canopy-dark` | `#064e3b` | Dark overlays, header backgrounds |
| `sanctuary-green` | `#059669` | Primary CTAs, active states |
| `golden-hour` | `#f59e0b` | Accents, highlights |
| `sunset-amber` | `#d97706` | Hover accents |
| `feather-cream` | `#fefce8` | Page backgrounds |
| `morning-mist` | `#ecfdf5` | Card backgrounds, nav hover |
| `night-sky` | `#0c0a09` | Dark text |

### Typography

| Token | Font | Usage |
|---|---|---|
| `font-display` | Playfair Display | Headings, hero text |
| `font-body` | Inter | Body copy, UI labels |

### Shadows
- `shadow-card` — subtle card elevation
- `shadow-glow-green` — green-tinted glow for CTAs
- `shadow-hero` — large section hero shadow

---

## Local Development

### Prerequisites
- Node.js 20+ and npm 10+
- A free [Supabase](https://supabase.com) project
- Git

### 1. Clone and install

```powershell
git clone https://github.com/your-org/birdman.git
cd birdman
npm install
```

### 2. Configure environment variables

```powershell
copy .env.local.example .env.local
```

Fill in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...          # server-only — never expose client-side

# Database (use Supabase Pooler connection string)
DATABASE_URL=postgresql://postgres.xxxx:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Auth secrets — generate each with: openssl rand -base64 32
JWT_SECRET=
NEXTAUTH_SECRET=
CRON_SECRET=

# Email (Resend — https://resend.com)
RESEND_API_KEY=re_xxx...
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

> **Supabase region:** Choose `South Asia (Mumbai)` for lowest latency from Chennai.

### 3. Push the database schema

```powershell
npm run db:push
```

Verify tables in Supabase Dashboard → Table Editor, or open Drizzle Studio:

```powershell
npm run db:studio
# opens https://local.drizzle.studio
```

### 4. Seed an admin account

```powershell
npx tsx scripts/seed-admin.ts
```

### 5. Start the dev server

```powershell
npm run dev
# http://localhost:3000
```

### Firebase Emulator Suite

Start the complete local Firebase environment with persistent emulator data:

```powershell
npm run emulators:start
```

Local Firestore uses the `(default)` database so it can be inspected in the
official Emulator Suite UI:

```text
http://127.0.0.1:7000/firestore/default/data
```

Production continues to use the named `birdman-db` database. Emulator data is
imported from and exported to `.firebase/emulator-data/`, which is ignored by
Git. Seed approved feedback after the first start with:

```powershell
npm run seed:feedback:emulator
```

Seed five local email/password accounts, including three Firestore-authorized
administrators, after the Auth and Firestore emulators are running:

```powershell
npm run seed:auth:emulator
```

The local seed password is `Birdman123!`. The script is idempotent and refuses
non-loopback emulator hosts. Seeded administrator emails are
`admin.one@birdman.local`, `admin.two@birdman.local`, and
`admin.three@birdman.local`.

### Firebase administrator setup

Admin identity uses Firebase email/password Authentication. Access is granted
separately by a server-only Firestore document at `adminUsers/{firebaseUid}`.
Direct client reads and writes remain denied by Firestore rules.

For local development:

1. Create an email/password user in the Authentication emulator UI and copy its UID.
2. Add the role document to the local `(default)` Firestore database. This
   PowerShell request uses the emulator's owner override:

```powershell
$firebaseUid = 'PASTE_FIREBASE_UID'
$roleBody = '{"fields":{"role":{"stringValue":"admin"},"displayName":{"stringValue":"Local Admin"}}}'
$roleUrl = "http://127.0.0.1:7003/v1/projects/birdman-7e745/databases/(default)/documents/adminUsers/$firebaseUid"
Invoke-RestMethod -Method Patch -Uri $roleUrl -Headers @{ Authorization = 'Bearer owner' } -ContentType 'application/json' -Body $roleBody
```

The client connects to the Auth emulator at
`NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL` (default `http://127.0.0.1:7002`). The
Auth emulator does not deliver password-reset email; open the generated reset
link from the Authentication emulator UI or emulator logs.

For production:

1. Enable the Email/Password provider in Firebase Authentication.
2. Add localhost and the deployed App Hosting domain to Authorized domains.
3. Configure the password-reset email template action URL to the deployed
   `/admin/reset-password` page.
4. Create the administrator in Firebase Authentication and copy its UID.
5. In the production `birdman-db` database, create `adminUsers/{uid}` with
   `role` set to the string `admin`; `displayName` is optional.

Production deliberately defaults to `birdman-db`; the local emulator uses
`(default)` through `FIRESTORE_DATABASE_ID`.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run emulators:start` | Start Firebase emulators with persistent `(default)` Firestore data |
| `npm run seed:feedback:emulator` | Seed approved feedback into the local Firestore emulator |
| `npm run seed:auth:emulator` | Seed five local Auth users, including three Firestore administrators |
| `npm run lint` | ESLint check |
| `npm run db:generate` | Generate Drizzle migration files |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:push` | Push schema directly (dev only) |
| `npm run db:studio` | Open Drizzle Studio (visual DB browser) |
| `npm run db:seed` | Seed default sessions |
| `npm test` | Run Vitest unit tests |
| `npm run test:coverage` | Unit tests with coverage report |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Playwright with interactive UI |

---

## Deployment (Vercel)

### Required environment variables in Vercel Dashboard

| Variable | Note |
|---|---|
| `DATABASE_URL` | Supabase Pooler connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Public — safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public — safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** — server only |
| `JWT_SECRET` | 32-char random string |
| `NEXTAUTH_SECRET` | 32-char random string |
| `CRON_SECRET` | 32-char random string |
| `NEXTAUTH_URL` | Your production URL |
| `NEXT_PUBLIC_APP_URL` | Your production URL |
| `RESEND_API_KEY` | From resend.com dashboard |
| `RESEND_FROM_EMAIL` | Verified sender email |

Generate secrets with:

```powershell
openssl rand -base64 32
```

### Cron job

`vercel.json` configures the daily reminder cron:

```json
{
  "crons": [{
    "path": "/api/cron/send-reminders",
    "schedule": "30 4 * * *"
  }]
}
```

This fires at 04:30 UTC = **10:00 AM IST** every day. Vercel automatically attaches `Authorization: Bearer <CRON_SECRET>` to the request.

### Custom domain (optional)

1. Vercel Dashboard → Project → Settings → Domains
2. Add your domain (e.g. `birdmanofchennai.com`)
3. Add DNS records at your registrar:
   - `A` record → `76.76.21.21`
   - `CNAME` record → `cname.vercel-dns.com`
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` in Vercel → Redeploy

---

## Security

- All secrets in `.env.local` — committed to `.gitignore`
- Admin API routes require `Authorization: Bearer <JWT>` header
- Cron endpoint verifies `Authorization: Bearer <CRON_SECRET>`
- `SUPABASE_SERVICE_ROLE_KEY` used only in server-side API routes — never exposed to the client
- Input validation with Zod on all API endpoints
- Bcrypt password hashing for admin accounts
- HTTP security headers set in `next.config.ts` (CSP, X-Frame-Options, X-Content-Type-Options)
- Row-Level Security (RLS) enabled on all Supabase tables
- Use different secrets for development and production
- Rotate all production secrets every 90 days

---

## Infrastructure (Zero-Cost)

| Service | Purpose | Free Tier |
|---|---|---|
| Vercel | Hosting, Edge, Cron | 100 GB bandwidth/month |
| Supabase | PostgreSQL + Storage + Realtime | 500 MB DB, 1 GB storage |
| Resend | Transactional email | 3,000 emails/month |
| GitHub Actions | CI/CD | 2,000 minutes/month |

Supports approximately **1,000–1,500 bookings/month** on free tier.

---

## Internationalization

| Locale | Language | File |
|---|---|---|
| `en` | English | `messages/en.json` |
| `ta` | Tamil | `messages/ta.json` |

The locale is set via URL prefix (`/en/...`, `/ta/...`) and detected automatically by `middleware.ts`. Tamil uses `Noto Sans Tamil` for correct script rendering.

---

## License

MIT — see [LICENSE](./LICENSE)

# Firebase Connect 

## Install Google Cloud SDK (gcloud) on your local machine if you haven't already.

`https://docs.cloud.google.com/sdk/docs/install-sdk`

### On your development machine, install/authenticate the Google Cloud CLI:

`gcloud auth application-default login`

### A browser will open. Sign in with the Google account that has access to your Firebase project.

### Then verify:

`gcloud auth application-default print-access-token`

### If that returns an access token, your local machine has ADC configured.

### Now run:

`npm run dev`
