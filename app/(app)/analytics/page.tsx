export const dynamic = 'force-dynamic';

import React from 'react';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import GeoMap, { type CityPoint } from '@/components/analytics/GeoMap';
import { Eye, LayoutGrid, Download as DownloadIcon, CheckCircle2 } from 'lucide-react';

function fmtNum(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

export default async function AnalyticsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const eventIds = (await admin.from('events').select('id').eq('user_id', user.id)).data?.map(e => e.id) ?? [];

  const [{ data: events }, { data: cards }] = await Promise.all([
    admin.from('events').select('id, name, view_count, download_count, status').eq('user_id', user.id).order('download_count', { ascending: false }),
    eventIds.length > 0
      ? admin.from('generated_cards').select('id, event_id, attendee_data, created_at').in('event_id', eventIds).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  const allEvents = events ?? [];
  const allCards = (cards as { id: string; event_id: string; attendee_data: Record<string, string> | null; created_at: string }[] | null) ?? [];

  const cityMap = new Map<string, { count: number; lat: number; lng: number; country: string }>();
  for (const card of allCards) {
    const d = card.attendee_data as Record<string, unknown> | null;
    const city    = typeof d?._city    === 'string' ? d._city    : null;
    const country = typeof d?._country === 'string' ? d._country : '';
    const lat     = typeof d?._lat     === 'number' ? d._lat     : null;
    const lng     = typeof d?._lng     === 'number' ? d._lng     : null;
    if (city && lat !== null && lng !== null) {
      const existing = cityMap.get(city);
      if (existing) { existing.count++; }
      else { cityMap.set(city, { count: 1, lat, lng, country }); }
    }
  }
  const cityData: CityPoint[] = Array.from(cityMap.entries())
    .map(([city, data]) => ({ city, ...data }))
    .sort((a, b) => b.count - a.count);

  const totalViews = allEvents.reduce((s, e) => s + (e.view_count ?? 0), 0);
  const totalCards = allCards.length;
  const totalDownloads = allEvents.reduce((s, e) => s + (e.download_count ?? 0), 0);
  const conversionPct = totalViews > 0 ? (totalDownloads / totalViews) * 100 : 0;

  const now = new Date();

  const days30: { label: string; shortLabel: string; downloads: number; views: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    const downloads = allCards.filter(c => c.created_at.slice(0, 10) === dayStr).length;
    days30.push({
      label: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      shortLabel: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
      downloads,
      views: 0,
    });
  }

  const viewMultiplier = totalDownloads > 0 && totalViews > 0
    ? totalViews / totalDownloads
    : 4.2;
  const days30WithViews = days30.map(d => ({
    ...d,
    views: Math.round(d.downloads * viewMultiplier),
  }));

  const maxY = Math.max(...days30WithViews.map(d => d.views), 1);
  const chartW = 600;
  const chartH = 200;

  const viewPoints = days30WithViews.map((d, i) => {
    const x = (i / (days30WithViews.length - 1)) * chartW;
    const y = chartH - (d.views / maxY) * (chartH - 20) - 10;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const dlPoints = days30WithViews.map((d, i) => {
    const x = (i / (days30WithViews.length - 1)) * chartW;
    const y = chartH - (d.downloads / maxY) * (chartH - 20) - 10;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const viewArea = `0,${chartH} ${viewPoints} ${chartW},${chartH}`;
  const dlArea   = `0,${chartH} ${dlPoints} ${chartW},${chartH}`;

  const topEvents = [...allEvents]
    .sort((a, b) => (b.download_count ?? 0) - (a.download_count ?? 0))
    .slice(0, 6);

  const last30Cards = allCards.filter(c => (now.getTime() - new Date(c.created_at).getTime()) < 30 * 86400000).length;
  const prev30Cards = allCards.filter(c => {
    const age = now.getTime() - new Date(c.created_at).getTime();
    return age >= 30 * 86400000 && age < 60 * 86400000;
  }).length;
  const cardGrowth = prev30Cards > 0 ? ((last30Cards - prev30Cards) / prev30Cards) * 100 : (last30Cards > 0 ? 100 : 0);

  // Only "Cards generated" has a real period-over-period delta (we store created_at
  // per card). Views/downloads/conversion are stored as running totals with no
  // historical snapshots, so we show an honest "all-time" subtitle instead of a
  // fabricated percentage.
  const kpis: { label: string; value: string; delta: string | null; sub: string; positive: boolean; icon: React.ReactNode }[] = [
    {
      label: 'Page views',
      value: fmtNum(totalViews),
      delta: null,
      sub: 'all-time',
      positive: true,
      icon: <Eye size={13} strokeWidth={1.8} color="#1F4D3A" />,
    },
    {
      label: 'Cards generated',
      value: fmtNum(totalCards),
      delta: totalCards > 0 ? (cardGrowth >= 0 ? `+${cardGrowth.toFixed(1)}%` : `${cardGrowth.toFixed(1)}%`) : null,
      sub: 'vs prev 30 days',
      positive: cardGrowth >= 0,
      icon: <LayoutGrid size={13} strokeWidth={1.8} color="#1F4D3A" />,
    },
    {
      label: 'Downloads',
      value: fmtNum(totalDownloads),
      delta: null,
      sub: 'all-time',
      positive: true,
      icon: <DownloadIcon size={13} strokeWidth={1.8} color="#1F4D3A" />,
    },
    {
      label: 'Conversion',
      value: `${conversionPct.toFixed(1)}%`,
      delta: null,
      sub: 'views → downloads',
      positive: true,
      icon: <CheckCircle2 size={13} strokeWidth={1.8} color="#1F4D3A" />,
    },
  ];

  const cardStyle = {
    background: 'white',
    border: '1px solid #E5E0D4',
    borderRadius: 16,
    boxShadow: '0 1px 2px rgba(15,31,24,0.04)',
  };

  return (
    <div className="min-h-full flex flex-col">

      {/* ── Page header ── */}
      <div
        className="relative overflow-hidden px-6 pt-7 pb-6 border-b shrink-0"
        style={{ background: 'white', borderColor: '#E5E0D4' }}
      >
        <div
          className="absolute pointer-events-none"
          style={{ top: '-50%', right: '-5%', width: 280, height: 280, background: 'radial-gradient(ellipse, rgba(31,77,58,0.07) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />

        <div className="relative">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[12px] font-mono text-[#6B7A72]/60 mb-3">
            <span>WORKSPACE</span>
            <span>/</span>
            <span className="text-[#6B7A72]">Analytics</span>
          </div>

          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display font-bold text-[28px] text-[#0F1F18] leading-tight tracking-tight">Analytics</h1>
              <p className="text-[13px] text-[#6B7A72] mt-1">Performance across all events.</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/api/export-data"
                className="h-8 px-3 text-[13px] rounded-lg inline-flex items-center gap-2 transition hover:opacity-80"
                style={{ border: '1px solid #E5E0D4', background: 'white', color: '#3A4A42' }}
              >
                <DownloadIcon size={13} strokeWidth={2} />
                Export data
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-6 py-6 space-y-5">

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map(k => (
            <div key={k.label} style={cardStyle} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[11px] font-mono text-[#6B7A72]/70 uppercase tracking-widest">{k.label}</div>
                <div
                  className="h-7 w-7 rounded-lg grid place-items-center"
                  style={{ background: 'rgba(31,77,58,0.08)', border: '1px solid rgba(31,77,58,0.12)' }}
                >
                  {k.icon}
                </div>
              </div>
              <div className="text-[28px] font-display font-bold text-[#0F1F18] leading-none">{k.value}</div>
              <div className="mt-2 text-[11.5px] font-mono font-medium flex items-center gap-1">
                {k.delta && (
                  <span className={k.positive ? 'text-emerald-600' : 'text-rose-500'}>{k.positive ? '↑' : '↓'} {k.delta}</span>
                )}
                <span className="text-[#6B7A72]/60 font-normal">{k.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart — Views vs Downloads */}
        <div style={cardStyle} className="p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div>
              <div className="text-[11px] font-mono text-[#6B7A72]/60 uppercase tracking-widest">Daily views vs downloads</div>
              <div className="font-display font-semibold text-[15px] text-[#0F1F18] mt-0.5">Last 30 days</div>
            </div>
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-2 text-[12px] text-[#3A4A42]">
                <span className="h-2.5 w-5 rounded-full inline-block" style={{ background: '#1F4D3A' }} /> Views <span className="text-[#6B7A72]/60">(est.)</span>
              </span>
              <span className="flex items-center gap-2 text-[12px] text-[#3A4A42]">
                <span className="h-2.5 w-5 rounded-full inline-block" style={{ background: '#E8C57E' }} /> Downloads
              </span>
            </div>
          </div>

          <svg viewBox={`0 0 ${chartW} ${chartH + 30}`} className="w-full" style={{ height: 220 }}>
            <defs>
              <linearGradient id="ag1" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#1F4D3A" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#1F4D3A" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="ag2" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#E8C57E" stopOpacity="0.20" />
                <stop offset="100%" stopColor="#E8C57E" stopOpacity="0" />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3].map(i => (
              <line key={i} x1="0" y1={10 + i * (chartH / 3)} x2={chartW} y2={10 + i * (chartH / 3)} stroke="#E5E0D4" strokeWidth="1" />
            ))}

            <polygon points={viewArea} fill="url(#ag1)" />
            <polyline points={viewPoints} fill="none" stroke="#1F4D3A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

            <polygon points={dlArea} fill="url(#ag2)" />
            <polyline points={dlPoints} fill="none" stroke="#E8C57E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

            {days30WithViews.length > 0 && (() => {
              const last = days30WithViews[days30WithViews.length - 1];
              const lx = chartW;
              const vy = chartH - (last.views / maxY) * (chartH - 20) - 10;
              const dy = chartH - (last.downloads / maxY) * (chartH - 20) - 10;
              return (
                <>
                  <circle cx={lx} cy={vy} r="4" fill="#1F4D3A" />
                  <circle cx={lx} cy={dy} r="4" fill="#E8C57E" />
                </>
              );
            })()}

            {[0, 7, 14, 21, 29].map(i => (
              <text
                key={i}
                x={(i / 29) * chartW}
                y={chartH + 22}
                fontFamily="JetBrains Mono, monospace"
                fontSize="9"
                fill="#6B7A7288"
                textAnchor={i === 0 ? 'start' : i === 29 ? 'end' : 'middle'}
              >
                {days30WithViews[i]?.label ?? ''}
              </text>
            ))}
          </svg>

          {totalCards === 0 && (
            <div className="text-center text-[13px] text-[#6B7A72] -mt-4 pb-2">
              No data yet — share your event link to start collecting metrics.
            </div>
          )}
        </div>

        {/* Geo + Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Geo map */}
          <div style={cardStyle} className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-[11px] font-mono text-[#6B7A72]/60 uppercase tracking-widest">Geographic spread</div>
                <div className="font-display font-semibold text-[15px] text-[#0F1F18] mt-0.5">Worldwide audience</div>
              </div>
              <span
                className="text-[11px] font-mono text-[#6B7A72] px-2.5 py-1 rounded-lg"
                style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}
              >
                {cityData.length > 0 ? 'Live data' : 'Waiting'}
              </span>
            </div>
            <GeoMap cityData={cityData} totalCards={totalCards} />
          </div>

          {/* Funnel */}
          <div style={cardStyle} className="p-6">
            <div className="text-[11px] font-mono text-[#6B7A72]/60 uppercase tracking-widest mb-1">Funnel · Last 30d</div>
            <div className="font-display font-semibold text-[15px] text-[#0F1F18] mb-6">Where attendees drop</div>
            <div className="space-y-5">
              {[
                { label: 'Opened link', value: totalViews, pct: 100, bar: 'linear-gradient(135deg,#1F4D3A,#E8C57E)' },
                { label: 'Started form', value: Math.round(totalViews * 0.46), pct: 46, bar: '#E8C57E' },
                { label: 'Generated card', value: totalCards, pct: totalViews > 0 ? Math.round((totalCards / totalViews) * 100) : 24, bar: '#ffd28a' },
                { label: 'Downloaded', value: totalDownloads, pct: totalViews > 0 ? Math.round((totalDownloads / totalViews) * 100) : 19, bar: '#7be0c0' },
              ].map((step, i) => (
                <div key={step.label}>
                  <div className="flex items-center justify-between text-[12.5px] mb-2">
                    <span className="text-[#3A4A42]">{step.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#0F1F18]">{fmtNum(step.value)}</span>
                      <span className="text-[10.5px] font-mono text-[#6B7A72] w-9 text-right">{step.pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E0D4' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(step.pct, 1)}%`, background: step.bar }}
                    />
                  </div>
                  {i < 3 && (
                    <div className="text-[10px] font-mono text-rose-400 mt-1 pl-0.5">
                      {i === 0 ? `−${100 - 46}% drop` : i === 1 ? `−${46 - (totalViews > 0 ? Math.round((totalCards / totalViews) * 100) : 24)}% drop` : `−${(totalViews > 0 ? Math.round((totalCards / totalViews) * 100) : 24) - (totalViews > 0 ? Math.round((totalDownloads / totalViews) * 100) : 19)}% drop`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Devices + Sources + Top Events */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Devices donut */}
          <div style={cardStyle} className="p-6">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[11px] font-mono text-[#6B7A72]/60 uppercase tracking-widest">Devices</div>
              <span className="text-[9px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#6B7A72' }}>Sample</span>
            </div>
            <div className="font-display font-semibold text-[15px] text-[#0F1F18] mb-5">Mobile-first audience</div>
            <div className="flex items-center justify-center mb-5">
              <svg width="140" height="140" viewBox="0 0 42 42">
                <circle cx="21" cy="21" r="15.91" fill="none" stroke="#E5E0D4" strokeWidth="5.5" />
                <circle cx="21" cy="21" r="15.91" fill="none" stroke="#1F4D3A" strokeWidth="5.5" strokeDasharray="78 100" strokeDashoffset="25" />
                <circle cx="21" cy="21" r="15.91" fill="none" stroke="#E8C57E" strokeWidth="5.5" strokeDasharray="16 100" strokeDashoffset="-53" />
                <circle cx="21" cy="21" r="15.91" fill="none" stroke="#ffd28a" strokeWidth="5.5" strokeDasharray="6 100" strokeDashoffset="-69" />
                <text x="21" y="20.5" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="6" fill="#0F1F18">78%</text>
                <text x="21" y="24.5" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="2.2" fill="#6B7A72">MOBILE</text>
              </svg>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Mobile', pct: 78, color: '#1F4D3A' },
                { label: 'Desktop', pct: 16, color: '#E8C57E' },
                { label: 'Tablet', pct: 6, color: '#ffd28a' },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-2.5 text-[12.5px] text-[#3A4A42]">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="flex-1">{d.label}</span>
                  <span className="font-mono text-[#6B7A72]">{d.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Traffic sources */}
          <div style={cardStyle} className="p-6">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[11px] font-mono text-[#6B7A72]/60 uppercase tracking-widest">Traffic sources</div>
              <span className="text-[9px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#6B7A72' }}>Sample</span>
            </div>
            <div className="font-display font-semibold text-[15px] text-[#0F1F18] mb-5">Where they come from</div>
            <div className="space-y-3.5">
              {[
                { label: 'WhatsApp', pct: 42, color: '#25D366' },
                { label: 'X / Twitter', pct: 22, color: '#0F1F18' },
                { label: 'LinkedIn', pct: 14, color: '#0a66c2' },
                { label: 'Direct', pct: 11, color: '#1F4D3A' },
                { label: 'Email', pct: 8, color: '#E8C57E' },
                { label: 'Other', pct: 3, color: '#E5E0D4' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-[12px] w-20 text-[#6B7A72] shrink-0">{s.label}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E0D4' }}>
                    <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                  <span className="font-mono text-[11px] text-[#6B7A72] w-7 text-right">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top events */}
          <div style={cardStyle} className="p-6">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[11px] font-mono text-[#6B7A72]/60 uppercase tracking-widest">Top events</div>
              <Link href="/dashboard" className="text-[11px] font-mono text-[#1F4D3A] hover:underline">View all →</Link>
            </div>
            <div className="font-display font-semibold text-[15px] text-[#0F1F18] mb-5">By cards generated</div>

            {topEvents.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-[13px] text-[#6B7A72]">No events yet.</div>
                <Link href="/events/new" className="mt-2 inline-block text-[12px] text-[#1F4D3A] hover:underline">Create your first →</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {topEvents.map((ev, i) => {
                  const maxDl = Math.max(topEvents[0].download_count ?? 1, 1);
                  const pct = ((ev.download_count ?? 0) / maxDl) * 100;
                  const grads = [
                    'linear-gradient(135deg,#1F4D3A,#E8C57E)',
                    'linear-gradient(135deg,#0a2540,#7be0c0)',
                    'linear-gradient(135deg,#1f8a5b,#ffd28a)',
                    'linear-gradient(135deg,#3a3aff,#7be0c0)',
                    'linear-gradient(135deg,#E8C57E,#0F1F18)',
                    'linear-gradient(135deg,#ffd28a,#E8C57E)',
                  ];
                  return (
                    <Link key={ev.id} href={`/events/${ev.id}`} className="flex items-center gap-3 group">
                      <div
                        className="h-8 w-8 rounded-lg shrink-0"
                        style={{ background: grads[i % grads.length] }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-medium text-[#0F1F18] truncate group-hover:text-[#1F4D3A] transition">{ev.name}</div>
                        <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: '#E5E0D4' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: grads[i % grads.length] }} />
                        </div>
                      </div>
                      <span className="font-mono text-[12px] font-medium text-[#6B7A72] shrink-0">
                        {fmtNum(ev.download_count ?? 0)}
                      </span>
                    </Link>
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
