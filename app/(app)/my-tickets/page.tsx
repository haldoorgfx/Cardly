export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Mic, Store, ArrowRight } from 'lucide-react';
import MyTicketsClient from '@/components/tickets/MyTicketsClient';
import { PageShell, PageHeader } from '@/components/dash';
import { registrationOwnershipFilter } from '@/lib/registration/ownership';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Tickets' };

type Booth = { id: string; company_name: string; logo_url: string | null; slug: string };
type Speaking = { id: string; name: string; eventName: string; slug: string };

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
      events(id, name, slug, event_pages(id, title, cover_image_url, starts_at, ends_at, venue_name, city, is_online, features))
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

  // ── Speaking + Your booths — match the logged-in email to speaker / sponsor records ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;
  const email = (user.email ?? '').toLowerCase();
  const [speakerRes, sponsorRes] = await Promise.all([
    email ? adminAny.from('speakers').select('id, name, event_id').ilike('email', email) : Promise.resolve({ data: [] }),
    email ? adminAny.from('sponsors').select('id, company_name, logo_url, event_id').ilike('contact_email', email) : Promise.resolve({ data: [] }),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speakerRows = (speakerRes?.data ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sponsorRows = (sponsorRes?.data ?? []) as any[];
  let speaking: Speaking[] = [];
  let booths: Booth[] = [];
  const eventIds = Array.from(new Set(
    speakerRows.map(s => s.event_id).concat(sponsorRows.map(s => s.event_id))
  ));
  if (eventIds.length > 0) {
    const { data: evs } = await adminAny.from('events').select('id, slug, name').in('id', eventIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const byId = new Map<string, any>((evs ?? []).map((e: any) => [e.id, e]));
    speaking = speakerRows.filter(s => byId.has(s.event_id))
      .map(s => ({ id: s.id, name: s.name, eventName: byId.get(s.event_id).name as string, slug: byId.get(s.event_id).slug as string }));
    booths = sponsorRows.filter(s => byId.has(s.event_id))
      .map(s => ({ id: s.id, company_name: s.company_name, logo_url: s.logo_url, slug: byId.get(s.event_id).slug as string }));
  }

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

      {/* Speaking — your speaker workspace lives in the dashboard */}
      {speaking.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="grid place-items-center w-7 h-7 rounded-lg shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
              <Mic size={15} strokeWidth={1.9} />
            </span>
            <h2 className="font-display font-medium text-[18px]" style={{ color: '#0F1F18' }}>Speaking</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {speaking.map(s => (
              <Link key={s.id} href="/speaking"
                className="group bg-white rounded-2xl border p-4 flex items-center gap-3 transition-colors hover:border-[#1F4D3A]/40"
                style={{ borderColor: '#E5E0D4' }}>
                <span className="grid place-items-center w-10 h-10 rounded-lg shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                  <Mic size={16} strokeWidth={1.8} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[14px] truncate" style={{ color: '#0F1F18' }}>{s.eventName}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: '#3A4A42' }}>Open speaker workspace</div>
                </div>
                <ArrowRight size={14} strokeWidth={2} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#1F4D3A' }} />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Your booths — sponsor workspace lives in the dashboard */}
      {booths.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center gap-2.5 mb-4">
            <span className="grid place-items-center w-7 h-7 rounded-lg shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
              <Store size={15} strokeWidth={1.9} />
            </span>
            <h2 className="font-display font-medium text-[18px]" style={{ color: '#0F1F18' }}>Your booths</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {booths.map(b => (
              <Link key={b.id} href="/sponsoring"
                className="group bg-white rounded-2xl border p-4 flex items-center gap-3 transition-colors hover:border-[#1F4D3A]/40"
                style={{ borderColor: '#E5E0D4' }}>
                <span className="w-10 h-10 rounded-lg grid place-items-center overflow-hidden shrink-0" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
                  {b.logo_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={b.logo_url} alt="" className="w-full h-full object-contain" />
                    : <Store size={16} strokeWidth={1.8} style={{ color: '#3A4A42' }} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-[14px] truncate" style={{ color: '#0F1F18' }}>{b.company_name}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: '#3A4A42' }}>Open sponsor workspace</div>
                </div>
                <ArrowRight size={14} strokeWidth={2} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#1F4D3A' }} />
              </Link>
            ))}
          </div>
        </section>
      )}
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
