export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Registrations' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RegistrationTabs } from '@/components/events/RegistrationTabs';
import { RegistrationsTable } from '@/components/events/RegistrationsTable';

interface Props { params: { id: string } }

export default async function RegistrationsPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const [{ data: event }, regResult] = await Promise.all([
    admin
      .from('events')
      .select('id, name, slug')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single(),
    admin
      .from('registrations')
      .select('*, ticket_types(name, price)', { count: 'exact' })
      .eq('event_id', params.id)
      .order('created_at', { ascending: false })
      .range(0, 49),
  ]);

  if (!event) redirect('/dashboard');

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <RegistrationTabs eventId={params.id} eventName={event.name} />

      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>
            Attendees
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            Attendee list with check-in status, ticket type, payment, and card download.
          </p>
        </div>

        <RegistrationsTable
          eventId={params.id}
          eventSlug={event.slug}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialRegistrations={(regResult.data ?? []) as any}
          totalCount={regResult.count ?? 0}
        />
      </div>
    </div>
  );
}
