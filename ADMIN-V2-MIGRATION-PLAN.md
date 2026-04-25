# Admin V2 Migration Plan

**Date:** April 25, 2026  
**Objective:** Replace old admin interface with new AdminV2, integrate authentication API, and implement session management.

---

## 📋 Migration Overview

### Phase 1: Route Renaming & Folder Structure
### Phase 2: Import & Reference Updates
### Phase 3: Login API Integration
### Phase 4: Session Management Implementation
### Phase 5: Testing & Validation

---

## Phase 1: Route Renaming & Folder Structure

### 1.1 Rename Operations (Order matters!)

Execute in this exact order to avoid conflicts:

```bash
# Step 1: Rename current /admin → /adminOld
mv src/app/admin src/app/adminOld

# Step 2: Rename /adminV2 → /admin
mv src/app/adminV2 src/app/admin

# Step 3: Rename API routes (if any adminV2-specific routes exist)
# None found - skip this step

# Step 4: Rename component folders
mv src/components/organisms/admin src/components/organisms/adminOld
# Note: AdminV2 components are in src/app/admin/_components - no move needed
```

### 1.2 Affected Files & Directories

**Application Routes:**
- ✅ `src/app/admin/` → `src/app/adminOld/` (old admin interface)
- ✅ `src/app/adminV2/` → `src/app/admin/` (new admin interface becomes primary)

**Component Folders:**
- ✅ `src/components/organisms/admin/` → `src/components/organisms/adminOld/`

**Files Staying In Place:**
- ✅ `src/app/api/admin/` - API routes remain unchanged (already correct)
- ✅ `src/lib/auth.ts` - Authentication utilities (already correct)
- ✅ `src/middleware.ts` - Will be updated to use new paths

---

## Phase 2: Import & Reference Updates

### 2.1 Middleware Updates

**File:** `src/middleware.ts`

Current behavior:
- Protects `/admin` routes
- Redirects unauthenticated users to `/admin/login`
- Allows `/admin/login` without auth

**Changes needed:** NONE - middleware already targets `/admin/*` patterns, which will now point to the new interface.

✅ **No changes required** - middleware is path-agnostic and will work with renamed routes.

### 2.2 Component Import Updates

**Files to update:**

1. **src/app/admin/layout.tsx** (formerly adminV2/layout.tsx)
   ```typescript
   // BEFORE:
   import { AdminV2Sidebar } from './_components/Sidebar';
   import { AdminV2Header } from './_components/Header';
   import { AdminV2BottomNav } from './_components/BottomNav';
   export default function AdminV2Layout({ ... }) { ... }
   
   // AFTER:
   import { AdminSidebar } from './_components/Sidebar';
   import { AdminHeader } from './_components/Header';
   import { AdminBottomNav } from './_components/BottomNav';
   export default function AdminLayout({ ... }) { ... }
   ```

2. **src/app/admin/_components/Sidebar.tsx**
   - Rename export: `AdminV2Sidebar` → `AdminSidebar`
   - Update all internal href references: `/adminV2/*` → `/admin/*`
   - Update logout redirect: `/adminV2/login` → `/admin/login`

3. **src/app/admin/_components/Header.tsx**
   - Rename export: `AdminV2Header` → `AdminHeader`
   - Update navigation paths: `/adminV2/*` → `/admin/*`

4. **src/app/admin/_components/BottomNav.tsx**
   - Rename export: `AdminV2BottomNav` → `AdminBottomNav`
   - Update navigation paths: `/adminV2/*` → `/admin/*`

5. **src/app/admin/page.tsx** (dashboard)
   - Rename export: `AdminV2Page` → `AdminPage`
   - Update any internal navigation paths

6. **src/app/admin/login/page.tsx**
   - Update success redirect: `router.push('/adminV2')` → `router.push('/admin')`

7. **src/app/admin/not-found.tsx**
   - Rename export: `AdminV2NotFound` → `AdminNotFound`

### 2.3 API Route Updates

**Files to check:**

1. **src/app/api/bookings/route.ts** (line 76)
   ```typescript
   // Already uses generic '/admin' - ✅ No changes needed
   url: '/admin'
   ```

2. **src/app/api/admin/push/test/route.ts** (line 9)
   ```typescript
   // Already uses generic '/admin' - ✅ No changes needed
   url: '/admin'
   ```

