# ✅ Setup Checklist

Quick reference for setting up the Birdman of Chennai application.

---

## 📋 Local Development Setup

### 1. Prerequisites
- [ ] Node.js 20+ installed (`node --version`)
- [ ] npm 10+ installed (`npm --version`)
- [ ] Git installed (`git --version`)
- [ ] Supabase account created ([supabase.com](https://supabase.com))

### 2. Repository Setup
```powershell
# Clone and install
git clone https://github.com/your-org/birdman.git
cd birdman
npm install
```
- [ ] Repository cloned
- [ ] Dependencies installed (check for errors)

### 3. Environment Variables
```powershell
# Copy template
copy .env.local.example .env.local
```
- [ ] `.env.local` file created
- [ ] Add `DATABASE_URL` (from Supabase)
- [ ] Add `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Add `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Generate `JWT_SECRET`: `openssl rand -base64 32`
- [ ] Generate `CRON_SECRET`: `openssl rand -base64 32`
- [ ] Generate `NEXTAUTH_SECRET`: `openssl rand -base64 32`
- [ ] Set `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- [ ] Set `NEXTAUTH_URL=http://localhost:3000`

### 4. Database Setup
```powershell
# Push schema to Supabase
npm run db:push
```
- [ ] Schema pushed successfully
- [ ] Verify tables in Supabase Dashboard → Table Editor
- [ ] Should see 6 tables: sessions, bookings, admin_users, blackout_dates, visitor_feedback, donations

### 5. Start Development
```powershell
npm run dev
```
- [ ] Server starts at `http://localhost:3000`
- [ ] No errors in terminal
- [ ] Homepage loads in browser

---

## 🚀 Production Deployment Checklist

### 1. Pre-Deployment
- [ ] All tests pass: `npm test` *(Sprint 2)*
- [ ] No TypeScript errors: `npm run build`
- [ ] No ESLint errors: `npm run lint`
- [ ] All environment variables in `.env.local.example` documented

### 2. Supabase Production Setup
- [ ] Create new Supabase project (name: `birdman-prod`)
- [ ] Select region: **South Asia (Mumbai)**
- [ ] Save database password securely
- [ ] Get connection string (Pooler mode)
- [ ] Get API keys (URL, anon key, service role key)
- [ ] Run `npm run db:push` with production `DATABASE_URL`

### 3. Resend Setup
- [ ] Create Resend account
- [ ] Get API key
- [ ] (Optional) Add custom domain and verify DNS

### 4. Vercel Deployment
- [ ] Connect GitHub repository to Vercel
- [ ] Import project
- [ ] Add environment variables (all 12):
  - [ ] `DATABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `RESEND_API_KEY`
  - [ ] `JWT_SECRET` (new, different from dev)
  - [ ] `CRON_SECRET` (new, different from dev)
  - [ ] `NEXTAUTH_SECRET` (new, different from dev)
  - [ ] `NEXTAUTH_URL` (your Vercel URL)
  - [ ] `NEXT_PUBLIC_APP_URL` (your Vercel URL)
- [ ] Deploy
- [ ] Note deployment URL

### 5. Post-Deployment
- [ ] Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` with actual domain
- [ ] Redeploy after URL update
- [ ] Create Vercel Blob store: `vercel blob create birdman-images`
- [ ] Add `BLOB_READ_WRITE_TOKEN` to Vercel environment variables
- [ ] Test homepage loads
- [ ] Test API endpoints *(Sprint 2)*
- [ ] Verify cron job in Vercel Dashboard → Settings → Cron Jobs
- [ ] Check security headers at [securityheaders.com](https://securityheaders.com)

---

## 🔐 Security Checklist

### Development
- [ ] `.env.local` in `.gitignore` (already done)
- [ ] Never commit secrets to Git
- [ ] Use different secrets for dev and prod
- [ ] Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only

### Production
- [ ] All secrets generated with `openssl rand -base64 32`
- [ ] Cron routes protected with `CRON_SECRET`
- [ ] Admin routes protected with JWT *(Sprint 2)*
- [ ] Rate limiting configured *(Sprint 2)*
- [ ] Row-Level Security (RLS) enabled in Supabase
- [ ] Security headers configured (check with securityheaders.com)
- [ ] HTTPS enforced (automatic on Vercel)

---

## 🧪 Testing Checklist *(Sprint 2)*

### Unit Tests
- [ ] API route tests written
- [ ] Database query tests written
- [ ] Validation logic tests written
- [ ] Run: `npm test`

### E2E Tests
- [ ] Booking flow tested
- [ ] Admin dashboard tested
- [ ] Email sending tested
- [ ] Run: `npm run test:e2e`

---

## 📊 Monitoring Checklist

### Weekly (Every Monday)
- [ ] Check Vercel bandwidth usage (alert at 80 GB)
- [ ] Check Supabase database size (alert at 400 MB)
- [ ] Check Supabase bandwidth (alert at 1.6 GB)
- [ ] Check Resend email count (alert at 2,400/month)
- [ ] Check Vercel Blob storage (alert at 8 GB)

### Monthly
- [ ] Review error logs in Vercel Dashboard
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Update dependencies: `npm update`
- [ ] Review security advisories (Dependabot)

---

## 🆘 Troubleshooting Quick Fixes

### Build Fails
```powershell
# Clean and rebuild
rm -r .next
npm run build
```

### Database Connection Error
```
# Verify connection string has ?pgbouncer=true
postgresql://...pooler.supabase.com:5432/postgres?pgbouncer=true
```

### Port 3000 In Use
```powershell
# Use different port
$env:PORT=3001; npm run dev
```

### Environment Variable Not Working
1. Restart dev server after adding variables
2. Verify variable names match exactly (case-sensitive)
3. For `NEXT_PUBLIC_*` vars, rebuild: `npm run build`

---

## 📚 Documentation Quick Links

| Document | Link |
|---|---|
| Quick Start Guide | [QUICK-START.md](./QUICK-START.md) |
| Infrastructure Overview | [INFRASTRUCTURE-OVERVIEW.md](./INFRASTRUCTURE-OVERVIEW.md) |
| Detailed Infrastructure Setup | [INFRASTRUCTURE.md](./INFRASTRUCTURE.md) |
| Deployment Guide | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Security Best Practices | [SECURITY.md](./SECURITY.md) |
| Sprint 1 Summary | [SPRINT-1-SUMMARY.md](./SPRINT-1-SUMMARY.md) |
| Database Schema | [DATABASE.md](../DATABASE.md) |
| Component Guide | [COMPONENT-GUIDE.md](../COMPONENT-GUIDE.md) |

---

## 🎯 Common Commands

```powershell
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run ESLint

# Database
npm run db:generate      # Generate migrations
npm run db:push          # Push schema to database
npm run db:studio        # Open Drizzle Studio

# Deployment
vercel login             # Login to Vercel
vercel                   # Deploy to preview
vercel --prod            # Deploy to production
```

---

## ✅ Ready to Code?

If all checkboxes above are checked, you're ready to start Sprint 2! 🎉

**Next steps:**
1. Read [SPRINT-1-SUMMARY.md](./SPRINT-1-SUMMARY.md) for Sprint 2 tasks
2. Create feature branch: `git checkout -b feature/booking-api`
3. Start implementing API routes
4. Have fun! 🚀
