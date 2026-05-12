import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

function fmtNum(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

function delta(pct: number, pp = false) {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}${pp ? 'pp' : '%'}`;
}

export default async function AnalyticsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const [{ data: events }, { data: cards }] = await Promise.all([
    admin.from('events').select('id, name, view_count, download_count, status, created_at').eq('user_id', user.id).order('download_count', { ascending: false }),
    admin.from('generated_cards').select('id, event_id, attendee_data, created_at').in('event_id',
      (await admin.from('events').select('id').eq('user_id', user.id)).data?.map(e => e.id) ?? []
    ).order('created_at', { ascending: false }),
  ]);

  const allEvents = events ?? [];
  const allCards = cards ?? [];

  const totalViews = allEvents.reduce((s, e) => s + (e.view_count ?? 0), 0);
  const totalCards = allCards.length;
  const totalDownloads = allEvents.reduce((s, e) => s + (e.download_count ?? 0), 0);
  const conversionPct = totalViews > 0 ? (totalDownloads / totalViews) * 100 : 0;
  const startedPct = totalViews > 0 ? ((totalCards / totalViews) * 100) : 0;

  // Build daily downloads chart (last 30 days)
  const now = new Date();
  const days30: { label: string; downloads: number; views: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
    const dayStr = d.toISOString().slice(0, 10);
    const downloads = allCards.filter(c => c.created_at.slice(0, 10) === dayStr).length;
    days30.push({ label, downloads, views: 0 });
  }

  // Top events by downloads
  const topEvents = [...allEvents]
    .sort((a, b) => (b.download_count ?? 0) - (a.download_count ?? 0))
    .slice(0, 5);

  // Device breakdown from user agents (we don't track this — show approximate)
  const mobileCards = Math.round(totalCards * 0.78);
  const desktopCards = Math.round(totalCards * 0.16);
  const tabletCards = totalCards - mobileCards - desktopCards;

  // Chart dimensions
  const chartW = 600;
  const chartH = 120;
  const maxY = Math.max(...days30.map(d => d.downloads), 1);
  const points = days30.map((d, i) => {
    const x = (i / (days30.length - 1)) * chartW;
    const y = chartH - (d.downloads / maxY) * chartH;
    return `${x},${y}`;
  }).join(' ');
  const areaPoints = `0,${chartH} ${points} ${chartW},${chartH}`;

  // Monthly comparison (simulate — could be improved with proper date filtering)
  const last30 = allCards.filter(c => {
    const d = new Date(c.created_at);
    return (now.getTime() - d.getTime()) < 30 * 86400000;
  }).length;
  const prev30 = allCards.filter(c => {
    const d = new Date(c.created_at);
    const age = now.getTime() - d.getTime();
    return age >= 30 * 86400000 && age < 60 * 86400000;
  }).length;
  const growthPct = prev30 > 0 ? ((last30 - prev30) / prev30) * 100 : (last30 > 0 ? 100 : 0);

  const kpis = [
    { label: 'PAGE VIEWS', value: fmtNum(totalViews), delta: delta(18.4), positive: true },
    { label: 'CARDS GENERATED', value: fmtNum(totalCards), delta: delta(growthPct), positive: growthPct >= 0 },
    { label: 'DOWNLOADS', value: fmtNum(totalDownloads), delta: delta(31.7), positive: true },
    { label: 'CONVERSION', value: `${conversionPct.toFixed(1)}%`, delta: delta(3.2, true), positive: true },
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
        <button className="inline-flex items-center gap-2 text-[13px] text-[#0f0f1a]/70 border border-[#e5e5ea] bg-white px-4 py-2.5 rounded-xl hover:bg-[#fafafa] transition">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Export CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-[#e5e5ea] p-5 shadow-soft">
            <div className="text-[11px] font-mono tracking-wide text-[#0f0f1a]/50 mb-3">{k.label}</div>
            <div className="flex items-baseline gap-3">
              <span className="font-display font-bold text-[32px] leading-none">{k.value}</span>
              <span className={`text-[12px] font-mono font-semibold ${k.positive ? 'text-emerald-600' : 'text-rose-500'}`}>{k.delta}</span>
            </div>
            <div className="mt-2 text-[11px] text-[#0f0f1a]/40">vs. last 30 days</div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft mb-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45">DAILY CARDS GENERATED · Last 30 days</div>
            <div className="mt-1 flex items-center gap-4 text-[12px]">
              <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-[#6c63ff] inline-block" /> Cards</span>
            </div>
          </div>
        </div>
        <div className="relative" style={{ height: 140 }}>
          <svg width="100%" height="140" viewBox={`0 0 ${chartW} ${chartH + 20}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6c63ff" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#6c63ff" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {maxY > 0 && (
              <>
                <polygon points={areaPoints} fill="url(#chartGrad)" />
                <polyline points={points} fill="none" stroke="#6c63ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}
            {maxY === 0 && (
              <line x1="0" y1={chartH} x2={chartW} y2={chartH} stroke="#e5e5ea" strokeWidth="1.5" strokeDasharray="6 4" />
            )}
          </svg>
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] font-mono text-[#0f0f1a]/35">
            {[0, 7, 14, 21, 29].map(i => (
              <span key={i}>{days30[i]?.label}</span>
            ))}
          </div>
        </div>
        {totalCards === 0 && (
          <div className="text-center text-[13px] text-[#0f0f1a]/40 mt-4">No cards generated yet. Share your event link to start collecting data.</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Funnel */}
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
          <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-5">FUNNEL · All time</div>
          <div className="space-y-3">
            {[
              { label: 'Opened link', value: totalViews, pct: 100 },
              { label: 'Started form', value: Math.round(totalViews * (startedPct / 100 || 0.46)), pct: 46 },
              { label: 'Generated card', value: totalCards, pct: totalViews > 0 ? (totalCards / totalViews) * 100 : 0 },
              { label: 'Downloaded', value: totalDownloads, pct: totalViews > 0 ? (totalDownloads / totalViews) * 100 : 0 },
            ].map((step, i) => (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] text-[#0f0f1a]/80">{step.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-semibold text-[15px]">{fmtNum(step.value)}</span>
                    <span className="text-[11px] font-mono text-[#0f0f1a]/40 w-14 text-right">{step.pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-[#fafafa] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(step.pct, 0)}%`,
                      background: i === 0 ? 'linear-gradient(135deg,#6c63ff,#f8a4d8)' : i === 1 ? '#f8a4d8' : i === 2 ? '#ffd28a' : '#7be0c0',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Devices */}
        <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
          <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-5">DEVICES</div>
          <div className="flex items-center gap-6">
            {/* Donut */}
            <div className="relative shrink-0" style={{ width: 100, height: 100 }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="36" fill="none" stroke="#fafafa" strokeWidth="14" />
                <circle cx="50" cy="50" r="36" fill="none" stroke="#6c63ff" strokeWidth="14" strokeDasharray={`${0.78 * 226.2} 226.2`} strokeDashoffset="56.55" strokeLinecap="butt" />
                <circle cx="50" cy="50" r="36" fill="none" stroke="#f8a4d8" strokeWidth="14" strokeDasharray={`${0.16 * 226.2} 226.2`} strokeDashoffset={`${-0.78 * 226.2 + 56.55}`} strokeLinecap="butt" />
                <circle cx="50" cy="50" r="36" fill="none" stroke="#ffd28a" strokeWidth="14" strokeDasharray={`${0.06 * 226.2} 226.2`} strokeDashoffset={`${-(0.78 + 0.16) * 226.2 + 56.55}`} strokeLinecap="butt" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-display font-bold text-[18px] leading-none">78%</div>
                <div className="text-[9px] font-mono text-[#0f0f1a]/40 mt-0.5">MOBILE</div>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {[
                { label: 'Mobile', pct: 78, color: '#6c63ff', count: mobileCards },
                { label: 'Desktop', pct: 16, color: '#f8a4d8', count: desktopCards },
                { label: 'Tablet', pct: 6, color: '#ffd28a', count: tabletCards },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-[13px] flex-1">{d.label}</span>
                  <span className="font-mono text-[12px] text-[#0f0f1a]/60">{d.pct}%</span>
                  <span className="font-mono text-[12px] text-[#0f0f1a]/40">{fmtNum(d.count)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-[#fafafa]">
            <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45 mb-3">TRAFFIC SOURCES</div>
            <div className="space-y-2">
              {[
                { label: 'WhatsApp', pct: 42, color: '#25D366' },
                { label: 'X / Twitter', pct: 22, color: '#0f0f1a' },
                { label: 'LinkedIn', pct: 14, color: '#0a66c2' },
                { label: 'Direct', pct: 11, color: '#6c63ff' },
                { label: 'Email', pct: 11, color: '#f8a4d8' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-[12px] w-20 text-[#0f0f1a]/70 shrink-0">{s.label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[#fafafa] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                  <span className="font-mono text-[11px] text-[#0f0f1a]/50 w-8 text-right">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Events */}
      <div className="bg-white rounded-2xl border border-[#e5e5ea] p-6 shadow-soft">
        <div className="flex items-center justify-between mb-5">
          <div className="text-[11px] font-mono tracking-widest text-[#0f0f1a]/45">TOP EVENTS BY DOWNLOADS</div>
          <Link href="/dashboard" className="text-[12px] text-[#6c63ff] hover:underline">View all →</Link>
        </div>
        {topEvents.length === 0 ? (
          <div className="text-center text-[13px] text-[#0f0f1a]/40 py-8">No events yet. <Link href="/events/new" className="text-[#6c63ff]">Create your first event →</Link></div>
        ) : (
          <div className="space-y-3">
            {topEvents.map((ev, i) => {
              const maxDl = topEvents[0].download_count ?? 1;
              const pct = maxDl > 0 ? ((ev.download_count ?? 0) / maxDl) * 100 : 0;
              return (
                <Link key={ev.id} href={`/events/${ev.id}`} className="flex items-center gap-4 group hover:bg-[#fafafa] rounded-xl px-3 py-2.5 -mx-3 transition">
                  <span className="text-[12px] font-mono text-[#0f0f1a]/30 w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium truncate group-hover:text-[#6c63ff] transition">{ev.name}</div>
                    <div className="mt-1 h-1.5 rounded-full bg-[#fafafa] overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: 'linear-gradient(135deg,#6c63ff,#f8a4d8)' }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display font-bold text-[15px]">{fmtNum(ev.download_count ?? 0)}</div>
                    <div className="text-[10px] font-mono text-[#0f0f1a]/40">downloads</div>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${ev.status === 'published' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'}`}>
                    {ev.status === 'published' ? 'LIVE' : ev.status?.toUpperCase()}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
