# 🔐 Security Best Practices

## Critical Security Rules

This document outlines security practices for the Birdman of Chennai application. **Follow these rules strictly** to protect user data and prevent unauthorized access.

---

## 1. Environment Variables & Secrets

### ✅ DO

**Generate Strong Secrets**
```powershell
# On Windows (PowerShell)
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Keep Secrets Out of Git**
- Add `.env.local` to `.gitignore` (already done)
- Never commit secrets in code comments
- Don't include secrets in pull request descriptions

**Use Different Secrets for Each Environment**
```
# Development (.env.local)
JWT_SECRET=dev_secret_here

# Production (Vercel Dashboard)
JWT_SECRET=prod_different_secret_here
```

**Rotate Secrets Regularly**
- Every 90 days for production
- Immediately if exposed or team member leaves

### ❌ DON'T

- ❌ Never hardcode secrets: `const secret = "my-secret-123"` ← **WRONG**
- ❌ Never log secrets: `console.log(process.env.JWT_SECRET)` ← **WRONG**
- ❌ Never commit `.env.local` to Git
- ❌ Never share secrets via email, Slack, or screenshots
- ❌ Never use weak secrets like `"secret"`, `"password"`, `"123456"`

---

## 2. API Route Security

### Protect Cron Endpoints

**Problem:** Cron routes are public URLs — anyone can call them

**Solution:** Use Authorization header with `CRON_SECRET`

```typescript
// src/app/api/cron/send-reminders/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Proceed with cron logic...
  return NextResponse.json({ success: true });
}
```

**Configure in Vercel:**
1. Vercel Dashboard → Project → **Settings → Environment Variables**
2. Add `CRON_SECRET` (same value used in Authorization header)
3. Vercel automatically includes this header when calling cron

### Protect Admin Endpoints

```typescript
// src/app/api/admin/[...]/route.ts
import { verifyAdminToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  // Extract token from Authorization header
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json(
      { error: 'Missing token' },
      { status: 401 }
    );
  }

  // Verify JWT
  const admin = await verifyAdminToken(token);
  
  if (!admin) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }

  // Admin verified — proceed
  return NextResponse.json({ success: true });
}
```

### Rate Limiting

**Problem:** Malicious users can spam booking API

**Solution:** Implement rate limiting with Vercel KV (free tier: 30k requests/month)

**Step 1: Install Dependencies**
```powershell
npm install @upstash/ratelimit @vercel/kv
```

**Step 2: Create Vercel KV Database**
1. Vercel Dashboard → Project → **Storage → Create Database**
2. Select **"KV"** (Redis)
3. Name: `birdman-ratelimit`
4. Click **"Create"**
5. Environment variables auto-added: `KV_URL`, `KV_REST_API_URL`, etc.

**Step 3: Implement Rate Limiter**
```typescript
// src/lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

// Allow 10 booking attempts per minute per IP
export const bookingRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: '@upstash/ratelimit:bookings',
});

