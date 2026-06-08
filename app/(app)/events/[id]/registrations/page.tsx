export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Registrations' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RegistrationsTable } from '@/components/events/RegistrationsTable';

interface Props { params: Promise<{ id: string }> }

export default async function RegistrationsPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const [{ data: event }, regResult, { data: ticketTypes }] = await Promise.all([
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
  ]);

  if (!event) redirect('/dashboard');

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
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
        />
      </div>
    </div>
  );
}
