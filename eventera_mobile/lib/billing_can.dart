import 'package:supabase_flutter/supabase_flutter.dart';

import 'net.dart';

/// Free-tier plan limits (CLAUDE.md: "Free: $0 — 1 event, 50 registrations").
/// Pro/Studio are unlimited on both counts. Mirrors `lib/billing/can.ts` on
/// web — mobile talks to Supabase directly (never the cookie-authed Next.js
/// API routes), so these limits need their own enforcement here rather than
/// being inherited for free.
const kFreeEventLimit = 1;
const kFreeRegistrationLimit = 50;

/// Webhook-loss grace period, in days. Mirrors `GRACE_DAYS` in web's
/// `lib/billing/can.ts`.
const _kGraceDays = 7;

/// The signed-in user's plan ('free' if unresolvable, matching web's
/// `getUserPlan` fallback). A failed/cancelled subscription always reads as
/// 'free' regardless of the stored plan value, same rule as web.
///
/// This must stay byte-for-byte equivalent in OUTCOME to web's `getUserPlan`.
/// Mobile's organizer writes go straight to Supabase rather than through the
/// Next.js API routes, so there is no server-side backstop behind this — any
/// rule web applies that this one skips is a plan bypass, not a cosmetic
/// difference.
Future<String> myPlan() async {
  final uid = currentUserId;
  if (uid == null) return 'free';
  try {
    final row = await supa
        .from('profiles')
        .select(
            'plan, subscription_status, stripe_subscription_id, current_period_end')
        .eq('id', uid)
        .maybeSingle();
    if (row == null) return 'free';
    final plan = asString(row['plan'], 'free');
    if (plan.isEmpty || plan == 'free') return 'free';

    final status = asString(row['subscription_status']);
    // `incomplete` = the FIRST payment never succeeded (card declined at
    // signup). Web counts it as failed; omitting it here handed mobile users
    // a free Pro/Studio that web refuses.
    final failed = status == 'canceled' ||
        status == 'past_due' ||
        status == 'incomplete';
    if (failed) return 'free';

    // Webhook-loss backstop, same as web: everything above trusts
    // `subscription_status`, which only changes when a Stripe webhook lands.
    // A Stripe-backed subscription whose billing period ended over
    // [_kGraceDays] ago has demonstrably not renewed. Comped/manual plans
    // (no subscription id, or no period end) are untouched.
    final subId = asString(row['stripe_subscription_id']);
    final periodEnd = asDate(row['current_period_end']);
    if (subId.isNotEmpty && periodEnd != null) {
      final endedAgo = DateTime.now().toUtc().difference(periodEnd.toUtc());
      if (endedAgo > const Duration(days: _kGraceDays)) return 'free';
    }

    return plan;
  } catch (_) {
    return 'free';
  }
}

/// True unless the signed-in organizer is on Free and already has
/// [kFreeEventLimit] non-archived events.
Future<bool> canCreateEvent() async {
  final plan = await myPlan();
  if (plan != 'free') return true;
  final uid = currentUserId;
  if (uid == null) return true; // don't block on our own lookup gap
  final res = await supa
      .from('events')
      .select('id')
      .eq('user_id', uid)
      .neq('status', 'archived')
      .count(CountOption.exact);
  return res.count < kFreeEventLimit;
}

/// True unless the event is owned by a Free-tier organizer and already has
/// [kFreeRegistrationLimit] confirmed/checked-in registrations. The organizer
/// app only ever operates on the caller's own events, so this checks the
/// caller's own plan rather than resolving a separate event-owner id.
Future<bool> canRegisterForEvent(String eventId) async {
  final plan = await myPlan();
  if (plan != 'free') return true;
  final res = await supa
      .from('registrations')
      .select('id')
      .eq('event_id', eventId)
      .inFilter('status', ['confirmed', 'checked_in'])
      .count(CountOption.exact);
  return res.count < kFreeRegistrationLimit;
}
