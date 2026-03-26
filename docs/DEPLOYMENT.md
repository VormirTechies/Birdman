# 🚀 Vercel Deployment Checklist

## Pre-Deployment

### 1. Code Quality
- [ ] All tests pass: `npm test` (if tests exist)
- [ ] No TypeScript errors: `npm run build`
- [ ] No ESLint errors: `npm run lint`
- [ ] All environment variables documented in `.env.local.example`

### 2. Database
- [ ] Database schema finalized
- [ ] Migrations generated: `npm run db:generate`
- [ ] Schema pushed to Supabase: `npm run db:push`
- [ ] Test database connection locally

### 3. Environment Variables
- [ ] All secrets generated (use `openssl rand -base64 32`)
- [ ] `.env.local` contains all required variables
- [ ] `.env.local.example` is up to date
- [ ] No secrets committed to Git (verify with `git log -p`)

---

## Deployment to Vercel

### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New..." → Project**
3. Import Git Repository:
   - Select your GitHub repository
   - Click **"Import"**

### Step 2: Configure Project

**Framework Preset:** Next.js (auto-detected)

**Build Settings:**
- Build Command: `npm run build`
- Output Directory: `.next` (default)
- Install Command: `npm install`

**Root Directory:** `./` (leave as default)

### Step 3: Add Environment Variables

Click **"Environment Variables"** and add each one:

#### Required for All Environments

| Variable | Value | Note |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.xxxxx...` | Use Supabase pooler connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | Public — safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxx...` | Public — safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJxxx...` | **SECRET** — server only |
| `JWT_SECRET` | Generate new | 32+ character random string |
| `CRON_SECRET` | Generate new | 32+ character random string |
| `NEXTAUTH_SECRET` | Generate new | 32+ character random string |
| `NEXTAUTH_URL` | `https://yourdomain.com` | Update after deployment |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` | Update after deployment |

#### After First Deployment

| Variable | Value | Note |
|---|---|---|
| `RESEND_API_KEY` | `re_xxxxx...` | Add after setting up Resend |
| `BLOB_READ_WRITE_TOKEN` | Generate via Vercel CLI | Add after creating blob store |

**Scope:** Select **"Production, Preview, and Development"** for all variables

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait ~2-3 minutes for build to complete
3. Note your deployment URL: `https://birdman-app-xxxxx.vercel.app`

---

## Post-Deployment

### 1. Update Environment Variables

**Update these with your actual deployment URL:**

1. Vercel Dashboard → Project → **Settings → Environment Variables**
2. Edit these variables:
   - `NEXTAUTH_URL` → `https://your-actual-domain.vercel.app`
   - `NEXT_PUBLIC_APP_URL` → `https://your-actual-domain.vercel.app`
3. Click **"Save"**
4. **Redeploy** → Deployments → ⋮ (three dots) → "Redeploy"

### 2. Set Up Vercel Blob

**Option A: Via CLI (Recommended)**
```powershell
# Install Vercel CLI if not installed
npm i -g vercel

# Login
vercel login

# Link your project
vercel link

# Create blob store
vercel blob create birdman-images
```

The CLI will:
- Create a blob store
- Automatically add `BLOB_READ_WRITE_TOKEN` to your project
- Show you the token to add to `.env.local` for local development

**Option B: Via Dashboard**
1. Vercel Dashboard → Project → **Storage** → **Create Database**
2. Select **"Blob"**
3. Name: `birdman-images`
4. Click **"Create"**
5. Copy `BLOB_READ_WRITE_TOKEN` from the `.env.local` tab
6. Add to local `.env.local` file

### 3. Verify Cron Job

**Check if cron is configured:**
1. Vercel Dashboard → Project → **Settings → Cron Jobs**
2. Verify: `/api/cron/send-reminders` runs at `30 4 * * *` (10 AM IST)

**If not showing:**
1. Ensure `vercel.json` is in project root and committed to Git
2. Redeploy the project

**Test cron endpoint:**
```powershell
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.vercel.app/api/cron/send-reminders
```

### 4. Configure Custom Domain (Optional)

1. Vercel Dashboard → Project → **Settings → Domains**
2. Click **"Add"**
3. Enter your domain: `birdmanofchennai.com`
4. Follow instructions to add DNS records at your domain registrar:
   - **A record** → `76.76.21.21`
   - **CNAME record** → `cname.vercel-dns.com`
5. Wait for DNS propagation (~10 minutes to 24 hours)
6. Enable **"Redirect www to apex"** or vice versa

### 5. Enable Edge Functions (Optional)

For faster responses in India:

1. Check if your API routes use Edge Runtime:
```typescript
// src/app/api/bookings/route.ts
export const runtime = 'edge';
```

2. Vercel automatically deploys Edge Functions to global CDN
3. Monitor in Dashboard → **Logs** → Filter by "Edge"

### 6. Set Up Monitoring

**Enable Vercel Analytics:**
1. Project → **Analytics** → **Enable Web Analytics**
2. Add to `src/app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout() {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

**Enable Speed Insights:**
1. Project → **Speed Insights** → **Enable**
2. Add to layout:
```typescript
import { SpeedInsights } from '@vercel/speed-insights/next';

