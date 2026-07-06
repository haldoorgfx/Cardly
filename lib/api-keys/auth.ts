import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, type ApiScope } from '@/lib/api-keys';
import { createAdminClient } from '@/lib/supabase/server';

export type ApiAuthResult =
  | { ok: true; userId: string; scopes: ApiScope[] }
  | { ok: false; response: NextResponse };

function err(status: number, error: string, extra?: Record<string, unknown>): { ok: false; response: NextResponse } {
  return { ok: false, response: NextResponse.json({ error, ...extra }, { status }) };
}

/**
 * Authenticate a public API (/api/v1/*) request.
 *  - Requires `Authorization: Bearer sk_live_...`
 *  - The key's owner must be on the Studio plan
 *  - If `requiredScope` is given, the key must hold it (or `full_access`)
 */
export async function authenticateApiKey(
  req: NextRequest,
  requiredScope?: ApiScope,
): Promise<ApiAuthResult> {
  const header = req.headers.get('authorization') ?? '';
  if (!header.startsWith('Bearer ')) {
    return err(401, 'Missing Authorization header. Use: Bearer sk_live_...');
  }

  const rawKey = header.slice(7).trim();
  const validated = await validateApiKey(rawKey);
  if (!validated) return err(401, 'Invalid or revoked API key.');

  // Studio-plan gate (API access is a Studio feature).
  const db = createAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('plan, subscription_status')
    .eq('id', validated.userId)
    .single();

  const subscriptionFailed =
    profile?.subscription_status === 'canceled' || profile?.subscription_status === 'past_due';
  const plan = (subscriptionFailed && profile?.plan !== 'free') ? 'free' : (profile?.plan ?? 'free');
  if (plan !== 'studio') {
    return err(402, 'API access requires the Studio plan.');
  }

  if (requiredScope) {
    const has = validated.scopes.includes('full_access') || validated.scopes.includes(requiredScope);
    if (!has) {
      return err(403, `This key is missing the required scope: ${requiredScope}`, { required_scope: requiredScope });
    }
  }

  return { ok: true, userId: validated.userId, scopes: validated.scopes };
}
