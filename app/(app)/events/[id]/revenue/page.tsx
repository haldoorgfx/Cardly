export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Revenue' };
}

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RevenueView } from '@/components/events/RevenueView';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { PageShell, PageHeader } from '@/components/dash';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

interface Props { params: Promise<{ id: string }> }

export default async function RevenuePage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: event } = await admin
    .from('events')
    .select('id, name, slug')
    .eq('id', id)
    .in('user_id', await manageableOwnerIds(user.id))
    .single();

  if (!event) redirect('/dashboard');

  // All paid/confirmed registrations. The fee columns (platform_fee/
  // organizer_net, migration 040) and promoter columns (referral_code/
  // utm_source, migration 032) may not be applied in every environment — and a
  // single missing column makes PostgREST fail the WHOLE select, which is what
  // silently blanked this page to $0 while Reports showed real revenue. So try
  // the full select, then fall back to guaranteed base columns on any error
  // (RevenueView already defaults the optional fields).
  // Canonical "registered" set — confirmed + checked_in — so the Attendees
  // stat and revenue here match Overview/Analytics/Reports/Check-in. Including
  // pending_approval made this page's counts read higher than every other one.
  const runRegQuery = (cols: string) => admin
    .from('registrations')
    .select(cols)
    .eq('event_id', id)
    .in('status', ['confirmed', 'checked_in'])
    .order('created_at', { ascending: false });

  let regsRes = await runRegQuery(
    'id, amount_paid, platform_fee, organizer_net, currency, status, payment_status, created_at, referral_code, utm_source, ticket_types(name, price)',
  );
  if (regsRes.error) {
    regsRes = await runRegQuery(
      'id, amount_paid, currency, status, payment_status, created_at, ticket_types(name, price)',
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const regs = (regsRes.data ?? []) as any;

  return (
    <PageShell width="wide">
      <PageHeader
        title="Revenue"
        subtitle="Earnings breakdown by ticket type, promoter link, and UTM source."
      />
      <RevenueView eventId={id} eventSlug={event.slug} registrations={regs ?? []} />
    </PageShell>
  );
}
