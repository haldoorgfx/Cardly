import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ── Graceful no-op when Upstash isn't configured ─────────────────────────────
// The app works without Upstash — rate limiting is simply skipped.
// To enable: set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in Vercel.

const isConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = isConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

function makeLimit(tokens: number, window: `${number} ${'s' | 'm' | 'h' | 'd'}`) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    analytics: true,
    prefix: 'karta:rl',
  });
}

// ── Tiers ────────────────────────────────────────────────────────────────────
//
//  STRICT   — auth & payment endpoints: 10 req / 60s per IP
//  STANDARD — general API: 60 req / 60s per IP
//  RENDER   — image generation (expensive): 10 req / 60s per IP
//  PUBLIC   — public reads (event pages, registrations): 30 req / 60s per IP

export const limiters = {
  strict:   makeLimit(10,  '60 s'),
  standard: makeLimit(60,  '60 s'),
  render:   makeLimit(10,  '60 s'),
  public:   makeLimit(30,  '60 s'),
} as const;

export type LimiterTier = keyof typeof limiters;

// ── Route → tier map ─────────────────────────────────────────────────────────
// Longest-prefix match. Everything not listed falls through to 'standard'.

const ROUTE_TIERS: Array<{ prefix: string; tier: LimiterTier }> = [
  // Strictest — auth, payments, image generation
  { prefix: '/api/auth',                      tier: 'strict'   },
  { prefix: '/api/billing',                   tier: 'strict'   },
  { prefix: '/api/payments',                  tier: 'strict'   },
  { prefix: '/api/render',                    tier: 'render'   },
  // Public-facing (unauthenticated, higher volume expected)
  { prefix: '/api/events/register',           tier: 'public'   },
  { prefix: '/api/contact',                   tier: 'strict'   },
  { prefix: '/api/view',                      tier: 'public'   },
  { prefix: '/api/download',                  tier: 'public'   },
  // Everything else → standard (authenticated organiser actions)
];

export function getTierForPath(pathname: string): LimiterTier {
  for (const { prefix, tier } of ROUTE_TIERS) {
    if (pathname.startsWith(prefix)) return tier;
  }
  return 'standard';
}

// ── Check helper ─────────────────────────────────────────────────────────────
// Returns { allowed: true } or { allowed: false, retryAfter: number (seconds) }

export async function checkRateLimit(
  pathname: string,
  ip: string,
): Promise<{ allowed: true } | { allowed: false; retryAfter: number }> {
  const tier = getTierForPath(pathname);
  const limiter = limiters[tier];

  // No Upstash configured → always allow (dev / unconfigured prod)
  if (!limiter) return { allowed: true };

  const identifier = `${tier}:${ip}`;
  const result = await limiter.limit(identifier);

  if (result.success) return { allowed: true };

  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
  return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
}