3. **src/components/organisms/adminOld/RealtimeNotifier.tsx** (line 27)
   ```typescript
   // Update after folder rename:
   onClick: () => window.location.href = '/adminOld'
   ```

4. **src/components/organisms/adminOld/AdminSidebar.tsx** (line 33)
   ```typescript
   // Update after folder rename:
   { key: 'dashboard', label: 'Overview', icon: LayoutDashboard, href: '/adminOld' }
   ```

### 2.4 Component Reference Pattern

**Search and Replace Strategy:**

```bash
# Find all adminV2 references
grep -r "adminV2" src/

# Find all AdminV2 component names
grep -r "AdminV2" src/

# Find all /adminV2/ path references
grep -r "/adminV2" src/
```

**Replacement Pattern:**
- `AdminV2Sidebar` → `AdminSidebar`
- `AdminV2Header` → `AdminHeader`
- `AdminV2BottomNav` → `AdminBottomNav`
- `AdminV2Page` → `AdminPage`
- `AdminV2Layout` → `AdminLayout`
- `AdminV2NotFound` → `AdminNotFound`
- `/adminV2` → `/admin` (in href, router.push, window.location)

---

## Phase 3: Login API Integration

### 3.1 Current Authentication System

**Technology Stack:**
- ✅ **Supabase Auth** - Already integrated and configured
- ✅ **@supabase/ssr** - Server-side rendering support
- ✅ **Session Cookies** - Automatic cookie management via Supabase client

**Existing Infrastructure:**

1. **Supabase Client** (`src/lib/supabase/client.ts`)
   - Browser client for client-side auth
   - Configured with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Supabase Server Client** (`src/lib/supabase/server.ts`)
   - Server-side client with cookie support
   - Admin client with service role key (bypasses RLS)

3. **Auth Utilities** (`src/lib/auth.ts`)
   - `getAdminSession()` - Retrieves current authenticated user
   - `requireAdmin()` - Protects API routes (returns 401/403 if unauthorized)

4. **Middleware** (`src/middleware.ts`)
   - Protects all `/admin/*` routes except `/admin/login`
   - Uses Supabase SSR for session management
   - Redirects unauthenticated users to login

### 3.2 Login Implementation (Already Working!)

**Current Login Flow (from old admin/login/page.tsx):**

```typescript
const supabase = createClient(); // Browser client

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) throw authError;

  router.push('/admin');
  router.refresh(); // Important: Refreshes middleware/session
};
```

**What happens:**
1. User submits email/password
2. Supabase validates credentials against `auth.users` table
3. Supabase sets session cookies automatically (`sb-*-auth-token`)
4. Middleware reads cookies on next request → grants access
5. User redirected to `/admin` dashboard

### 3.3 New Login Page Integration

**File:** `src/app/admin/login/page.tsx` (formerly adminV2/login/page.tsx)

**Current State:** ✅ Already has Supabase client import and basic structure

**Required Changes:**

```typescript
// src/app/admin/login/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
// ... other imports (Bird, Mail, Lock, etc.)

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  
  // ... existing state declarations (email, password, currentView, etc.)
  
  // ✅ UPDATE: Real login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error(authError.message || 'Invalid login credentials');
      }

      // Success - redirect to dashboard
      router.push('/admin');
      router.refresh(); // Critical: Refreshes middleware session
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // ... rest of component
}
```

**Key Implementation Details:**
- ✅ Uses existing Supabase auth (no new API endpoints needed)
- ✅ Session management handled automatically by Supabase cookies
- ✅ `router.refresh()` ensures middleware re-validates session
- ✅ Error handling with user-friendly messages
- ✅ Loading states already implemented in UI

---

## Phase 4: Password Reset Implementation

### 4.1 Supabase Password Reset Flow

**Built-in Supabase Method:**

