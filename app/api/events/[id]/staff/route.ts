import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { upsertEventRole, resolveAccountIdByEmail } from '@/lib/rbac/assign';

type Params = { params: Promise<{ id: string }> };

/** The staff roles the Staff page offers. Anything else is rejected — the
 *  event_staff CHECK constraint would reject it too, but we fail fast with a
 *  400 instead of a 500 and keep PATCH's update_role honest. */
const STAFF_ROLES = ['check_in', 'moderator', 'finance', 'manager'] as const;

/**
 * Roles that get a mirrored `user_event_roles` row with role 'staff'.
 *
 * WHY THIS IS NOT "all staff roles": the DB helper `can_manage_event()`
 * (migration 080) and the check-in / walk-in / approve-registration RPCs treat
 * ANY active 'staff' row as full event-management authority — check-in, cash
 * walk-in sales, entitlement redemption/refund, approving registrations. The
 * Staff UI promises a Moderator "no registrations, money or settings" and
 * Finance "no check-in", so mirroring those two would silently hand them
 * powers the organizer was told they don't get (callable straight from the
 * browser via supabase.rpc). Only the two roles our own gate
 * (lib/rbac/ownership.ts → hasCheckInAccess) already accepts are mirrored.
 * Moderator access is enforced separately off `event_staff` itself
 * (hasModeratorAccess), so it needs no mirrored row.
 */
const MANAGE_ROLES: readonly string[] = ['check_in', 'manager'];

/**
 * Recompute the mirrored `user_event_roles` 'staff' row for one email at one
 * event from the CURRENT event_staff rows: active iff at least one non-removed
 * MANAGE_ROLES assignment remains, revoked otherwise. Called after every
 * removal and every role change so access can never outlive the assignment
 * that granted it. Scoped by event_id — never touches other events' roles.
 * Best-effort; failures must not break the organizer's request.
 */
async function syncStaffRole(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  eventId: string,
  email: string,
): Promise<void> {
  try {
    const normalized = email.trim().toLowerCase();
    const accountId = await resolveAccountIdByEmail(normalized);
    if (!accountId) return;

    // ilike, not eq: rows written before emails were normalised on insert may
    // still carry mixed case.
    const { data: remaining } = await db
      .from('event_staff')
      .select('id')
      .eq('event_id', eventId)
      .ilike('email', normalized)
      .in('role', MANAGE_ROLES)
      .neq('status', 'removed')
      .limit(1);

    if (remaining && remaining.length > 0) {
      await upsertEventRole({ userId: accountId, eventId, role: 'staff' });
    } else {
      await db
        .from('user_event_roles')
        .update({ status: 'revoked' })
        .eq('user_id', accountId)
        .eq('event_id', eventId)
        .eq('role', 'staff');
    }
  } catch {
    // best-effort — the event_staff write already succeeded
  }
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any).from('event_staff').select('*').eq('event_id', id).neq('status', 'removed').order('invited_at');
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { email, role, expires } = body as { email: string; role: string; expires: string };
  if (!email || !role) return NextResponse.json({ error: 'email and role required' }, { status: 400 });
  if (!STAFF_ROLES.includes(role as typeof STAFF_ROLES[number])) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Store the email normalised. The access gates (hasCheckInAccess /
  // hasModeratorAccess) compare against the LOWERCASED profile email, so an
  // invite typed as "Alice@Corp.com" used to be stored verbatim and never
  // matched — the staffer silently got no access at all.
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return NextResponse.json({ error: 'email and role required' }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  // Block duplicate active assignment (same email + role already active)
  const { data: existing } = await db
    .from('event_staff')
    .select('id')
    .eq('event_id', id)
    .eq('email', normalizedEmail)
    .eq('role', role)
    .neq('status', 'removed')
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: `${email} already has an active ${role} role for this event` }, { status: 409 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any).from('event_staff').insert({
    event_id: id, owner_id: user.id, email: normalizedEmail, role, expires: expires ?? '24h_after', status: 'pending',
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Write-path parity (migration 055): if the invited email belongs to an
  // account, record the staff role so the unified dashboard resolver sees it.
  // Only for MANAGE_ROLES — see the constant's comment for why.
  // Best-effort — never blocks the invite.
  if (MANAGE_ROLES.includes(role)) {
    const staffAccountId = await resolveAccountIdByEmail(normalizedEmail);
    if (staffAccountId) {
      await upsertEventRole({ userId: staffAccountId, eventId: id, role: 'staff' });
    }
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: event } = await admin.from('events').select('id').eq('id', id).eq('user_id', user.id).single();
  if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const { staffId, action, role } = body as { staffId: string; action: 'remove' | 'resend' | 'update_role'; role?: string };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  if (action === 'remove') {
    const { data: removedRow } = await db
      .from('event_staff')
      .select('email')
      .eq('id', staffId)
      .eq('event_id', id)
      .maybeSingle();
    await db.from('event_staff').update({ status: 'removed' }).eq('id', staffId).eq('event_id', id);

    // Write-path parity: recompute the mirrored role from what's left.
    if (removedRow?.email) await syncStaffRole(db, id, removedRow.email as string);
    return NextResponse.json({ ok: true });
  }
  if (action === 'update_role' && role) {
    if (!STAFF_ROLES.includes(role as typeof STAFF_ROLES[number])) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    const { data } = await db.from('event_staff').update({ role }).eq('id', staffId).eq('event_id', id).select().single();
    // A role change moves the staffer INTO or OUT OF manage tier (e.g.
    // manager → moderator must drop can_manage_event), so re-sync the mirror.
    // Without this, demoting a manager left their 'staff' role active and they
    // kept check-in / walk-in / entitlement powers via the RPCs.
    if (data?.email) await syncStaffRole(db, id, data.email as string);
    return NextResponse.json(data);
  }
  if (action === 'resend') {
    await db.from('event_staff').update({ invited_at: new Date().toISOString() }).eq('id', staffId).eq('event_id', id);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
