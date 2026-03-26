# 🏗️ Infrastructure Setup Guide

## Zero-Cost MVP Architecture

This document outlines the complete infrastructure setup for the Birdman of Chennai application using **100% free-tier services**.

---

## 📊 Database Recommendation: Supabase vs Neon

### ✅ **RECOMMENDED: Supabase**

**Why Supabase?**

| Criteria | Supabase | Neon |
|---|---|---|
| **Free Storage** | 500 MB database | 500 MB database |
| **Bandwidth** | 2 GB/month | 3 GB/month |
| **Built-in Features** | ✅ Storage, Auth, Realtime | ❌ Database only |
| **Dashboard** | ✅ Excellent UI | ✅ Good UI |
| **Connection Pooling** | ✅ PgBouncer included | ✅ Built-in |
| **Backup** | Daily (7-day retention) | Branch-based |
| **Regional Coverage** | Multiple (incl. India) | Multiple (incl. India) |

**Decision: Use Supabase**

**Rationale:**
1. **Already integrated** — `@supabase/supabase-js` is installed
2. **Built-in Storage** — Can store visitor photos using Supabase Storage (alternative to Vercel Blob)
3. **Future-proof** — Supabase Auth can be added later if needed
4. **Better for India** — Asia-Pacific region available (lower latency for Chennai visitors)
5. **Connection Pooling** — Built-in PgBouncer works perfectly with Vercel serverless

---

## 🗄️ Database Setup (Supabase)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up with GitHub account
3. Click **"New Project"**
4. Fill in:
   - **Name:** `birdman-chennai-prod`
   - **Database Password:** Generate strong password (save in password manager)
   - **Region:** `South Asia (Mumbai)` — closest to Chennai
   - **Pricing Plan:** Free
5. Click **"Create new project"** (takes ~2 minutes)

### Step 2: Get Database Credentials

**Navigate to:** Settings → Database

#### Connection String (Pooler Mode)
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true
```

⚠️ **IMPORTANT:** Use the **"Connection pooling"** string, NOT the "Direct connection" one.  
Why? Vercel serverless functions need connection pooling to avoid exhausting database connections.

Copy this to `DATABASE_URL` in `.env.local`

### Step 3: Get Supabase API Keys

**Navigate to:** Settings → API

- **Project URL:** `https://xxxxxxxxxxxxx.supabase.co` → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key:** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key:** → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### Step 4: Run Database Migrations

```powershell
# Generate migration files
npm run db:generate

# Push schema to Supabase
npm run db:push
```

Verify in Supabase Dashboard → Table Editor — you should see 6 tables:
- sessions
- bookings
- admin_users
- blackout_dates
- visitor_feedback
- donations

---

## 📧 Email Service Setup (Resend)

**Free Tier:** 3,000 emails/month, 100 emails/day

### Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up with email
3. Verify your email address

### Step 2: Get API Key

1. Navigate to **API Keys** (left sidebar)
2. Click **"Create API Key"**
3. Name: `birdman-production`
4. Permissions: **"Sending access"**
5. Copy the key → `RESEND_API_KEY` in `.env.local`

### Step 3: Add Domain (For Production)

⚠️ **For Development:** You can send emails from `onboarding@resend.dev` (no domain needed)

**For Production:**
1. Navigate to **Domains** → **"Add Domain"**
2. Enter your domain: `birdmanofchennai.com`
3. Add DNS records to your domain provider:
   - `MX` record
   - `TXT` record (SPF)
   - `TXT` record (DKIM)
4. Wait for verification (~10 minutes to 24 hours)

**Email Template Structure:**
```typescript
// src/lib/email/templates/booking-confirmation.ts
export const bookingConfirmationEmail = {
  from: 'noreply@birdmanofchennai.com',
  subject: 'Booking Confirmed - Birdman of Chennai',
  // html content...
};
```

---

## 🖼️ Image Storage Setup (Vercel Blob)

**Free Tier:** 10 GB storage, 100 GB bandwidth/month

### Option A: Use Vercel Blob (Recommended)

**Step 1: Install Package**
```powershell
npm install @vercel/blob
```

**Step 2: Create Blob Store** (after deploying to Vercel)
```powershell
vercel blob create birdman-images
```

This command will:
- Create a blob store
- Generate `BLOB_READ_WRITE_TOKEN`
- Add it to your Vercel project environment variables

**Step 3: Add Token Locally**

Copy the token from Vercel Dashboard:
1. Go to your project → **Storage** → **Blob**
2. Click your store → **`.env.local` tab**
3. Copy `BLOB_READ_WRITE_TOKEN` to your local `.env.local`

**Usage Example:**
```typescript
import { put } from '@vercel/blob';

export async function uploadVisitorPhoto(file: File) {
  const blob = await put(`visitors/${Date.now()}-${file.name}`, file, {
    access: 'public',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return blob.url;
}
```

### Option B: Use Supabase Storage (Alternative)

Since you're already using Supabase, storage is included:

**Free Tier:** 1 GB storage

**Setup:**
1. Supabase Dashboard → **Storage** → **"New Bucket"**
2. Name: `visitor-photos`
3. Public bucket: **Yes** (for visitor gallery)
4. File size limit: 5 MB
5. Allowed MIME types: `image/*`