```typescript
// Send password reset email
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/admin/reset-password`,
});
```

**How it works:**
1. User enters email in "Forgot Password" card
2. Supabase sends magic link to email
3. User clicks link → redirected to `/admin/reset-password?token=xxx`
4. Reset page extracts token → updates password via Supabase
5. User redirected to login with success message

### 4.2 Forgot Password Implementation

**File:** `src/app/admin/login/page.tsx`

**Current State:** UI cards complete, handlers are stubs

**Required Changes:**

```typescript
// ✅ UPDATE: Forgot password handler (Magic Link Flow)
const handleForgotPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setForgotLoading(true);
  setForgotError('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(forgotEmail)) {
    setForgotError('Please enter a valid email address');
    setForgotLoading(false);
    return;
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/admin/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Success - show success message and redirect back to login
    alert('Password reset link sent! Please check your email.');
    setCurrentView('login');
    setForgotEmail('');
  } catch (err: any) {
    setForgotError(err.message || 'Failed to send reset email');
  } finally {
    setForgotLoading(false);
  }
};
```

**Note:** The OTP verification flow is not needed with magic link approach. Supabase sends a secure link directly to the user's email.

### 4.3 Password Reset Page

**File:** `src/app/admin/reset-password/page.tsx` (NEW FILE - ✅ CREATED)

**Current State:** ✅ Complete with full carousel and card UI matching login page

**Features:**
- Same carousel background as login page (10 gallery images)
- Matching card design with icon, title, and form
- Two password fields with eye toggle buttons
- Validation (min 8 chars, passwords must match)
- Success card with animated checkmark
- Automatic redirect to login after success
- Session validation on page load
- Loading states during session check
- Error handling with user-friendly messages

**Key Implementation:**
```typescript
// Session check on mount
useEffect(() => {
  const checkSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      router.push('/admin/login');
    }
  };
  checkSession();
}, [router, supabase]);

// Password update
const { error } = await supabase.auth.updateUser({
  password: newPassword,
});

// Success - show success card, then redirect
setIsSuccess(true);
setTimeout(() => {
  router.push('/admin/login?reset=success');
}, 2000);
```

**Design Match:**
- ✅ Same Work Sans font family
- ✅ Same color scheme (#2E7D32 green, #212121 text)
- ✅ Same card shadow and rounded corners
- ✅ Same input field styling with icons
- ✅ Same button styling and animations
- ✅ Success card with CheckCircle2 icon
- ✅ Mobile-responsive with carousel background

### 4.4 Magic Link Flow (✅ IMPLEMENTED)

**Simplified flow using Supabase's built-in magic link:**

1. **Forgot Password** → User enters email → Supabase sends magic link
2. User clicks link → **Reset Password Page** → Enter new password + confirm
3. **Success Card** → Auto-redirect to login after 2 seconds

**Benefits:**
- ✅ No OTP validation needed
- ✅ No custom email service required
- ✅ Supabase handles email delivery
- ✅ Secure token-based validation
- ✅ Simpler implementation
- ✅ Better UX with visual feedback

**Implementation Status:**
- ✅ `src/app/adminV2/reset-password/page.tsx` created
- ✅ Full carousel and card UI implemented
- ✅ Password validation added
- ✅ Success state with animation
- ✅ Session validation on mount
- ⏳ Forgot password handler needs update (Phase 3)

**UI Flow:**
- Login page "Forgot Password" card → User enters email
- Supabase sends email with magic link to `/admin/reset-password`
- Reset password page → User enters new password twice
- Success card shows with green checkmark animation
- Auto-redirect to login with success query param

---

## Phase 5: API Availability Check

### 5.1 Existing Admin API Endpoints

**Authentication:**
- ✅ **Login:** `supabase.auth.signInWithPassword()` (Supabase SDK)
- ✅ **Logout:** `supabase.auth.signOut()` (Supabase SDK)
- ✅ **Password Reset:** `supabase.auth.resetPasswordForEmail()` (Supabase SDK)
- ✅ **Session Check:** `supabase.auth.getUser()` (Used in middleware)

**Dashboard Data (from SPRINT-3-API-REFERENCE.md):**
- ✅ `GET /api/admin/bookings` - List all bookings (requires auth)
- ✅ `GET /api/admin/calendar` - Get session calendar (requires auth)
- ✅ `GET /api/admin/sessions` - List all sessions (requires auth)
- ✅ `GET /api/admin/feedback` - Get visitor feedback (requires auth)
- ✅ `GET /api/admin/checkin` - Check-in operations (requires auth)
- ✅ `GET /api/admin/gallery` - Gallery management (requires auth)

**Email Operations:**
- ✅ `POST /api/admin/email/resend` - Resend booking confirmation

**Profile Management:**
- ✅ `POST /api/admin/profile/verify-update` - Update admin email

### 5.2 Missing Endpoints

**None required!** 

All authentication is handled by Supabase SDK directly from the client. No custom login/logout API endpoints needed.

---

## Phase 6: Session Management

### 6.1 Current Session Architecture

**Session Storage:** Supabase cookies (`sb-*-auth-token`)

**Session Flow:**
```
Client Login → Supabase Auth → Cookie Set
    ↓
