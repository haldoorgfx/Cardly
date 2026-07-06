export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Revenue' };
}

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RevenueView } from '@/components/events/RevenueView';
import { resolveEventRef } from '@/lib/events/resolveEventRef';

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
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[26px] sm:text-[30px] leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            Revenue
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            Earnings breakdown by ticket type, promoter link, and UTM source.
          </p>
        </div>
        <RevenueView eventId={id} eventSlug={event.slug} registrations={regs ?? []} />
      </div>
    </div>
  );
}
