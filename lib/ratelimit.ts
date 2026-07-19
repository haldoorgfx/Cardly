import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ── Rate limiting with an in-memory fallback ─────────────────────────────────
// Preferred: Upstash Redis (distributed, shared across all serverless instances).
// Fallback:  an in-memory sliding window, per instance, used when Upstash isn't
// configured. This means rate limiting NEVER fully fails open — the expensive
// public endpoints (/api/render) stay throttled even without Redis.
// To enable distributed limiting: set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.

const isConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

// Production startup assert — loudly warn if Upstash is missing in prod. We don't
// hard-throw (that would brick the app); the in-memory fallback keeps us safe.
if (!isConfigured && process.env.NODE_ENV === 'production' && process.env.VERCEL) {
  console.error(
    '[ratelimit] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are NOT set in production. ' +
    'Falling back to per-instance in-memory rate limiting. Set both in Vercel for distributed limits.',
  );
}

const redis = isConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

interface LimitResult { success: boolean; reset: number }
interface LimiterLike { limit(identifier: string): Promise<LimitResult> }

// ── In-memory sliding-window limiter (fallback) ──────────────────────────────
// Per-instance only. Bounded by a periodic sweep so the Map can't grow forever.
class MemoryRatelimit implements LimiterLike {
  private hits = new Map<string, number[]>();
  private lastSweep = Date.now();

  constructor(private tokens: number, private windowMs: number) {}

  private sweep(now: number) {
    if (now - this.lastSweep < this.windowMs) return;
    this.hits.forEach((times, key) => {
      const kept = times.filter(t => now - t < this.windowMs);
      if (kept.length === 0) this.hits.delete(key);
      else this.hits.set(key, kept);
    });
    this.lastSweep = now;
  }

  async limit(identifier: string): Promise<LimitResult> {
    const now = Date.now();
    this.sweep(now);
    const times = (this.hits.get(identifier) ?? []).filter(t => now - t < this.windowMs);
    if (times.length >= this.tokens) {
      const reset = times[0] + this.windowMs; // when the oldest hit ages out
      this.hits.set(identifier, times);
      return { success: false, reset };
    }
    times.push(now);
    this.hits.set(identifier, times);
    return { success: true, reset: now + this.windowMs };
  }
}

const WINDOW_MS: Record<'s' | 'm' | 'h' | 'd', number> = {
  s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000,
};

function makeLimit(tokens: number, window: `${number} ${'s' | 'm' | 'h' | 'd'}`): LimiterLike {
  if (redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(tokens, window),
      analytics: true,
      prefix: 'eventera:rl',
    });
  }
  // Fallback — never returns null, so checkRateLimit never fails open.
  const [countStr, unit] = window.split(' ') as [string, 's' | 'm' | 'h' | 'd'];
  return new MemoryRatelimit(tokens, Number(countStr) * WINDOW_MS[unit]);
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
  // Strictest — auth, payments
  { prefix: '/api/auth',                      tier: 'strict'   },
  { prefix: '/api/billing',                   tier: 'strict'   },
  { prefix: '/api/payments',                  tier: 'strict'   },
  // Storage-writing uploads (sharp/storage cost).
  { prefix: '/api/sponsors/upload',           tier: 'render'   },
  { prefix: '/api/upload',                    tier: 'render'   },
  // Expensive generation — image rendering and LLM calls.
  // NOTE: /api/v1/render must be listed too — it does NOT match the
  // '/api/render' prefix, so it was silently falling through to 'standard'
  // (60/min) for the single most expensive endpoint on the public API.
  { prefix: '/api/v1/render',                 tier: 'render'   },
  { prefix: '/api/render',                    tier: 'render'   },
  { prefix: '/api/era',                       tier: 'render'   },
  { prefix: '/api/apply-solid-bg',            tier: 'render'   },
  { prefix: '/api/apply-template-bg',         tier: 'render'   },
  // Public-facing (unauthenticated, higher volume expected)
  { prefix: '/api/contact',                   tier: 'strict'   },
  { prefix: '/api/view',                      tier: 'public'   },
  { prefix: '/api/download',                  tier: 'public'   },
  { prefix: '/api/registrations/status',      tier: 'public'   },
  // Everything else → standard (authenticated organiser actions)
];

// Dynamic-segment routes a static prefix can't express:
// /api/events/<id>/register and /api/events/<id>/copilot.
const ROUTE_TIER_PATTERNS: Array<{ pattern: RegExp; tier: LimiterTier }> = [
  { pattern: /^\/api\/events\/[^/]+\/register(\/|$)/, tier: 'public' },
  { pattern: /^\/api\/events\/[^/]+\/copilot(\/|$)/,  tier: 'render' },
  // Expensive LLM matchmaking generation.
  { pattern: /^\/api\/events\/[^/]+\/matches(\/|$)/,  tier: 'render' },
  // Brute-forceable / oracle-style public endpoints — keep them strict.
  { pattern: /^\/api\/events\/[^/]+\/unlock(\/|$)/,     tier: 'strict' },
  { pattern: /^\/api\/events\/[^/]+\/check-email(\/|$)/, tier: 'strict' },
  { pattern: /^\/api\/events\/[^/]+\/apply(\/|$)/,      tier: 'strict' },
  // Valid/invalid oracle over a short, human-chosen code — same brute-force
  // shape as check-email/unlock above.
  { pattern: /^\/api\/events\/[^/]+\/promo\/validate(\/|$)/, tier: 'strict' },
  // Storage-writing upload routes.
  { pattern: /^\/api\/sessions\/[^/]+\/slides(\/|$)/,  tier: 'render' },
];

export function getTierForPath(pathname: string): LimiterTier {
  for (const { pattern, tier } of ROUTE_TIER_PATTERNS) {
    if (pattern.test(pathname)) return tier;
  }
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
  const limiter = limiters[tier]; // always defined — Upstash or in-memory fallback

  const identifier = `${tier}:${ip}`;
  const result = await limiter.limit(identifier);

  if (result.success) return { allowed: true };

  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
  return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
}
