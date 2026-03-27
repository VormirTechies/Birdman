# 🏗️ Infrastructure Overview

## Sprint 1: Zero-Cost Infrastructure Setup ✅

This document provides an overview of the infrastructure setup for the Birdman of Chennai MVP.

---

## 🎯 Infrastructure Goals

1. **Zero Cost** — Use only free-tier services
2. **Scalable** — Handle 100+ visitors/day
3. **Reliable** — 99.9% uptime on free tier
4. **Secure** — Industry-standard security practices
5. **Simple** — Easy to maintain and deploy

---

## 🗺️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Internet Users                           │
│                    (Visitors from Chennai)                       │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                           │
│  • Next.js 16 (App Router)                                       │
│  • Edge Functions (India region)                                 │
│  • Static + ISR pages                                            │
│  • Free: 100 GB bandwidth, 6000 build minutes/month             │
└─────────────┬──────────────────┬──────────────────┬─────────────┘
              │                  │                  │
              ▼                  ▼                  ▼
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │   Supabase   │   │    Resend    │   │ Vercel Blob  │
    │  PostgreSQL  │   │    Email     │   │   Storage    │
    │              │   │              │   │              │
    │ Free: 500 MB │   │ Free: 3000   │   │ Free: 10 GB  │
    │   2 GB/mo    │   │  emails/mo   │   │   100 GB/mo  │
    └──────────────┘   └──────────────┘   └──────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4 | Server components, streaming, responsive UI |
| **Backend** | Next.js API Routes, Server Actions | RESTful APIs, server-side logic |
| **Database** | Supabase PostgreSQL + Drizzle ORM | Type-safe database queries, migrations |
| **Email** | Resend | Booking confirmations, daily reminders |
| **Storage** | Vercel Blob (optional: Supabase Storage) | Visitor photos, documents |
| **Cron Jobs** | Vercel Cron | Daily reminder emails at 10 AM IST |
| **Forms** | React Hook Form + Zod | Client & server-side validation |
| **i18n** | next-intl | English and Tamil localization |
| **Hosting** | Vercel | Deployment, edge functions, CDN |

---

## 📊 Service Comparison: Supabase vs Neon

### ✅ **RECOMMENDATION: Supabase**

| Feature | Supabase | Neon | Decision |
|---|---|---|---|
| **Free Storage** | 500 MB | 500 MB | Tie |
| **Bandwidth** | 2 GB/month | 3 GB/month | Neon wins |
| **Built-in Storage** | ✅ 1 GB | ❌ None | Supabase wins |
| **Connection Pooling** | ✅ PgBouncer | ✅ Built-in | Tie |
| **Dashboard** | ✅ Excellent | ✅ Good | Supabase wins |
| **Region Support** | ✅ Mumbai (India) | ✅ Mumbai | Tie |
| **Realtime** | ✅ WebSocket support | ❌ None | Supabase wins |
| **Auth** | ✅ Built-in | ❌ None | Supabase wins |
| **Backups** | Daily (7-day retention) | Branch-based | Depends |

**Winner:** **Supabase** — Better for MVP with built-in features we can grow into.

---

## 🗄️ Database Schema

**6 Tables:**
1. **sessions** — Available visit slots (morning/evening)
2. **bookings** — Visitor reservations
3. **admin_users** — Admin dashboard access
4. **blackout_dates** — Unavailable dates (holidays, maintenance)
5. **visitor_feedback** — Post-visit ratings and comments
6. **donations** — Optional visitor contributions

For detailed schema, see [DATABASE.md](../DATABASE.md).

---

## 🔐 Security Implementation

### Secrets Management
- All secrets in `.env.local` (gitignored)
- Different secrets for dev/prod environments
- Strong random secrets generated with `openssl rand -base64 32`

### API Protection
- Cron routes protected with `CRON_SECRET`
- Admin routes protected with JWT tokens
- Rate limiting on booking endpoints (10 req/min per IP)

### Database Security
- Connection pooling via PgBouncer
- Row-Level Security (RLS) policies enabled
- Separate anon and service role keys

### Headers
- Content-Security-Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

For detailed security practices, see [SECURITY.md](./SECURITY.md).

---

## ⏰ Cron Jobs

**Daily Reminders:** 10:00 AM IST = 04:30 AM UTC

Configured in `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/send-reminders",
    "schedule": "30 4 * * *"
  }]
}
```

**What it does:**
1. Queries bookings for tomorrow
2. Sends reminder emails via Resend
3. Includes directions, rules, and session details

---

## 📧 Email Service: Resend

**Free Tier:** 3,000 emails/month, 100 emails/day

**Email Templates:**
1. **Booking Confirmation** — Sent immediately after booking
2. **Daily Reminder** — Sent 1 day before visit
3. **Cancellation Confirmation** — When visitor cancels
4. **Admin Notification** — New booking alert (optional)

**From Address:**
- Development: `onboarding@resend.dev`
- Production: `noreply@birdmanofchennai.com` (requires domain verification)

---

## 🖼️ Image Storage Options

### Option A: Vercel Blob (Recommended)
- **Free Tier:** 10 GB storage, 100 GB bandwidth
- **Setup:** `npm install @vercel/blob` + `vercel blob create`
- **Best for:** General file uploads, visitor photos

### Option B: Supabase Storage (Alternative)
- **Free Tier:** 1 GB storage (included with Supabase DB)
- **Setup:** Already configured via `@supabase/supabase-js`
- **Best for:** Media tied to database records

**Decision:** **Vercel Blob** — Larger free tier, better integration with Vercel hosting.

