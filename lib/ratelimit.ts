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
  // One request here sends mail to EVERY confirmed attendee, so the cost of a
  // single call is unbounded in a way no other tier's is. Nobody legitimately
  // sends three broadcasts in a minute.
  fanout:   makeLimit(3,   '60 s'),
  // Signature-verified machine traffic. Generous on purpose — see the webhook
  // entries in the route map for why throttling these is the wrong trade.
  webhook:  makeLimit(120, '60 s'),
  // Door traffic — the check-in endpoint on event day.
  //
  // Every limiter here keys on IP, and every phone, tablet and laptop at a
  // venue leaves through ONE public IP. At 'standard' (60/min) a single door
  // was sharing 60 requests a minute across: the dashboard's 5-second live-feed
  // poll (12/min per open tab), the kiosk, and every keystroke of every staff
  // member's attendee search — before a single ticket is scanned. Three staff
  // on the venue wifi exhausted it, and the 429 lands as "Too many requests"
  // on the scanner with a queue waiting. This tier is sized so a busy door
  // cannot rate-limit itself, while still capping a runaway client.
  door:     makeLimit(600, '60 s'),
  // Public API (/api/v1/*), keyed on the API KEY rather than the IP — see
  // checkApiKeyRateLimit below for why IP is the wrong unit for this surface.
  apiKey:       makeLimit(120, '60 s'),
  // Card rendering is the one genuinely expensive call on the public API, so
  // it gets a much smaller per-key budget of its own.
  apiKeyRender: makeLimit(20,  '60 s'),
} as const;

export type LimiterTier = keyof typeof limiters;

// ── Route → tier map ─────────────────────────────────────────────────────────
// Longest-prefix match. Everything not listed falls through to 'standard'.

