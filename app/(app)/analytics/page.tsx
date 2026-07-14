export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { PeriodSelector } from '@/components/analytics/PeriodSelector';
import { ExportButton } from '@/components/analytics/ExportButton';
import { PageShell, PageHeader } from '@/components/dash';

export const metadata: Metadata = { title: 'Analytics' };

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function fmtMoney(n: number, currency: string | null | undefined): string {
  if (!currency || n === 0) return '—';
  // Get currency symbol for abbreviation labels
  let sym = currency;
  try { sym = (0).toLocaleString(undefined, { style: 'currency', currency, minimumFractionDigits: 0 }).replace(/[\d,.\s]/g, '').trim() || currency; } catch { /* */ }
  if (n >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${sym}${(n / 1_000).toFixed(1)}k`;
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 0 }).format(n); }
  catch { return `${currency} ${n.toLocaleString()}`; }
}

const EVENT_COLORS = ['#1F4D3A', '#2A6A50', '#3D7A5E', '#4F8A6E', '#2D7A4F', '#163828', '#5E9A7D'];

function StatCard({
  label, icon, gold, children,
}: { label: string; icon: 'calendar' | 'users' | 'dollar' | 'card'; gold?: boolean; children: ReactNode }) {
  const paths: Record<string, ReactNode> = {
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    users:    <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    dollar:   <><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    card:     <><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></>,
  };
  return (
    <div className="rounded-2xl p-5"
      style={gold
        ? { background: '#FDF6E3', border: '1px solid #EDD98A', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }
        : { background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12.5px] uppercase tracking-widest"
          style={{ color: gold ? '#C9A45E' : '#6B7A72' }}>{label}</span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke={gold ? '#C9A45E' : '#C9C3B1'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {paths[icon]}
        </svg>
      </div>
      {children}
    </div>
  );
}

function MoMBadge({ value }: { value: number }) {
  return (
    <div className="mt-2 text-[12px] font-medium flex items-center gap-1"
      style={{ color: value > 0 ? '#2D7A4F' : value < 0 ? '#B8423C' : '#6B7A72' }}>
      {value > 0 ? '↗' : value < 0 ? '↘' : '→'} {Math.abs(value)}% mo
    </div>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const period = ['90d', '6m', '1y'].includes(periodParam ?? '') ? (periodParam as string) : '90d';
  const periodDays = period === '1y' ? 365 : period === '6m' ? 180 : 90;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const { data: events } = await admin
    .from('events')
    .select('id, name, slug, status, download_count, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const allEvents = events ?? [];
  const eventIds = allEvents.map(e => e.id);

  const { data: regs } = eventIds.length > 0
    ? await admin
        .from('registrations')
        .select('event_id, status, amount_paid, created_at, currency')
        .in('event_id', eventIds)
    : { data: [] };

  const allRegsRaw = regs ?? [];

  // Apply period filter
  const cutoffDate = new Date(Date.now() - periodDays * 86400000);
  const allRegs = allRegsRaw.filter(r => new Date(r.created_at) >= cutoffDate);

  // ─── Aggregate stats ────────────────────────────────────────────────────────

  const totalEvents    = allEvents.filter(e => e.status !== 'archived').length;
  const confirmedRegs  = allRegs.filter(r => ['confirmed', 'checked_in'].includes(r.status));
  const totalRegs      = confirmedRegs.length;
  const totalRevenue   = allRegs.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
  const allCurrencies  = new Set(allRegs.map(r => r.currency).filter(Boolean) as string[]);
  const primaryCurrency = allCurrencies.size === 1 ? Array.from(allCurrencies)[0] : null;
  const totalCards     = allEvents.reduce((s, e) => s + (e.download_count ?? 0), 0);

  // Month-over-month
  const now             = new Date();
  const thisMonthStart  = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const regsThisMonth = confirmedRegs.filter(r => new Date(r.created_at) >= thisMonthStart).length;
  const regsLastMonth = confirmedRegs.filter(r => {
    const d = new Date(r.created_at);
    return d >= lastMonthStart && d < thisMonthStart;
  }).length;
  const regsMoM = regsLastMonth > 0 ? Math.round(((regsThisMonth - regsLastMonth) / regsLastMonth) * 100) : null;

  const revThisMonth = allRegs.filter(r => new Date(r.created_at) >= thisMonthStart)
    .reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
  const revLastMonth = allRegs.filter(r => {
    const d = new Date(r.created_at);
    return d >= lastMonthStart && d < thisMonthStart;
  }).reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
  const revMoM = revLastMonth > 0 ? Math.round(((revThisMonth - revLastMonth) / revLastMonth) * 100) : null;

  // ─── Per-event data ──────────────────────────────────────────────────────────

  const regsByEvent: Record<string, { count: number; revenue: number; checkedIn: number }> = {};
  for (const r of allRegs) {
    if (!['confirmed', 'checked_in'].includes(r.status)) continue;
    if (!regsByEvent[r.event_id]) regsByEvent[r.event_id] = { count: 0, revenue: 0, checkedIn: 0 };
    regsByEvent[r.event_id].count++;
    regsByEvent[r.event_id].revenue += Number(r.amount_paid ?? 0);
    if (r.status === 'checked_in') regsByEvent[r.event_id].checkedIn++;
  }

  const activeEvents = allEvents.filter(e => e.status !== 'archived');

  // Bar chart — top 5 events by registrations
  const chartEvents = activeEvents
    .map(e => ({ id: e.id, name: e.name, regs: regsByEvent[e.id]?.count ?? 0 }))
    .sort((a, b) => b.regs - a.regs)
    .slice(0, 5);
  const maxChartRegs = Math.max(...chartEvents.map(c => c.regs), 1);

  // Revenue trend — last 6 months
  const revMonths: { label: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    revMonths.push({
      label:   d.toLocaleDateString(undefined, { month: 'short' }),
      revenue: allRegs.filter(r => { const rd = new Date(r.created_at); return rd >= d && rd < nextD; })
                      .reduce((s, r) => s + Number(r.amount_paid ?? 0), 0),
    });
  }
  const maxRevenue = Math.max(...revMonths.map(m => m.revenue), 1);

  // SVG line chart coordinates
  const SVG_W = 280, SVG_H = 80;
  const revPoints = revMonths.map((m, i) => ({
    x: revMonths.length > 1 ? (i / (revMonths.length - 1)) * SVG_W : SVG_W / 2,
    y: SVG_H - (m.revenue / maxRevenue) * (SVG_H - 10) - 5,
    ...m,
  }));
  const polylineStr = revPoints.map(p => `${p.x},${p.y}`).join(' ');
  const areaStr     = [`0,${SVG_H}`, ...revPoints.map(p => `${p.x},${p.y}`), `${SVG_W},${SVG_H}`].join(' ');

  // Event performance table
  const perfEvents = activeEvents.map((e, idx) => ({
    ...e,
    color:     EVENT_COLORS[idx % EVENT_COLORS.length],
    regs:      regsByEvent[e.id]?.count    ?? 0,
    revenue:   regsByEvent[e.id]?.revenue  ?? 0,
    checkedIn: regsByEvent[e.id]?.checkedIn ?? 0,
    cards:     e.download_count ?? 0,
  })).sort((a, b) => b.regs - a.regs);

  return (
    <PageShell width="wide">
        <PageHeader
          title="Analytics"
          subtitle="Across all your events"
          actions={<>
            <Suspense fallback={null}>
              <PeriodSelector current={period} />
            </Suspense>
            <ExportButton events={perfEvents} currency={primaryCurrency} period={period} />
          </>}
        />

        {/* ── 4 stat cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Events" icon="calendar">
            <div className="font-display text-[36px] font-semibold tracking-tight leading-none"
              style={{ color: '#0F1F18' }}>
              {totalEvents}
            </div>
          </StatCard>

          <StatCard label="Registrations" icon="users">
            <div className="font-display text-[36px] font-semibold tracking-tight leading-none"
              style={{ color: '#0F1F18' }}>
              {fmtNum(totalRegs)}
            </div>
            {regsMoM !== null && <MoMBadge value={regsMoM} />}
          </StatCard>

          <StatCard label="Revenue" icon="dollar">
            <div className="font-display text-[36px] font-semibold tracking-tight leading-none"
              style={{ color: '#0F1F18' }}>
              {fmtMoney(totalRevenue, primaryCurrency)}
            </div>
            {revMoM !== null && <MoMBadge value={revMoM} />}
          </StatCard>

          <StatCard label="Cards Shared" icon="card" gold>
            <div className="font-display text-[36px] font-semibold tracking-tight leading-none"
              style={{ color: '#B8833A' }}>
              {fmtNum(totalCards)}
            </div>
          </StatCard>
        </div>

        {/* ── Two charts ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.65fr_1fr] gap-4 mb-6">

          {/* Registrations across events — vertical bar chart */}
          <div className="bg-white rounded-2xl p-6"
            style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
            <div className="font-display text-[15px] font-semibold mb-6" style={{ color: '#0F1F18' }}>
              Registrations across events
            </div>
            {chartEvents.length === 0 ? (
              <div className="h-[160px] flex items-center justify-center text-[13px]"
                style={{ color: '#6B7A72' }}>
                No events yet
              </div>
            ) : (
              <div className="flex items-end gap-4 h-[160px]">
                {chartEvents.map((ev, i) => {
                  const pct   = (ev.regs / maxChartRegs) * 100;
                  const barH  = ev.regs > 0 ? Math.max(pct, 4) : 2;
                  const words = ev.name.split(' ');
                  const short = words.length > 1
                    ? `${words[0]} ${words[1].slice(0, 3)}${words[1].length > 3 ? '…' : ''}`
                    : ev.name.slice(0, 10);
                  return (
                    <div key={ev.id} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[12px]" style={{ color: '#6B7A72' }}>
                        {ev.regs > 0 ? fmtNum(ev.regs) : ''}
                      </span>
                      <div className="w-full rounded-t-md"
                        style={{
                          height:    `${barH}%`,
                          background: EVENT_COLORS[i % EVENT_COLORS.length],
                          minHeight: '2px',
                          transition: 'height 0.3s ease',
                        }} />
                      <span className="text-[12px] text-center leading-tight"
                        style={{ color: '#6B7A72', maxWidth: '68px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', display: 'block' }}>
                        {short}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Revenue trend — SVG line chart */}
          <div className="bg-white rounded-2xl p-6"
            style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
            <div className="font-display text-[15px] font-semibold mb-6" style={{ color: '#0F1F18' }}>
              Revenue trend
            </div>
            <div className="flex flex-col h-[160px]">
              <div className="flex-1 relative">
                <svg
                  viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                  width="100%" height="100%"
                  preserveAspectRatio="none"
                  style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#E8C57E" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#E8C57E" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>
                  <polygon points={areaStr} fill="url(#revFill)" />
                  <polyline
                    points={polylineStr}
                    fill="none"
                    stroke="#C9A45E"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  {revPoints.map((p, i) =>
                    p.revenue > 0 ? (
                      <circle
                        key={i}
                        cx={p.x} cy={p.y} r="4"
                        fill="#C9A45E" stroke="white" strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                      />
                    ) : null
                  )}
                </svg>
              </div>
              <div className="flex justify-between mt-3 px-0.5">
                {[revMonths[0], revMonths[Math.floor(revMonths.length / 2)], revMonths[revMonths.length - 1]]
                  .map((m, i) => (
                    <span key={i} className="text-[12px]" style={{ color: '#6B7A72' }}>
                      {m.label}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Event performance table ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl"
          style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: '#E5E0D4' }}>
            <div className="font-display text-[15px] font-semibold" style={{ color: '#0F1F18' }}>
              Event performance
            </div>
          </div>

          {perfEvents.length === 0 ? (
            <div className="px-6 py-12 text-center text-[13px]" style={{ color: '#6B7A72' }}>
              No events yet.
            </div>
          ) : (
            <div className="hidden md:block overflow-x-auto">
            <table className="w-full" style={{ minWidth: 640 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E0D4', background: '#FAFAF9' }}>
                  {['Event', 'Status', 'Registrations', 'Revenue', 'Cards', 'Check-in'].map(h => (
                    <th key={h} className="px-5 py-3 text-left  text-[12px] tracking-[0.12em] uppercase whitespace-nowrap"
                      style={{ color: '#6B7A72' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {perfEvents.map(e => {
                  const checkInRate = e.regs > 0 ? Math.round((e.checkedIn / e.regs) * 100) : 0;
                  const isLive      = e.status === 'published';
                  return (
                    <tr key={e.id}
                      className="border-b last:border-0 hover:bg-[#FAFAF9] transition-colors"
                      style={{ borderColor: '#E5E0D4' }}>

                      {/* Event name + thumbnail */}
                      <td className="px-5 py-3.5">
                        <Link href={`/events/${e.slug ?? e.id}`} className="flex items-center gap-3 group">
                          <div className="w-7 h-7 rounded-lg shrink-0" style={{ background: e.color }} />
                          <span
                            className="font-display text-[13.5px] font-semibold group-hover:text-[#1F4D3A] transition-colors block"
                            style={{ color: '#0F1F18', maxWidth: '220px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            {e.name}
                          </span>
                        </Link>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${
                          isLive
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full"
                            style={{ background: isLive ? '#2D7A4F' : '#C9A45E' }} />
                          {isLive ? 'Live' : 'Draft'}
                        </span>
                      </td>

                      {/* Registrations */}
                      <td className="px-5 py-3.5  text-[13px] font-medium" style={{ color: '#0F1F18' }}>
                        {fmtNum(e.regs)}
                      </td>

                      {/* Revenue */}
                      <td className="px-5 py-3.5  text-[13px]" style={{ color: '#0F1F18' }}>
                        {fmtMoney(e.revenue, primaryCurrency)}
                      </td>

                      {/* Cards */}
                      <td className="px-5 py-3.5  text-[13px]" style={{ color: '#0F1F18' }}>
                        {e.cards}
                      </td>

                      {/* Check-in */}
                      <td className="px-5 py-3.5  text-[13px]" style={{ color: '#0F1F18' }}>
                        {checkInRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}

          {/* Mobile cards (below md) — no sideways scrolling */}
          {perfEvents.length > 0 && (
            <div className="md:hidden divide-y" style={{ borderColor: '#F0EBE3' }}>
              {perfEvents.map(e => {
                const checkInRate = e.regs > 0 ? Math.round((e.checkedIn / e.regs) * 100) : 0;
                const isLive = e.status === 'published';
                return (
                  <div key={e.id} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Link href={`/events/${e.slug ?? e.id}`} className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg shrink-0" style={{ background: e.color }} />
                        <span className="font-display text-[13.5px] font-semibold truncate" style={{ color: '#0F1F18' }}>
                          {e.name}
                        </span>
                      </Link>
                      <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap shrink-0 ${
                        isLive
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: isLive ? '#2D7A4F' : '#C9A45E' }} />
                        {isLive ? 'Live' : 'Draft'}
                      </span>
                    </div>
                    <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-3 text-[12px]" style={{ color: '#6B7A72' }}>
                      <span className="whitespace-nowrap"><span style={{ color: '#0F1F18', fontWeight: 500 }}>{fmtNum(e.regs)}</span> regs</span>
                      <span className="whitespace-nowrap"><span style={{ color: '#0F1F18', fontWeight: 500 }}>{fmtMoney(e.revenue, primaryCurrency)}</span> revenue</span>
                      <span className="whitespace-nowrap"><span style={{ color: '#0F1F18', fontWeight: 500 }}>{e.cards}</span> cards</span>
                      <span className="whitespace-nowrap"><span style={{ color: '#0F1F18', fontWeight: 500 }}>{checkInRate}%</span> check-in</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Card sharing bar chart (w32 design) ─────────────────────────── */}
        {perfEvents.length > 0 && (() => {
          const topByCards = perfEvents
            .filter(e => e.regs > 0)
            .map(e => ({ name: e.name, pct: Math.round((e.cards / e.regs) * 100) }))
            .sort((a, b) => b.pct - a.pct)
            .slice(0, 5);

          if (topByCards.length === 0) return null;

          return (
            <div className="mt-4 bg-white rounded-2xl p-6"
              style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
              <div className="font-display text-[15px] font-semibold mb-5" style={{ color: '#0F1F18' }}>
                Card sharing across your events
              </div>
              <div className="space-y-4">
                {topByCards.map((ev, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px]" style={{ color: '#3A4A42', maxWidth: '70%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {ev.name}
                      </span>
                      <span className=" text-[13px] font-semibold" style={{ color: '#1F4D3A' }}>{ev.pct}%</span>
                    </div>
                    <div className="h-2.5 rounded-full overflow-hidden" style={{ background: '#E8EFEB' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${ev.pct}%`, background: '#1F4D3A' }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[13px] mt-5 leading-relaxed" style={{ color: '#6B7A72' }}>
                Attendees who receive their Eventera Card share it at higher rates when the event design feels premium.
                The more polished your card design, the more organic reach you get.
              </p>
            </div>
          );
        })()}

    </PageShell>
  );
}
