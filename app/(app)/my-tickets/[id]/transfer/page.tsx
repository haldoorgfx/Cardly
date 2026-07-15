export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { TicketTransferClient } from '@/components/tickets/TicketTransferClient';
import { registrationOwnershipFilter } from '@/lib/registration/ownership';

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
    .select('id, attendee_name, attendee_email, status, qr_code_token, ticket_types(name, price, currency), events(name, id, event_pages(title, starts_at, venue_name, cover_image_url))')
    .eq('id', id)
    .or(registrationOwnershipFilter(user.id, user.email))
    .in('status', ['confirmed', 'pending_approval'])
    .maybeSingle();

  if (!reg) notFound();

  return <TicketTransferClient registration={reg} />;
}
