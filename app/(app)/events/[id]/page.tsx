export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Pencil, Users, ArrowRight, Globe, ScanLine, FileDown,
} from 'lucide-react';
import CopyButton from '@/components/shared/CopyButton';
import EventDetailActions from './EventDetailActions';
import { OverviewCards } from './OverviewCards';
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

  const [{ data: event }, { data: variantsData }, { data: recentRegs }, { data: revData }, { count: regCount }, { count: checkedInCount }, { data: profile }] = await Promise.all([
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

  const st   = STATUS_STYLE[event.status as keyof typeof STATUS_STYLE] ?? STATUS_STYLE.draft;
  const plan = profile?.plan ?? 'free';

  // Action banners
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

        {/* ── Feature overview grid ── */}
        <OverviewCards
          eventId={id}
          plan={plan}
          registered={registrations}
          cards={event.download_count ?? 0}
        />

        {/* ── Main content: recent registrations + quick links ── */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">

          {/* Recent registrations */}
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

          {/* Quick links */}
          <div className="space-y-3">
            {[
              {
                label: 'View all registrations',
                desc: 'Attendee list, check-in status, exports.',
                href: `/events/${id}/registrations`,
                icon: <Users size={18} strokeWidth={1.7} />,
              },
              {
                label: 'Edit event page',
                desc: 'Public page, date, venue, description.',
                href: `/events/${id}/event-page`,
                icon: <Globe size={18} strokeWidth={1.7} />,
              },
              {
                label: 'Open check-in',
                desc: 'QR scanner for attendees at the door.',
                href: `/events/${id}/check-in`,
                icon: <ScanLine size={18} strokeWidth={1.7} />,
              },
            ].map(card => (
              <Link key={card.label} href={card.href}
                className="group flex items-start gap-3 bg-white rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:border-[#1F4D3A]/40"
                style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)', textDecoration: 'none' }}>
                <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0 mt-0.5" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                  {card.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[14px] font-semibold text-[#0F1F18]">{card.label}</div>
                  <p className="text-[12px] text-[#6B7A72] mt-0.5 leading-snug">{card.desc}</p>
                </div>
                <ArrowRight size={14} strokeWidth={2} className="shrink-0 mt-1 text-[#C9C3B1] group-hover:text-[#1F4D3A] transition-colors" />
              </Link>
            ))}

            {/* Share link */}
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

      </div>
    </div>
  );
}
