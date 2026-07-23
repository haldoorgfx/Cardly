export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Entitlement audit log' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { AuditLogClient } from '@/components/entitlements/AuditLogClient';
import type { AuditRow, StaffOption } from '@/components/entitlements/audit-model';
import type { EntitlementType } from '@/components/tickets/EntitlementIcon';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';
import { isPlatformFeatureEnabled } from '@/lib/features/platform';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ registration?: string; entitlement?: string }>;
}

interface EntOption { id: string; name: string; type: EntitlementType }

export default async function AuditLogPage({ params, searchParams }: Props) {
  const { id: _ref } = await params;
  const { registration, entitlement } = await searchParams;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: event } = await admin.from('events').select('id, name, slug').eq('id', id).in('user_id', await manageableOwnerIds(user.id)).single();
  if (!event) redirect('/dashboard');
  if (!(await isPlatformFeatureEnabled('entitlements'))) redirect(`/events/${event.slug}`);

  // Entitlement options for the filter dropdown.
  const { data: entRows } = await admin.from('entitlements').select('id, name, type').eq('event_id', id).order('type').order('name');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entitlements: EntOption[] = ((entRows ?? []) as any[]).map((e) => ({ id: e.id, name: e.name, type: e.type as EntitlementType }));

  // ── Load the ledger via the SESSION client (RPC authorises on auth.uid()). ──
  // list_entitlement_audit returns a jsonb ARRAY of rows, OR an OBJECT
  // { error: '...' } when the caller can't manage the event — handle both.
  let rows: AuditRow[] | null = null;
  let loadError: 'auth' | 'generic' | null = null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = createClient() as any;
    const { data, error } = await session.rpc('list_entitlement_audit', { p_event_id: id, p_limit: 1000 });
    if (error) {
      loadError = 'generic';
    } else if (data && !Array.isArray(data) && typeof data === 'object' && 'error' in data) {
      loadError = 'auth';
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = (Array.isArray(data) ? data : []) as any[];

      // Resolve performed_by → display names.
      const staffIds = Array.from(new Set(raw.map((r) => r.performed_by).filter(Boolean))) as string[];
      const nameById = new Map<string, string>();
      if (staffIds.length > 0) {
        const { data: profs } = await admin.from('profiles').select('id, full_name, email').in('id', staffIds);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((profs ?? []) as any[]).forEach((p) => nameById.set(p.id, p.full_name || p.email || 'Staff'));
      }

      rows = raw.map((r) => ({
        id: r.id,
        redeemed_at: r.redeemed_at,
        scanned_at: r.scanned_at ?? null,
        synced_at: r.synced_at ?? null,
        action: r.action,
        status: r.status,
        source: r.source ?? null,
        device_id: r.device_id ?? null,
        reason: r.reason ?? null,
        performed_by: r.performed_by ?? null,
        performedByName: r.performed_by ? (nameById.get(r.performed_by) ?? null) : null,
        registration_id: r.registration_id ?? null,
        attendee_name: r.attendee_name ?? null,
        attendee_email: r.attendee_email ?? null,
        entitlement_id: r.entitlement_id ?? null,
        entitlement_name: r.entitlement_name ?? null,
        entitlement_type: (r.entitlement_type ?? null) as EntitlementType | null,
      }));
    }
  } catch {
    loadError = 'generic';
  }

  // Distinct staff (from the loaded rows) for the "performed by" filter.
  const staffMap = new Map<string, string>();
  (rows ?? []).forEach((r) => { if (r.performed_by) staffMap.set(r.performed_by, r.performedByName ?? 'Staff'); });
  const staffOptions: StaffOption[] = Array.from(staffMap.entries()).map(([sid, name]) => ({ id: sid, name }));

  return (
    <AuditLogClient
      eventSlug={event.slug}
      rows={rows}
      loadError={loadError}
      entitlements={entitlements}
      staffOptions={staffOptions}
      initialRegistrationId={registration ?? ''}
      initialEntitlementId={entitlement ?? ''}
    />
  );
}
