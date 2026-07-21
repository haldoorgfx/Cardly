import { createAdminClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

type RegistrationRow = Database['public']['Tables']['registrations']['Row'];

export type CheckInResult =
  | { ok: true; registration: RegistrationRow; alreadyCheckedIn: false }
  | { ok: true; registration: RegistrationRow; alreadyCheckedIn: true; checkedInAt: string }
  | { ok: false; error: 'TOKEN_NOT_FOUND' | 'WRONG_EVENT' | 'CANCELLED' };

export async function validateAndCheckIn(
  qrToken: string,
  eventId: string,
  operatorId: string
): Promise<CheckInResult> {
  const admin = createAdminClient();

  const { data: reg, error } = await admin
    .from('registrations')
    .select('*')
    .eq('qr_code_token', qrToken)
    .single();

  if (error || !reg) return { ok: false, error: 'TOKEN_NOT_FOUND' };
  if (reg.event_id !== eventId) return { ok: false, error: 'WRONG_EVENT' };
  if (reg.status === 'cancelled') return { ok: false, error: 'CANCELLED' };

  if (reg.checked_in_at) {
    return { ok: true, registration: reg, alreadyCheckedIn: true, checkedInAt: reg.checked_in_at };
  }

  const now = new Date().toISOString();

  // The transition is guarded in the WHERE clause, not by the read above: two
  // doors scanning the same ticket in the same second both passed that read,
  // and both wrote a check-in. `.neq('status','checked_in')` means the row
  // comes back to exactly one of them; the loser is told "already checked in",
  // which is the truth.
  const { data: updated } = await admin
    .from('registrations')
    .update({ status: 'checked_in', checked_in_at: now, checked_in_by: operatorId, updated_at: now })
    .eq('id', reg.id)
    .neq('status', 'checked_in')
    .select('checked_in_at')
    .maybeSingle();

  if (!updated) {
    // Someone else won the race between our read and our write.
    const { data: fresh } = await admin
      .from('registrations')
      .select('checked_in_at')
      .eq('id', reg.id)
      .maybeSingle();
    const at = fresh?.checked_in_at ?? now;
    return { ok: true, registration: { ...reg, checked_in_at: at }, alreadyCheckedIn: true, checkedInAt: at };
  }

  // Increment the active check-in session counter (best-effort, non-blocking)
  admin
    .from('check_in_sessions')
    .select('id, check_ins_count')
    .eq('event_id', eventId)
    .eq('operator_id', operatorId)
    .order('started_at', { ascending: false })
    .limit(1)
    .single()
    .then(({ data: session }) => {
      if (session) {
        admin
          .from('check_in_sessions')
          .update({ check_ins_count: session.check_ins_count + 1 })
          .eq('id', session.id);
      }
    });

  return { ok: true, registration: { ...reg, checked_in_at: now }, alreadyCheckedIn: false };
}
