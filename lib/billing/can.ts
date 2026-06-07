import { createAdminClient } from '@/lib/supabase/server';
import { PLANS, type Plan } from './plans';

type Profile = {
  plan: Plan;
  subscription_status: string;
  cards_this_month: number;
  cards_month_start: string;
};

export async function getUserPlan(userId: string): Promise<Plan> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('profiles')
    .select('plan, subscription_status')
    .eq('id', userId)
    .single();

  if (!data) return 'free';

  // Only downgrade if there's an explicitly failed/cancelled subscription.
  // Any other value (null, '', 'active', 'trialing', or unknown) → honor the plan.
  // This correctly handles manually-assigned plans with no Stripe subscription.
  const subscriptionFailed =
    data.subscription_status === 'canceled' ||
    data.subscription_status === 'past_due' ||
    data.subscription_status === 'unpaid';

  if (subscriptionFailed && data.plan !== 'free') return 'free';
  return (data.plan as Plan) ?? 'free';
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

  // Only downgrade if there's an explicitly failed/cancelled subscription.
  const subscriptionFailed =
    profile.subscription_status === 'canceled' ||
    profile.subscription_status === 'past_due' ||
    profile.subscription_status === 'unpaid';

  const plan: Plan =
    subscriptionFailed && profile.plan !== 'free'
      ? 'free'
      : (profile.plan as Plan) ?? 'free';

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
