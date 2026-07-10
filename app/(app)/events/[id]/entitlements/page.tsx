export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { EntitlementsClient } from '@/components/tickets/EntitlementsClient';
import type { Entitlement, EntitlementInput, TicketTypeLite } from '@/components/tickets/entitlement-model';
import type { EntitlementType } from '@/components/tickets/EntitlementIcon';

export async function generateMetadata() {
  return { title: 'Entitlements' };
}

const TYPES: EntitlementType[] = ['entry', 'meal', 'session', 'merch', 'transport', 'access', 'parking', 'certificate'];
const LIMITS = ['once', 'once_per_day', 'unlimited'] as const;

/** Server-side sanitize + validate of an entitlement payload. Never trust the client. */
function cleanInput(input: EntitlementInput): { value: Omit<EntitlementInput, 'ticketTypeIds'>; ticketTypeIds: string[] } | { error: string } {
  const name = String(input?.name ?? '').trim();
  if (!name) return { error: 'Name is required' };
  if (name.length > 120) return { error: 'Name must be under 120 characters' };
  if (!TYPES.includes(input?.type)) return { error: 'Invalid entitlement type' };
  if (!LIMITS.includes(input?.redemption_limit)) return { error: 'Invalid redemption limit' };

  let quantity: number | null = null;
  if (input.quantity !== null && input.quantity !== undefined) {
    const q = Number(input.quantity);
    if (!Number.isInteger(q) || q < 1) return { error: 'Quantity must be a whole number of 1 or more' };
    quantity = q;
  }

  const parseTs = (v: string | null): string | null => {
    if (!v) return null;
    const d = new Date(v);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
  };
  const valid_from = parseTs(input.valid_from);
  const valid_until = parseTs(input.valid_until);
  if (valid_from && valid_until && new Date(valid_from) >= new Date(valid_until)) {
    return { error: 'The valid-from time must be before valid-until' };
  }

  const ticketTypeIds = Array.isArray(input.ticketTypeIds) ? input.ticketTypeIds.filter((x) => typeof x === 'string') : [];
  return { value: { name, type: input.type, quantity, valid_from, valid_until, redemption_limit: input.redemption_limit }, ticketTypeIds };
}

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

// Keep only ticket-type ids that really belong to this event.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function filterEventTicketTypeIds(admin: any, eventId: string, ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const { data } = await admin.from('ticket_types').select('id').eq('event_id', eventId).in('id', ids);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[]).map((r) => r.id as string);
}

