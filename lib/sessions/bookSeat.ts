import { createAdminClient } from '@/lib/supabase/server';

/**
 * The single place a row is added to `attendee_agendas`.
 *
 * WHY THIS EXISTS
 *   Capacity used to be enforced in exactly one of the two routes that write
 *   this table:
 *
 *     • POST /api/events/[id]/sessions/[sessionId]/book   → checked capacity
 *     • POST /api/sessions/[sessionId]/agenda { add }     → did not, at all
 *
 *   The second one is what the public session-detail page's "Save to my agenda"
 *   button calls. So the cap on a 30-seat workshop held only for attendees who
 *   arrived via the Workshops list; anyone who opened the session's own page —
 *   which renders "30 / 30 seats" right above the button — could take a 31st
 *   seat with one click. Routing both through here means the seat check cannot
 *   be skipped by choosing a different entry point.
 *
 * ATOMICITY
 *   `book_session_seat` (migration 107) locks the session row and does the
 *   count and the insert in one transaction, so two people cannot both take the
 *   last seat. If that RPC is not present yet the fallback below still refuses
 *   an over-cap booking — it just does the count and the insert as two
 *   statements, so a simultaneous pair can still slip through by one. Verified
 *   2026-07-21: the RPC is NOT yet applied in prod, so the fallback is the live
 *   path. Applying 107 closes the remaining race.
 */
export type SeatOutcome = 'booked' | 'already_booked' | 'full' | 'not_found';

export async function bookSessionSeat(
  eventId: string,
  sessionId: string,
  registrationId: string
): Promise<{ outcome: SeatOutcome } | { error: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const { data: rpcOutcome, error: rpcError } = await admin.rpc('book_session_seat', {
    p_event_id: eventId,
    p_session_id: sessionId,
    p_registration_id: registrationId,
  });

  if (!rpcError) return { outcome: rpcOutcome as SeatOutcome };

  // ── Fallback: migration 107 not applied ────────────────────────────────────
  const { data: session } = await admin
    .from('sessions')
    .select('capacity')
    .eq('id', sessionId)
    .eq('event_id', eventId)
    .maybeSingle();

  if (!session) return { outcome: 'not_found' };

  // Already booked → idempotent success, and never consumes a second seat.
  const { data: existing } = await admin
    .from('attendee_agendas')
    .select('id')
    .eq('session_id', sessionId)
    .eq('registration_id', registrationId)
    .maybeSingle();
  if (existing) return { outcome: 'already_booked' };

  if (session.capacity != null) {
    // Count real rows. `sessions.registrations_count` is only truthful once
    // migration 099's trigger exists; before that it reads 0 forever and the
    // cap silently never engages.
    const { count } = await admin
      .from('attendee_agendas')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId);
    if ((count ?? 0) >= session.capacity) return { outcome: 'full' };
  }

  const { error } = await admin.from('attendee_agendas').upsert(
    { registration_id: registrationId, session_id: sessionId },
    { onConflict: 'registration_id,session_id' }
  );
  if (error) return { error: error.message };

  return { outcome: 'booked' };
}