/** `methods` narrows a rule to specific HTTP verbs; omitted means all verbs. */
const ROUTE_TIERS: Array<{ prefix: string; tier: LimiterTier; methods?: string[] }> = [
  // Deleting an account and recording an unsubscribe are both one-shot writes
  // that no UI polls — there is no reason for either to allow 60 a minute.
  { prefix: '/api/account/delete',            tier: 'strict'   },
  { prefix: '/api/unsubscribe',               tier: 'strict'   },
  { prefix: '/api/newsletter',                tier: 'strict'   },
  // Provider webhooks. These MUST come before the '/api/payments' prefix
  // below — matching is first-hit in array order, not longest-prefix, so the
  // broader rule would otherwise swallow them.
  //
  // They were sitting at strict (10/min), which is machine-to-machine traffic
  // from Stripe/Flutterwave/WaafiPay arriving on a handful of shared source
  // IPs: twenty ticket sales in a minute is twenty deliveries, so a busy sale
  // would start collecting 429s. The providers retry with backoff, so nothing
  // is lost outright — but confirmations stall, attendees wait for tickets,
  // and repeated failures are exactly what makes Stripe disable an endpoint.
  // Every one of these verifies an HMAC signature before doing any work, so
  // an IP limit buys almost nothing here and costs real reliability.
  { prefix: '/api/payments/webhook',             tier: 'webhook' },
  { prefix: '/api/payments/flutterwave-webhook', tier: 'webhook' },
  { prefix: '/api/payments/waafipay-webhook',    tier: 'webhook' },
  // Inbound, signature-verified Stripe deliveries — the same argument as the
  // three above. NOTE: this is deliberately the '/stripe' path and not the
  // bare '/api/webhooks' prefix. The bare prefix also covers the organizer's
  // OWN webhook CRUD (POST /api/webhooks, PATCH /api/webhooks/[id]), which is
  // ordinary browser traffic that was being handed 120 req/min — and whose
  // POST body performs a DNS lookup of a caller-supplied hostname, so that
  // budget doubled as a cheap internal-network scanning primitive. The CRUD
  // routes now fall through to 'standard'.
  { prefix: '/api/webhooks/stripe',              tier: 'webhook' },
  // Strictest — auth, payments
  { prefix: '/api/auth',                      tier: 'strict'   },
  { prefix: '/api/billing',                   tier: 'strict'   },
  { prefix: '/api/payments',                  tier: 'strict'   },
  // Storage-writing uploads (sharp/storage cost).
  { prefix: '/api/sponsors/upload',           tier: 'render'   },
  { prefix: '/api/upload',                    tier: 'render'   },
  // These also write straight to Storage but were falling through to
  // 'standard' (60/min) — at 10 MB a request that is ~600 MB/min per IP of
  // billable object storage with no cap.
  // (/api/admin/media is deliberately left on 'standard' — the same path also
  // serves the GET listing that backs the admin media library's pagination.)
  { prefix: '/api/brand/logo',                tier: 'render'   },
  { prefix: '/api/admin/upload-logo',         tier: 'render'   },
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
const ROUTE_TIER_PATTERNS: Array<{ pattern: RegExp; tier: LimiterTier; methods?: string[] }> = [
  { pattern: /^\/api\/events\/[^/]+\/register(\/|$)/, tier: 'public' },
  { pattern: /^\/api\/events\/[^/]+\/copilot(\/|$)/,  tier: 'render' },
  // Expensive LLM matchmaking generation.
  { pattern: /^\/api\/events\/[^/]+\/matches(\/|$)/,  tier: 'render' },
  // Day-of-event door traffic — scans, attendee lookups and the live feed all
  // arrive from one venue IP. See the 'door' tier comment for why 'standard'
  // was a self-inflicted outage at the busiest moment of an event.
  { pattern: /^\/api\/events\/[^/]+\/checkin(\/|$)/,  tier: 'door'   },
  { pattern: /^\/api\/events\/[^/]+\/walk-in(\/|$)/,  tier: 'door'   },
  // Brute-forceable / oracle-style public endpoints — keep them strict.
  { pattern: /^\/api\/events\/[^/]+\/unlock(\/|$)/,     tier: 'strict' },
  { pattern: /^\/api\/events\/[^/]+\/check-email(\/|$)/, tier: 'strict' },
  { pattern: /^\/api\/events\/[^/]+\/apply(\/|$)/,      tier: 'strict' },
  // Valid/invalid oracle over a short, human-chosen code — same brute-force
  // shape as check-email/unlock above.
  { pattern: /^\/api\/events\/[^/]+\/promo\/validate(\/|$)/, tier: 'strict' },
  // Storage-writing upload routes.
  { pattern: /^\/api\/sessions\/[^/]+\/slides(\/|$)/,  tier: 'render' },
  { pattern: /^\/api\/events\/[^/]+\/background(\/|$)/, tier: 'render' },
  { pattern: /^\/api\/events\/[^/]+\/event-page\/cover(\/|$)/, tier: 'render' },

  // ── Mail-sending writes ────────────────────────────────────────────────
  // These are scoped to POST on purpose. Every path below also serves a GET
  // that the UI POLLS on a short interval (the Q&A wall, the message thread,
  // the connection deck), so tightening the whole path would break the
  // product while trying to protect it. Only the write costs money.
  //
  // A broadcast fans out to every confirmed attendee; at the old 60/min a
  // single IP could trigger 60 sends a minute, which on a 500-person event is
  // 30,000 emails a minute of Resend spend and sender reputation.
  { pattern: /^\/api\/events\/[^/]+\/communicate(\/|$)/, tier: 'fanout', methods: ['POST'] },
  // Each of these fires a real notification email AT SOMEONE ELSE, so an
  // unthrottled write is a spam relay pointed at your own attendees.
  { pattern: /^\/api\/events\/[^/]+\/connections(\/|$)/, tier: 'strict', methods: ['POST'] },
  { pattern: /^\/api\/events\/[^/]+\/messages(\/|$)/,    tier: 'strict', methods: ['POST'] },
  { pattern: /^\/api\/events\/[^/]+\/q-and-a(\/|$)/,     tier: 'strict', methods: ['POST'] },
  { pattern: /^\/api\/events\/[^/]+\/registrations\/bulk(\/|$)/, tier: 'strict', methods: ['POST'] },
  { pattern: /^\/api\/threads(\/|$)/,                    tier: 'strict', methods: ['POST'] },
];

/**
 * Resolve the tier for a request.
 *
 * `method` is optional so existing callers keep working, but omitting it means
 * method-scoped rules are skipped — a rule that only applies to POST must not
 * silently apply to everything when the caller does not say what it is doing.
 */
export function getTierForPath(pathname: string, method?: string): LimiterTier {
  for (const { pattern, tier, methods } of ROUTE_TIER_PATTERNS) {
    if (methods && (!method || !methods.includes(method.toUpperCase()))) continue;
    if (pattern.test(pathname)) return tier;
  }
  for (const { prefix, tier, methods } of ROUTE_TIERS) {
    if (methods && (!method || !methods.includes(method.toUpperCase()))) continue;
    if (pathname.startsWith(prefix)) return tier;
  }
  return 'standard';
}

// ── Check helper ─────────────────────────────────────────────────────────────
// Returns { allowed: true } or { allowed: false, retryAfter: number (seconds) }

export async function checkRateLimit(
  pathname: string,
  ip: string,
  method?: string,
): Promise<{ allowed: true } | { allowed: false; retryAfter: number }> {
  const tier = getTierForPath(pathname, method);
  const limiter = limiters[tier]; // always defined — Upstash or in-memory fallback

  const identifier = `${tier}:${ip}`;
  const result = await limiter.limit(identifier);

  if (result.success) return { allowed: true };

  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
  return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
}

// ── Per-API-key limiting (public API) ─────────────────────────────────────────
//
// The middleware limiter above keys every tier on the client IP, which is the
// wrong unit for /api/v1. A public API is machine traffic, and the IP it
// arrives from says nothing useful about who is calling:
//
//   • One key spread across a fleet — a customer's workers, a serverless
//     integration, anything behind rotating egress IPs — never accumulates
//     enough hits on any single IP to be limited at all. The account-level
//     budget the docs promise did not exist.
//   • Conversely, several customers behind one corporate NAT or one cloud
//     region's egress range SHARE a budget and throttle each other.
//
// So the public API is limited on the key id, which is the thing that maps to
// an account and to a bill. This runs after authentication (an unauthenticated
// request never gets here — it is already rejected, and is still covered by
// the middleware's IP limiter), so it cannot be used to enumerate keys.
export async function checkApiKeyRateLimit(
  keyId: string,
  tier: 'apiKey' | 'apiKeyRender' = 'apiKey',
): Promise<{ allowed: true } | { allowed: false; retryAfter: number }> {
  const result = await limiters[tier].limit(`${tier}:${keyId}`);
  if (result.success) return { allowed: true };
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
  return { allowed: false, retryAfter: Math.max(retryAfter, 1) };
}
