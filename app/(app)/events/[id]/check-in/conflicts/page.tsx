export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Sync conflicts' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { ConflictsClient } from '@/components/check-in/ConflictsClient';
import type { Conflict, ResolveInput, ResolveResult } from '@/components/check-in/conflict-types';
import type { EntitlementType } from '@/components/tickets/EntitlementIcon';

interface Props { params: Promise<{ id: string }> }

const ACTIONS = ['keep_first', 'keep_both', 'manual'];

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

export default async function ConflictsPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: event } = await admin
    .from('events')
    .select('id, name, slug')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (!event) redirect('/dashboard');

  // ── Server action: server-authoritative conflict resolution ──────────────
  // Re-derives the caller, verifies events.user_id = caller.id, then calls the
  // RPC through the SESSION client so the RPC's own can_manage_event(auth.uid())
  // check passes. Never trusts the client.
  async function resolveConflictAction(
    input: ResolveInput,
  ): Promise<{ ok: true; result: ResolveResult } | { error: string }> {
    'use server';
    if (!input || !ACTIONS.includes(input.action)) return { error: 'Invalid action' };
    if (input.action === 'manual' && !input.keepRedemptionId) return { error: 'Select a scan to keep first.' };
    if (!(await verifyEventOwner(id))) return { error: 'You can no longer manage this event.' };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionDb = createClient() as any;
    const { data, error } = await sessionDb.rpc('resolve_conflict', {
      p_registration_id: input.registrationId,
      p_entitlement_id: input.entitlementId,
      p_day_index: input.dayIndex,
      p_action: input.action,
      p_keep_redemption_id: input.keepRedemptionId ?? null,
    });
    if (error) {
      if (error.code === 'P0001' && /NOT_AUTHORISED/.test(error.message ?? '')) {
        return { error: 'You can no longer manage this event.' };
      }
      return { error: 'Couldn’t resolve this conflict. Try again.' };
    }
    revalidatePath(`/events/${id}/check-in/conflicts`);
    return { ok: true, result: data as ResolveResult };
  }

  // ── Load conflicts via the SESSION client (RPC authorises on auth.uid()).
  // list_sync_conflicts raises NOT_AUTHORISED (P0001) for non-managers — catch
  // it and render a clean error instead of a 500.
  let conflicts: Conflict[] | null = null;
  let loadError: 'auth' | 'generic' | null = null;
  let lastSync: string | null = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionDb = createClient() as any;
    const { data: raw, error } = await sessionDb.rpc('list_sync_conflicts', { p_event_id: id });

    if (error) {
      loadError = error.code === 'P0001' && /NOT_AUTHORISED/.test(error.message ?? '') ? 'auth' : 'generic';
    } else {
      // The RPC returns entitlement_name but not type — join the icon type in.
      const { data: entRows } = await admin.from('entitlements').select('id, type').eq('event_id', id);
      const typeById: Record<string, EntitlementType> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((entRows ?? []) as any[]).forEach((e) => { typeById[e.id] = e.type as EntitlementType; });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conflicts = ((raw ?? []) as any[]).map((c) => ({
        registration_id: c.registration_id,
        attendee_name: c.attendee_name ?? null,
        entitlement_id: c.entitlement_id,
        entitlement_name: c.entitlement_name ?? 'Entitlement',
        entitlement_type: typeById[c.entitlement_id] ?? 'entry',
        day_index: c.day_index ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rows: ((c.rows ?? []) as any[]).map((r) => ({
          redemption_id: r.redemption_id,
          device_id: r.device_id ?? null,
          scanned_at: r.scanned_at ?? null,
          synced_at: r.synced_at ?? null,
          redeemed_by: r.redeemed_by ?? null,
        })),
      }));

      // "Last sync time" = newest server clock across this event's offline scans.
      const { data: ls } = await admin
        .from('entitlement_redemptions')
        .select('synced_at')
        .eq('event_id', id)
        .eq('source', 'offline')
        .not('synced_at', 'is', null)
        .order('synced_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      lastSync = ls?.synced_at ?? null;
    }
  } catch {
    loadError = 'generic';
  }

  return (
    <ConflictsClient
      eventSlug={event.slug}
      conflicts={conflicts}
      lastSync={lastSync}
      loadError={loadError}
      resolveConflictAction={resolveConflictAction}
    />
  );
}