export default async function EntitlementsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const [{ data: event }, { data: ents }, { data: ticketTypes }, { data: redemptions }] = await Promise.all([
    db.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    db.from('entitlements').select('*').eq('event_id', id).order('created_at', { ascending: true }),
    db.from('ticket_types').select('id, name').eq('event_id', id).order('position'),
    db.from('entitlement_redemptions').select('entitlement_id').eq('event_id', id).eq('action', 'redeemed').eq('status', 'redeemed'),
  ]);

  if (!event) redirect('/dashboard');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entRows: any[] = ents ?? [];
  const entIds: string[] = entRows.map((e) => e.id);

  // Ticket-type links for this event's entitlements.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tteRows: any[] = [];
  if (entIds.length > 0) {
    const { data: tte } = await db.from('ticket_type_entitlements').select('ticket_type_id, entitlement_id').in('entitlement_id', entIds);
    tteRows = tte ?? [];
  }

  const ticketsByEnt = new Map<string, string[]>();
  for (const row of tteRows) {
    const arr = ticketsByEnt.get(row.entitlement_id) ?? [];
    arr.push(row.ticket_type_id);
    ticketsByEnt.set(row.entitlement_id, arr);
  }
  const countByEnt = new Map<string, number>();
  for (const r of (redemptions ?? [])) {
    countByEnt.set(r.entitlement_id, (countByEnt.get(r.entitlement_id) ?? 0) + 1);
  }

  const entitlements: Entitlement[] = entRows.map((e) => ({
    id: e.id,
    name: e.name,
    type: e.type,
    quantity: e.quantity ?? null,
    valid_from: e.valid_from ?? null,
    valid_until: e.valid_until ?? null,
    redemption_limit: e.redemption_limit,
    ticketTypeIds: ticketsByEnt.get(e.id) ?? [],
    redemptionCount: countByEnt.get(e.id) ?? 0,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tt: TicketTypeLite[] = ((ticketTypes ?? []) as any[]).map((t) => ({ id: t.id, name: t.name }));

  // ── Server actions ──────────────────────────────────────────────────────
  // Each re-derives the caller from the session and verifies event ownership
  // before any write (copies the deletePost security shape). Admin client for
  // the write; never trusts the client.

  async function createEntitlement(input: EntitlementInput): Promise<{ ok?: boolean; error?: string }> {
    'use server';
    if (!(await verifyEventOwner(id))) return { error: 'Not authorized' };
    const cleaned = cleanInput(input);
    if ('error' in cleaned) return { error: cleaned.error };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    const { data: created, error } = await admin
      .from('entitlements')
      .insert({ ...cleaned.value, event_id: id })
      .select('id')
      .single();
    if (error) return { error: error.message };

    const ttIds = await filterEventTicketTypeIds(admin, id, cleaned.ticketTypeIds);
    if (ttIds.length > 0) {
      const { error: linkErr } = await admin
        .from('ticket_type_entitlements')
        .insert(ttIds.map((ticket_type_id: string) => ({ ticket_type_id, entitlement_id: created.id })));
      if (linkErr) return { error: linkErr.message };
    }
    revalidatePath(`/events/${id}/entitlements`);
    return { ok: true };
  }

  async function updateEntitlement(entId: string, input: EntitlementInput): Promise<{ ok?: boolean; error?: string }> {
    'use server';
    if (!(await verifyEventOwner(id))) return { error: 'Not authorized' };
    const cleaned = cleanInput(input);
    if ('error' in cleaned) return { error: cleaned.error };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    // Confirm the entitlement belongs to this event before touching it.
    const { data: owned } = await admin.from('entitlements').select('id').eq('id', entId).eq('event_id', id).maybeSingle();
    if (!owned) return { error: 'Entitlement not found' };

    const { error } = await admin.from('entitlements').update(cleaned.value).eq('id', entId).eq('event_id', id);
    if (error) return { error: error.message };

    // Re-sync ticket-type links: drop all, re-insert the valid selected set.
    const ttIds = await filterEventTicketTypeIds(admin, id, cleaned.ticketTypeIds);
    const { error: delErr } = await admin.from('ticket_type_entitlements').delete().eq('entitlement_id', entId);
    if (delErr) return { error: delErr.message };
    if (ttIds.length > 0) {
      const { error: linkErr } = await admin
        .from('ticket_type_entitlements')
        .insert(ttIds.map((ticket_type_id: string) => ({ ticket_type_id, entitlement_id: entId })));
      if (linkErr) return { error: linkErr.message };
    }
    revalidatePath(`/events/${id}/entitlements`);
    return { ok: true };
  }

  async function deleteEntitlement(entId: string): Promise<{ ok?: boolean; error?: string }> {
    'use server';
    if (!(await verifyEventOwner(id))) return { error: 'Not authorized' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;
    const { error } = await admin.from('entitlements').delete().eq('id', entId).eq('event_id', id);
    if (error) return { error: error.message };
    revalidatePath(`/events/${id}/entitlements`);
    return { ok: true };
  }

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[760px] mx-auto px-6 py-8 pb-24">
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            Entitlements
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            Define what attendees can redeem — entry, meals, sessions, merch, transport and more. Each entitlement scans on its own, with its own validity window and redemption limit. Attach them to ticket types so the right people hold the right things.
          </p>
        </div>
        <EntitlementsClient
          initialEntitlements={entitlements}
          ticketTypes={tt}
          createEntitlement={createEntitlement}
          updateEntitlement={updateEntitlement}
          deleteEntitlement={deleteEntitlement}
        />
      </div>
    </div>
  );
}
                          