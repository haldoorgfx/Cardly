export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { TicketTypesManager } from '@/components/events/TicketTypesManager';
import { PageShell, PageHeader } from '@/components/dash';
import { manageableOwnerIds } from '@/lib/rbac/canManageEvent';

interface Props { params: Promise<{ id: string }> }

export default async function TicketsPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: eventPage }, { data: tickets }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).in('user_id', await manageableOwnerIds(user.id)).single(),
    admin.from('event_pages').select('starts_at, ends_at, max_capacity').eq('event_id', id).maybeSingle(),
    admin.from('ticket_types').select('*').eq('event_id', id).order('position'),
  ]);

  if (!event) redirect('/dashboard');

  return (
    <PageShell width="wide">
      <PageHeader
        title="Tickets"
        subtitle="Set up the ticket tiers people choose when they register. Each person who registers gets their own ticket with a QR badge — overselling is prevented automatically."
      />
      <div className="pb-16">
        <TicketTypesManager
          eventId={id}
          initialTickets={tickets ?? []}
          eventDates={{
            starts_at: eventPage?.starts_at ?? null,
            ends_at: eventPage?.ends_at ?? null,
            max_capacity: eventPage?.max_capacity ?? null,
          }}
        />
      </div>
    </PageShell>
  );
}
