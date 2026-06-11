export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Tickets' };

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TicketsPageClient } from '@/components/events/TicketsPageClient';

interface Props { params: Promise<{ id: string }> }

export default async function TicketsPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: tickets }, { data: regs }, { data: promoCodes }] = await Promise.all([
    admin.from('events').select('id, name, slug, checkout_collect_details, checkout_require_approval, checkout_show_remaining, checkout_apply_vat').eq('id', id).eq('user_id', user.id).single(),
    admin.from('ticket_types').select('*').eq('event_id', id).order('position'),
    admin.from('registrations').select('status, amount_paid, ticket_type_id').eq('event_id', id),
    admin.from('promo_codes').select('*').eq('event_id', id).order('created_at', { ascending: false }).limit(20),
  ]);

  if (!event) redirect('/dashboard');

  const confirmedRegs = (regs ?? []).filter(r => ['confirmed', 'checked_in'].includes(r.status));
  const totalRevenue  = confirmedRegs.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
  const ticketsSold   = confirmedRegs.length;
  const avgOrder      = ticketsSold > 0 ? totalRevenue / ticketsSold : 0;
  const totalCapacity = (tickets ?? []).reduce((s, t) => s + (t.quantity ?? 0), 0);
  const conversion    = totalCapacity > 0 ? Math.round((ticketsSold / totalCapacity) * 100) : 0;

  const soldByType: Record<string, number> = {};
  for (const r of confirmedRegs) {
    if (r.ticket_type_id) soldByType[r.ticket_type_id] = (soldByType[r.ticket_type_id] ?? 0) + 1;
  }

  return (
    <TicketsPageClient
      eventId={id}
      eventName={event.name}
      tickets={tickets ?? []}
      soldByType={soldByType}
      totalRevenue={totalRevenue}
      ticketsSold={ticketsSold}
      avgOrder={avgOrder}
      conversion={conversion}
      promoCodes={promoCodes ?? []}
      checkoutCollectDetails={event.checkout_collect_details ?? true}
      checkoutRequireApproval={event.checkout_require_approval ?? false}
      checkoutShowRemaining={event.checkout_show_remaining ?? true}
      checkoutApplyVat={event.checkout_apply_vat ?? false}
    />
  );
}
