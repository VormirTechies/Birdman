# 🚀 Quick Start Guide

## Local Development Setup

Follow these steps to get the Birdman of Chennai application running on your local machine.

---

## Prerequisites

- **Node.js** 20+ and npm 10+
- **Git** 2.40+
- **Supabase account** (free)
- **Resend account** (free, optional for email testing)

---

## Step-by-Step Setup

### 1. Clone the Repository

```powershell
git clone https://github.com/your-org/birdman.git
cd birdman
```

### 2. Install Dependencies

```powershell
npm install
```

### 3. Set Up Environment Variables

Copy the example file:
```powershell
copy .env.local.example .env.local
```

### 4. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click **"New Project"**
3. Fill in:
   - Name: `birdman-dev` (or any name)
   - Database Password: Generate and save securely
   - Region: `South Asia (Mumbai)`
4. Wait ~2 minutes for provisioning

### 5. Get Supabase Credentials

**Database Connection String:**
1. Supabase Dashboard → **Settings → Database**
2. Copy **"Connection string"** (use **Pooler** mode)
3. Replace `[YOUR-PASSWORD]` with your database password
4. Add to `.env.local` as `DATABASE_URL`

**API Keys:**
1. Supabase Dashboard → **Settings → API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
3. Add all to `.env.local`

### 6. Generate Secrets

Run these commands and add results to `.env.local`:

```powershell
# JWT_SECRET
openssl rand -base64 32

# CRON_SECRET
openssl rand -base64 32

# NEXTAUTH_SECRET
openssl rand -base64 32
```

### 7. Set Application URLs

Add to `.env.local`:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

### 8. Push Database Schema

```powershell
npm run db:push
```

This creates all tables in your Supabase database. Verify in Supabase Dashboard → **Table Editor**.

### 9. Start Development Server

```powershell
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 Verify Setup

### Test Database Connection

```powershell
npm run db:studio
```

Opens Drizzle Studio at `https://local.drizzle.studio` — you can view and edit data.

### Test API Endpoints

```powershell
# Create a test session
curl -X POST http://localhost:3000/api/sessions `
  -H "Content-Type: application/json" `
  -d '{"date": "2026-04-01", "type": "morning", "capacity": 20}'

# Get sessions
curl http://localhost:3000/api/sessions
```

---

## 📧 Optional: Email Testing (Resend)

If you want to test email sending locally:

### 1. Create Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up and verify email

### 2. Get API Key
1. Dashboard → **API Keys → Create API Key**
2. Name: `birdman-dev`
3. Copy key → Add to `.env.local` as `RESEND_API_KEY`

### 3. Test Email Sending

```powershell
curl -X POST http://localhost:3000/api/test-email `
  -H "Content-Type: application/json" `
  -d '{"to": "your-email@example.com"}'
```

⚠️ **Note:** In development, emails are sent from `onboarding@resend.dev`. To use your own domain, see [INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md).

---

## 🔧 Common Issues

### Build Error: "Type error" 

```powershell
# Check TypeScript errors
npx tsc --noEmit

# If no errors, clean and rebuild
rm -r .next
npm run build
```

### Database Connection Error

**Error:** "Connection terminated unexpectedly"

**Fix:** Make sure you're using the **Pooler** connection string, not the direct one:
```
postgresql://postgres.xxxxx:[password]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true
                                                            ^^^^^^         ^^^^^^^^^^^^^^^^^^^
```

### Port 3000 Already in Use

**Error:** "Port 3000 is already in use"

**Fix:** Kill the process or use a different port:
```powershell
# Use different port
$env:PORT=3001; npm run dev

# Or kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Missing Environment Variable

**Error:** "Missing NEXT_PUBLIC_SUPABASE_URL environment variable"

**Fix:**
1. Ensure `.env.local` exists in project root
2. Restart development server after adding variables
3. Check variable names match exactly (case-sensitive)

---

## 🧪 Running Tests (Coming in Sprint 2)

```powershell
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

---

## 📚 Next Steps

- **Read the architecture:** [INFRASTRUCTURE.md](./docs/INFRASTRUCTURE.md)
- **Security best practices:** [SECURITY.md](./docs/SECURITY.md)
- **Deploy to production:** [DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- **Component usage:** [COMPONENT-GUIDE.md](./COMPONENT-GUIDE.md)
- **Database schema:** [DATABASE.md](./DATABASE.md)

---

## 🆘 Need Help?

- **Documentation issues?** Open an issue on GitHub
- **Setup problems?** Check [Troubleshooting section](#-common-issues) above
- **Questions?** Ask in the team Slack channel

---

**Happy coding!** 🎉
