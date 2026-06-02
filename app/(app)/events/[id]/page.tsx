export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Pencil, Users, ArrowRight, ScanLine, FileDown,
  Layout, Ticket, LayoutGrid, User, Network, MessageSquare,
  Briefcase, BarChart2, IdCard, Video, Lock, Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import CopyButton from '@/components/shared/CopyButton';
import EventDetailActions from './EventDetailActions';
import type { Zone, Variant } from '@/types/database';

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
  published: { label: 'Live',     cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: '#2D7A4F', pulse: true },
  draft:     { label: 'Draft',    cls: 'bg-amber-50 text-amber-700 border-amber-200',       dot: '#C9A45E', pulse: false },
  archived:  { label: 'Archived', cls: 'bg-[#FAF6EE] text-[#6B7A72] border-[#E5E0D4]',     dot: '#6B7A72', pulse: false },
};

const PLAN_LEVEL: Record<string, number> = { free: 0, pro: 1, studio: 2 };
const PLAN_LABEL: Record<string, string> = { pro: 'Pro', studio: 'Studio' };

type FeatureCard = {
  id: string;
  label: string;
  Icon: LucideIcon;
  desc: string;
  segment: string | null;
  minPlan: 'pro' | 'studio' | null;
  gold: boolean;
};

const FEATURE_CARDS: FeatureCard[] = [
  { id: 'event-page',    label: 'Event Page',    Icon: Layout,        desc: 'Edit your public event page',                segment: 'event-page',    minPlan: null,      gold: false },
  { id: 'tickets',       label: 'Tickets',       Icon: Ticket,        desc: 'Manage ticket types and pricing',            segment: 'tickets',       minPlan: null,      gold: false },
  { id: 'registrations', label: 'Registrations', Icon: Users,         desc: 'View and manage attendees',                 segment: 'registrations', minPlan: null,      gold: false },
  { id: 'agenda',        label: 'Agenda',         Icon: LayoutGrid,    desc: 'Build your event schedule',                 segment: 'agenda',        minPlan: null,      gold: false },
  { id: 'speakers',      label: 'Speakers',       Icon: User,          desc: 'Manage speakers and sessions',              segment: 'speakers',      minPlan: null,      gold: false },
  { id: 'check-in',      label: 'Check-in',       Icon: ScanLine,      desc: 'Scan attendees at the door',                segment: 'check-in',      minPlan: null,      gold: false },
  { id: 'networking',    label: 'Networking',     Icon: Network,       desc: 'Attendee connections and matchmaking',      segment: null,            minPlan: 'pro',     gold: false },
  { id: 'q-and-a',       label: 'Q&A & Polls',    Icon: MessageSquare, desc: 'Live session engagement',                   segment: 'engagement',    minPlan: 'pro',     gold: false },
  { id: 'sponsors',      label: 'Sponsors',       Icon: Briefcase,     desc: 'Manage sponsors and exhibitors',            segment: null,            minPlan: 'studio',  gold: false },
  { id: 'analytics',     label: 'Analytics',      Icon: BarChart2,     desc: 'Registration funnel and engagement data',   segment: 'analytics',     minPlan: null,      gold: false },
  { id: 'karta-card',    label: 'Karta Card',     Icon: IdCard,        desc: 'The personalised card every attendee gets', segment: 'edit',          minPlan: null,      gold: true  },
  { id: 'virtual',       label: 'Virtual',        Icon: Video,         desc: 'Stream sessions online',                    segment: null,            minPlan: 'studio',  gold: false },
];

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    { data: profileData },
  ] = await Promise.all([
    admin.from('events').select('id, name, slug, status, view_count, download_count, user_id, created_at').eq('id', id).eq('user_id', user.id).single(),
    admin.from('event_variants').select('id, variant_name, variant_slug, background_url, background_width, background_height, zones, position').eq('event_id', id).order('position', { ascending: true }),
    admin.from('registrations').select('id, attendee_name, status, created_at').eq('event_id', id).order('created_at', { ascending: false }).limit(5),
    admin.from('registrations').select('amount_paid').eq('event_id', id).in('status', ['confirmed', 'checked_in']),
    admin.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id).in('status', ['confirmed', 'checked_in']),
    admin.from('registrations').select('id', { count: 'exact', head: true }).eq('event_id', id).eq('status', 'checked_in'),
    admin.from('profiles').select('plan').eq('id', user.id).single(),
  ]);

  if (!event) redirect('/dashboard');

  const variants = (variantsData ?? []) as unknown as Variant[];
  const firstVariant = variants[0];
  const zones = (firstVariant?.zones as unknown as Zone[]) ?? [];
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/c/${event.slug}`;

  const totalRevenue = (revData ?? []).reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
  const registrations = regCount ?? 0;
  const checkedIn = checkedInCount ?? 0;
  const checkInRate = registrations > 0 ? Math.round((checkedIn / registrations) * 100) : 0;

  const userPlan = profileData?.plan ?? 'free';
  const userPlanLevel = PLAN_LEVEL[userPlan] ?? 0;

  const st = STATUS_STYLE[event.status as keyof typeof STATUS_STYLE] ?? STATUS_STYLE.draft;

  const actionItems: { text: string; cta: string; href: string; accent?: boolean }[] = [];
  if (event.status === 'draft') {
    actionItems.push({ text: 'This event is still a draft — publish it to open registration.', cta: 'Publish event', href: `/events/${id}/publish`, accent: true });
  }
  if (!firstVariant) {
    actionItems.push({ text: 'No card design uploaded yet.', cta: 'Upload design', href: `/events/${id}/edit` });
  } else if (zones.length === 0) {
    actionItems.push({ text: 'No editable zones defined on the card.', cta: 'Open editor', href: `/events/${id}/edit` });
  }

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>

      {/* ── Cover header ── */}
      <div className="relative" style={{ background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)', paddingBottom: '28px' }}>
        <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(60% 120% at 90% 0%, rgba(232,197,126,0.28), transparent 55%)' }} />
        <svg aria-hidden viewBox="0 0 1200 176" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" style={{ opacity: 0.08 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <path key={i} d={`M -40 ${36 + i * 36} Q 320 ${-8 + i * 36} 640 ${66 + i * 36} T 1280 ${40 + i * 36}`} fill="none" stroke="#E8C57E" strokeWidth="1.5" />
          ))}
        </svg>
        <div className="relative max-w-[1100px] mx-auto px-6 lg:px-8 pt-7">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <span className={`self-start inline-flex items-center gap-1.5 text-[10px] font-mono tracking-[0.1em] uppercase px-2 py-0.5 rounded-full border bg-[#FAF6EE]/95 mb-3 ${st.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.pulse ? 'animate-pulse' : ''}`} style={{ background: st.dot }} />
                {st.label}
              </span>
              <h1 className="font-display text-[26px] sm:text-[30px] font-bold text-[#FAF6EE] tracking-[-0.02em] leading-tight">
                {event.name}
              </h1>
              <div className="flex items-center gap-2 mt-1.5 font-mono text-[12px] text-[#FAF6EE]/60">
                <span>/{event.slug}</span>
                <span className="text-[#FAF6EE]/30">·</span>
                <span>{variants.length} variant{variants.length !== 1 ? 's' : ''}</span>
                <span className="text-[#FAF6EE]/30">·</span>
                <span>{zones.length} zones</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 pb-0.5">
              <EventDetailActions eventId={id} eventName={event.name} status={event.status} />
              <Link href={`/events/${id}/edit`}
                className="inline-flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium rounded-lg transition border border-white/20 text-white/80 hover:text-white hover:border-white/40 hover:bg-white/[0.08]">
                <Pencil size={13} strokeWidth={1.8} />
                Edit zones
              </Link>
              <Link href={`/events/${id}/publish`}
                className="inline-flex items-center gap-1.5 h-8 px-3.5 text-[13px] font-semibold rounded-lg transition"
                style={{ background: '#E8C57E', color: '#0F1F18' }}>
                {event.status === 'published' ? 'Share →' : 'Publish →'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-7 space-y-6">

        {/* ── Stats bar ── */}
        <div className="bg-white rounded-2xl border px-6 py-4 flex flex-wrap items-center gap-x-10 gap-y-3"
          style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
          {[
            { value: registrations.toLocaleString(), label: 'registrations' },
            { value: totalRevenue > 0 ? '$' + totalRevenue.toLocaleString() : '$0', label: 'revenue' },
            { value: `${checkInRate}%`, label: 'check-in rate' },
            { value: event.download_count.toLocaleString(), label: 'cards shared' },
          ].map((s, i) => (
            <div key={i} className="flex items-baseline gap-2">
              <span className="font-mono text-[22px] text-[#1F4D3A] tracking-tight leading-none font-bold">{s.value}</span>
              <span className="text-[13px] text-[#6B7A72]">{s.label}</span>
              {i < 3 && <span className="text-[#E5E0D4] hidden sm:inline ml-4">·</span>}
            </div>
          ))}
        </div>

        {/* ── Action banners ── */}
        {actionItems.length > 0 && (
          <div className="grid gap-2.5">
            {actionItems.map((item, i) => (
              <div key={i}
                className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 border ${item.accent ? 'border-[#E8C57E]/50' : 'bg-white border-[#E5E0D4]'}`}
                style={item.accent ? { background: 'linear-gradient(135deg, rgba(232,197,126,0.14), rgba(31,77,58,0.05))' } : undefined}>
                <span className="text-[13.5px] font-medium" style={{ color: item.accent ? '#163828' : '#3A4A42' }}>
                  {item.text}
                </span>
                <Link href={item.href}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-semibold shrink-0 transition-colors"
                  style={item.accent
                    ? { background: '#E8C57E', color: '#0F1F18' }
                    : { border: '1px solid rgba(31,77,58,0.25)', color: '#1F4D3A', background: 'transparent' }}>
                  {item.cta} <ArrowRight size={13} strokeWidth={2} />
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* ── Feature cards grid ── */}
        <div>
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#6B7A72] mb-3">Manage this event</div>
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURE_CARDS.map(card => {
              const locked = card.minPlan
                ? userPlanLevel < (PLAN_LEVEL[card.minPlan] ?? 0)
                : false;
              const href = !locked && card.segment
                ? `/events/${id}/${card.segment}`
                : null;

              const iconEl = (
                <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
                  style={card.gold
                    ? { background: 'rgba(232,197,126,0.25)', color: '#C9A45E' }
                    : { background: '#E8EFEB', color: '#1F4D3A' }}>
                  <card.Icon size={20} strokeWidth={1.7} />
                </span>
              );

              const badge = locked && card.minPlan ? (
                <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.12em] uppercase px-1.5 py-1 rounded font-semibold shrink-0"
                  style={{ background: 'rgba(232,197,126,0.2)', color: '#C9A45E' }}>
                  <Lock size={9} strokeWidth={2} /> {PLAN_LABEL[card.minPlan]}
                </span>
              ) : null;

              const body = (
                <>
                  <div className="flex items-start justify-between mb-3">
                    {iconEl}
                    {badge}
                  </div>
                  <div className="font-display text-[15px] font-semibold tracking-tight flex items-center gap-1.5"
                    style={{ color: card.gold ? '#C9A45E' : '#0F1F18' }}>
                    {card.label}
                    {card.gold && <Sparkles size={11} strokeWidth={1.8} style={{ color: '#C9A45E' }} />}
                  </div>
                  <p className="text-[13px] mt-1 leading-[1.5]" style={{ color: '#3A4A42' }}>{card.desc}</p>
                </>
              );

              const baseStyle = card.gold
                ? { background: 'linear-gradient(135deg, rgba(232,197,126,0.16), rgba(31,77,58,0.06))', borderColor: 'rgba(232,197,126,0.6)' }
                : { background: 'white', borderColor: '#E5E0D4' };

              if (!href) {
                return (
                  <div key={card.id} className="rounded-2xl border p-5"
                    style={{ ...baseStyle, opacity: locked ? 0.6 : 1 }}>
                    {body}
                  </div>
                );
              }

              return (
                <Link key={card.id} href={href}
                  className="group rounded-2xl border p-5 block transition-all hover:-translate-y-0.5"
                  style={{ ...baseStyle, textDecoration: 'none' }}>
                  {body}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Recent registrations ── */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E5E0D4' }}>
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#6B7A72]">Recent registrations</div>
            <div className="flex items-center gap-3">
              {registrations > 0 && (
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {registrations} total
                </span>
              )}
              {registrations > 0 && (
                <a href={`/api/events/${id}/export`} download
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border text-[12px] font-medium transition hover:bg-[#FAF6EE]"
                  style={{ borderColor: '#E5E0D4', color: '#1F4D3A' }}>
                  <FileDown size={12} strokeWidth={2.2} />
                  Export
                </a>
              )}
            </div>
          </div>

          {(recentRegs ?? []).length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="text-[13px] text-[#6B7A72]">No registrations yet.</div>
              {event.status === 'published' ? (
                <div className="mt-1 text-[12.5px] text-[#6B7A72]">Share the link to start seeing activity.</div>
              ) : (
                <Link href={`/events/${id}/publish`} className="mt-3 inline-block text-[13px] text-[#1F4D3A] font-medium hover:underline">
                  Publish to start →
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="divide-y" style={{ borderColor: '#F0EDE7' }}>
                {(recentRegs ?? []).map((reg, i) => (
                  <div key={reg.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#FAF6EE] transition">
                    <div className="h-8 w-8 rounded-full grid place-items-center text-white text-[11px] font-bold shrink-0"
                      style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                      {getInitials(reg.attendee_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-[#0F1F18] truncate">{reg.attendee_name ?? 'Anonymous'}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {reg.status === 'checked_in' && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(45,122,79,0.1)', color: '#2D7A4F' }}>Checked in</span>
                      )}
                      <span className="text-[11px] text-[#6B7A72]">{timeAgo(reg.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
              {registrations > 5 && (
                <div className="px-5 py-3 border-t" style={{ borderColor: '#F0EDE7' }}>
                  <Link href={`/events/${id}/registrations`} className="text-[12.5px] font-medium text-[#1F4D3A] hover:underline inline-flex items-center gap-1">
                    View all {registrations} registrations <ArrowRight size={12} strokeWidth={2} />
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Share link ── */}
        {event.status === 'published' && (
          <div className="bg-white rounded-2xl border p-4 space-y-3" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#6B7A72]">Share link</div>
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#3A4A42] bg-[#FAF6EE] border rounded-lg px-3 py-2"
              style={{ borderColor: '#E5E0D4' }}>
              <span className="flex-1 truncate">{shareUrl}</span>
              <CopyButton text={shareUrl} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <a href={`https://wa.me/?text=${encodeURIComponent(`Get your personalised card: ${shareUrl}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="py-1.5 rounded-lg text-[11px] font-medium text-white text-center transition hover:opacity-90"
                style={{ background: '#25D366' }}>WhatsApp</a>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Get your personalised card: ${shareUrl}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="py-1.5 rounded-lg text-[11px] font-medium text-white text-center bg-black transition hover:opacity-90">X</a>
              <a href={shareUrl} target="_blank" rel="noopener noreferrer"
                className="py-1.5 rounded-lg text-[11px] font-medium text-center border transition hover:bg-[#FAF6EE]"
                style={{ borderColor: '#E5E0D4', color: '#1F4D3A' }}>Preview ↗</a>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
