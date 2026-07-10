export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { TicketTypesManager } from '@/components/events/TicketTypesManager';

interface Props { params: Promise<{ id: string }> }

export default async function TicketsPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const [{ data: event }, { data: eventPage }, { data: tickets }, { data: entRows }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    admin.from('event_pages').select('starts_at, ends_at, max_capacity').eq('event_id', id).maybeSingle(),
    admin.from('ticket_types').select('*').eq('event_id', id).order('position'),
    admin.from('entitlements').select('id, name, type').eq('event_id', id).order('created_at', { ascending: true }),
  ]);

  if (!event) redirect('/dashboard');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const entitlements = ((entRows ?? []) as any[]).map((e) => ({ id: e.id, name: e.name, type: e.type }));
  const entIds = entitlements.map((e) => e.id);

  // ticketId → entitlementIds map (only this event's entitlements).
  const ticketEntitlements: Record<string, string[]> = {};
  if (entIds.length > 0) {
    const { data: tte } = await admin
      .from('ticket_type_entitlements').select('ticket_type_id, entitlement_id').in('entitlement_id', entIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const row of ((tte ?? []) as any[])) {
      (ticketEntitlements[row.ticket_type_id] ??= []).push(row.entitlement_id);
    }
  }

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[760px] mx-auto px-6 py-8 pb-24">
        <div className="mb-6">
          <h1
            className="font-display font-semibold text-[24px]"
            style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}
          >
            Tickets
          </h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
            Set up the ticket tiers people choose when they register. Each person who registers gets their own ticket with a QR badge — overselling is prevented automatically.
          </p>
        </div>
        <TicketTypesManager
          eventId={id}
          eventSlug={event.slug}
          initialTickets={tickets ?? []}
          entitlements={entitlements}
          initialTicketEntitlements={ticketEntitlements}
          eventDates={{
            starts_at: eventPage?.starts_at ?? null,
            ends_at: eventPage?.ends_at ?? null,
            max_capacity: eventPage?.max_capacity ?? null,
          }}
        />
      </div>
    </div>
  );
}