**Usage:**
```typescript
import { supabase } from '@/lib/supabase/client';

export async function uploadToSupabase(file: File) {
  const { data, error } = await supabase.storage
    .from('visitor-photos')
    .upload(`public/${Date.now()}-${file.name}`, file);
  
  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('visitor-photos')
    .getPublicUrl(data.path);
  
  return publicUrl;
}
```

---

## ⏰ Cron Job Setup (Vercel)

**Purpose:** Send daily reminder emails at 10 AM IST to visitors with bookings

### Timezone Conversion
- **10:00 AM IST** = **04:30 AM UTC**
- Cron expression: `30 4 * * *` (runs every day at 4:30 AM UTC)

### Configuration

Already set up in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/send-reminders",
      "schedule": "30 4 * * *"
    }
  ]
}
```

### Create Cron API Route

Create `src/app/api/cron/send-reminders/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get bookings for tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Send reminder emails...
  
  return NextResponse.json({ success: true, sent: 10 });
}
```

### Test Locally

```powershell
curl -H "Authorization: Bearer your_cron_secret" http://localhost:3000/api/cron/send-reminders
```

---

## 🔐 Security Best Practices

### 1. Environment Variables

**✅ DO:**
- Store all secrets in `.env.local` (gitignored)
- Use different secrets for development and production
- Rotate secrets every 90 days
- Use `openssl rand -base64 32` to generate strong secrets

**❌ DON'T:**
- Commit `.env.local` to Git
- Share secrets in Slack, email, or screenshots
- Use weak secrets like `"secret123"`
- Reuse the same secret across different purposes

### 2. API Security

**Protect Cron Routes:**
```typescript
// Verify Authorization header
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return new Response('Unauthorized', { status: 401 });
}
```

**Protect Admin Routes:**
```typescript
// Verify JWT token
const token = request.headers.get('authorization')?.split(' ')[1];
const decoded = verifyJWT(token, process.env.JWT_SECRET);
if (!decoded || decoded.role !== 'admin') {
  return new Response('Forbidden', { status: 403 });
}
```

### 3. Database Security

**Use Service Role Key Only in Server Components:**
```typescript
// ❌ WRONG — Never expose service role key to client
export const supabase = createClient(url, SERVICE_ROLE_KEY);

// ✅ CORRECT — Use anon key for client
export const supabase = createClient(url, ANON_KEY);

// ✅ CORRECT — Use service role only in server actions
import { createServerClient } from '@supabase/ssr';
```

**Enable Row-Level Security (RLS):**
```sql
-- In Supabase Dashboard → SQL Editor
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own bookings"
ON bookings FOR SELECT
USING (phone = current_setting('request.jwt.claims')::json->>'phone');
```

### 4. Rate Limiting

**Protect booking endpoint from abuse:**

```typescript
// src/middleware.ts
import { ratelimit } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/bookings')) {
    const { success } = await ratelimit.limit(request.ip ?? 'anonymous');
    if (!success) {
      return new Response('Too Many Requests', { status: 429 });
    }
  }
}
```

**Simple rate limiter with Vercel KV (free tier: 30k requests/month):**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

export const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
});
```

### 5. Content Security Policy

Add to `next.config.ts`:

```typescript
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js needs unsafe-eval in dev
      "style-src 'self' 'unsafe-inline'", // Tailwind needs unsafe-inline
      "img-src 'self' data: https://xxxxx.supabase.co https://blob.vercel-storage.com",
      "font-src 'self'",
      "connect-src 'self' https://xxxxx.supabase.co",
    ].join('; '),
  },
];

export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## 📋 Environment Variables Checklist

Copy `.env.local.example` to `.env.local` and fill in:

- [ ] `DATABASE_URL` — Supabase connection string (pooler mode)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- [ ] `RESEND_API_KEY` — Resend API key
- [ ] `BLOB_READ_WRITE_TOKEN` — Vercel Blob token (after deployment)
- [ ] `JWT_SECRET` — Generate with `openssl rand -base64 32`
- [ ] `CRON_SECRET` — Generate with `openssl rand -base64 32`
- [ ] `NEXTAUTH_SECRET` — Generate with `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` — `http://localhost:3000` (dev) or your domain (prod)
- [ ] `NEXT_PUBLIC_APP_URL` — Same as above

---

## 🚀 Free Tier Limits Summary

| Service | Free Tier | Monitoring |
|---|---|---|
| **Vercel** | 100 GB bandwidth, 6000 build minutes | Dashboard → Usage |
| **Supabase** | 500 MB database, 2 GB bandwidth | Dashboard → Settings → Billing |
| **Resend** | 3,000 emails/month, 100/day | Dashboard → Usage |
| **Vercel Blob** | 10 GB storage, 100 GB bandwidth | Dashboard → Storage → Usage |
| **GitHub Actions** | 2000 minutes/month | Repo → Actions → Usage |

**Alerts:**
- Set up billing alerts in each service dashboard
- Monitor usage weekly
- Optimize if any service exceeds 80% of free tier

---

## 📦 Next Steps

1. ✅ Copy `.env.local.example` to `.env.local`
2. ✅ Create Supabase project and get credentials
3. ✅ Run `npm run db:push` to create tables
4. ✅ Create Resend account and get API key
5. ✅ Test email sending locally
6. ✅ Deploy to Vercel (see `DEPLOYMENT.md`)
7. ✅ Create Vercel Blob store after deployment
8. ✅ Configure production environment variables in Vercel Dashboard

---

**Infrastructure Ready!** 🎉  
Your zero-cost MVP is now configured. Proceed to Sprint 2 for API development.