<SpeedInsights />
```

---

## Verification Checklist

After deployment, verify these work:

### Public Pages
- [ ] Homepage loads: `https://yourdomain.com`
- [ ] Booking form renders correctly
- [ ] Date picker shows available dates
- [ ] Language toggle works (English ↔ Tamil)

### API Endpoints
- [ ] `GET /api/sessions` returns available sessions
- [ ] `POST /api/bookings` creates a booking
- [ ] Email confirmation sent via Resend
- [ ] Database entry created in Supabase

### Database
- [ ] Open Supabase Dashboard → **Table Editor**
- [ ] Verify `sessions` table has data
- [ ] Check recent bookings in `bookings` table

### Cron Jobs
- [ ] Wait until next scheduled run (10 AM IST)
- [ ] Check Vercel **Logs** → filter by `/api/cron`
- [ ] Verify reminder emails sent successfully

### Security
- [ ] Test `/api/cron/send-reminders` without Authorization header → should return 401
- [ ] Check headers at [securityheaders.com](https://securityheaders.com)
- [ ] Verify no secrets exposed in Network tab (Dev Tools)

---

## Rollback Plan

If deployment fails or critical bug found:

### Instant Rollback
1. Vercel Dashboard → **Deployments**
2. Find last working deployment
3. Click ⋮ (three dots) → **"Promote to Production"**
4. Deployment reverted in <30 seconds

### Fix and Redeploy
1. Fix issue locally
2. Commit and push to Git
3. Vercel auto-deploys from `main` branch
4. Or manual redeploy: `vercel --prod`

---

## Troubleshooting

### Build Fails

**Error: "Type error in src/..."**
```powershell
# Fix TypeScript errors locally first
npm run build

# Check errors
npx tsc --noEmit
```

**Error: "Module not found"**
```powershell
# Ensure dependencies installed
npm install

# Check package.json has all imports
```

### Database Connection Fails

**Error: "Connection terminated unexpectedly"**

❌ You're using the wrong connection string.

✅ Use the **"Connection pooling"** string from Supabase:
```
postgresql://postgres.xxxxx:[password]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true
```

**Error: "Too many connections"**

- Ensure `DATABASE_URL` has `?pgbouncer=true` at the end
- Check Supabase Dashboard → **Settings → Database → Connection Info** → Use Transaction mode

### Environment Variables Not Working

**Symptom:** `process.env.VARIABLE_NAME` is `undefined`

**Solution:**
1. Verify variable added in Vercel Dashboard
2. Check scope is "Production" (or all environments)
3. **Redeploy** — environment variable changes require redeploy
4. For `NEXT_PUBLIC_*` vars, ensure rebuilding (`npm run build`)

### Cron Not Running

**Symptom:** No logs at scheduled time

**Checklist:**
- [ ] `vercel.json` exists in project root
- [ ] `vercel.json` committed to Git
- [ ] Redeployed after adding `vercel.json`
- [ ] Path in `vercel.json` matches API route file
- [ ] Check **Logs** tab — filter by "cron"

---

## Performance Optimization

### After First 100 Visitors

**Monitor Vercel Analytics:**
- Check **Web Vitals** (LCP, FID, CLS)
- Identify slow pages

**Optimize:**
1. Add ISR to session listing:
```typescript
// src/app/page.tsx
export const revalidate = 3600; // Revalidate every 1 hour
```

2. Optimize images:
```typescript
import Image from 'next/image';

<Image
  src="/birdman.jpg"
  width={800}
  height={600}
  alt="Birdman of Chennai"
  quality={85} // Reduce from 100
  priority // Load above fold
/>
```

3. Enable caching headers in Vercel Dashboard

---

## Budget Monitoring

### Weekly Check (Every Monday 10 AM)

| Service | Metric | Free Limit | Alert At |
|---|---|---|---|
| **Vercel** | Bandwidth | 100 GB/month | 80 GB |
| **Supabase** | Database size | 500 MB | 400 MB |
| **Supabase** | Bandwidth | 2 GB/month | 1.6 GB |
| **Resend** | Emails sent | 3000/month | 2400/month |
| **Blob** | Storage | 10 GB | 8 GB |

**How to Check:**
- Vercel: Dashboard → **Usage**
- Supabase: Dashboard → **Settings → Billing**
- Resend: Dashboard → **Usage**

**If Exceeding 80%:**
1. Optimize queries (reduce database bandwidth)
2. Add aggressive caching (reduce Vercel bandwidth)
3. Compress images (reduce Blob storage)
4. Batch email sends (reduce Resend usage)

---

## Production URL Handoff

Once deployed, share these with the team:

| Item | URL |
|---|---|
| **Live Site** | `https://birdmanofchennai.vercel.app` |
| **Vercel Dashboard** | [Project Settings](https://vercel.com/dashboard) |
| **Supabase Dashboard** | `https://supabase.com/dashboard/project/xxxxx` |
| **Resend Dashboard** | `https://resend.com/emails` |
| **GitHub Repo** | `https://github.com/your-org/birdman` |

---

**Deployment Complete!** ✅  
Your application is now live on Vercel with zero infrastructure costs.
