export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getVisibleSections } from '@/lib/rbac/sections';
import { formatRevenue } from '@/lib/events/format';
import { Plus, Users, ScanLine, ArrowRight, Mic, Briefcase, ShieldCheck, Compass, IdCard, Heart } from 'lucide-react';
import { PageShell, PageHeader, StatRow, EmptyState, PrimaryButton } from '@/components/dash';

export const metadata: Metadata = { title: 'Home' };

type Attention = { id: string; name: string; reason: string; href: string };
type AttendEvent = { id: string; name: string; when: string | null };
type Activity = { id: string; name: string; event: string; amount: number; when: string };
type OrgData = {
  events: number; registrations: number; revenue: number; checkInRate: number;
  attention: Attention[]; firstLiveSlug: string | null; recent: Activity[];
};

function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function SectionCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: '#F0EDE6' }}>
        <div className="text-[13px] font-semibold" style={{ color: '#0F1F18' }}>{title}</div>
        {action}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13.5px] font-medium transition-colors hover:bg-[#F5F3EE]" style={{ color: '#0F1F18' }}>
      <span className="grid place-items-center w-7 h-7 rounded-lg shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>{icon}</span>
      {label}
    </Link>
  );
}

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const sections = await getVisibleSections(user.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const email = (user.email ?? '').toLowerCase();

  let org: OrgData | null = null;
  if (sections.organizing) {
    const { data: events } = await admin.from('events').select('id, name, slug, status').eq('user_id', user.id);
    const allEvents = (events ?? []) as { id: string; name: string; slug: string; status: string }[];
    const eventIds = allEvents.map((e) => e.id);
    let totalRegistrations = 0, totalRevenue = 0, totalCheckedIn = 0;
    const regCountByEvent: Record<string, number> = {};
    let recent: Activity[] = [];
    if (eventIds.length) {
      const [{ data: regs }, { data: recentRegs }] = await Promise.all([
        admin.from('registrations').select('event_id, amount_paid, status').in('event_id', eventIds).in('status', ['confirmed', 'checked_in']),
        admin.from('registrations').select('id, attendee_name, amount_paid, created_at, events(name)').in('event_id', eventIds).order('created_at', { ascending: false }).limit(6),
      ]);
      for (const r of (regs ?? []) as { event_id: string; amount_paid: number | null; status: string }[]) {
        regCountByEvent[r.event_id] = (regCountByEvent[r.event_id] ?? 0) + 1;
        totalRegistrations += 1;
        totalRevenue += Number(r.amount_paid ?? 0);
        if (r.status === 'checked_in') totalCheckedIn += 1;
      }
      recent = (recentRegs ?? []).map((r: { id: string; attendee_name: string | null; amount_paid: number | null; created_at: string; events: unknown }) => {
        const ev = r.events;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const evName = (Array.isArray(ev) ? (ev[0] as any)?.name : (ev as any)?.name) ?? 'an event';
        return { id: r.id, name: r.attendee_name ?? 'Someone', event: evName, amount: Number(r.amount_paid ?? 0), when: r.created_at };
      });
    }
    const checkInRate = totalRegistrations > 0 ? Math.round((totalCheckedIn / totalRegistrations) * 100) : 0;
    const attention: Attention[] = [];
    for (const e of allEvents) {
      if (e.status === 'draft') attention.push({ id: e.id, name: e.name, reason: 'not published', href: `/events/${e.slug}` });
      else if (e.status === 'published' && (regCountByEvent[e.id] ?? 0) === 0) attention.push({ id: e.id, name: e.name, reason: 'no registrations yet', href: `/events/${e.slug}` });
      if (attention.length >= 5) break;
    }
    org = {
      events: allEvents.filter((e) => e.status !== 'archived').length,
      registrations: totalRegistrations, revenue: totalRevenue, checkInRate,
      attention, firstLiveSlug: allEvents.find((e) => e.status === 'published')?.slug ?? null, recent,
    };
  }

  const attending: AttendEvent[] = [];
  if (sections.tickets) {
    const { data: regs } = await admin
      .from('registrations')
      .select('id, created_at, events(id, name, event_pages(starts_at))')
      .or(`attendee_email.eq.${email},user_id.eq.${user.id}`)
      .in('status', ['confirmed', 'checked_in', 'pending', 'pending_approval'])
      .order('created_at', { ascending: false }).limit(12);
    const now = new Date();
    const seen = new Set<string>();
    for (const r of (regs ?? [])) {
      const ev = r.events;
      if (!ev || seen.has(ev.id)) continue;
      const ep = ev.event_pages?.[0];
      if (ep?.starts_at && new Date(ep.starts_at) < now) continue;
      seen.add(ev.id);
      attending.push({ id: ev.id, name: ev.name, when: ep?.starts_at ?? null });
      if (attending.length >= 5) break;
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
        <div className="space-y-6">
          {org && (
            <StatRow stats={[
              { label: 'Events', value: org.events },
              { label: 'Registrations', value: org.registrations.toLocaleString() },
              { label: 'Revenue', value: org.revenue > 0 ? formatRevenue(org.revenue, 'USD') : '—' },
              { label: 'Check-in rate', value: `${org.checkInRate}%` },
            ]} />
          )}

          <div className="grid lg:grid-cols-2 gap-4 items-start">
            {/* LEFT column */}
            <div className="space-y-4">
              {org && (
                <SectionCard title="Needs attention">
                  {org.attention.length === 0 ? (
                    <div className="px-3 py-4 text-[13px] text-center" style={{ color: '#6B7A72' }}>All your events look healthy.</div>
                  ) : (
                    <div className="space-y-0.5">
                      {org.attention.map((item) => (
                        <Link key={item.id} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-[#FEFBF3]">
                          <div className="w-8 h-8 rounded-lg shrink-0" style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 130%)' }} />
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-medium truncate" style={{ color: '#0F1F18' }}>{item.name}</div>
                            <div className="text-[11.5px]" style={{ color: '#B45309' }}>{item.reason}</div>
                          </div>
                          <ArrowRight size={14} strokeWidth={2.2} style={{ color: '#B45309' }} />
                        </Link>
                      ))}
                    </div>
                  )}
                </SectionCard>
              )}

              {sections.tickets && (
                <SectionCard title="Attending next" action={<Link href="/my-tickets" className="text-[12px] font-medium" style={{ color: '#1F4D3A' }}>View all &rarr;</Link>}>
                  {attending.length === 0 ? (
                    <div className="px-3 py-4 text-[13px] text-center" style={{ color: '#6B7A72' }}>
                      No upcoming events. <Link href="/discover" className="font-medium" style={{ color: '#1F4D3A' }}>Discover events &rarr;</Link>
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {attending.map((a) => (
                        <Link key={a.id} href="/my-tickets" className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors hover:bg-[#F5F3EE]">
                          <div className="w-8 h-8 rounded-lg shrink-0" style={{ background: 'linear-gradient(135deg,#1F4D3A,#2A6A50)' }} />
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-medium truncate" style={{ color: '#0F1F18' }}>{a.name}</div>
                            <div className="text-[11.5px]" style={{ color: '#6B7A72' }}>{a.when ? new Date(a.when).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBA'}</div>
                          </div>
                          <ArrowRight size={14} strokeWidth={2} style={{ color: '#6B7A72' }} />
                        </Link>
                      ))}
                    </div>
                  )}
                </SectionCard>
              )}
            </div>

            {/* RIGHT column */}
            <div className="space-y-4">
              {org && (
                <SectionCard title="Quick actions">
                  <div className="space-y-0.5">
                    <QuickAction href="/events/new" icon={<Plus size={15} strokeWidth={2.2} />} label="Create event" />
                    <QuickAction href="/dashboard" icon={<Users size={15} strokeWidth={1.8} />} label="View registrations" />
                    {org.firstLiveSlug && <QuickAction href={`/events/${org.firstLiveSlug}/check-in`} icon={<ScanLine size={15} strokeWidth={1.8} />} label="Check-in scanner" />}
                  </div>
                </SectionCard>
              )}

              {org && (
                <SectionCard title="Recent activity">
                  {org.recent.length === 0 ? (
                    <div className="px-3 py-4 text-[13px] text-center" style={{ color: '#6B7A72' }}>No activity yet.</div>
                  ) : (
                    <div className="space-y-0.5">
                      {org.recent.map((r) => (
                        <div key={r.id} className="flex items-center gap-3 px-3 py-2">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: r.amount > 0 ? '#2D7A4F' : '#1F4D3A' }} />
                          <div className="min-w-0 flex-1 text-[13px]">
                            <span className="font-medium" style={{ color: '#0F1F18' }}>{r.name}</span>
                            <span style={{ color: '#6B7A72' }}> · {r.event}</span>
                          </div>
                          {r.amount > 0 && <span className="text-[12.5px] font-medium shrink-0" style={{ color: '#2D7A4F' }}>{formatRevenue(r.amount, 'USD')}</span>}
                          <span className="text-[11.5px] shrink-0" style={{ color: '#9BA8A1' }}>{timeAgo(r.when)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>
              )}

              {!org && sections.tickets && (
                <SectionCard title="Your stuff">
                  <div className="space-y-0.5">
                    <QuickAction href="/my-cards" icon={<IdCard size={15} strokeWidth={1.8} />} label="My Cards" />
                    <QuickAction href="/saved" icon={<Heart size={15} strokeWidth={1.8} />} label="Saved events" />
                    <QuickAction href="/discover" icon={<Compass size={15} strokeWidth={1.8} />} label="Discover events" />
                  </div>
                </SectionCard>
              )}
            </div>
          </div>

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
    <Link href={href} className="flex items-center gap-3 bg-white rounded-2xl border p-4 transition-colors hover:border-[#1F4D3A]/40" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
      <span className="grid place-items-center w-10 h-10 rounded-xl shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>{icon}</span>
      <div className="min-w-0">
        <div className="text-[14px] font-semibold" style={{ color: '#0F1F18' }}>{label}</div>
        <div className="text-[12px]" style={{ color: '#6B7A72' }}>{desc}</div>
      </div>
    </Link>
  );
}
