export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PublicNav } from '@/components/events/PublicNav';
import MyTicketsClient from '@/components/tickets/MyTicketsClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'My tickets' };

export default async function MyTicketsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/account/login?next=/my-tickets');

  const admin = createAdminClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: regs, error: regsError } = await (admin as any)
    .from('registrations')
    .select(`
      id, attendee_name, attendee_email, status, karta_card_url, qr_code_token, created_at,
      ticket_types(name, price),
      events(id, name, slug, event_pages(id, title, cover_image_url, starts_at, ends_at, venue_name, city, is_online))
    `)
    .eq('attendee_email', (user.email ?? '').toLowerCase())
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
  const cardCount = allRegs.filter(r => r.karta_card_url).length;

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />
      <div className="max-w-[900px] mx-auto px-5 py-10">
        <div className="mb-8">
          <h1 className="font-display font-normal text-[32px]" style={{ color: '#1F4D3A', letterSpacing: '-0.025em' }}>
            My tickets
          </h1>
          <p className="text-[15px] mt-2" style={{ color: '#6B7A72' }}>
            {upcoming.length} upcoming
            {past.length > 0 && <> · {past.length} past event{past.length !== 1 ? 's' : ''}</>}
            {cardCount > 0 && <> · {cardCount} Karta Card{cardCount !== 1 ? 's' : ''} collected</>}
          </p>
        </div>
        <MyTicketsClient upcoming={upcoming} past={past} />
      </div>
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────────

type Registration = {
  id: string;
  attendee_name: string;
  attendee_email: string;
  status: string;
  karta_card_url: string | null;
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
    }>;
  } | null;
};
