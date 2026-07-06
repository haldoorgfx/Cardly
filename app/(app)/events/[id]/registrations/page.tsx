export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Registrations' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RegistrationsTable } from '@/components/events/RegistrationsTable';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { getUserPlan } from '@/lib/billing/can';

interface Props { params: Promise<{ id: string }> }

export default async function RegistrationsPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const [{ data: event }, regResult, { data: ticketTypes }, cardsResult, checkedInResult, pendingResult, revenueResult] = await Promise.all([
    admin
      .from('events')
      .select('id, name, slug')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    admin
      .from('registrations')
      .select('*, ticket_types(name, price)', { count: 'exact' })
      .eq('event_id', id)
      .order('created_at', { ascending: false })
      .range(0, 49),
    admin
      .from('ticket_types')
      .select('id, name, price, currency')
      .eq('event_id', id)
      .order('position'),
    admin
      .from('generated_cards')
      .select('attendee_data')
      .eq('event_id', id),
    // Aggregate counts — correct for any event size
    admin
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id)
      .eq('status', 'checked_in'),
    admin
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id)
      .eq('status', 'pending'),
    // Revenue: only pull amount+currency for paid registrations
    admin
      .from('registrations')
      .select('amount_paid, currency')
      .eq('event_id', id)
      .gt('amount_paid', 0),
  ]);

  const { data: formFields } = await admin
    .from('registration_form_fields')
    .select('id, label, field_type')
    .eq('event_id', id)
    .order('position');

  if (!event) redirect('/dashboard');

  const plan = await getUserPlan(user.id);

  // Build set of emails that have generated a card (for the CARD column)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cardEmails = new Set<string>((cardsResult.data ?? []).map((c: any) => {
    const d = c.attendee_data as Record<string, unknown> | null;
    return (d?.email ?? d?.attendee_email ?? '') as string;
  }).filter(Boolean));
  const totalCardsGenerated = cardsResult.data?.length ?? 0;

  // Server-computed aggregate stats (correct for any event size)
  const serverCheckedInCount = checkedInResult.count ?? 0;
  const serverPendingCount   = pendingResult.count ?? 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serverRevenueByCurrency = (revenueResult.data ?? []).reduce<Record<string, number>>((acc: Record<string, number>, r: any) => {
    const cur = (r.currency as string) || 'USD';
    acc[cur] = (acc[cur] ?? 0) + (r.amount_paid as number);
    return acc;
  }, {});

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[26px] sm:text-[30px] leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            Attendees
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            Attendee list with check-in status, ticket type, payment, and card download.
          </p>
        </div>

        <RegistrationsTable
          eventId={id}
          eventSlug={event.slug}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialRegistrations={(regResult.data ?? []) as any}
          totalCount={regResult.count ?? 0}
          ticketTypes={ticketTypes ?? []}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formFields={(formFields ?? []) as any}
          cardEmails={Array.from(cardEmails)}
          totalCardsGenerated={totalCardsGenerated}
          serverCheckedInCount={serverCheckedInCount}
          serverPendingCount={serverPendingCount}
          serverRevenueByCurrency={serverRevenueByCurrency}
          plan={plan}
          eventName={event.name}
        />
      </div>
    </div>
  );
}
