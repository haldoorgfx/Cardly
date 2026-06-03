export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import MyTicketsClient from './MyTicketsClient';

export const metadata: Metadata = { title: 'My Tickets — Karta' };

interface Props { searchParams: { email?: string; reg?: string } }

export default async function MyTicketsPage({ searchParams }: Props) {
  const email = searchParams.email?.trim().toLowerCase();
  const regId  = searchParams.reg;

  if (!email && !regId) {
    // Show empty prompt
    return (
      <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
        <div className="max-w-[680px] mx-auto px-5 py-24 text-center">
          <h1 className="font-display font-medium text-[32px] mb-3" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>
            My tickets
          </h1>
          <p className="text-[15px] mb-8" style={{ color: '#6B7A72' }}>
            Enter your email to see your tickets and Karta Cards.
          </p>
          <form method="GET" action="/my-tickets" className="flex gap-2 max-w-[400px] mx-auto">
            <input
              name="email"
              type="email"
              placeholder="your@email.com"
              required
              className="flex-1 rounded-xl px-4 text-[14px]"
              style={{ height: 44, border: '1px solid #E5E0D4', background: 'white', outline: 'none', color: '#0F1F18' }}
            />
            <button
              type="submit"
              className="rounded-xl font-display font-semibold text-[14px] text-white px-5"
              style={{ height: 44, background: '#1F4D3A' }}
            >
              View tickets
            </button>
          </form>
        </div>
      </div>
    );
  }

  const admin = createAdminClient();

  // Look up registrations by email or registration ID
  let registrationsQuery = admin
    .from('registrations')
    .select(`
      id, status, created_at, amount_paid, currency, karta_card_url,
      ticket_types(name, price),
      events!inner(id, name, slug,
        event_pages(cover_image_url, venue_name, venue_address, starts_at, ends_at, timezone, is_online)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (email) {
    registrationsQuery = registrationsQuery.eq('attendee_email', email);
  } else if (regId) {
    registrationsQuery = registrationsQuery.eq('id', regId);
  }

  const { data: regs } = await registrationsQuery;

  if (!regs || regs.length === 0) {
    return (
      <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
        <div className="max-w-[680px] mx-auto px-5 py-24 text-center">
          <h1 className="font-display font-medium text-[32px] mb-3" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>
            No tickets found
          </h1>
          <p className="text-[15px] mb-6" style={{ color: '#6B7A72' }}>
            No registrations found for <strong>{email ?? regId}</strong>.
          </p>
          <a href="/my-tickets" className="text-[14px] font-medium" style={{ color: '#1F4D3A' }}>Try a different email →</a>
        </div>
      </div>
    );
  }

  // Split upcoming vs past
  const now = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upcoming = regs.filter((r: any) => {
    const ep = Array.isArray(r.events?.event_pages) ? r.events.event_pages[0] : r.events?.event_pages;
    return ep ? new Date(ep.ends_at ?? ep.starts_at) >= now : false;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const past = regs.filter((r: any) => {
    const ep = Array.isArray(r.events?.event_pages) ? r.events.event_pages[0] : r.events?.event_pages;
    return ep ? new Date(ep.ends_at ?? ep.starts_at) < now : true;
  });

  // Find the first card for the sidebar
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cardReg = upcoming.find((r: any) => r.karta_card_url) ?? past.find((r: any) => r.karta_card_url);

  return (
    <MyTicketsClient
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      upcoming={upcoming as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      past={past as any}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cardReg={cardReg as any ?? null}
      totalCards={regs.filter((r: any) => r.karta_card_url).length}
    />
  );
}
