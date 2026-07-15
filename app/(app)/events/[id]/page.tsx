export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, CalendarDays, ExternalLink, FileDown, MapPin, Wifi,
} from 'lucide-react';
import EventDetailActions from './EventDetailActions';
import { EventOverviewCards, type OverviewCard } from '@/components/events/EventOverviewCards';
import { EventCompletionCard, type ChecklistItem } from '@/components/events/EventCompletionCard';
import type { Zone, Variant } from '@/types/database';
import { resolveEventRef } from '@/lib/events/resolveEventRef';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getInitials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

const AVATAR_COLORS = ['#1F4D3A', '#2A6A50', '#163828', '#3A6B8C', '#0F1F18'];

const STATUS_STYLE = {
  published: { label: 'Live',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: '#2D7A4F', pulse: true  },
  draft:     { label: 'Draft',    cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: '#C9A45E', pulse: false },
  archived:  { label: 'Archived', cls: 'bg-[#FAF6EE] text-[#65736B] border-[#E5E0D4]',     dot: '#65736B', pulse: false },
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<import('next').Metadata> {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  return {
    title: _ev?.name ?? 'Event Overview',
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const slug = _ev.slug;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const [
    { data: event },
    { data: variantsData },
    { data: recentRegs },
    { data: revData },
    { count: regCount },
    { count: checkedInCount },
    { count: sessionCount },
    { count: speakerCount },
    { count: ticketTypeCount },
    { data: profile },
  ] = await Promise.all([
    admin.from('events').select('id, name, slug, status, view_count, download_count, user_id, created_at, event_pages(starts_at, ends_at, venue_name, is_online)').eq('id', id).eq('user_id', user.id).single(),
    admin.from('event_variants').select('id, variant_name, variant_slug, background_url, background_width, background_height, zones, position').eq('event_id', id).order('position', { ascending: true }),
    admin.from('registrations').select('id, attendee_name, status, created_at').eq('event_id', id).order('created_at', { ascending: false }).limit(5),
    admin.from('registrations').select('amount_paid, currency').eq('event_id', id).in('status', ['confirmed', 'checked_in']),
    admin.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id).in('status', ['confirmed', 'checked_in']),
    admin.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id).eq('status', 'checked_in'),
    admin.from('sessions').select('id', { count: 'exact', head: true }).eq('event_id', id),
    admin.from('speakers').select('id', { count: 'exact', head: true }).eq('event_id', id),
    admin.from('ticket_types').select('id', { count: 'exact', head: true }).eq('event_id', id),
    admin.from('profiles').select('plan').eq('id', user.id).single(),
  ]);

  if (!event) redirect('/dashboard');

  const variants = (variantsData ?? []) as unknown as Variant[];
  const firstVariant = variants[0];
  // zones used indirectly via firstVariant check below
  void (firstVariant?.zones as unknown as Zone[]);

  const totalRevenue = (revData ?? []).reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
  const revCurrencies = new Set((revData ?? []).map(r => r.currency).filter(Boolean) as string[]);
  const revCurrency = revCurrencies.size === 1 ? Array.from(revCurrencies)[0] : null;
  const revenueDisplay = totalRevenue > 0 && revCurrency
    ? (() => { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: revCurrency, minimumFractionDigits: 0 }).format(totalRevenue); } catch { return `${revCurrency} ${totalRevenue.toLocaleString()}`; } })()
    : '—';
  const registrations = regCount ?? 0;
  const checkedIn = checkedInCount ?? 0;
  const checkInRate = registrations > 0 ? Math.round((checkedIn / registrations) * 100) : 0;
  const sessions = sessionCount ?? 0;
  const speakers = speakerCount ?? 0;
  const ticketTypes = ticketTypeCount ?? 0;

  const st = STATUS_STYLE[event.status as keyof typeof STATUS_STYLE] ?? STATUS_STYLE.draft;

  const epOverview = Array.isArray(event.event_pages) ? event.event_pages[0] : event.event_pages;
  const CHECKLIST: ChecklistItem[] = [
    { label: 'Event details & page', done: !!(epOverview?.starts_at), href: `/events/${slug}/event-page`, cta: 'Set up' },
    { label: 'Eventera Card design',    done: !!firstVariant,             href: `/events/${slug}/edit`,       cta: 'Upload' },
    { label: 'Tickets',              done: ticketTypes > 0,            href: `/events/${slug}/tickets`,    cta: 'Add' },
    { label: 'Agenda & sessions',    done: sessions > 0,               href: `/events/${slug}/agenda`,     cta: 'Build', optional: true },
    { label: 'Speakers',             done: speakers > 0,               href: `/events/${slug}/speakers`,   cta: 'Add', optional: true },
  ];

  const ACTION_CARDS: OverviewCard[] = [
    { id: 'event-page',     label: 'Event Page',     iconId: 'layout',    desc: 'Edit your public event page',               href: `/events/${slug}/event-page`,     badge: event.status === 'published' ? 'Published' : 'Draft', badgeGreen: event.status === 'published' },
    { id: 'tickets',        label: 'Tickets',        iconId: 'ticket',    desc: 'Manage ticket types and pricing',            href: `/events/${slug}/tickets`,        badge: ticketTypes > 0 ? `${ticketTypes} ticket type${ticketTypes !== 1 ? 's' : ''}` : null },
    { id: 'registrations',  label: 'Registrations',  iconId: 'users',     desc: 'View and manage attendees',                 href: `/events/${slug}/registrations`,  badge: registrations > 0 ? `${registrations.toLocaleString()} registered` : null },
    { id: 'agenda',         label: 'Agenda',         iconId: 'calendar',  desc: 'Build your event schedule',                 href: `/events/${slug}/agenda`,         badge: sessions > 0 ? `${sessions} session${sessions !== 1 ? 's' : ''}` : null },
    { id: 'speakers',       label: 'Speakers',       iconId: 'user',      desc: 'Manage speakers and sessions',              href: `/events/${slug}/speakers`,       badge: speakers > 0 ? `${speakers} speaker${speakers !== 1 ? 's' : ''}` : null },
    { id: 'abstracts',      label: 'Abstracts',      iconId: 'audit',     desc: 'Review call-for-papers submissions',        href: `/events/${slug}/abstracts`,      badge: null },
    { id: 'check-in',       label: 'Check-in',       iconId: 'scan',      desc: 'Scan attendees at the door',                href: `/events/${slug}/check-in`,       badge: event.status === 'published' ? `${checkInRate}% checked in` : 'Go live →' },
    { id: 'entitlements',   label: 'Passes & access',iconId: 'entitlements', desc: 'Meals, sessions, merch — scannable passes', href: `/events/${slug}/entitlements`,   badge: null },
    { id: 'redemption',     label: 'Live redemption',iconId: 'redemption',desc: 'Watch passes get scanned in real time',     href: `/events/${slug}/analytics/redemption`, badge: null },
    { id: 'multiday',       label: 'Multi-day',      iconId: 'multiday',  desc: 'Per-day check-in, capacity and passes',     href: `/events/${slug}/settings/days`,  badge: null },
    { id: 'catering',       label: 'Catering',       iconId: 'catering',  desc: 'Meal counts and dietary breakdown',         href: `/events/${slug}/catering`,       badge: null },
    { id: 'audit',          label: 'Audit log',      iconId: 'audit',     desc: 'Every pass action, fully traceable',        href: `/events/${slug}/analytics/audit`, badge: null },
    { id: 'networking',     label: 'Networking',     iconId: 'network',   desc: 'Attendee connections and matchmaking',      href: `/e/${event.slug}/people`,        badge: null, minPlan: 'pro' },
    { id: 'q-and-a',        label: 'Q&A & Polls',    iconId: 'message',   desc: 'Live session engagement',                  href: `/events/${slug}/q-and-a`,        badge: null, minPlan: 'pro' },
    { id: 'gamification',   label: 'Gamification',   iconId: 'trophy',    desc: 'Points and leaderboard for attendees',      href: `/events/${slug}/gamification`,   badge: null, minPlan: 'pro' },
    { id: 'sponsors',       label: 'Sponsors',       iconId: 'briefcase', desc: 'Manage sponsors and exhibitors',            href: `/events/${slug}/sponsors`,       badge: null, minPlan: 'studio' },
    { id: 'virtual',        label: 'Virtual',        iconId: 'video',     desc: 'Stream sessions online',                   href: `/events/${slug}/virtual`,        badge: null, minPlan: 'studio' },
    { id: 'analytics',      label: 'Analytics',      iconId: 'chart',     desc: 'Registration funnel and engagement data',  href: `/events/${slug}/analytics`,      badge: 'View →' },
    { id: 'eventera-card',     label: 'Eventera Card',     iconId: 'sparkles',  desc: 'The personalized card every attendee gets', href: `/events/${slug}/eventera-card`,    badge: (event.download_count ?? 0) > 0 ? `${event.download_count} downloaded` : null, gold: true },
    { id: 'communications', label: 'Communications', iconId: 'bell',      desc: 'Email your attendees and send updates',     href: `/events/${slug}/communications`, badge: null },
  ];

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>

      {/* ── Cover hero ── */}
      <div className="relative" style={{ background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)', minHeight: 190 }}>
        <svg aria-hidden viewBox="0 0 1200 190" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" style={{ opacity: 0.08 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <path key={i} d={`M -40 ${30 + i * 32} Q 320 ${-8 + i * 32} 640 ${60 + i * 32} T 1280 ${36 + i * 32}`} fill="none" stroke="#E8C57E" strokeWidth="1.5" />
          ))}
        </svg>
        <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-5 flex flex-col justify-end">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
            <div>
              <span className={`inline-flex items-center gap-1.5 text-[12px] tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border bg-[#FAF6EE]/95 mb-3 ${st.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.pulse ? 'animate-pulse' : ''}`} style={{ background: st.dot }} />
                {st.label}
              </span>
              <h1 className="font-display text-[26px] sm:text-[32px] font-bold text-[#FAF6EE] tracking-[-0.02em] leading-tight">
                {event.name}
              </h1>
              {(() => {
                const ep = Array.isArray(event.event_pages) ? event.event_pages[0] : event.event_pages;
                if (!ep) return null;
                return (
                  <div className="flex items-center gap-2.5 mt-2  text-[12.5px]" style={{ color: 'rgba(250,246,238,0.75)' }}>
                    {ep.starts_at && (
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays size={12} strokeWidth={1.8} />
                        {new Date(ep.starts_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    {ep.starts_at && (ep.venue_name || ep.is_online) && (
                      <span style={{ color: 'rgba(250,246,238,0.35)' }}>·</span>
                    )}
                    {(ep.venue_name || ep.is_online) && (
                      <span className="inline-flex items-center gap-1.5">
                        {ep.is_online ? <Wifi size={12} strokeWidth={1.8} /> : <MapPin size={12} strokeWidth={1.8} />}
                        {ep.is_online ? 'Online' : ep.venue_name}
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center gap-2 shrink-0 sm:pb-0.5">
              <EventDetailActions eventId={id} eventName={event.name} status={event.status} />
              {event.status === 'published' && (
                <a href={`/e/${event.slug}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 h-10 px-3.5 text-[13px] font-semibold rounded-lg border transition-colors hover:bg-white/20"
                  style={{ background: 'rgba(255,255,255,0.12)', color: '#FAF6EE', borderColor: 'rgba(250,246,238,0.25)' }}>
                  <span>View public page</span>
                  <ExternalLink size={13} strokeWidth={2} />
                </a>
              )}
              <Link href={`/events/${slug}/publish`}
                className="inline-flex items-center gap-1.5 h-10 px-3.5 text-[13px] font-semibold rounded-lg transition"
                style={{ background: '#E8C57E', color: '#0F1F18' }}>
                {event.status === 'published' ? 'Share →' : 'Publish →'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Stats bar ── */}
        <div className="bg-white rounded-2xl border px-5 py-4"
          style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center gap-x-8 gap-y-3">
            {[
              { value: registrations.toLocaleString(), label: 'registered' },
              { value: revenueDisplay, label: 'revenue' },
              { value: checkedIn > 0 ? `${checkedIn} (${checkInRate}%)` : `${checkInRate}%`, label: 'checked in' },
              { value: (event.download_count ?? 0).toLocaleString(), label: 'cards shared' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                <span className=" text-[18px] sm:text-[20px] text-[#0F1F18] tracking-tight leading-none font-bold">{s.value}</span>
                <span className="text-[12.5px] sm:text-[13px] text-[#65736B]">{s.label}</span>
                {i < 3 && <span className="text-[#E5E0D4] hidden sm:inline ml-3">·</span>}
              </div>
            ))}
          </div>
        </div>

        {/* ── Setup completion card ── */}
        <EventCompletionCard items={CHECKLIST} status={event.status} publishHref={`/events/${slug}/publish`} />

        {/* ── Action cards grid ── */}
        <div>
          <p className="text-[12px] uppercase tracking-[0.2em] mb-4" style={{ color: '#9BA8A1' }}>
            Manage this event
          </p>
          <EventOverviewCards cards={ACTION_CARDS} userPlan={profile?.plan ?? 'free'} />
        </div>

        {/* ── Recent registrations ── */}
        {(recentRegs ?? []).length > 0 && (
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E0D4' }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E5E0D4' }}>
              <span className=" text-[12px] tracking-[0.2em] uppercase" style={{ color: '#65736B' }}>Recent registrations</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[12.5px] text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {registrations} total
                </span>
                <a href={`/api/events/${id}/export`} download
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-[12px] font-medium transition hover:bg-[#FAF6EE]"
                  style={{ borderColor: '#E5E0D4', color: '#1F4D3A' }}>
                  <FileDown size={12} strokeWidth={2.2} />
                  Export
                </a>
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: '#F0EDE7' }}>
              {(recentRegs ?? []).map((reg, i) => (
                <div key={reg.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#FAF6EE] transition">
                  <div className="h-8 w-8 rounded-full grid place-items-center text-white text-[12.5px] font-bold shrink-0"
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                    {getInitials(reg.attendee_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ color: '#0F1F18' }}>{reg.attendee_name ?? 'Anonymous'}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {reg.status === 'checked_in' && (
                      <span className="text-[12px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(45,122,79,0.1)', color: '#2D7A4F' }}>Checked in</span>
                    )}
                    <span className="text-[12.5px]" style={{ color: '#65736B' }}>{timeAgo(reg.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
            {registrations > 5 && (
              <div className="px-5 py-3 border-t" style={{ borderColor: '#F0EDE7' }}>
                <Link href={`/events/${slug}/registrations`} className="text-[12.5px] font-medium inline-flex items-center gap-1" style={{ color: '#1F4D3A' }}>
                  View all {registrations} registrations <ArrowRight size={12} strokeWidth={2} />
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
