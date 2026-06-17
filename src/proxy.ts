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

      try {
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
      } catch (error) {
        console.error('[Proxy] Booking rate limit check failed; allowing request:', error)
      }
    }
  }
  return NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json|ico|txt|xml|webmanifest)$).*)',
  ],
}
