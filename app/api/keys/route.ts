import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createApiKey, listApiKeys, normalizeScopes } from '@/lib/api-keys';
import { getUserPlan } from '@/lib/billing/can';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

// GET /api/keys — list user's active API keys
export async function GET() {
  if (!(await isPlatformFeatureEnabled('developer_api'))) return NextResponse.json({ error: 'Developer API is currently unavailable.' }, { status: 404 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const keys = await listApiKeys(user.id);
  return NextResponse.json(keys);
}

// POST /api/keys — create a new API key
// Body: { name: string }
export async function POST(req: NextRequest) {
  if (!(await isPlatformFeatureEnabled('developer_api'))) return NextResponse.json({ error: 'Developer API is currently unavailable.' }, { status: 404 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Studio plan only. Uses the canonical helper rather than a local copy of the
  // plan rules — the copy that lived here missed `incomplete` (first payment
  // declined) and getUserPlan's period-end backstop, so it issued live API keys
  // to accounts that had never successfully paid for Studio.
  if ((await getUserPlan(user.id)) !== 'studio') {
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
