export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import TicketDetailClient from '@/components/tickets/TicketDetailClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Ticket' };

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/account/login?next=/my-tickets/${id}`);

  const admin = createAdminClient();

  // Owner-only: registration must match the signed-in user (user_id OR attendee_email).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reg } = await (admin as any)
    .from('registrations')
    .select(`
      id, attendee_name, attendee_email, status, payment_status, amount_paid, currency,
      qr_code_token, checked_in_at, checked_in_by, eventera_card_url, created_at,
      ticket_types(name, price, currency),
      events(id, name, slug, event_pages(id, title, cover_image_url, starts_at, ends_at, venue_name, venue_address, city, country, is_online, features))
    `)
    .eq('id', id)
    .or(`attendee_email.eq.${(user.email ?? '').toLowerCase()},user_id.eq.${user.id}`)
    .maybeSingle();

  if (!reg) notFound();

  // Resolve who scanned this ticket in (for the checked-in state), best-effort.
  let scannedByName: string | null = null;
  if (reg.checked_in_by) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: scanner } = await (admin as any)
      .from('profiles')
      .select('full_name')
      .eq('id', reg.checked_in_by)
      .maybeSingle();
    scannedByName = scanner?.full_name ?? null;
  }

  return <TicketDetailClient reg={reg} scannedByName={scannedByName} />;
}
