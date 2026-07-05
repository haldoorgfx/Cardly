export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getVisibleSections } from '@/lib/rbac/sections';
import { formatRevenue } from '@/lib/events/format';
import { Plus, Users, ScanLine, ArrowRight, Mic, Briefcase, ShieldCheck, Compass } from 'lucide-react';
import { PageShell, PageHeader, StatRow, Card, EmptyState, PrimaryButton, SecondaryButton } from '@/components/dash';

export const metadata: Metadata = { title: 'Home' };

type Attention = { id: string; name: string; reason: string; href: string };
type OrgData = {
  events: number; registrations: number; revenue: number; checkInRate: number;
  attention: Attention[]; firstLiveSlug: string | null;
};
type AttendEvent = { id: string; name: string; slug: string; cover: string | null; when: string | null };

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const sections = await getVisibleSections(user.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const email = (user.email ?? '').toLowerCase();

  // ── Organizer command center (reuses the proven /dashboard query) ──
  let org: OrgData | null = null;
  if (sections.organizing) {
    const { data: events } = await admin
      .from('events')
      .select('id, name, slug, status')
      .eq('user_id', user.id);
    const allEvents = (events ?? []) as { id: string; name: string; slug: string; status: string }[];
    const eventIds = allEvents.map((e) => e.id);
    let totalRegistrations = 0, totalRevenue = 0, totalCheckedIn = 0;
    const regCountByEvent: Record<string, number> = {};
    if (eventIds.length) {
      const { data: regs } = await admin
        .from('registrations')
        .select('event_id, amount_paid, status')
        .in('event_id', eventIds)
        .in('status', ['confirmed', 'checked_in']);
      for (const r of (regs ?? []) as { event_id: string; amount_paid: number | null; status: string }[]) {
        regCountByEvent[r.event_id] = (regCountByEvent[r.event_id] ?? 0) + 1;
        totalRegistrations += 1;
        totalRevenue += Number(r.amount_paid ?? 0);
        if (r.status === 'checked_in') totalCheckedIn += 1;
      }
    }
    const checkInRate = totalRegistrations > 0 ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0;
    const attention: Attention[] = [];
    for (const e of allEvents) {
      if (e.status === 'draft') attention.push({ id: e.id, name: e.name, reason: 'not published', href: `/events/${e.slug}` });
      else if (e.status === 'published' && (regCountByEvent[e.id] ?? 0) === 0) attention.push({ id: e.id, name: e.name, reason: 'no registrations yet', href: `/events/${e.slug}` });
      if (attention.length >= 4) break;
    }
    org = {
      events: allEvents.filter((e) => e.status !== 'archived').length,
      registrations: totalRegistrations,
      revenue: totalRevenue,
      checkInRate,
      attention,
      firstLiveSlug: allEvents.find((e) => e.status === 'published')?.slug ?? null,
    };
  }

  // ── Attending next (reuses the /my-tickets query) ──
  const attending: AttendEvent[] = [];
  if (sections.tickets) {
    const { data: regs } = await admin
      .from('registrations')
      .select('id, created_at, events(id, name, slug, event_pages(cover_image_url, starts_at))')
      .or(`attendee_email.eq.${email},user_id.eq.${user.id}`)
      .in('status', ['confirmed', 'checked_in', 'pending', 'pending_approval'])
      .order('created_at', { ascending: false })
      .limit(12);
    const now = new Date();
    const seen = new Set<string>();
    for (const r of (regs ?? [])) {
      const ev = r.events;
      if (!ev || seen.has(ev.id)) continue;
      const ep = ev.event_pages?.[0];
      if (ep?.starts_at && new Date(ep.starts_at) < now) continue;
      seen.add(ev.id);
      attending.push({ id: ev.id, name: ev.name, slug: ev.slug, cover: ep?.cover_image_url ?? null, when: ep?.starts_at ?? null });
      if (attending.length >= 4) break;
    }
  }

  const nothing = !sections.organizing && !sections.tickets && !sections.speaking && !sections.sponsoring && !sections.admin;

  return (
    <PageShell width="wide">
      <PageHeader title="Home" subtitle="Everything you run and attend, at a glance." />

      {nothing ? (
        <EmptyState
          icon={<Compass size={24} strokeWidth={1.7} />}
          title="Nothing here yet"
          body={<>Once you register for an event, speak at one, or sponsor one, it&apos;ll show up here.</>}
          action={<PrimaryButton href="/discover">Discover events <ArrowRight size={15} strokeWidth={2} /></PrimaryButton>}
        />
      ) : (
        <div className="space-y-9">
          {org && (
            <section>
              <StatRow stats={[
                { label: 'Events', value: org.events },
                { label: 'Registrations', value: org.registrations.toLocaleString() },
                { label: 'Revenue', value: org.revenue > 0 ? formatRevenue(org.revenue, 'USD') : '—' },
                { label: 'Check-in rate', value: `${org.checkInRate}%` },
              ]} />
              <div className="flex flex-wrap gap-2.5 mb-6">
                <PrimaryButton href="/events/new"><Plus size={15} strokeWidth={2.2} /> Create event</PrimaryButton>
                <SecondaryButton href="/dashboard"><Users size={15} strokeWidth={1.8} /> All events</SecondaryButton>
                {org.firstLiveSlug && (
                  <SecondaryButton href={`/events/${org.firstLiveSlug}/check-in`}><ScanLine size={15} strokeWidth={1.8} /> Check-in scanner</SecondaryButton>
                )}
              </div>
              {org.attention.length > 0 && (
                <div>
                  <div className="text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: '#B45309' }}>Needs attention</div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {org.attention.map((item) => (
                      <Link key={item.id} href={item.href}
                        className="flex items-center gap-3 rounded-2xl px-4 py-3 transition-colors"
                        style={{ background: 'rgba(254,243,199,0.6)', border: '1px solid rgba(253,230,138,0.7)' }}>
                        <div className="w-9 h-9 rounded-lg shrink-0" style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[13.5px] font-medium truncate" style={{ color: '#0F1F18' }}>{item.name}</div>
                          <div className="text-[12px] mt-0.5" style={{ color: '#B45309' }}>{item.reason}</div>
                        </div>
                        <ArrowRight size={15} strokeWidth={2.2} style={{ color: '#B45309' }} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {sections.tickets && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: '#6B7A72' }}>Attending next</div>
                <Link href="/my-tickets" className="text-[12.5px] font-medium" style={{ color: '#1F4D3A' }}>View all &rarr;</Link>
              </div>
              {attending.length === 0 ? (
                <Card>
                  <div className="text-[13.5px] text-center py-4" style={{ color: '#6B7A72' }}>
                    No upcoming events. <Link href="/discover" className="font-medium" style={{ color: '#1F4D3A' }}>Discover events &rarr;</Link>
                  </div>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {attending.map((a) => (
                    <Link key={a.id} href="/my-tickets"
                      className="flex items-center gap-3 bg-white rounded-2xl border p-3 transition-colors hover:border-[#1F4D3A]/40"
                      style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                      <div className="w-12 h-12 rounded-xl shrink-0"
                        style={{ background: a.cover ? `url(${a.cover}) center/cover` : 'linear-gradient(135deg,#1F4D3A,#2A6A50)' }} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-medium truncate" style={{ color: '#0F1F18' }}>{a.name}</div>
                        <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>
                          {a.when ? new Date(a.when).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBA'}
                        </div>
                      </div>
                      <ArrowRight size={15} strokeWidth={2} style={{ color: '#6B7A72' }} />
                    </Link>
                  ))}
                </div>
              )}
            </section>
          )}

          {(sections.speaking || sections.sponsoring || sections.admin) && (
            <section>
              <div className="text-[10px] tracking-[0.2em] uppercase mb-3" style={{ color: '#6B7A72' }}>More</div>
              <div className="grid sm:grid-cols-3 gap-3">
                {sections.speaking && <RoleLink href="/speaking" icon={<Mic size={18} strokeWidth={1.8} />} label="Speaking" desc="Your sessions" />}
                {sections.sponsoring && <RoleLink href="/sponsoring" icon={<Briefcase size={18} strokeWidth={1.8} />} label="Sponsoring" desc="Booths & leads" />}
                {sections.admin && <RoleLink href="/admin/analytics" icon={<ShieldCheck size={18} strokeWidth={1.8} />} label="Admin" desc="Platform" />}
              </div>
            </section>
          )}
        </div>
      )}
    </PageShell>
  );
}

function RoleLink({ href, icon, label, desc }: { href: string; icon: React.ReactNode; label: string; desc: string }) {
  return (
    <Link href={href}
      className="flex items-center gap-3 bg-white rounded-2xl border p-4 transition-colors hover:border-[#1F4D3A]/40"
      style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
      <span className="grid place-items-center w-10 h-10 rounded-xl shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>{icon}</span>
      <div className="min-w-0">
        <div className="text-[14px] font-semibold" style={{ color: '#0F1F18' }}>{label}</div>
        <div className="text-[12px]" style={{ color: '#6B7A72' }}>{desc}</div>
      </div>
    </Link>
  );
}
