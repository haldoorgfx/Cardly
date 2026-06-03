export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import EventDetailActions from './EventDetailActions';
import EventFeatureGrid from '@/components/events/EventFeatureGrid';
import type { Zone, Variant } from '@/types/database';

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

  const [
    { data: event },
    { data: variantsData },
    { data: revData },
    { count: regCount },
    { count: checkedInCount },
    { data: profileData },
    { count: ticketTypesCount },
    { count: sessionsCount },
    { count: speakersCount },
  ] = await Promise.all([
    admin.from('events')
      .select('id, name, slug, status, view_count, download_count, user_id, created_at')
      .eq('id', id).eq('user_id', user.id).single(),
    admin.from('event_variants')
      .select('id, variant_name, zones, position')
      .eq('event_id', id).order('position', { ascending: true }),
    admin.from('registrations')
      .select('amount_paid').eq('event_id', id).in('status', ['confirmed', 'checked_in']),
    admin.from('registrations')
      .select('id', { count: 'exact', head: true }).eq('event_id', id).in('status', ['confirmed', 'checked_in']),
    admin.from('registrations')
      .select('id', { count: 'exact', head: true }).eq('event_id', id).eq('status', 'checked_in'),
    admin.from('profiles').select('plan').eq('id', user.id).single(),
    admin.from('ticket_types')
      .select('id', { count: 'exact', head: true }).eq('event_id', id),
    admin.from('sessions')
      .select('id', { count: 'exact', head: true }).eq('event_id', id),
    admin.from('speakers')
      .select('id', { count: 'exact', head: true }).eq('event_id', id),
  ]);

  if (!event) redirect('/dashboard');

  const variants     = (variantsData ?? []) as unknown as Variant[];
  const firstVariant = variants[0];
  const zones        = (firstVariant?.zones as unknown as Zone[]) ?? [];
  const plan         = (profileData?.plan as string) ?? 'free';

  const totalRevenue  = (revData ?? []).reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
  const registrations = regCount ?? 0;
  const checkedIn     = checkedInCount ?? 0;
  const checkInRate   = registrations > 0 ? Math.round((checkedIn / registrations) * 100) : 0;

  const st = STATUS_STYLE[event.status as keyof typeof STATUS_STYLE] ?? STATUS_STYLE.draft;

  // Action banners — items that need attention
  const actionItems: { text: string; cta: string; href: string; accent?: boolean }[] = [];
  if (event.status === 'draft') {
    actionItems.push({ text: 'This event is still a draft — publish it to open registration.', cta: 'Publish event', href: `/events/${id}/publish`, accent: true });
  }
  if (!firstVariant) {
    actionItems.push({ text: 'No Karta Card design uploaded yet.', cta: 'Upload design', href: `/events/${id}/edit` });
  } else if (zones.length === 0) {
    actionItems.push({ text: 'No editable zones defined on the card.', cta: 'Open editor', href: `/events/${id}/edit` });
  }

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>

      {/* ── Cover header ─────────────────────────────────────────── */}
      <div className="relative" style={{ background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)', paddingBottom: '28px' }}>
        <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(60% 120% at 90% 0%, rgba(232,197,126,0.28), transparent 55%)' }} />
        <svg aria-hidden viewBox="0 0 1200 176" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" style={{ opacity: 0.08 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <path key={i} d={`M -40 ${38 + i * 34} Q 320 ${-8 + i * 34} 640 ${68 + i * 34} T 1280 ${42 + i * 34}`} fill="none" stroke="#E8C57E" strokeWidth="1.5" />
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
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 pb-0.5">
              <EventDetailActions eventId={id} eventName={event.name} status={event.status} />
              <Link
                href={`/events/${id}/edit`}
                className="inline-flex items-center gap-1.5 h-8 px-3 text-[13px] font-medium rounded-lg transition border border-white/20 text-white/80 hover:text-white hover:border-white/40 hover:bg-white/[0.08]"
              >
                <Pencil size={13} strokeWidth={1.8} />
                Edit card
              </Link>
              <Link
                href={`/events/${id}/publish`}
                className="inline-flex items-center gap-1.5 h-8 px-3.5 text-[13px] font-semibold rounded-lg transition"
                style={{ background: '#E8C57E', color: '#0F1F18' }}
              >
                {event.status === 'published' ? 'Share →' : 'Publish →'}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-7 space-y-6">

        {/* ── Stats bar ────────────────────────────────────────────── */}
        <div
          className="bg-white rounded-2xl border px-6 py-4 flex flex-wrap items-center gap-x-8 gap-y-3"
          style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
        >
          {[
            { value: registrations.toLocaleString(), label: 'registered' },
            { value: totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : '$0', label: 'revenue' },
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

        {/* ── Action banners ───────────────────────────────────────── */}
        {actionItems.length > 0 && (
          <div className="grid gap-2.5">
            {actionItems.map((item, i) => (
              <div
                key={i}
                className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 border ${item.accent ? 'border-[#E8C57E]/50' : 'bg-white border-[#E5E0D4]'}`}
                style={item.accent ? { background: 'linear-gradient(135deg, rgba(232,197,126,0.14), rgba(31,77,58,0.05))' } : undefined}
              >
                <span className="text-[13.5px] font-medium" style={{ color: item.accent ? '#163828' : '#3A4A42' }}>
                  {item.text}
                </span>
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12.5px] font-semibold shrink-0 transition-colors"
                  style={item.accent
                    ? { background: '#E8C57E', color: '#0F1F18' }
                    : { border: '1px solid rgba(31,77,58,0.25)', color: '#1F4D3A', background: 'transparent' }}
                >
                  {item.cta} →
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* ── Feature card grid ────────────────────────────────────── */}
        <EventFeatureGrid
          eventId={id}
          plan={plan}
          stats={{
            registrations,
            checkedIn,
            downloads: event.download_count,
            sessions:     sessionsCount    ?? 0,
            speakers:     speakersCount    ?? 0,
            ticketTypes:  ticketTypesCount ?? 0,
          }}
        />

      </div>
    </div>
  );
}
