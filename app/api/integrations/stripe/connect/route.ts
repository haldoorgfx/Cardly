import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ensureConnectAccount, createOnboardingLink } from '@/lib/integrations/stripe-connect';

// POST /api/integrations/stripe/connect — start (or resume) Stripe onboarding.
// Returns { url } to redirect the organizer to Stripe's hosted onboarding.
export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe is not configured on the platform yet.' }, { status: 503 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL('/', 'https://localhost').origin;

  try {
    const accountId = await ensureConnectAccount(user.id, user.email ?? null);
    const url = await createOnboardingLink(accountId, appUrl);
    return NextResponse.json({ url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not start Stripe onboarding';
    console.error('[stripe connect]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
