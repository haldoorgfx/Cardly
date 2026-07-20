export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MyTicketsClient from '@/components/tickets/MyTicketsClient';
import { PageShell, PageHeader } from '@/components/dash';
import { registrationOwnershipFilter } from '@/lib/registration/ownership';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Tickets' };

export default async function MyTicketsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/account/login?next=/my-tickets');

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: regs, error: regsError } = await (admin as any)
    .from('registrations')
    .select(`
      id, attendee_name, attendee_email, status, payment_status, amount_paid, eventera_card_url, qr_code_token, created_at,
      ticket_types(name, price),
      events(id, name, slug, event_pages(id, title, cover_image_url, starts_at, ends_at, venue_name, city, is_online, features, timezone))
    `)
    .or(registrationOwnershipFilter(user.id, user.email))
    .in('status', ['confirmed', 'checked_in', 'pending', 'pending_approval'])
    .order('created_at', { ascending: false });

  if (regsError) console.error('[my-tickets] query error:', regsError);

  const allRegs = (regs ?? []) as Registration[];
  const now = new Date();

  const upcoming = allRegs.filter(r => {
    const ep = r.events?.event_pages?.[0];
    if (!ep?.starts_at) return true;
    return new Date(ep.starts_at) >= now;
  });
  const past = allRegs.filter(r => {
    const ep = r.events?.event_pages?.[0];
    if (!ep?.starts_at) return false;
    return new Date(ep.starts_at) < now;
  });
  const cardCount = allRegs.filter(r => r.eventera_card_url).length;

  // "Next up" hero: the soonest confirmed upcoming event with a live QR, so the
  // event you're about to attend surfaces its tools front-and-center.
  const featuredPool = upcoming.filter(r => r.status === 'confirmed' || r.status === 'checked_in');
  const featured =
    [...featuredPool]
      .filter(r => r.events?.event_pages?.[0]?.starts_at)
      .sort((a, b) =>
        new Date(a.events!.event_pages[0].starts_at!).getTime() -
        new Date(b.events!.event_pages[0].starts_at!).getTime())[0]
    ?? featuredPool[0]
    ?? null;

  // Speaking / Your booths used to be listed here too, at the very bottom of
  // a long ticket list — the least visible spot on the page, and a duplicate:
  // the sidebar carries Speaking and Sponsoring as top-level entries, and the
  // per-event role chips now link across from inside each workspace. Three
  // routes to the same place was two too many, and this was the worst of them.

  return (
    <PageShell width="wide">
      <PageHeader
        title="Tickets"
        subtitle={<>
          {upcoming.length} upcoming
          {past.length > 0 && <> · {past.length} past event{past.length !== 1 ? 's' : ''}</>}
          {cardCount > 0 && <> · {cardCount} Eventera Card{cardCount !== 1 ? 's' : ''} collected</>}
        </>}
      />
      <MyTicketsClient upcoming={upcoming} past={past} featured={featured} />

    </PageShell>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

type Registration = {
  id: string;
  attendee_name: string;
  attendee_email: string;
  status: string;
  payment_status: string;
  amount_paid: number | string | null;
  eventera_card_url: string | null;
  qr_code_token: string;
  created_at: string;
  ticket_types: { name: string; price: number } | null;
  events: {
    id: string;
    name: string;
    slug: string;
    event_pages: Array<{
      id: string;
      title: string;
      cover_image_url: string | null;
      starts_at: string | null;
      ends_at: string | null;
      venue_name: string | null;
      city: string | null;
      is_online: boolean;
      features: Record<string, boolean> | null;
    }>;
  } | null;
};