Next Request → Middleware → Read Cookie → Validate
    ↓
API Request → Auth Utility → Verify Session → Allow/Deny
```

**Key Components:**

1. **Client-Side (Browser):**
   ```typescript
   const supabase = createClient(); // from @/lib/supabase/client
   await supabase.auth.signInWithPassword({ email, password });
   ```

2. **Server-Side (Middleware):**
   ```typescript
   const supabase = createServerClient(...); // from middleware.ts
   const { data: { user } } = await supabase.auth.getUser();
   if (!user) redirect('/admin/login');
   ```

3. **API Routes (Protected):**
   ```typescript
   import { requireAdmin } from '@/lib/auth';
   
   export async function GET(request: NextRequest) {
     const authResult = await requireAdmin(request);
     if (authResult instanceof Response) return authResult; // 401/403
     
     const { session } = authResult;
     // ... proceed with authorized logic
   }
   ```

### 6.2 Session Features

**Automatic Cookie Management:**
- ✅ Set on login
- ✅ Refreshed on each request (middleware)
- ✅ Cleared on logout
- ✅ Expires after 7 days (Supabase default)

**Security:**
- ✅ HTTPOnly cookies (protected from XSS)
- ✅ Secure flag (HTTPS only in production)
- ✅ SameSite=Lax (CSRF protection)
- ✅ Token-based validation (JWT)

**Session Data Available:**
```typescript
const session = await getAdminSession();
// Returns:
{
  id: string;        // User UUID
  username: string;  // Email address
  isAdmin: boolean;  // true for all authenticated users
}
```

### 6.3 Logout Implementation

**Client-Side Logout:**

```typescript
// In Header.tsx or Sidebar.tsx
const handleLogout = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  router.push('/admin/login');
  router.refresh();
};
```

**What happens:**
1. Supabase clears session cookies
2. User redirected to login
3. Middleware blocks access to protected routes

---

## Phase 7: Testing Checklist

### 7.1 Route Testing

- [ ] Access `/admin` → Redirects to `/admin/login` (if not logged in)
- [ ] Access `/admin/login` → Shows new login interface
- [ ] Access `/adminOld` → Shows old admin interface (for reference)
- [ ] Access `/adminOld/login` → Shows old login page (still works)

### 7.2 Authentication Testing

**Login Flow:**
- [ ] Enter invalid credentials → Shows error message
- [ ] Enter valid credentials → Redirects to `/admin` dashboard
- [ ] Session persists across page refreshes
- [ ] Logout → Clears session, redirects to login

**Forgot Password Flow (Option 1 - Magic Link):**
- [ ] Click "Forgot Password" → Shows email input
- [ ] Enter email → Sends reset link via Supabase
- [ ] Click link in email → Opens `/admin/reset-password`
- [ ] Enter new password → Updates successfully
- [ ] Redirect to login → Can log in with new password

**Forgot Password Flow (Option 2 - OTP):**
- [ ] Requires custom email service (Twilio, Resend, SendGrid)
- [ ] See Phase 4.4 for implementation details

### 7.3 Component Testing

**Navigation:**
- [ ] Sidebar links use `/admin/*` paths (not `/adminV2/*`)
- [ ] Header profile menu navigates correctly
- [ ] Bottom nav (mobile) works on all routes
- [ ] Logout button functions from sidebar and header

**Protected Routes:**
- [ ] `/admin` → Requires auth
- [ ] `/admin/calendar` → Requires auth
- [ ] `/admin/profile` → Requires auth
- [ ] `/admin/settings` → Requires auth

**Public Routes:**
- [ ] `/admin/login` → Accessible without auth
- [ ] `/admin/reset-password` → Accessible with valid token

### 7.4 API Testing

**With Valid Session:**
- [ ] `GET /api/admin/bookings` → Returns data
- [ ] `GET /api/admin/calendar` → Returns data
- [ ] `GET /api/admin/sessions` → Returns data

**Without Session:**
- [ ] `GET /api/admin/bookings` → Returns 401
- [ ] All admin API routes → Return 401

---

## Phase 8: Implementation Order

### Step 1: Backup (5 minutes)
```bash
# Create backup branch
git checkout -b backup/pre-admin-migration
git add .
git commit -m "Backup before admin V2 migration"
git push origin backup/pre-admin-migration

# Return to main working branch
git checkout main
```

### Step 2: Rename Folders (5 minutes)
```bash
# PowerShell commands
mv src/app/admin src/app/adminOld
mv src/app/adminV2 src/app/admin
mv src/components/organisms/admin src/components/organisms/adminOld

# Commit
git add .
git commit -m "Phase 1: Rename admin folders (admin→adminOld, adminV2→admin)"
```

### Step 3: Update Component Names (15 minutes)

**Files to update (in order):**
1. `src/app/admin/_components/Sidebar.tsx`
2. `src/app/admin/_components/Header.tsx`
3. `src/app/admin/_components/BottomNav.tsx`
4. `src/app/admin/layout.tsx`
5. `src/app/admin/page.tsx`
6. `src/app/admin/login/page.tsx`
7. `src/app/admin/not-found.tsx`

**Commit:**
```bash
git add .
git commit -m "Phase 2: Update component names and path references"
```

### Step 4: Integrate Login API (20 minutes)

**Tasks:**
1. Update `handleLogin` in `src/app/admin/login/page.tsx`
2. Test login with real credentials
3. Verify session persistence
4. Test logout functionality

**Commit:**
```bash
git add .
git commit -m "Phase 3: Integrate Supabase login API"
```

### Step 5: Implement Password Reset (20 minutes)

**Tasks:**
1. Update `handleForgotPassword` in `src/app/admin/login/page.tsx` (magic link flow)
2. Reset password page already created at `src/app/admin/reset-password/page.tsx` ✅
3. Test forgot password flow (enter email, check inbox)
4. Click magic link and verify redirect to reset page
5. Test password reset with validation (min 8 chars, passwords match)
6. Verify success animation and redirect to login
7. Test login with new password

**Commit:**
```bash
git add .
git commit -m "Phase 4: Implement password reset flow with magic link"
```

### Step 6: Test Everything (30 minutes)

Run through all test cases from Phase 7.

**Commit:**
```bash
git add .
git commit -m "Phase 5: Complete admin V2 migration - all tests passing"
git push origin main
```

---

## Phase 9: Rollback Plan

If anything goes wrong, revert to backup:

```bash
# Option 1: Revert specific commits
git log --oneline  # Find commit hashes
git revert <commit-hash>

# Option 2: Hard reset to backup
git reset --hard backup/pre-admin-migration

# Option 3: Restore from backup branch
git checkout backup/pre-admin-migration
git checkout -b main-restored
```

---

## Phase 10: Environment Variables

**Required for Authentication:**

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Required for password reset redirects
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change in production
```

**Production:**
- Update `NEXT_PUBLIC_APP_URL` to production domain
- Ensure Supabase email templates point to production URL

---

## Summary

### ✅ What We Have
- ✅ Supabase Auth fully configured
- ✅ Middleware protecting admin routes
- ✅ Session management working
- ✅ All admin API endpoints ready
- ✅ Beautiful new admin UI (AdminV2)
- ✅ Reset password page with carousel UI created

### 🚀 What We Need To Do
- 🔄 Rename folders (admin → adminOld, adminV2 → admin)
- 🔄 Update component names (AdminV2* → Admin*)
- 🔄 Update path references (/adminV2 → /admin)
- 🔄 Connect login form to Supabase API
- 🔄 Update forgot password handler (magic link flow)

### 📝 Estimated Time
- **Phase 1-2:** 20 minutes (renaming and updates)
- **Phase 3:** 20 minutes (login integration)
- **Phase 4:** 20 minutes (password reset handler update)
- **Phase 5:** 30 minutes (testing)

**Total:** ~1.5 hours for complete migration

### 🎯 Success Criteria
- [ ] Old admin accessible at `/adminOld` (backup)
- [ ] New admin live at `/admin`
- [ ] Login works with real Supabase auth
- [ ] Session persists across pages
- [ ] Password reset sends magic link
- [ ] All protected routes require authentication
- [ ] No broken links or imports

---

## Next Steps

1. **Review this plan** with team/stakeholder
2. **Create backup branch** before starting
3. **Execute Phase 1-2** (folder renaming)
4. **Execute Phase 3** (login integration)
5. **Execute Phase 4** (password reset)
6. **Execute Phase 5** (testing)
7. **Deploy to production** (if tests pass)

---

**Questions or concerns? Review each phase carefully before execution.**