// Allow 5 admin login attempts per hour per IP
export const adminLoginRateLimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: '@upstash/ratelimit:admin-login',
});
```

**Step 4: Apply in API Routes**
```typescript
// src/app/api/bookings/route.ts
import { bookingRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  // Get user IP
  const identifier = request.ip ?? 'anonymous';
  
  // Check rate limit
  const { success, reset } = await bookingRateLimit.limit(identifier);
  
  if (!success) {
    const resetDate = new Date(reset);
    return NextResponse.json(
      { 
        error: 'Too many requests',
        retryAfter: resetDate.toISOString(),
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  // Rate limit passed — proceed with booking
  // ...
}
```

---

## 3. Database Security

### Use Connection Pooling for Serverless

**Problem:** Vercel serverless functions can exhaust database connections

**Solution:** Use Supabase connection pooling (PgBouncer)

```typescript
// drizzle.config.ts — ✅ CORRECT
export default defineConfig({
  dbCredentials: {
    // Must include ?pgbouncer=true for serverless
    url: process.env.DATABASE_URL!, // Uses pooler connection
  },
});
```

**Verify your DATABASE_URL has:**
```
postgresql://postgres.xxxxx:[password]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true
                                                          ^^^^^^         ^^^^^^^^^^^^^^^^^^^
                                                        (pooler)         (enable pgbouncer)
```

### Separate Supabase Keys

**Problem:** Exposing service role key to client allows full database access

**Solution:** Use anon key for client, service role only on server

```typescript
// src/lib/supabase/client.ts — ✅ PUBLIC (safe for browser)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Anon key (public)
);

// src/lib/supabase/server.ts — ✅ SERVER ONLY
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role (secret)
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

**Usage:**
```typescript
// ❌ WRONG — Never import supabaseAdmin in client component
'use client';
import { supabaseAdmin } from '@/lib/supabase/server'; // ← NEVER DO THIS

// ✅ CORRECT — Use in Server Actions or API Routes only
// src/app/api/admin/delete-booking/route.ts
import { supabaseAdmin } from '@/lib/supabase/server';

export async function DELETE(request: NextRequest) {
  // Server-side only — safe to use service role
  const { error } = await supabaseAdmin
    .from('bookings')
    .delete()
    .eq('id', bookingId);
}
```

### Enable Row-Level Security (RLS)

**Problem:** Even with anon key, users can query any row in the database

**Solution:** Enable RLS policies in Supabase

**Step 1: Enable RLS on All Tables**

In Supabase Dashboard → **SQL Editor**, run:

```sql
-- Enable RLS on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE blackout_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
```

**Step 2: Create RLS Policies**

```sql
-- Sessions: Everyone can read available sessions
CREATE POLICY "Anyone can view available sessions"
ON sessions FOR SELECT
TO public
USING (is_available = true);

-- Bookings: Users can only read their own bookings
CREATE POLICY "Users can view their own bookings"
ON bookings FOR SELECT
TO public
USING (phone = current_setting('app.current_user_phone', true));

-- Bookings: Anyone can create bookings
CREATE POLICY "Anyone can create bookings"
ON bookings FOR INSERT
TO public
WITH CHECK (true);

-- Admin users: No public access
-- (Service role bypasses RLS automatically)

-- Feedback: Users can only add feedback for their bookings
CREATE POLICY "Users can add feedback to own bookings"
ON visitor_feedback FOR INSERT
TO public
WITH CHECK (
  booking_id IN (
    SELECT id FROM bookings
    WHERE phone = current_setting('app.current_user_phone', true)
  )
);
```

**Step 3: Pass User Context in Server Actions**

```typescript
// src/app/actions/get-my-bookings.ts
'use server';

import { supabase } from '@/lib/supabase/client';

export async function getMyBookings(phone: string) {
  // Set user context for RLS
  await supabase.rpc('set_config', {
    setting: 'app.current_user_phone',
    value: phone,
  });

  // Query now respects RLS policy
  const { data, error } = await supabase
    .from('bookings')
    .select('*');

  return data;
}
```

---

## 4. Input Validation

### Validate All User Input

**Problem:** Malicious input can cause crashes or data corruption

**Solution:** Use Zod for runtime validation

```typescript
// src/lib/validations/booking.ts
import { z } from 'zod';

export const bookingSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  visitorName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s.]+$/, 'Invalid characters in name'),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  email: z
    .string()
    .email('Invalid email')
    .optional()
    .or(z.literal('')),
  numberOfVisitors: z
    .number()
    .int()
    .min(1, 'At least 1 visitor required')
    .max(10, 'Maximum 10 visitors per booking'),
  locale: z.enum(['en', 'ta']),
  rulesAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the rules' }),
  }),
});

export type BookingInput = z.infer<typeof bookingSchema>;
```

**Usage in API Route:**
```typescript
// src/app/api/bookings/route.ts
import { bookingSchema } from '@/lib/validations/booking';

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validate input
  const result = bookingSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { 
        error: 'Validation failed',
        details: result.error.issues,
      },
      { status: 400 }
    );
  }

  // Safe to use result.data — it's validated
  const booking = result.data;
  // ...
}
```

### Sanitize SQL Parameters

**Problem:** SQL injection attacks

**Solution:** Drizzle ORM handles this automatically, but be cautious with raw SQL

```typescript
// ✅ CORRECT — Drizzle ORM (safe)
await db.select().from(bookings).where(eq(bookings.phone, userPhone));

// ❌ WRONG — Raw SQL concatenation (vulnerable to SQL injection)
await db.execute(`SELECT * FROM bookings WHERE phone = '${userPhone}'`);

// ✅ CORRECT — Raw SQL with parameterized query
await db.execute(
  sql`SELECT * FROM bookings WHERE phone = ${userPhone}`
);
```

---

## 5. Content Security Policy (CSP)

### Add Security Headers

**Problem:** XSS attacks can inject malicious scripts

**Solution:** Add CSP headers in `next.config.ts`

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval in dev
      "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
      `img-src 'self' data: https://*.supabase.co https://blob.vercel-storage.com`,
      "font-src 'self'",
      `connect-src 'self' https://*.supabase.co`,
      "frame-ancestors 'none'",
    ]
      .join('; ')
      .replace(/\s{2,}/g, ' '),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

**Verify Headers:**
1. Deploy to Vercel
2. Check at [securityheaders.com](https://securityheaders.com)
3. Should get A or A+ rating

---

## 6. Authentication & Authorization

### Admin Login Security

```typescript
// src/lib/auth/admin.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';
import { adminUsers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function loginAdmin(username: string, password: string) {
  // Find admin user
  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.username, username))
    .limit(1);

  if (!admin) {
    // Use same error message for user not found + wrong password
    // This prevents username enumeration attacks
    throw new Error('Invalid credentials');
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, admin.passwordHash);

  if (!validPassword) {
    throw new Error('Invalid credentials');
  }

  // Generate JWT
  const token = jwt.sign(
    {
      id: admin.id,
      username: admin.username,
      role: 'admin',
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '24h',
    }
  );

  return { token, admin: { id: admin.id, username: admin.username } };
}

export async function verifyAdminToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
      username: string;
      role: string;
    };

    if (decoded.role !== 'admin') {
      return null;
    }

    return decoded;
  } catch {
    return null;
  }
}
```

### Password Requirements

```typescript
// src/lib/validations/admin.ts
export const adminPasswordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain special character');
```

### Hash Passwords Before Storing

```typescript
// src/app/api/admin/create/route.ts
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const { username, password, email } = await request.json();

  // Hash password (cost factor: 12)
  const passwordHash = await bcrypt.hash(password, 12);

  // Store in database
  await db.insert(adminUsers).values({
    username,
    passwordHash, // Never store plain text password
    email,
  });

  return NextResponse.json({ success: true });
}
```

---

## 7. Error Handling

### Don't Leak Sensitive Info in Errors

```typescript
// ❌ WRONG — Leaks database structure
try {
  await db.insert(bookings).values(data);
} catch (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}
// Error exposed to user: "null value in column 'session_id' violates not-null constraint"

// ✅ CORRECT — Generic error message + log details server-side
try {
  await db.insert(bookings).values(data);
} catch (error) {
  console.error('Booking creation failed:', error); // Server logs only
  return NextResponse.json(
    { error: 'Failed to create booking. Please try again.' },
    { status: 500 }
  );
}
```

---

## 8. Logging & Monitoring

### What to Log

**✅ DO Log:**
- Failed login attempts (with IP and timestamp)
- API errors (without sensitive data)
- Rate limit violations
- Cron job executions

**❌ DON'T Log:**
- Passwords (plain or hashed)
- JWT tokens
- API keys
- Full credit card numbers (if added later)
- User emails or phone numbers in plain text

### Secure Logging Example

```typescript
// ✅ CORRECT
console.log('Admin login failed', {
  username: username, // OK — public identifier
  ip: request.ip,
  timestamp: new Date().toISOString(),
});

// ❌ WRONG
console.log('Login attempt', {
  username,
  password, // ← NEVER LOG PASSWORDS
  token: jwtToken, // ← NEVER LOG TOKENS
});
```

---

## 9. HTTPS Only

### Force HTTPS in Production

Already handled by Vercel, but verify:

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // In production, redirect HTTP to HTTPS
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    );
  }

  return NextResponse.next();
}
```

---

## 10. Dependency Security

### Keep Dependencies Updated

```powershell
# Check for vulnerabilities
npm audit

