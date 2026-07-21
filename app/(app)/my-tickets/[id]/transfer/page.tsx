export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { TicketTransferClient } from '@/components/tickets/TicketTransferClient';
import { registrationOwnershipFilter } from '@/lib/registration/ownership';
import { ticketState, isTransferable } from '@/components/tickets/ticketState';

export async function generateMetadata() {
  return { title: 'Transfer Ticket' };
}

export default async function TicketTransferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/account/login?next=/my-tickets/${id}/transfer`);

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reg } = await (admin as any)
    .from('registrations')
    .select('id, attendee_name, attendee_email, status, payment_status, amount_paid, ticket_types(name, price, currency), events(name, id, event_pages(title, starts_at, venue_name, cover_image_url))')
    .eq('id', id)
    .or(registrationOwnershipFilter(user.id, user.email))
    .maybeSingle();

  // Same gate the API enforces (lib/registration/transfer.ts): only a live
  // ticket may be given away. Without this the page happily rendered a form for
  // an unpaid or unapproved ticket that the API would then always reject.
  if (!reg || !isTransferable(ticketState(reg))) notFound();

  return <TicketTransferClient registration={reg} />;
}
