import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ─── Rate Limiter (lazy — only initialised when env vars are present) ─────────
let ratelimit: Ratelimit | null = null

function getRatelimit(): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'birdman:booking',
    })
  }
  return ratelimit
}

export async function proxy(request: NextRequest) {
  // ─── Rate limit: POST /api/bookings — 5 requests per IP per minute ───────────
  if (request.method === 'POST' && request.nextUrl.pathname === '/api/bookings') {
    const limiter = getRatelimit()
    if (limiter) {
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        request.headers.get('x-real-ip') ??
        '127.0.0.1'

      const { success, limit, remaining, reset } = await limiter.limit(ip)

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Too many requests. Please try again in a minute.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
              'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
            },
          }
        )
      }
    }
  }
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Skip Supabase auth when env vars are absent (e.g. during build-time prerender)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect Admin Dashboard Routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Exception: Don't protect login and reset-password pages
    if (
      request.nextUrl.pathname === '/admin/login' ||
      request.nextUrl.pathname === '/admin/reset-password'
    ) {
      // If user is already logged in and trying to access login, redirect to dashboard
      if (user && request.nextUrl.pathname === '/admin/login') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      return response
    }

    // Protect all other /admin routes
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|ico|txt|xml|webmanifest)$).*)',
  ],
}
