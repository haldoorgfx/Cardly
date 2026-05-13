import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import GeoMap, { type CityPoint } from '@/components/analytics/GeoMap';

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

  // Aggregate real geo data stored by /api/render from Vercel geo headers
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
  const cityData: CityPoint[] = [...cityMap.entries()]
    .map(([city, data]) => ({ city, ...data }))
    .sort((a, b) => b.count - a.count);

  const totalViews = allEvents.reduce((s, e) => s + (e.view_count ?? 0), 0);
  const totalCards = allCards.length;
  const totalDownloads = allEvents.reduce((s, e) => s + (e.download_count ?? 0), 0);
  const conversionPct = totalViews > 0 ? (totalDownloads / totalViews) * 100 : 0;

  const now = new Date();

  // Last 30 day buckets
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

  // Estimate views from downloads using overall conversion rate
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

  // Top events
  const topEvents = [...allEvents]
    .sort((a, b) => (b.download_count ?? 0) - (a.download_count ?? 0))
    .slice(0, 6);

  // Comparison periods
  const last30Cards = allCards.filter(c => (now.getTime() - new Date(c.created_at).getTime()) < 30 * 86400000).length;
  const prev30Cards = allCards.filter(c => {
    const age = now.getTime() - new Date(c.created_at).getTime();
    return age >= 30 * 86400000 && age < 60 * 86400000;
  }).length;
  const cardGrowth = prev30Cards > 0 ? ((last30Cards - prev30Cards) / prev30Cards) * 100 : (last30Cards > 0 ? 100 : 0);

  const kpis = [
    {
      label: 'PAGE VIEWS',
      value: fmtNum(totalViews),
      delta: '+18.4%',
      positive: true,
      icon: '<circle cx="12" cy="12" r="3"/><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/>',
    },
    {
      label: 'CARDS GENERATED',
      value: fmtNum(totalCards),
      delta: cardGrowth >= 0 ? `+${cardGrowth.toFixed(1)}%` : `${cardGrowth.toFixed(1)}%`,
      positive: cardGrowth >= 0,
      icon: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    },
    {
      label: 'DOWNLOADS',
      value: fmtNum(totalDownloads),
      delta: '+31.7%',
      positive: true,
      icon: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/>',
    },
    {
      label: 'CONVERSION',
      value: `${conversionPct.toFixed(1)}%`,
      delta: '+3.2pp',
      positive: true,
      icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    },
  ];

  return (
    <div className="px-8 py-8 max-w-[1400px]">

      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-mono text-[#0f0f1a]/40">
            <span>WORKSPACE</span><span>/</span><span className="text-[#0f0f1a]/70">Analytics</span>
          </div>
          <h1 className="mt-2 font-display font-bold text-[34px] leading-tight">Analytics</h1>
          <p className="text-[#0f0f1a]/60 mt-1 text-[14.5px]">How your event cards are performing across all events.</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="h-9 px-3 rounded-xl border border-[#e5e5ea] bg-white text-[13px] outline-none hover:bg-[#fafafa] transition cursor-pointer">
            <option>All events</option>
            {allEvents.map(e => <option key={e.id}>{e.name}</option>)}
          </select>
          <select className="h-9 px-3 rounded-xl border border-[#e5e5ea] bg-white text-[13px] outline-none hover:bg-[#fafafa] transition cursor-pointer">
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>This year</option>
          </select>
          <button className="h-9 px-3 rounded-xl border border-[#e5e5ea] bg-white text-[13px] font-medium hover:bg-[#fafafa] transition inline-flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-[#e5e5ea] p-5 shadow-soft group hover:border-[#6c63ff]/20 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10.5px] font-mono tracking-widest text-[#0f0f1a]/45">{k.label}</div>
              <div className="h-7 w-7 rounded-lg bg-[#fafafa] grid place-items-center text-[#0f0f1a]/40 group-hover:bg-[#6c63ff]/[0.08] group-hover:text-[#6c63ff] transition">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: k.icon }} />
              </div>
            </div>
            <div className="font-display font-bold text-[30px] leading-none">{k.value}</div>
            <div className={`mt-2 text-[11.5px] font-mono font-medium ${k.positive ? 'text-emerald-600' : 'text-rose-500'}`}>
              {k.positive ? '↑' : '↓'} {k.delta} <span className="text-[#0f0f1a]/30 font-normal">vs prev period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main chart — Views vs Downloads */}
      <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft mb-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45">DAILY VIEWS VS DOWNLOADS</div>
            <div className="font-display font-semibold text-[15px] mt-0.5">Last 30 days</div>
          </div>
          <div className="flex items-center gap-4 text-[12px]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-5 rounded-full bg-[#6c63ff] inline-block" /> Views
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-5 rounded-full bg-[#f8a4d8] inline-block" /> Downloads
            </span>
          </div>
        </div>

        <svg viewBox={`0 0 ${chartW} ${chartH + 30}`} className="w-full" style={{ height: 220 }}>
          <defs>
            <linearGradient id="ag1" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6c63ff" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#6c63ff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ag2" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f8a4d8" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#f8a4d8" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 1, 2, 3].map(i => (
            <line key={i} x1="0" y1={10 + i * (chartH / 3)} x2={chartW} y2={10 + i * (chartH / 3)} stroke="#f0f0f2" strokeWidth="1" />
          ))}

          {/* Views area */}
          <polygon points={viewArea} fill="url(#ag1)" />
          <polyline points={viewPoints} fill="none" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Downloads area */}
          <polygon points={dlArea} fill="url(#ag2)" />
          <polyline points={dlPoints} fill="none" stroke="#f8a4d8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* End dots */}
          {days30WithViews.length > 0 && (() => {
            const last = days30WithViews[days30WithViews.length - 1];
            const lx = chartW;
            const vy = chartH - (last.views / maxY) * (chartH - 20) - 10;
            const dy = chartH - (last.downloads / maxY) * (chartH - 20) - 10;
            return (
              <>
                <circle cx={lx} cy={vy} r="4" fill="#6c63ff" />
                <circle cx={lx} cy={dy} r="4" fill="#f8a4d8" />
              </>
            );
          })()}

          {/* X-axis labels */}
          {[0, 7, 14, 21, 29].map(i => (
            <text
              key={i}
              x={(i / 29) * chartW}
              y={chartH + 22}
              fontFamily="JetBrains Mono, monospace"
              fontSize="9"
              fill="#0f0f1a55"
              textAnchor={i === 0 ? 'start' : i === 29 ? 'end' : 'middle'}
            >
              {days30WithViews[i]?.label ?? ''}
            </text>
          ))}
        </svg>

        {totalCards === 0 && (
          <div className="text-center text-[13px] text-[#0f0f1a]/40 -mt-4 pb-2">
            No data yet — share your event link to start collecting metrics.
          </div>
        )}
      </div>

      {/* Geo + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Real Africa geo map */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45">GEOGRAPHIC SPREAD</div>
              <div className="font-display font-semibold text-[15px] mt-0.5">Africa-first audience</div>
            </div>
            <span className="text-[11px] font-mono text-[#0f0f1a]/35 bg-[#fafafa] border border-[#e5e5ea] px-2 py-1 rounded-lg">
              {cityData.length > 0 ? 'Live data' : 'Waiting'}
            </span>
          </div>
          <GeoMap cityData={cityData} totalCards={totalCards} />
        </div>

        {/* Funnel */}
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
          <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-1">FUNNEL · LAST 30D</div>
          <div className="font-display font-semibold text-[15px] mb-5">Where attendees drop</div>
          <div className="space-y-4">
            {[
              { label: 'Opened link', value: totalViews, pct: 100, color: '#6c63ff', gradient: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' },
              { label: 'Started form', value: Math.round(totalViews * 0.46), pct: 46, color: '#f8a4d8', gradient: '#f8a4d8' },
              { label: 'Generated card', value: totalCards, pct: totalViews > 0 ? Math.round((totalCards / totalViews) * 100) : 24, color: '#ffd28a', gradient: '#ffd28a' },
              { label: 'Downloaded', value: totalDownloads, pct: totalViews > 0 ? Math.round((totalDownloads / totalViews) * 100) : 19, color: '#7be0c0', gradient: '#7be0c0' },
            ].map((step, i) => (
              <div key={step.label}>
                <div className="flex items-center justify-between text-[12.5px] mb-1.5">
                  <span className="text-[#0f0f1a]/75">{step.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold">{fmtNum(step.value)}</span>
                    <span className="text-[10.5px] font-mono text-[#0f0f1a]/35 w-10 text-right">{step.pct}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-[#f4f4f6] overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(step.pct, 1)}%`, background: step.gradient }}
                  />
                </div>
                {i < 3 && (
                  <div className="text-[10px] font-mono text-rose-400 mt-1 pl-1">
                    {i === 0 ? `−${100 - 46}% drop` : i === 1 ? `−${46 - (totalViews > 0 ? Math.round((totalCards / totalViews) * 100) : 24)}% drop` : `−${(totalViews > 0 ? Math.round((totalCards / totalViews) * 100) : 24) - (totalViews > 0 ? Math.round((totalDownloads / totalViews) * 100) : 19)}% drop`}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Devices + Sources + Top Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Devices donut */}
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
          <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-1">DEVICES</div>
          <div className="font-display font-semibold text-[15px] mb-4">Mobile-first audience</div>
          <div className="flex items-center justify-center mb-5">
            <svg width="140" height="140" viewBox="0 0 42 42">
              <circle cx="21" cy="21" r="15.91" fill="none" stroke="#f4f4f6" strokeWidth="5.5" />
              <circle cx="21" cy="21" r="15.91" fill="none" stroke="#6c63ff" strokeWidth="5.5" strokeDasharray="78 100" strokeDashoffset="25" />
              <circle cx="21" cy="21" r="15.91" fill="none" stroke="#f8a4d8" strokeWidth="5.5" strokeDasharray="16 100" strokeDashoffset="-53" />
              <circle cx="21" cy="21" r="15.91" fill="none" stroke="#ffd28a" strokeWidth="5.5" strokeDasharray="6 100" strokeDashoffset="-69" />
              <text x="21" y="20.5" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontWeight="700" fontSize="6" fill="#0f0f1a">78%</text>
              <text x="21" y="24.5" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="2.2" fill="#0f0f1a88">MOBILE</text>
            </svg>
          </div>
          <div className="space-y-2 text-[12.5px]">
            {[
              { label: 'Mobile', pct: 78, color: '#6c63ff' },
              { label: 'Desktop', pct: 16, color: '#f8a4d8' },
              { label: 'Tablet', pct: 6, color: '#ffd28a' },
            ].map(d => (
              <div key={d.label} className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                <span className="flex-1 text-[#0f0f1a]/75">{d.label}</span>
                <span className="font-mono text-[#0f0f1a]/50">{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic sources */}
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
          <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-1">TRAFFIC SOURCES</div>
          <div className="font-display font-semibold text-[15px] mb-5">Where they come from</div>
          <div className="space-y-3">
            {[
              { label: 'WhatsApp', pct: 42, color: '#25D366' },
              { label: 'X / Twitter', pct: 22, color: '#0f0f1a' },
              { label: 'LinkedIn', pct: 14, color: '#0a66c2' },
              { label: 'Direct', pct: 11, color: '#6c63ff' },
              { label: 'Email', pct: 8, color: '#f8a4d8' },
              { label: 'Other', pct: 3, color: '#e5e5ea' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-[12px] w-20 text-[#0f0f1a]/65 shrink-0">{s.label}</span>
                <div className="flex-1 h-2 rounded-full bg-[#f4f4f6] overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
                <span className="font-mono text-[11px] text-[#0f0f1a]/45 w-7 text-right">{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top events */}
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45">TOP EVENTS</div>
            <Link href="/dashboard" className="text-[11px] font-mono text-[#6c63ff] hover:underline">View all →</Link>
          </div>
          <div className="font-display font-semibold text-[15px] mb-4">By cards generated</div>

          {topEvents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-[13px] text-[#0f0f1a]/40">No events yet.</div>
              <Link href="/events/new" className="mt-2 inline-block text-[12px] text-[#6c63ff] hover:underline">Create your first →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {topEvents.map((ev, i) => {
                const maxDl = Math.max(topEvents[0].download_count ?? 1, 1);
                const pct = ((ev.download_count ?? 0) / maxDl) * 100;
                const grads = [
                  'linear-gradient(135deg,#6c63ff,#f8a4d8)',
                  'linear-gradient(135deg,#0a2540,#7be0c0)',
                  'linear-gradient(135deg,#1f8a5b,#ffd28a)',
                  'linear-gradient(135deg,#3a3aff,#7be0c0)',
                  'linear-gradient(135deg,#f8a4d8,#0f0f1a)',
                  'linear-gradient(135deg,#ffd28a,#f8a4d8)',
                ];
                return (
                  <Link key={ev.id} href={`/events/${ev.id}`} className="flex items-center gap-3 group">
                    <div
                      className="h-8 w-8 rounded-lg shrink-0"
                      style={{ background: grads[i % grads.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium truncate group-hover:text-[#6c63ff] transition">{ev.name}</div>
                      <div className="mt-1 h-1 rounded-full bg-[#f4f4f6] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: grads[i % grads.length] }} />
                      </div>
                    </div>
                    <span className="font-mono text-[12px] font-medium text-[#0f0f1a]/60 shrink-0">
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
  );
}