---

## 📈 Free Tier Limits & Monitoring

| Service | Metric | Free Limit | Alert Threshold |
|---|---|---|---|
| **Vercel** | Bandwidth | 100 GB/month | 80 GB |
| **Vercel** | Build minutes | 6000/month | 4800 min |
| **Supabase** | Database size | 500 MB | 400 MB |
| **Supabase** | Bandwidth | 2 GB/month | 1.6 GB |
| **Resend** | Emails sent | 3000/month | 2400/month |
| **Vercel Blob** | Storage | 10 GB | 8 GB |

**Weekly Monitoring:**
- Check usage every Monday 10 AM
- Set up billing alerts in each dashboard
- Optimize if any service exceeds 80%

---

## 🚀 Deployment Workflow

### Local Development
```powershell
npm install
npm run dev
```

### Push to GitHub
```powershell
git add .
git commit -m "feat: add booking form"
git push origin main
```

### Auto-Deploy to Vercel
1. Vercel detects push to `main` branch
2. Runs build: `npm run build`
3. Runs type-check and linting
4. Deploys to production (if successful)
5. Deployment URL: `https://birdman-app-xxxxx.vercel.app`

### Manual Deploy via CLI
```powershell
npm install -g vercel
vercel login
vercel --prod
```

For detailed deployment steps, see [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 🔄 CI/CD Pipeline (Coming in Sprint 2)

**GitHub Actions Workflow:**

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Install dependencies
      - Run ESLint
      - Run TypeScript type-check
      - Run unit tests
      - Run E2E tests (main branch only)
      - Deploy to Vercel (main branch only)
```

---

## 🌍 i18n Configuration

**Supported Locales:**
- English (en) — Default
- Tamil (ta) — For local Chennai visitors

**Implementation:**
- `next-intl` library
- JSON translation files in `src/i18n/`
- Locale detection via user selection (stored in cookie)
- All UI text translated, including booking form and rules

**Example:**
```typescript
// src/i18n/en.json
{
  "booking": {
    "title": "Book Your Visit",
    "submit": "Confirm Booking"
  }
}

// src/i18n/ta.json
{
  "booking": {
    "title": "உங்கள் வருகையை பதிவு செய்யுங்கள்",
    "submit": "பதிவை உறுதிப்படுத்து"
  }
}
```

---

## 📦 Environment Variables

**Total: 12 required environment variables**

| Variable | Type | Required |
|---|---|---|
| `DATABASE_URL` | Secret | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | ✅ |
| `RESEND_API_KEY` | Secret | ✅ |
| `BLOB_READ_WRITE_TOKEN` | Secret | After deploy |
| `JWT_SECRET` | Secret | ✅ |
| `CRON_SECRET` | Secret | ✅ |
| `NEXTAUTH_SECRET` | Secret | ✅ |
| `NEXTAUTH_URL` | Public | ✅ |
| `NEXT_PUBLIC_APP_URL` | Public | ✅ |

See [.env.local.example](./.env.local.example) for details.

---

## 📝 Documentation Structure

```
docs/
├── INFRASTRUCTURE.md    ← You are here (architecture overview)
├── DEPLOYMENT.md        ← Step-by-step deployment guide
├── SECURITY.md          ← Security best practices
└── QUICK-START.md       ← Local development setup
```

---

## ✅ Sprint 1 Deliverables Checklist

- [x] Database recommendation (Supabase vs Neon) — **Supabase chosen**
- [x] `.env.local.example` created with all required variables
- [x] `vercel.json` configured with cron and security headers
- [x] Security headers added to `next.config.ts`
- [x] `INFRASTRUCTURE.md` — Comprehensive setup guide
- [x] `DEPLOYMENT.md` — Vercel deployment checklist
- [x] `SECURITY.md` — Security best practices
- [x] `QUICK-START.md` — Local development guide

---

## 🎯 Next Steps (Sprint 2)

1. **API Development**
   - Implement booking endpoints
   - Add session availability logic
   - Create admin CRUD operations

2. **Email Templates**
   - Design booking confirmation email
   - Create reminder email template
   - Test with Resend

3. **Testing Setup**
   - Unit tests for API routes
   - E2E tests for booking flow
   - CI/CD pipeline with GitHub Actions

---

## 📊 Cost Projection

**Current (MVP):**
- Total monthly cost: **$0.00** ✅

**At 500 bookings/month:**
- Vercel bandwidth: ~15 GB (within 100 GB free tier) ✅
- Supabase database: ~50 MB (within 500 MB free tier) ✅
- Resend emails: ~1500 emails (within 3000 free tier) ✅
- **Total monthly cost: $0.00** ✅

**At 2000 bookings/month (max free tier):**
- Vercel: ~60 GB bandwidth (within limit) ✅
- Supabase: ~200 MB database (within limit) ✅
- Resend: Out of free tier → **$20/month** ⚠️
- **Total monthly cost: $20.00**

**Conclusion:** Free tier supports **1000-1500 bookings/month** comfortably.

---

## 🆘 Support & Maintenance

**Monitoring:**
- Check service dashboards weekly
- Set up billing alerts at 80% usage
- Monitor error logs in Vercel dashboard

**Backups:**
- Supabase: Automatic daily backups (7-day retention)
- Code: Git repository on GitHub
- Environment variables: Documented in password manager

**Updates:**
- Run `npm audit` monthly
- Update dependencies quarterly
- Review security advisories via Dependabot

---

**Infrastructure Setup Complete!** 🎉  
Zero-cost MVP infrastructure is ready for Sprint 2 development.
