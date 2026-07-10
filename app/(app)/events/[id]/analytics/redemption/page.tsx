export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Live redemption' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { RedemptionDashboard } from '@/components/analytics/RedemptionDashboard';
import { computeRedemptionStats, type RedemptionStatRow } from '@/lib/entitlements/redemptionStats';

interface Props { params: Promise<{ id: string }> }

export default async function RedemptionDashboardPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // types/database.ts is frozen and lacks the entitlement tables → untyped client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  // Ownership check — mirrors the sibling analytics page.
  const { data: event } = await db
    .from('events')
    .select('id, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  if (!event) redirect('/dashboard');

  let rows: RedemptionStatRow[] | null = null;
  let loadError = false;

  try {
    const { data: entitlements, error: entErr } = await db
      .from('entitlements')
      .select('id, name, type, quantity, redemption_limit')
      .eq('event_id', id)
      .order('type', { ascending: true })
      .order('name', { ascending: true });
    if (entErr) throw entErr;

    const entIds: string[] = (entitlements ?? []).map((e: { id: string }) => e.id);
    if (entIds.length === 0) {
      rows = [];
    } else {
      const [tteRes, regRes, holdRes, redRes] = await Promise.all([
        db.from('ticket_type_entitlements')
          .select('entitlement_id, ticket_type_id')
          .in('entitlement_id', entIds),
        db.from('registrations')
          .select('id, ticket_type_id')
          .eq('event_id', id)
          .in('status', ['confirmed', 'checked_in', 'pending'])
          .limit(20000),
        db.from('entitlement_redemptions')
          .select('entitlement_id, registration_id, action')
          .eq('event_id', id)
          .in('action', ['granted', 'revoked', 'transferred'])
          .limit(20000),
        db.from('entitlement_redemptions')
          .select('entitlement_id, registration_id, action, status, redeemed_at, registrations(attendee_name)')
          .eq('event_id', id)
          .in('action', ['redeemed', 'un_redeemed'])
          .order('redeemed_at', { ascending: false })
          .limit(10000),
      ]);

      const firstErr = tteRes.error || regRes.error || holdRes.error || redRes.error;
      if (firstErr) throw firstErr;

      const redemptionLedger = (redRes.data ?? []).map((r: {
        entitlement_id: string;
        registration_id: string | null;
        action: string;
        status: string;
        redeemed_at: string;
        registrations: { attendee_name: string | null } | null;
      }) => ({
        entitlement_id: r.entitlement_id,
        registration_id: r.registration_id,
        action: r.action,
        status: r.status,
        redeemed_at: r.redeemed_at,
        attendee_name: r.registrations?.attendee_name ?? null,
      }));

      rows = computeRedemptionStats(
        entitlements ?? [],
        tteRes.data ?? [],
        regRes.data ?? [],
        holdRes.data ?? [],
        redemptionLedger,
      );
    }
  } catch {
    loadError = true;
  }

  return (
    <RedemptionDashboard
      eventId={id}
      eventName={event.name}
      rows={rows}
      error={loadError}
    />
  );
}
