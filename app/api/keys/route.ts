import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiKey, listApiKeys, normalizeScopes } from '@/lib/api-keys';

// GET /api/keys — list user's active API keys
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const keys = await listApiKeys(user.id);
  return NextResponse.json(keys);
}

// POST /api/keys — create a new API key
// Body: { name: string }
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Studio plan only
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, subscription_status')
    .eq('id', user.id)
    .single();

  const subscriptionFailed =
    profile?.subscription_status === 'canceled' ||
    profile?.subscription_status === 'past_due';
  const plan = (subscriptionFailed && profile?.plan !== 'free') ? 'free' : (profile?.plan ?? 'free');

  if (plan !== 'studio') {
    return NextResponse.json({ error: 'API keys require the Studio plan.' }, { status: 402 });
  }

  const { name, scopes } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Key name is required.' }, { status: 400 });

  // Cap at 10 keys per user
  const existing = await listApiKeys(user.id);
  if (existing.length >= 10) {
    return NextResponse.json({ error: 'Maximum 10 API keys per account.' }, { status: 429 });
  }

  const { key, record } = await createApiKey(user.id, name.trim(), normalizeScopes(scopes));
  return NextResponse.json({ key, record }, { status: 201 });
}
