# Turbopack Development Issue

## Problem
The project uses Next.js 16.2.1, where Turbopack is the default bundler for development. However, Turbopack is experiencing fatal crashes during development, causing infinite page reload loops and build failures.

## Symptoms
- Repeated `FATAL: An unexpected Turbopack error occurred` messages
- Panic logs written to temp directory
- Infinite GET requests to routes causing server overload
- Browser unable to load pages properly

## Root Cause
The Turbopack bundler in Next.js 16.2.1 has stability issues that cause crashes when:
- Processing certain middleware configurations
- Hot module reloading (HMR)
- Handling route navigation

## Workaround

### Option 1: Use Environment Variable (Recommended)
**Windows PowerShell:**
```powershell
$env:TURBOPACK='0'; npm run dev
```

**Linux/Mac:**
```bash
TURBOPACK=0 npm run dev
```

### Option 2: Downgrade to Next.js 15
If the Turbopack crashes persist, consider downgrading to Next.js 15 where Turbopack is opt-in:
```bash
npm install next@15
```

## Fixed Issues
✅ Removed `router.refresh()` call after login that was contributing to reload loops
✅ Added `/admin/reset-password` to middleware exceptions to prevent redirect loops
✅ Verified webpack bundler works correctly as fallback

## Status
- **Development**: Use webpack (TURBOPACK=0) until Next.js 16 Turbopack stability improves
- **Production**: Vercel deployment uses optimized bundler automatically (no issue)

## References
- Next.js 16 Turbopack: https://nextjs.org/docs/architecture/turbopack
- Issue tracker: Monitor for Next.js 16 Turbopack fixes
