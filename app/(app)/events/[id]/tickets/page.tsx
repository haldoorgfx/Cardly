export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RegistrationTabs } from '@/components/events/RegistrationTabs';
import { TicketTypesManager } from '@/components/events/TicketTypesManager';

interface Props { params: { id: string } }

export default async function TicketsPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: tickets }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', params.id).eq('user_id', user.id).single(),
    admin.from('ticket_types').select('*').eq('event_id', params.id).order('position'),
  ]);

  if (!event) redirect('/dashboard');

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <RegistrationTabs eventId={params.id} eventName={event.name} />
      <div className="max-w-[760px] mx-auto px-6 py-8 pb-24">
        <div className="mb-6">
          <h1
            className="font-display font-semibold text-[24px]"
            style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}
          >
            Ticket types
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            Create free and paid ticket tiers. Quantity caps are enforced — overselling is prevented at the database level.
          </p>
        </div>
        <TicketTypesManager eventId={params.id} initialTickets={tickets ?? []} />
      </div>
    </div>
  );
}
