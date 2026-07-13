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
    .eq('user_id', user.id)
    .single();

  if (!event) redirect('/dashboard');

  // All paid/confirmed registrations
  const { data: regs } = await admin
    .from('registrations')
    .select('id, amount_paid, platform_fee, organizer_net, currency, status, payment_status, created_at, referral_code, utm_source, ticket_types(name, price)')
    .eq('event_id', id)
    .in('status', ['confirmed', 'checked_in', 'pending_approval'])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .order('created_at', { ascending: false }) as any;

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
