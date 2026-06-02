export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Pencil, Download, LayoutGrid, Globe, Users, Ticket,
  ScanLine, CalendarDays, User, BarChart2, IdCard, ArrowRight,
  FileDown, Eye,
} from 'lucide-react';
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

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: variantsData }, { data: recentCards }] = await Promise.all([
    admin.from('events').select('id, name, slug, status, view_count, download_count, user_id, created_at').eq('id', id).eq('user_id', user.id).single(),
    admin.from('event_variants').select('id, variant_name, variant_slug, background_url, background_width, background_height, zones, position').eq('event_id', id).order('position', { ascending: true }),
    admin.from('generated_cards').select('id, attendee_name, attendee_data, created_at').eq('event_id', id).order('created_at', { ascending: false }).limit(6),
  ]);

  if (!event) redirect('/dashboard');

  const variants = (variantsData ?? []) as unknown as Variant[];
  const firstVariant = variants[0];
  const zones = (firstVariant?.zones as unknown as Zone[]) ?? [];
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/c/${event.slug}`;
  const activity = recentCards ?? [];

  const conversionPct = event.view_count > 0
    ? Math.round((event.download_count / event.view_count) * 100)
    : 0;

  const st = STATUS_STYLE[event.status as keyof typeof STATUS_STYLE] ?? STATUS_STYLE.draft;

  // Action items
  const actionItems: { text: string; cta: string; href: string; accent?: boolean }[] = [];
  if (event.status === 'draft') {
    actionItems.push({ text: 'This event is still a draft — publish it to open registration.', cta: 'Publish event', href: `/events/${id}/publish`, accent: true });
  }
  if (!firstVariant) {
    actionItems.push({ text: 'No card design uploaded yet.', cta: 'Upload design', href: `/events/${id}/edit` });
  } else if (zones.length === 0) {
    actionItems.push({ text: 'No editable zones defined on the card.', cta: 'Open editor', href: `/events/${id}/edit` });
  }

  // Feature grid cards
  const featureCards = [
    {
      id: 'karta-card', label: 'Karta Card', icon: <IdCard size={20} strokeWidth={1.7} />,
      desc: 'The personalized card every attendee gets.',
      status: `${event.download_count} downloaded`, href: `/events/${id}/edit`, gold: true,
    },
    {
      id: 'registrations', label: 'Registrations', icon: <Users size={20} strokeWidth={1.7} />,
      desc: 'View and manage attendees who generated a card.',
      status: `${event.download_count} total`, href: `/events/${id}/registrations`,
    },
    {
      id: 'event-page', label: 'Event Page', icon: <Globe size={20} strokeWidth={1.7} />,
      desc: 'Edit your public event page and settings.',
      status: event.status === 'published' ? 'Published' : 'Draft', href: `/events/${id}/event-page`,
    },
    {
      id: 'tickets', label: 'Tickets', icon: <Ticket size={20} strokeWidth={1.7} />,
      desc: 'Manage ticket types and pricing.',
      status: null, href: `/events/${id}/tickets`,
    },
    {
      id: 'agenda', label: 'Agenda', icon: <CalendarDays size={20} strokeWidth={1.7} />,
      desc: 'Build and manage the event schedule.',
      status: null, href: `/events/${id}/agenda`,
    },
    {
      id: 'speakers', label: 'Speakers', icon: <User size={20} strokeWidth={1.7} />,
      desc: 'Manage speakers and their sessions.',
      status: null, href: `/events/${id}/speakers`,
    },
    {
      id: 'sessions', label: 'Sessions', icon: <LayoutGrid size={20} strokeWidth={1.7} />,
      desc: 'Individual sessions and breakout rooms.',
      status: null, href: `/events/${id}/sessions`,
    },
    {
      id: 'check-in', label: 'Check-in', icon: <ScanLine size={20} strokeWidth={1.7} />,
      desc: 'Scan attendees at the door.',
      status: 'Go live →', href: `/events/${id}/check-in`,
    },
    {
      id: 'analytics', label: 'Analytics', icon: <BarChart2 size={20} strokeWidth={1.7} />,
      desc: 'Registration funnel and engagement data.',
      status: 'View →', href: `/events/${id}/analytics`,
    },
  ];

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>

      {/* ── Cover header ── */}
      <div className="relative h-[176px]" style={{ background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)' }}>
        <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(60% 120% at 90% 0%, rgba(232,197,126,0.28), transparent 55%)' }} />
        <svg aria-hidden viewBox="0 0 1200 176" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" style={{ opacity: 0.08 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <path key={i} d={`M -40 ${36 + i * 36} Q 320 ${-8 + i * 36} 640 ${66 + i * 36} T 1280 ${40 + i * 36}`} fill="none" stroke="#E8C57E" strokeWidth="1.5" />
          ))}
        </svg>
        <div className="relative max-w-[1100px] mx-auto px-6 lg:px-8 h-full flex flex-col justify-end pb-5">
          {/* Status + actions row */}
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

      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-7">

        {/* ── Quick stats strip ── */}
        <div className="bg-white rounded-2xl border px-6 py-4 mb-6 flex flex-wrap items-center gap-x-8 gap-y-3"
          style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
          {[
            { value: event.view_count.toLocaleString(), label: 'page views', icon: <Eye size={14} strokeWidth={1.8} /> },
            { value: event.download_count.toLocaleString(), label: 'cards generated', icon: <Download size={14} strokeWidth={1.8} /> },
            { value: `${conversionPct}%`, label: 'conversion', icon: <BarChart2 size={14} strokeWidth={1.8} /> },
            { value: activity.length.toString(), label: 'recent activity', icon: <Users size={14} strokeWidth={1.8} /> },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[20px] text-[#1F4D3A] tracking-tight leading-none">{s.value}</span>
                <span className="text-[13px] text-[#6B7A72]">{s.label}</span>
              </div>
              {i < 3 && <span className="text-[#E5E0D4] hidden sm:inline">·</span>}
            </div>
          ))}
        </div>

        {/* ── Action items ── */}
        {actionItems.length > 0 && (
          <div className="mb-6 grid gap-2.5">
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

        {/* ── Feature grid ── */}
        <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#6B7A72] mb-3">Manage this event</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {featureCards.map(card => (
            <Link key={card.id} href={card.href}
              className={`group text-left rounded-2xl border p-5 transition-all hover:-translate-y-0.5 ${card.gold ? 'border-[#E8C57E]/60 hover:border-[#E8C57E]' : 'bg-white border-[#E5E0D4] hover:border-[#1F4D3A]/40'}`}
              style={card.gold ? { background: 'linear-gradient(135deg, rgba(232,197,126,0.16), rgba(31,77,58,0.06))' } : { boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
              <div className="flex items-start justify-between mb-3">
                <span className={`w-10 h-10 rounded-xl grid place-items-center ${card.gold ? 'bg-[#E8C57E]/25 text-[#C9A45E]' : 'bg-[#E8EFEB] text-[#1F4D3A]'}`}>
                  {card.icon}
                </span>
                {card.status && (
                  <span className={`font-mono text-[10px] tracking-[0.08em] ${card.gold ? 'text-[#C9A45E]' : 'text-[#6B7A72]'}`}>
                    {card.status}
                  </span>
                )}
              </div>
              <div className={`font-display text-[15px] font-semibold tracking-tight flex items-center gap-1.5 ${card.gold ? 'text-[#C9A45E]' : 'text-[#0F1F18]'}`}>
                {card.label}
              </div>
              <p className="text-[13px] text-[#6B7A72] mt-1 leading-[1.5]">{card.desc}</p>
            </Link>
          ))}
        </div>

        {/* ── Share link + recent activity ── */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* Share link */}
          <div className="bg-white rounded-2xl border p-5" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#6B7A72] mb-4">
              {event.status === 'published' ? 'Share link' : 'Ready to share?'}
            </div>
            {event.status === 'published' ? (
              <>
                <div className="flex items-center gap-2 font-mono text-[12px] text-[#3A4A42] bg-[#FAF6EE] border rounded-lg px-3 py-2 mb-4"
                  style={{ borderColor: '#E5E0D4' }}>
                  <span className="flex-1 truncate">{shareUrl}</span>
                  <CopyButton text={shareUrl} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <a href={`https://wa.me/?text=${encodeURIComponent(`Get your personalised card: ${shareUrl}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="py-2 rounded-lg text-[12px] font-medium text-white text-center transition hover:opacity-90"
                    style={{ background: '#25D366' }}>WhatsApp</a>
                  <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Get your personalised card: ${shareUrl}`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="py-2 rounded-lg text-[12px] font-medium text-white text-center bg-black transition hover:opacity-90">X</a>
                  <a href={shareUrl} target="_blank" rel="noopener noreferrer"
                    className="py-2 rounded-lg text-[12px] font-medium text-center border transition hover:bg-[#FAF6EE]"
                    style={{ borderColor: '#E5E0D4', color: '#1F4D3A' }}>Preview ↗</a>
                </div>
              </>
            ) : (
              <div>
                <p className="text-[13px] text-[#6B7A72] mb-4">Publish to get a shareable link attendees can open on their phone.</p>
                <Link href={`/events/${id}/publish`}
                  className="inline-flex items-center gap-1.5 h-9 px-4 text-white text-[13px] font-semibold rounded-lg transition hover:opacity-90"
                  style={{ background: '#1F4D3A' }}>
                  Publish &amp; share →
                </Link>
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
            <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E5E0D4' }}>
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#6B7A72]">Recent activity</div>
              <div className="flex items-center gap-3">
                {activity.length > 0 && (
                  <span className="flex items-center gap-1.5 text-[11px] text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {activity.length} recent
                  </span>
                )}
                {event.download_count > 0 && (
                  <a href={`/api/events/${id}/export`} download
                    className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg border text-[12px] font-medium transition hover:bg-[#FAF6EE]"
                    style={{ borderColor: '#E5E0D4', color: '#1F4D3A' }}>
                    <FileDown size={12} strokeWidth={2.2} />
                    Export CSV
                  </a>
                )}
              </div>
            </div>
            {activity.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="text-[13px] text-[#6B7A72]">No cards generated yet.</div>
                {event.status === 'published' ? (
                  <div className="mt-1 text-[12.5px] text-[#6B7A72]">Share the link to start seeing activity here.</div>
                ) : (
                  <Link href={`/events/${id}/publish`} className="mt-3 inline-block text-[13px] text-[#1F4D3A] font-medium hover:underline">
                    Publish to start →
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#E5E0D4' }}>
                {activity.map((card, i) => {
                  const attendeeData = (card.attendee_data ?? {}) as Record<string, string>;
                  const location = Object.values(attendeeData).find(v => typeof v === 'string' && v.includes(',')) ?? null;
                  return (
                    <div key={card.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#FAF6EE] transition">
                      <div className="h-9 w-9 rounded-full grid place-items-center text-white text-[12px] font-bold shrink-0"
                        style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                        {getInitials(card.attendee_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-[#0F1F18] truncate">{card.attendee_name ?? 'Anonymous'}</div>
                        {location && <div className="text-[11px] text-[#6B7A72] truncate">{location}</div>}
                      </div>
                      <span className="text-[11px] text-[#6B7A72] shrink-0">{timeAgo(card.created_at)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
