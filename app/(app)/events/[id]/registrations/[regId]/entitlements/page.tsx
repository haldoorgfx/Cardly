export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Attendee entitlements' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { computeHolders } from '@/lib/entitlements/redemptionStats';
import { isNotifAllowed } from '@/lib/notifications/prefs';
import { createNotification } from '@/lib/notifications';
import { AttendeeEntitlementsClient } from '@/components/entitlements/AttendeeEntitlementsClient';
import type {
  AttendeeEntitlement, AttendeeHeader, TransferTarget,
  ActionResult, TransferResult,
} from '@/components/entitlements/attendee-model';
import type { EntitlementType } from '@/components/tickets/EntitlementIcon';
import type { RedemptionLimit } from '@/components/tickets/entitlement-model';
import { escapeLikePattern } from '@/lib/search/filter';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

interface Props { params: Promise<{ id: string; regId: string }> }

// Re-derive the caller from the session and confirm they own this event.
// Module-level so it is NOT itself exposed as a server-action endpoint.
async function verifyEventOwner(eventId: string): Promise<boolean> {
  const supa = createClient();
  const { data: { user: caller } } = await supa.auth.getUser();
  if (!caller) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data } = await admin.from('events').select('id').eq('id', eventId).eq('user_id', caller.id).maybeSingle();
  return !!data;
}

// Map an RPC jsonb return into an ActionResult. The RPCs return
// { status:'ok' | 'error', message? } — never trust the client, surface theirs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rpcResult(data: any, error: { message?: string; code?: string } | null, action = 'complete this action'): ActionResult {
  if (error) return { error: describeRpcError(error, action) };
  if (data && data.status === 'error') return { error: String(data.message ?? 'Action failed') };
  return { ok: true };
}

// Turns a Postgres/RPC error into a plain-language sentence for the client.
// Mirrors components/ui/status-state's describeError() in spirit, but that
// helper lives in a 'use client' module and can't be imported into these
// server actions — same intent here: never a blanket "went wrong" when the
// error object actually tells us why.
function describeRpcError(error: { message?: string; code?: string } | null, action: string): string {
  if (!error) return `Couldn't ${action}. Please try again.`;
  const msg = String(error.message ?? '').toLowerCase();
  if (msg.includes('permission denied') || msg.includes('rls') || error.code === '42501') {
    return "You don't have permission to do that.";
  }
  if (msg.includes('violates') && msg.includes('constraint')) {
    return `Couldn't ${action} — that conflicts with existing data.`;
  }
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return 'That took too long to respond. Please try again.';
  }
  if (error.message && error.message.trim() && error.message.length < 200) {
    return error.message;
  }
  return `Couldn't ${action}. Please try again.`;
}

