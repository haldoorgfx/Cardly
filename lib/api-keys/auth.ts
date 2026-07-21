import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, type ApiScope } from '@/lib/api-keys';
import { getUserPlan } from '@/lib/billing/can';
import { checkApiKeyRateLimit } from '@/lib/ratelimit';

export type ApiAuthResult =
  | { ok: true; keyId: string; userId: string; scopes: ApiScope[] }
  | { ok: false; response: NextResponse };

function err(status: number, error: string, extra?: Record<string, unknown>): { ok: false; response: NextResponse } {
  return { ok: false, response: NextResponse.json({ error, ...extra }, { status }) };
}

/** Options for a route that costs more than a plain read. */
export interface ApiAuthOptions {
  /** Charges the request against the tighter per-key render budget. */
  rateTier?: 'apiKey' | 'apiKeyRender';
}

/**
 * Authenticate a public API (/api/v1/*) request.
 *  - Requires `Authorization: Bearer sk_live_...`
 *  - The key's owner must be on the Studio plan
 *  - The key gets its own rate budget (the middleware only limits by IP)
 *  - If `requiredScope` is given, the key must hold it (or `full_access`)
 */
export async function authenticateApiKey(
  req: NextRequest,
  requiredScope?: ApiScope,
  options: ApiAuthOptions = {},
): Promise<ApiAuthResult> {
  const header = req.headers.get('authorization') ?? '';
  if (!header.startsWith('Bearer ')) {
    return err(401, 'Missing Authorization header. Use: Bearer sk_live_...');
  }

  const rawKey = header.slice(7).trim();
  const validated = await validateApiKey(rawKey);
  if (!validated) return err(401, 'Invalid or revoked API key.');

  // Per-key budget. Deliberately before the plan lookup so a key hammering the
  // API is cut off without a profiles read per request.
  const rl = await checkApiKeyRateLimit(validated.keyId, options.rateTier ?? 'apiKey');
  if (!rl.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Too many requests for this API key. Please slow down.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rl.retryAfter),
            'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + rl.retryAfter),
          },
        },
      ),
    };
  }

  // Studio-plan gate (API access is a Studio feature).
  //
  // This used to hand-roll the plan check off `plan` + `subscription_status`,
  // which drifted from the canonical helper in two ways that both granted paid
  // API access for free: it did not treat `incomplete` (the very first payment
  // was declined at signup) as a failure, and it had none of getUserPlan's
  // period-end backstop for a Stripe webhook that never landed.
  if ((await getUserPlan(validated.userId)) !== 'studio') {
    return err(402, 'API access requires the Studio plan.');
  }

  if (requiredScope) {
    const has = validated.scopes.includes('full_access') || validated.scopes.includes(requiredScope);
    if (!has) {
      return err(403, `This key is missing the required scope: ${requiredScope}`, { required_scope: requiredScope });
    }
  }

  return { ok: true, keyId: validated.keyId, userId: validated.userId, scopes: validated.scopes };
}