# Fix automatically if possible
npm audit fix

# Update dependencies
npm update
```

### Use Dependabot (GitHub)

1. GitHub Repo → **Settings → Security & analysis**
2. Enable **"Dependabot alerts"**
3. Enable **"Dependabot security updates"**

Dependabot will:
- Scan for vulnerable dependencies
- Automatically create PRs to update them

---

## Security Checklist

Before deploying to production:

- [ ] All secrets generated with `openssl rand -base64 32`
- [ ] `.env.local` in `.gitignore` and never committed
- [ ] Different secrets for development and production
- [ ] Cron routes protected with `CRON_SECRET`
- [ ] Admin routes protected with JWT verification
- [ ] Rate limiting enabled on booking endpoints
- [ ] Database using connection pooling (PgBouncer)
- [ ] Row-Level Security (RLS) enabled on Supabase tables
- [ ] All user input validated with Zod
- [ ] CSP headers configured in `next.config.ts`
- [ ] Admin passwords hashed with bcrypt (cost factor 12)
- [ ] Error messages don't leak sensitive info
- [ ] Logs don't contain passwords or tokens
- [ ] HTTPS enforced in production
- [ ] Dependencies scanned for vulnerabilities
- [ ] Dependabot enabled on GitHub

---

**Security Implemented!** 🔒  
Your application is now protected against common vulnerabilities.
