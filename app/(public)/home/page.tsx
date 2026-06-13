export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { PublicNav } from '@/components/events/PublicNav';
import {
  CalendarDays, Ticket, Store, Bookmark, Users, ArrowRight, Plus,
  MapPin, Compass, Mic,
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Home' };

/* ── helpers ─────────────────────────────────────────────────────────── */

function fmtDate(iso: string | null | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS = {
  published: { label: 'Live', color: '#2D7A4F', bg: '#E8EFEB' },
  draft:     { label: 'Draft', color: '#C97A2D', bg: '#FBF3E6' },
  archived:  { label: 'Archived', color: '#6B7A72', bg: '#F0EDE7' },
} as const;

type HostEvent = { id: string; name: string; slug: string; status: string; event_pages?: Array<{ starts_at: string | null; venue_name: string | null }> | null };
type Attending = { id: string; status: string; events: { name: string; slug: string; event_pages?: Array<{ starts_at: string | null; city: string | null; venue_name: string | null; is_online: boolean }> | null } | null };
type Booth = { id: string; company_name: string; logo_url: string | null; tier: string | null; slug: string };
type Speaking = { id: string; name: string; eventName: string; slug: string };

/* ── section shell ───────────────────────────────────────────────────── */

function Section({ icon, title, count, action, children }: {
  icon: React.ReactNode; title: string; count?: number;
  action?: { href: string; label: string }; children: React.ReactNode;
}) {
  return (
    <section className="mb-9">
      <div className="flex items-center gap-2.5 mb-4">
        <span className="grid place-items-center w-7 h-7 rounded-lg shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
          {icon}
        </span>
        <h2 className="font-display font-semibold text-[18px] tracking-tight" style={{ color: '#0F1F18' }}>{title}</h2>
        {typeof count === 'number' && count > 0 && (
          <span className="text-[13px]" style={{ color: '#6B7A72' }}>{count}</span>
        )}
        {action && (
          <Link href={action.href} className="ml-auto inline-flex items-center gap-1 text-[13px] font-medium transition hover:opacity-70" style={{ color: '#1F4D3A' }}>
            {action.label} <ArrowRight size={13} strokeWidth={2} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/* ── page ────────────────────────────────────────────────────────────── */

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/account/login?next=/home');

  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;
  const email = (user.email ?? '').toLowerCase();

  const [profileRes, hostingRes, attendingRes, sponsorRes, savedRes, followingRes, speakerRes] = await Promise.all([
    adminAny.from('profiles').select('full_name, role, plan').eq('id', user.id).single(),
    admin.from('events')
      .select('id, name, slug, status, event_pages(starts_at, venue_name)')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(6),
    adminAny.from('registrations')
      .select('id, status, events(name, slug, event_pages(starts_at, city, venue_name, is_online))')
      .or(`attendee_email.eq.${email},user_id.eq.${user.id}`)
      .in('status', ['confirmed', 'checked_in', 'pending', 'pending_approval'])
      .order('created_at', { ascending: false })
      .limit(12),
    email ? adminAny.from('sponsors').select('id, company_name, logo_url, tier, event_id').ilike('contact_email', email) : Promise.resolve({ data: [] }),
    adminAny.from('saved_events').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    adminAny.from('organizer_follows').select('id', { count: 'exact', head: true }).eq('follower_id', user.id),
    email ? adminAny.from('speakers').select('id, name, event_id').ilike('email', email) : Promise.resolve({ data: [] }),
  ]);

  const profile = profileRes.data ?? null;
  const firstName = (profile?.full_name ?? user.email?.split('@')[0] ?? 'there').split(' ')[0];

  const hosting = (hostingRes.data ?? []) as HostEvent[];

  // Attending — upcoming only, de-duped per event
  const now = new Date();
  const attendingAll = (attendingRes.data ?? []) as Attending[];
  const seen = new Set<string>();
  const attending = attendingAll.filter(r => {
    const slug = r.events?.slug;
    if (!slug || seen.has(slug)) return false;
    const start = r.events?.event_pages?.[0]?.starts_at;
    if (start && new Date(start) < now) return false;
    seen.add(slug);
    return true;
  }).slice(0, 6);

  // Exhibiting + Speaking — resolve event slug/name for the matched rows
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sponsorRows = (sponsorRes.data ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speakerRows = (speakerRes?.data ?? []) as any[];
  let booths: Booth[] = [];
  let speaking: Speaking[] = [];
  const eventIds = Array.from(new Set(
    sponsorRows.map(s => s.event_id).concat(speakerRows.map(s => s.event_id))
  ));
  if (eventIds.length > 0) {
    const { data: evs } = await adminAny.from('events').select('id, slug, name').in('id', eventIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const byId = new Map<string, any>((evs ?? []).map((e: any) => [e.id, e]));
    booths = sponsorRows
      .filter(s => byId.has(s.event_id))
      .map(s => ({ id: s.id, company_name: s.company_name, logo_url: s.logo_url, tier: s.tier, slug: byId.get(s.event_id).slug as string }));
    speaking = speakerRows
      .filter(s => byId.has(s.event_id))
      .map(s => ({ id: s.id, name: s.name, eventName: byId.get(s.event_id).name as string, slug: byId.get(s.event_id).slug as string }));
  }

  const savedCount = (savedRes.count ?? 0) as number;
  const followingCount = (followingRes.count ?? 0) as number;

  const hasAnything = hosting.length > 0 || attending.length > 0 || booths.length > 0 || speaking.length > 0 || savedCount > 0 || followingCount > 0;

  // Summary line
  const bits: string[] = [];
  if (hosting.length) bits.push(`hosting ${hosting.length}`);
  if (attending.length) bits.push(`attending ${attending.length}`);
  if (speaking.length) bits.push(`speaking at ${speaking.length}`);
  if (booths.length) bits.push(`${booths.length} booth${booths.length !== 1 ? 's' : ''}`);
  const summary = bits.length ? `You're ${bits.join(' · ')}.` : 'Find your next event below.';

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />
      <div className="max-w-[1100px] mx-auto px-5 py-9 sm:py-11">

        {/* Greeting */}
        <header className="mb-9">
          <h1 className="font-display font-semibold text-[clamp(26px,4vw,34px)] tracking-tight" style={{ color: '#1F4D3A', letterSpacing: '-0.025em' }}>
            Welcome back, {firstName}
          </h1>
          <p className="text-[15px] mt-2" style={{ color: '#6B7A72' }}>{summary}</p>
        </header>

        {/* Hosting */}
        {hosting.length > 0 && (
          <Section icon={<CalendarDays size={15} strokeWidth={1.9} />} title="Hosting" count={hosting.length}
            action={{ href: '/dashboard', label: 'Manage all' }}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {hosting.map(ev => {
                const st = STATUS[ev.status as keyof typeof STATUS] ?? STATUS.draft;
                const date = fmtDate(ev.event_pages?.[0]?.starts_at);
                return (
                  <Link key={ev.id} href={`/events/${ev.id}`}
                    className="group bg-white rounded-2xl border p-4 transition-colors hover:border-[#1F4D3A]/40"
                    style={{ borderColor: '#E5E0D4' }}>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />{st.label}
                      </span>
                      <ArrowRight size={14} strokeWidth={2} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#1F4D3A' }} />
                    </div>
                    <div className="font-display font-semibold text-[15px] leading-snug line-clamp-1" style={{ color: '#0F1F18' }}>{ev.name}</div>
                    {date && <div className="text-[12.5px] mt-1" style={{ color: '#6B7A72' }}>{date}</div>}
                  </Link>
                );
              })}
            </div>
          </Section>
        )}

        {/* Attending */}
        {attending.length > 0 && (
          <Section icon={<Ticket size={15} strokeWidth={1.9} />} title="Attending" count={attending.length}
            action={{ href: '/my-tickets', label: 'My tickets' }}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {attending.map(r => {
                const ep = r.events?.event_pages?.[0];
                const date = fmtDate(ep?.starts_at);
                const where = ep?.is_online ? 'Online' : (ep?.city ?? ep?.venue_name ?? null);
                return (
                  <Link key={r.id} href={`/e/${r.events?.slug ?? ''}`}
                    className="group bg-white rounded-2xl border p-4 transition-colors hover:border-[#1F4D3A]/40"
                    style={{ borderColor: '#E5E0D4' }}>
                    <div className="font-display font-semibold text-[15px] leading-snug line-clamp-1" style={{ color: '#0F1F18' }}>{r.events?.name}</div>
                    <div className="flex items-center gap-2 mt-1.5 text-[12.5px] flex-wrap" style={{ color: '#6B7A72' }}>
                      {date && <span>{date}</span>}
                      {date && where && <span style={{ color: '#E5E0D4' }}>·</span>}
                      {where && <span className="inline-flex items-center gap-1"><MapPin size={11} strokeWidth={1.8} />{where}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          </Section>
        )}

        {/* Speaking */}
        {speaking.length > 0 && (
          <Section icon={<Mic size={15} strokeWidth={1.9} />} title="Speaking" count={speaking.length}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {speaking.map(s => (
                <Link key={s.id} href={`/s/${s.slug}/${s.id}`}
                  className="group bg-white rounded-2xl border p-4 flex items-center gap-3 transition-colors hover:border-[#1F4D3A]/40"
                  style={{ borderColor: '#E5E0D4' }}>
                  <span className="grid place-items-center w-10 h-10 rounded-lg shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    <Mic size={16} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[14px] truncate" style={{ color: '#0F1F18' }}>{s.eventName}</div>
                    <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>Open speaker portal</div>
                  </div>
                  <ArrowRight size={14} strokeWidth={2} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#1F4D3A' }} />
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* Exhibiting */}
        {booths.length > 0 && (
          <Section icon={<Store size={15} strokeWidth={1.9} />} title="Your booths" count={booths.length}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {booths.map(b => (
                <Link key={b.id} href={`/x/${b.slug}/${b.id}`}
                  className="group bg-white rounded-2xl border p-4 flex items-center gap-3 transition-colors hover:border-[#1F4D3A]/40"
                  style={{ borderColor: '#E5E0D4' }}>
                  <div className="w-10 h-10 rounded-lg grid place-items-center overflow-hidden shrink-0" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
                    {b.logo_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={b.logo_url} alt="" className="w-full h-full object-contain" />
                      : <Store size={16} strokeWidth={1.8} style={{ color: '#6B7A72' }} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[14px] truncate" style={{ color: '#0F1F18' }}>{b.company_name}</div>
                    <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>Open exhibitor portal</div>
                  </div>
                  <ArrowRight size={14} strokeWidth={2} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#1F4D3A' }} />
                </Link>
              ))}
            </div>
          </Section>
        )}

        {/* Discovery row — saved & following */}
        {(savedCount > 0 || followingCount > 0) && (
          <Section icon={<Bookmark size={15} strokeWidth={1.9} />} title="Saved & following"
            action={{ href: '/saved', label: 'View all' }}>
            <div className="grid sm:grid-cols-2 gap-3">
              <Link href="/saved" className="bg-white rounded-2xl border p-4 flex items-center gap-3 transition-colors hover:border-[#1F4D3A]/40" style={{ borderColor: '#E5E0D4' }}>
                <span className="grid place-items-center w-9 h-9 rounded-lg shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}><Bookmark size={15} strokeWidth={1.8} /></span>
                <div><div className="font-medium text-[14px]" style={{ color: '#0F1F18' }}>{savedCount} saved event{savedCount !== 1 ? 's' : ''}</div><div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>Events you bookmarked</div></div>
              </Link>
              <Link href="/account/following" className="bg-white rounded-2xl border p-4 flex items-center gap-3 transition-colors hover:border-[#1F4D3A]/40" style={{ borderColor: '#E5E0D4' }}>
                <span className="grid place-items-center w-9 h-9 rounded-lg shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}><Users size={15} strokeWidth={1.8} /></span>
                <div><div className="font-medium text-[14px]" style={{ color: '#0F1F18' }}>Following {followingCount}</div><div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>Organizers you follow</div></div>
              </Link>
            </div>
          </Section>
        )}

        {/* Empty state — brand new user */}
        {!hasAnything && (
          <div className="bg-white rounded-2xl border p-10 text-center" style={{ borderColor: '#E5E0D4' }}>
            <span className="inline-grid place-items-center w-14 h-14 rounded-2xl mb-5" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
              <Compass size={26} strokeWidth={1.7} />
            </span>
            <h2 className="font-display font-semibold text-[22px] tracking-tight" style={{ color: '#1F4D3A' }}>Nothing here yet</h2>
            <p className="text-[14px] mt-2 mb-6 max-w-[420px] mx-auto" style={{ color: '#6B7A72' }}>
              Discover an event to attend, or host your own — everything you join shows up here.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/events" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-[14px] font-medium transition hover:bg-[#163828]" style={{ background: '#1F4D3A' }}>
                <Compass size={15} strokeWidth={1.9} /> Discover events
              </Link>
              <Link href="/events/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-[14px] font-medium border transition hover:border-[#1F4D3A]/40" style={{ borderColor: '#E5E0D4', color: '#1F4D3A', background: 'white' }}>
                <Plus size={15} strokeWidth={2} /> Host an event
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