export default async function AttendeeEntitlementsPage({ params }: Props) {
  const { id: _ref, regId } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const { data: event } = await db.from('events').select('id, name, slug').eq('id', id).in('user_id', await manageableOwnerIds(user.id)).single();
  if (!event) redirect('/dashboard');

  const { data: reg } = await db
    .from('registrations')
    .select('id, attendee_name, attendee_email, ticket_type_id, status, ticket_types(name)')
    .eq('id', regId).eq('event_id', id).single();
  if (!reg) redirect(`/events/${event.slug}/registrations`);

  // Load every entitlement for the event + the ledger for THIS registration.
  const [{ data: ents }, { data: redRows }] = await Promise.all([
    db.from('entitlements').select('id, name, type, redemption_limit, valid_from, valid_until')
      .eq('event_id', id).order('type').order('name'),
    db.from('entitlement_redemptions')
      .select('id, entitlement_id, action, status, redeemed_at, performed_by, device_id, superseded_by')
      .eq('event_id', id).eq('registration_id', regId)
      .order('redeemed_at', { ascending: false }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entRows: any[] = ents ?? [];
  const entIds: string[] = entRows.map((e) => e.id);

  // Ticket-type links (for held math) + hold ledger for this registration.
  let tte: { entitlement_id: string; ticket_type_id: string | null }[] = [];
  if (entIds.length > 0) {
    const { data } = await db.from('ticket_type_entitlements').select('entitlement_id, ticket_type_id').in('entitlement_id', entIds);
    tte = data ?? [];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ledger: any[] = redRows ?? [];
  const holdLedger = ledger
    .filter((r) => ['granted', 'revoked', 'transferred'].includes(r.action))
    .map((r) => ({ entitlement_id: r.entitlement_id, registration_id: regId, action: r.action }));

  // Reuse the shared _entitlement_held math (never reimplement it).
  const holderMap = computeHolders(entIds, tte, [{ id: regId, ticket_type_id: reg.ticket_type_id ?? null }], holdLedger);

  // Resolve performed_by → display names for the redemption metadata.
  const staffIds = Array.from(new Set(ledger.map((r) => r.performed_by).filter(Boolean))) as string[];
  const nameById = new Map<string, string>();
  if (staffIds.length > 0) {
    const { data: profs } = await db.from('profiles').select('id, full_name, email').in('id', staffIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((profs ?? []) as any[]).forEach((p) => nameById.set(p.id, p.full_name || p.email || 'Staff'));
  }

  const now = Date.now();
  const entitlements: AttendeeEntitlement[] = entRows.map((e) => {
    const held = holderMap.get(e.id)?.has(regId) ?? false;
    // Active (non-superseded) redemptions for this entitlement, newest first.
    const rowsForEnt = ledger.filter((r) => r.entitlement_id === e.id && !r.superseded_by);
    const redeemedRows = rowsForEnt.filter((r) => r.action === 'redeemed' && r.status === 'redeemed');
    const unredeemed = rowsForEnt.filter((r) => r.action === 'un_redeemed').length;
    const netActive = redeemedRows.length - unredeemed;
    const latest = redeemedRows[0] ?? null;
    const expired = !!e.valid_until && new Date(e.valid_until).getTime() < now;
    const state = netActive > 0 ? 'redeemed' : expired ? 'expired' : 'held';
    return {
      id: e.id,
      name: e.name,
      type: e.type as EntitlementType,
      redemption_limit: e.redemption_limit as RedemptionLimit,
      valid_from: e.valid_from ?? null,
      valid_until: e.valid_until ?? null,
      held,
      state,
      redeemedAt: netActive > 0 && latest ? latest.redeemed_at : null,
      redeemedByName: netActive > 0 && latest ? (nameById.get(latest.performed_by) ?? null) : null,
      deviceId: netActive > 0 && latest ? (latest.device_id ?? null) : null,
      latestRedemptionId: netActive > 0 && latest ? latest.id : null,
      transferable: held && netActive <= 0,
    };
  });

  const header: AttendeeHeader = {
    registrationId: regId,
    name: reg.attendee_name ?? 'Attendee',
    email: reg.attendee_email ?? null,
    ticketName: reg.ticket_types?.name ?? null,
    status: reg.status,
  };

  // ── Server actions (SESSION client so the RPCs' can_manage_event(auth.uid())
  //    check passes; the service role has no auth.uid()). ──────────────────────
  async function revoke(entitlementId: string, reason: string): Promise<ActionResult> {
    'use server';
    if (!(await verifyEventOwner(id))) return { error: 'You can no longer manage this event.' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = createClient() as any;
    const { data, error } = await s.rpc('revoke_entitlement', { p_entitlement_id: entitlementId, p_registration_id: regId, p_reason: reason || null });
    const res = rpcResult(data, error, 'revoke this entitlement');
    if ('ok' in res) revalidatePath(`/events/${id}/registrations/${regId}/entitlements`);
    return res;
  }

  async function unredeem(redemptionId: string, reason: string): Promise<ActionResult> {
    'use server';
    // Reason is required (the RPC also enforces this and returns an error if blank).
    if (!reason || !reason.trim()) return { error: 'A reason is required to un-redeem.' };
    if (!(await verifyEventOwner(id))) return { error: 'You can no longer manage this event.' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = createClient() as any;
    const { data, error } = await s.rpc('unredeem_entitlement', { p_redemption_id: redemptionId, p_reason: reason.trim() });
    const res = rpcResult(data, error, 'un-redeem this entitlement');
    if ('ok' in res) revalidatePath(`/events/${id}/registrations/${regId}/entitlements`);
    return res;
  }

  async function grant(entitlementId: string): Promise<ActionResult> {
    'use server';
    if (!(await verifyEventOwner(id))) return { error: 'You can no longer manage this event.' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = createClient() as any;
    const { data, error } = await s.rpc('grant_entitlement', { p_entitlement_id: entitlementId, p_registration_id: regId });
    const res = rpcResult(data, error, 'grant this entitlement');
    if ('ok' in res) revalidatePath(`/events/${id}/registrations/${regId}/entitlements`);
    return res;
  }

  async function extend(entitlementId: string, validUntilIso: string): Promise<ActionResult> {
    'use server';
    if (!(await verifyEventOwner(id))) return { error: 'You can no longer manage this event.' };
    const d = new Date(validUntilIso);
    if (Number.isNaN(d.getTime())) return { error: 'Pick a valid date and time.' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = createClient() as any;
    const { data, error } = await s.rpc('extend_validity', { p_entitlement_id: entitlementId, p_valid_until: d.toISOString() });
    const res = rpcResult(data, error, 'extend the validity');
    if ('ok' in res) revalidatePath(`/events/${id}/registrations/${regId}/entitlements`);
    return res;
  }

  async function searchTargets(query: string): Promise<TransferTarget[]> {
    'use server';
    if (!(await verifyEventOwner(id))) return [];
    const q = String(query ?? '').trim().replace(/[(),*:%]/g, '');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    let sel = admin.from('registrations')
      .select('id, attendee_name, attendee_email, ticket_types(name)')
      .eq('event_id', id).neq('id', regId)
      .in('status', ['confirmed', 'checked_in', 'pending']).limit(8);
    if (q) sel = sel.or(`attendee_name.ilike.%${q}%,attendee_email.ilike.%${q}%`);
    const { data } = await sel;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data ?? []) as any[]).map((r) => ({
      registrationId: r.id, name: r.attendee_name ?? 'Attendee', email: r.attendee_email ?? null, ticketName: r.ticket_types?.name ?? null,
    }));
  }

  async function lookupByEmail(email: string): Promise<{ found: true; target: TransferTarget } | { found: false }> {
    'use server';
    if (!(await verifyEventOwner(id))) return { found: false };
    const e = String(email ?? '').trim().toLowerCase();
    if (!e) return { found: false };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    const { data } = await admin.from('registrations')
      .select('id, attendee_name, attendee_email, ticket_types(name)')
      .eq('event_id', id).neq('id', regId).ilike('attendee_email', escapeLikePattern(e)).limit(1).maybeSingle();
    if (!data) return { found: false };
    return { found: true, target: { registrationId: data.id, name: data.attendee_name ?? 'Attendee', email: data.attendee_email ?? null, ticketName: data.ticket_types?.name ?? null } };
  }

  async function transfer(entitlementId: string, toRegistrationId: string): Promise<TransferResult> {
    'use server';
    if (!(await verifyEventOwner(id))) return { error: 'You can no longer manage this event.' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = createClient() as any;
    const { data, error } = await s.rpc('transfer_entitlement', {
      p_entitlement_id: entitlementId, p_from_registration: regId, p_to_registration: toRegistrationId,
    });
    if (error) return { error: describeRpcError(error, 'transfer this entitlement') };
    if (data?.status === 'already_redeemed') return { blocked: 'already_redeemed' };
    if (data?.status === 'error') return { error: String(data.message ?? 'Transfer failed') };

    // Actually notify both attendees (in-app), honouring their opt-out prefs.
    const notified = await notifyTransfer(id, event.name, regId, toRegistrationId, data?.to_attendee ?? 'an attendee');
    revalidatePath(`/events/${id}/registrations/${regId}/entitlements`);
    return { ok: true, toName: data?.to_attendee ?? 'the attendee', notified };
  }

  return (
    <AttendeeEntitlementsClient
      eventSlug={event.slug}
      eventName={event.name}
      header={header}
      entitlements={entitlements}
      actions={{ revoke, unredeem, grant, extend, transfer, searchTargets, lookupByEmail }}
    />
  );
}

/**
 * Notify the two attendees of a completed transfer via in-app notifications.
 * Maps each attendee email → Eventera profile and gates through isNotifAllowed
 * (opt-out model). Returns the number ACTUALLY notified — the UI never claims a
 * notification it did not send. Email/SMS have no live provider on this
 * deployment, so we do not fake those channels.
 */
async function notifyTransfer(
  eventId: string, eventName: string, fromRegId: string, toRegId: string, toName: string,
): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: regs } = await admin.from('registrations')
    .select('id, attendee_name, attendee_email').in('id', [fromRegId, toRegId]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (regs ?? []) as any[];
  const emails = Array.from(new Set(rows.map((r) => String(r.attendee_email ?? '').toLowerCase()).filter(Boolean)));
  const profileByEmail = new Map<string, string>();
  if (emails.length > 0) {
    const { data: profs } = await admin.from('profiles').select('id, email').in('email', emails);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((profs ?? []) as any[]).forEach((p) => { if (p.email) profileByEmail.set(String(p.email).toLowerCase(), p.id); });
  }

  let notified = 0;
  for (const r of rows) {
    const pid = profileByEmail.get(String(r.attendee_email ?? '').toLowerCase());
    if (!pid) continue;
    if (!(await isNotifAllowed(pid, 'tickets', 'inapp'))) continue;
    const isTarget = r.id === toRegId;
    await createNotification({
      userId: pid,
      eventId,
      type: 'event_update',
      title: isTarget ? 'An entitlement was transferred to you' : 'An entitlement was transferred',
      body: isTarget
        ? `You received an entitlement for ${eventName}.`
        : `An entitlement was transferred to ${toName} for ${eventName}.`,
    });
    notified += 1;
  }
  return notified;
}
