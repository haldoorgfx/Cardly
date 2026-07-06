import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { refreshConnectStatus } from '@/lib/integrations/stripe-connect';

// GET /api/integrations/stripe/callback — Stripe returns the organizer here
// after onboarding (both return_url and refresh_url point here). We re-read the
// account status from Stripe, persist it, then send them back to Settings.
export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const settingsUrl = `${appUrl}/settings/integrations`;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${appUrl}/login`);

  try {
    const status = await refreshConnectStatus(user.id);
    const flag = status.chargesEnabled ? 'stripe=connected' : 'stripe=pending';
    return NextResponse.redirect(`${settingsUrl}?${flag}`);
  } catch (err) {
    console.error('[stripe callback]', err);
    return NextResponse.redirect(`${settingsUrl}?stripe=error`);
  }
}
