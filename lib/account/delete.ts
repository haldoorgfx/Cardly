import { createAdminClient } from '@/lib/supabase/server';

// Single implementation of "delete my own account". Destructive + irreversible.
//
// This lives in one place on purpose. There used to be THREE independent
// deletion paths — the API route, a `deleteAccount` server action wired into
// Settings, and a client-side profile-row delete used as a fallback by both
// callers — each with different behaviour. The server action skipped every
// check, so the path most users actually reached was the least safe one.
//
// Safety model:
//   1. The caller supplies the authenticated uid. This function never reads an
//      id from user input, so it can only ever delete the caller's own account.
//   2. profiles.id references auth.users ON DELETE CASCADE (migration 001), and
//      events → registrations cascade from profiles. Deleting is therefore very
//      far-reaching, which is what makes the two guards below necessary.
//   3. Both guards run BEFORE anything is destroyed, and callers must surface a
//      refusal rather than falling back to deleting anyway.

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; error: string; status: number };

export async function deleteOwnAccount(userId: string): Promise<DeleteAccountResult> {
  const admin = createAdminClient();

  // ── Guard 1: don't destroy OTHER people's paid tickets ────────────────────
  // Deleting an organizer account cascades away every attendee's registration,
  // including people who paid for an event that hasn't happened yet. They'd
  // simply find their ticket gone, with no notice and no refund. Deleting your
  // own account is your right; deleting a stranger's paid ticket is not. Past
  // events are fine to remove — only upcoming ones still owe attendance.
  const { data: ownedEvents } = await admin
    .from('events')
    .select('id, event_pages(starts_at)')
    .eq('user_id', userId)
    .eq('status', 'published');

  const now = Date.now();
  const upcomingIds = ((ownedEvents ?? []) as {
    id: string; event_pages: { starts_at: string | null }[] | null;
  }[])
    .filter(e => {
      const startsAt = e.event_pages?.[0]?.starts_at;
      return startsAt ? new Date(startsAt).getTime() > now : false;
    })
    .map(e => e.id);

  if (upcomingIds.length > 0) {
    const { count } = await admin
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .in('event_id', upcomingIds)
      .in('status', ['confirmed', 'checked_in'])
      .gt('amount_paid', 0);

    if ((count ?? 0) > 0) {
      return {
        ok: false,
        status: 409,
        error:
          `You have ${count} paid ticket${count === 1 ? '' : 's'} sold for upcoming events. ` +
          'Cancel and refund those events first — deleting your account now would remove ' +
          'those attendees’ tickets without notice.',
      };
    }
  }

  // ── Guard 2: stop the subscription before the account disappears ──────────
  // stripe_subscription_id lives on profiles, which is about to be deleted.
  // Without cancelling first, Stripe keeps charging the card every month for an
  // account that no longer exists — and the customer portal (our only cancel
  // path) needs a login the user can no longer perform. If the cancel call
  // fails we abort, because proceeding is the outcome that costs them money.
  const { data: profile } = await admin
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', userId)
    .maybeSingle();

  const subId = (profile as { stripe_subscription_id?: string | null } | null)?.stripe_subscription_id;
  if (subId) {
    try {
      const { getStripe } = await import('@/lib/billing/stripe');
      await getStripe().subscriptions.cancel(subId);
    } catch (err) {
      // An already-cancelled subscription 404s as "No such subscription" —
      // that's the end state we wanted, so let it through.
      const e = err as { code?: string; statusCode?: number } | null;
      const alreadyGone = e?.code === 'resource_missing' || e?.statusCode === 404;
      if (!alreadyGone) {
        console.error('[account/delete] subscription cancel failed', err);
        return {
          ok: false,
          status: 502,
          error:
            'We could not cancel your active subscription, so your account was not deleted ' +
            '(you would have kept being billed). Please cancel your plan in Billing settings, then try again.',
        };
      }
    }
  }

  // Delete the profile row (cascades to their events/cards), then the
  // privileged auth user. Scoped to userId — never anyone else.
  const { error: profileError } = await admin.from('profiles').delete().eq('id', userId);
  if (profileError) return { ok: false, status: 500, error: profileError.message };

  const { error: authError } = await admin.auth.admin.deleteUser(userId);
  if (authError) return { ok: false, status: 500, error: authError.message };

  return { ok: true };
}
