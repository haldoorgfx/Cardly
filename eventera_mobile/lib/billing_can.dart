import 'package:supabase_flutter/supabase_flutter.dart';

import 'net.dart';

/// Free-tier plan limits (CLAUDE.md: "Free: $0 — 1 event, 50 registrations").
/// Pro/Studio are unlimited on both counts. Mirrors `lib/billing/can.ts` on
/// web — mobile talks to Supabase directly (never the cookie-authed Next.js
/// API routes), so these limits need their own enforcement here rather than
/// being inherited for free.
const kFreeEventLimit = 1;
const kFreeRegistrationLimit = 50;

/// The signed-in user's plan ('free' if unresolvable, matching web's
/// `getUserPlan` fallback). A failed/cancelled subscription always reads as
/// 'free' regardless of the stored plan value, same rule as web.
Future<String> myPlan() async {
  final uid = currentUserId;
  if (uid == null) return 'free';
  try {
    final row = await supa
        .from('profiles')
        .select('plan, subscription_status')
        .eq('id', uid)
        .maybeSingle();
    if (row == null) return 'free';
    final status = asString(row['subscription_status']);
    final failed = status == 'canceled' || status == 'past_due';
    final plan = asString(row['plan'], 'free');
    if (failed && plan != 'free') return 'free';
    return plan.isEmpty ? 'free' : plan;
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
