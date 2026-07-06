/* eslint-disable @typescript-eslint/no-explicit-any */
import { getTicketStripe } from '@/lib/payments/stripe';
import { createAdminClient } from '@/lib/supabase/server';

// ── Stripe Connect for organizer event payments ──────────────────────────────
// Organizers onboard an Express account so paid-ticket funds settle to them.
// Reuses the platform Stripe secret key (STRIPE_SECRET_KEY) — Connect must be
// enabled on that Stripe account.

export interface ConnectStatus {
  connected: boolean;      // an account exists
  chargesEnabled: boolean; // onboarding complete, can accept charges
  accountId: string | null;
  onboardedAt: string | null;
}

export async function getConnectStatus(userId: string): Promise<ConnectStatus> {
  const db = createAdminClient();
  const { data } = await (db as any)
    .from('profiles')
    .select('stripe_connect_account_id, stripe_connect_charges_enabled, stripe_connect_onboarded_at')
    .eq('id', userId)
    .maybeSingle();
  return {
    connected: !!data?.stripe_connect_account_id,
    chargesEnabled: !!data?.stripe_connect_charges_enabled,
    accountId: data?.stripe_connect_account_id ?? null,
    onboardedAt: data?.stripe_connect_onboarded_at ?? null,
  };
}

/** Get the organizer's Connect account id, creating an Express account if none. */
export async function ensureConnectAccount(userId: string, email: string | null): Promise<string> {
  const db = createAdminClient();
  const { data: profile } = await (db as any)
    .from('profiles')
    .select('stripe_connect_account_id')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.stripe_connect_account_id) return profile.stripe_connect_account_id;

  const stripe = getTicketStripe();
  const account = await stripe.accounts.create({
    type: 'express',
    email: email ?? undefined,
    metadata: { eventera_user_id: userId },
    capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
  });

  await (db as any)
    .from('profiles')
    .update({ stripe_connect_account_id: account.id })
    .eq('id', userId);

  return account.id;
}

/** Create a hosted onboarding link the organizer is redirected to. */
export async function createOnboardingLink(accountId: string, appUrl: string): Promise<string> {
  const stripe = getTicketStripe();
  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/api/integrations/stripe/callback`,
    return_url: `${appUrl}/api/integrations/stripe/callback`,
    type: 'account_onboarding',
  });
  return link.url;
}

/** Re-read the account from Stripe and persist whether charges are enabled. */
export async function refreshConnectStatus(userId: string): Promise<ConnectStatus> {
  const db = createAdminClient();
  const { data: profile } = await (db as any)
    .from('profiles')
    .select('stripe_connect_account_id, stripe_connect_onboarded_at')
    .eq('id', userId)
    .maybeSingle();

  const accountId = profile?.stripe_connect_account_id;
  if (!accountId) {
    return { connected: false, chargesEnabled: false, accountId: null, onboardedAt: null };
  }

  const stripe = getTicketStripe();
  const account = await stripe.accounts.retrieve(accountId);
  const chargesEnabled = !!account.charges_enabled;
  const onboardedAt = chargesEnabled
    ? (profile?.stripe_connect_onboarded_at ?? new Date().toISOString())
    : null;

  await (db as any)
    .from('profiles')
    .update({
      stripe_connect_charges_enabled: chargesEnabled,
      stripe_connect_onboarded_at: onboardedAt,
    })
    .eq('id', userId);

  return { connected: true, chargesEnabled, accountId, onboardedAt };
}

export async function disconnectConnect(userId: string): Promise<void> {
  const db = createAdminClient();
  await (db as any)
    .from('profiles')
    .update({
      stripe_connect_account_id: null,
      stripe_connect_charges_enabled: false,
      stripe_connect_onboarded_at: null,
    })
    .eq('id', userId);
}
