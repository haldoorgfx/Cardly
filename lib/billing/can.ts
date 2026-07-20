import { createAdminClient } from '@/lib/supabase/server';
import { PLANS, type Plan } from './plans';
import type { SubscriptionStatus } from '@/types/database';

type Profile = {
  plan: Plan;
  subscription_status: SubscriptionStatus;
  cards_this_month: number;
  cards_month_start: string;
};

export async function getUserPlan(userId: string): Promise<Plan> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('plan, subscription_status, stripe_subscription_id, current_period_end')
    .eq('id', userId)
    .single();

  if (!data) return 'free';

  // Only downgrade if there's an explicitly failed/cancelled/never-paid
  // subscription. Any other value (null, '', 'active', 'trialing', or unknown)
  // → honor the plan. This correctly handles manually-assigned/comped plans
  // with no Stripe subscription.
  //   • incomplete → the FIRST payment never succeeded (card declined at
  //     signup), which previously still granted full Pro/Studio for free.
  const subscriptionFailed =
    data.subscription_status === 'canceled' ||
    data.subscription_status === 'past_due' ||
    data.subscription_status === 'incomplete';

  if (subscriptionFailed && data.plan !== 'free') return 'free';

  // Webhook-loss backstop. Everything above trusts `subscription_status`, which
  // only ever changes when a Stripe webhook lands. If the endpoint is down,
  // disabled by Stripe after repeated failures, or the secret is rotated, a
  // cancelled subscription stays 'active' in our DB and the user keeps a paid
  // plan for free indefinitely. A Stripe-backed subscription whose billing
  // period ended over a week ago has demonstrably not renewed → treat as free.
  // Comped/manual plans (no stripe_subscription_id, or no period end) are
  // untouched.
  const GRACE_DAYS = 7;
  if (data.stripe_subscription_id && data.current_period_end && data.plan !== 'free') {
    const endedMsAgo = Date.now() - new Date(data.current_period_end).getTime();
    if (Number.isFinite(endedMsAgo) && endedMsAgo > GRACE_DAYS * 24 * 60 * 60 * 1000) {
      return 'free';
    }
  }

  return (data.plan as Plan) ?? 'free';
}

/**
 * Plan of the EVENT OWNER (events.user_id), not the caller. Several attendee-
 * facing mutations (messaging, connections, matchmaking, Q&A) are gated by
 * whether the organizer's plan includes that feature — the caller is an
 * attendee/guest with no plan of their own. Returns null if the event doesn't
 * exist, so callers can treat that as "not entitled" without crashing.
 */
export async function getEventOwnerPlan(eventId: string): Promise<Plan | null> {
  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('user_id')
    .eq('id', eventId)
    .single();

  if (!event?.user_id) return null;
  return getUserPlan(event.user_id);
}

export async function canCreateEvent(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const plan = await getUserPlan(userId);
  const limit = PLANS[plan].events;
  if (limit === null) return true;

  const { count } = await admin
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('status', 'archived');

  return (count ?? 0) < limit;
}

/**
 * Free-tier events are capped at PLANS.free.registrationsPerEvent confirmed/
 * checked-in registrations (CLAUDE.md: "Free: 1 event, 50 registrations").
 * Checked against the EVENT OWNER's plan, since the caller registering is
 * usually an anonymous attendee, not the organizer.
 */
export async function canRegisterForEvent(eventId: string): Promise<boolean> {
  const plan = await getEventOwnerPlan(eventId);
  if (!plan) return true; // event owner not resolvable — don't block on our own lookup failure
  const limit = PLANS[plan].registrationsPerEvent;
  if (limit === null) return true;

  const admin = createAdminClient();
  const { count } = await admin
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .in('status', ['confirmed', 'checked_in']);

  return (count ?? 0) < limit;
}

export async function canCreateVariant(userId: string, eventId: string): Promise<boolean> {
  const plan = await getUserPlan(userId);
  const limit = PLANS[plan].variants;
  if (limit === null) return true;

  const admin = createAdminClient();
  const { count } = await admin
    .from('event_variants')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId);

  return (count ?? 0) < limit;
}

export async function canGenerateCard(userId: string): Promise<{ allowed: boolean; plan: Plan }> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('plan, subscription_status, cards_this_month, cards_month_start')
    .eq('id', userId)
    .single<Profile>();

  if (!profile) return { allowed: false, plan: 'free' };

  // Resolve through getUserPlan rather than re-deriving the downgrade rules
  // here — this copy had drifted (it missed 'incomplete' and the period-end
  // backstop), so a never-paid signup still got Pro's 500-card monthly quota.
  const plan = await getUserPlan(userId);

  // Lazy monthly rollover: if cards_month_start is more than 30 days ago, reset
  const monthStart = new Date(profile.cards_month_start);
  const now = new Date();
  const daysSinceReset = (now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceReset >= 30) {
    await admin
      .from('profiles')
      .update({ cards_this_month: 0, cards_month_start: now.toISOString() })
      .eq('id', userId);
    return { allowed: true, plan };
  }

  const limit = PLANS[plan].cardsPerMonth;
  return { allowed: profile.cards_this_month < limit, plan };
}

export async function incrementCardsThisMonth(userId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc('increment_cards_this_month', { user_id: userId });
}
