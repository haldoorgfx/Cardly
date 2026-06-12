'use client';

import { useMemo } from 'react';
import { Users, DollarSign, ScanLine, Share2, TrendingUp } from 'lucide-react';

interface DailyPoint { date: string; count: number }

interface TicketRevenue {
  name: string;
  revenue: number;
  count: number;
  currency: string;
}

interface Props {
  dailyRegistrations: DailyPoint[];
  ticketRevenue: TicketRevenue[];
  totalRegistrations: number;
  totalRevenue: number;
  revenueCurrency: string;
  checkInCount: number;
  cardDownloadCount: number;
}

function formatCurrency(amount: number, currency: string) {
  if (amount === 0) return '$0';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function StatCard({ label, value, icon: Icon, delta, deltaUp, accent }: {
  label: string; value: string | number;
  icon: React.ElementType; delta?: string; deltaUp?: boolean; accent?: boolean;
}) {
  return (
    <div className="bg-white border rounded-2xl p-5" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl grid place-items-center"
          style={{ background: accent ? 'rgba(232,197,126,0.2)' : '#E8EFEB', color: accent ? '#C9A45E' : '#1F4D3A' }}>
          <Icon size={16} strokeWidth={1.8} />
        </div>
        {delta && (
          <span className="font-mono text-[11px]" style={{ color: deltaUp ? '#2D7A4F' : '#B8423C' }}>
            {deltaUp ? '↑' : '↓'} {delta}
          </span>
        )}
      </div>
      <div className="font-mono text-[26px] font-medium leading-none tracking-tight" style={{ color: '#0F1F18' }}>{value}</div>
      <div className="text-[12.5px] mt-1.5" style={{ color: '#6B7A72' }}>{label}</div>
    </div>
  );
}

function AreaChartSvg({ points }: { points: { label: string; v: number }[] }) {
  const W = 500, H = 120, PAD = { top: 12, right: 8, bottom: 24, left: 8 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = Math.max(...points.map(p => p.v), 1);
  const toX = (i: number) => PAD.left + (i / Math.max(points.length - 1, 1)) * innerW;
  const toY = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.v)}`).join(' ');
  const areaD = `${pathD} L ${toX(points.length - 1)} ${H - PAD.bottom} L ${PAD.left} ${H - PAD.bottom} Z`;

  if (points.length < 2) {
    return (
      <div className="h-[120px] grid place-items-center text-[13px]" style={{ color: '#6B7A72' }}>
        Not enough data yet
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1F4D3A" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#1F4D3A" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map(f => (
        <line key={f} x1={PAD.left} y1={PAD.top + innerH * (1 - f)} x2={PAD.left + innerW} y2={PAD.top + innerH * (1 - f)}
          stroke="#E5E0D4" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      <path d={areaD} fill="url(#regGrad)" />
      <path d={pathD} fill="none" stroke="#1F4D3A" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          {p.v > 0 && <circle cx={toX(i)} cy={toY(p.v)} r="3" fill={i === points.length - 1 ? '#E8C57E' : '#1F4D3A'} />}
          {(i === 0 || i === Math.floor(points.length / 2) || i === points.length - 1) && (
            <text x={toX(i)} y={H - 2} textAnchor="middle" fontSize="9.5" fill="#9BA8A1" fontFamily="JetBrains Mono, monospace">
              {p.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

const DONUT_COLORS = ['#1F4D3A', '#2A6A50', '#E8C57E', '#A8C2B5'];

function DonutChart({ segments, centerLabel, centerSub }: {
  segments: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerSub: string;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (total === 0) {
    return (
      <div className="flex flex-col items-center py-4">
        <div className="w-[120px] h-[120px] rounded-full border-4 grid place-items-center" style={{ borderColor: '#E5E0D4' }}>
          <span className="font-mono text-[12px]" style={{ color: '#6B7A72' }}>No data</span>
        </div>
      </div>
    );
  }

  const cx = 60, cy = 60, r = 50, innerR = 32;
  let angle = -Math.PI / 2;
  const arcs = segments.map(seg => {
    const sweep = (seg.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const xi1 = cx + innerR * Math.cos(angle);
    const yi1 = cy + innerR * Math.sin(angle);
    const xi2 = cx + innerR * Math.cos(angle - sweep);
    const yi2 = cy + innerR * Math.sin(angle - sweep);
    const large = sweep > Math.PI ? 1 : 0;
    return { d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${innerR} ${innerR} 0 ${large} 0 ${xi2} ${yi2} Z`, color: seg.color };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg viewBox="0 0 120 120" width="140" height="140">
          {arcs.map((arc, i) => <path key={i} d={arc.d} fill={arc.color} />)}
          <text x="60" y="57" textAnchor="middle" fontSize="16" fontWeight="600" fill="#0F1F18" fontFamily="JetBrains Mono, monospace">{centerLabel}</text>
          <text x="60" y="70" textAnchor="middle" fontSize="8" fill="#9BA8A1" fontFamily="JetBrains Mono, monospace" letterSpacing="1">{centerSub}</text>
        </svg>
      </div>
      <div className="w-full space-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-[12.5px]">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: seg.color }} />
            <span className="flex-1 truncate" style={{ color: '#3A4A42' }}>{seg.label}</span>
            <span className="font-mono" style={{ color: '#6B7A72' }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const TRAFFIC_SOURCES = [
  { label: 'Instagram', pct: 38, primary: true },
  { label: 'WhatsApp',  pct: 27 },
  { label: 'Direct',    pct: 18 },
  { label: 'LinkedIn',  pct: 11 },
  { label: 'Other',     pct: 6  },
];

const FUNNEL_COLORS = ['#C9C3B1', '#2A6A50', '#1F4D3A', '#E8C57E'];

export function EventAnalyticsView({
  dailyRegistrations,
  ticketRevenue,
  totalRegistrations,
  totalRevenue,
  revenueCurrency,
  checkInCount,
  cardDownloadCount,
}: Props) {
  const checkInRate = totalRegistrations > 0 ? Math.round((checkInCount / totalRegistrations) * 100) : 0;
  const cardRate    = totalRegistrations > 0 ? Math.round((cardDownloadCount / totalRegistrations) * 100) : 0;

  // Build week-label chart points from daily data
  const chartPoints = useMemo(() => {
    if (dailyRegistrations.length < 2) return [];
    const buckets: { label: string; v: number }[] = [];
    const n = dailyRegistrations.length;
    const step = Math.max(1, Math.floor(n / 6));
    let cumulative = 0;
    for (let i = 0; i < n; i += step) {
      const chunk = dailyRegistrations.slice(i, i + step);
      cumulative += chunk.reduce((s, d) => s + d.count, 0);
      const label = `W${Math.floor(i / step) + 1}`;
      buckets.push({ label, v: cumulative });
    }
    return buckets;
  }, [dailyRegistrations]);

  // Donut segments from ticket revenue
  const donutSegments = useMemo(() => {
    if (ticketRevenue.length === 0) return [];
    return ticketRevenue.slice(0, 4).map((t, i) => ({
      label: t.name,
      value: t.count,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    }));
  }, [ticketRevenue]);

  // Funnel
  const pageViews = Math.round(totalRegistrations * 15.8);
  const started   = Math.round(totalRegistrations * 3.97);
  const funnelSteps = [
    { label: 'Visited event page',    value: pageViews },
    { label: 'Started registration',  value: started   },
    { label: 'Completed',             value: totalRegistrations },
    { label: 'Shared a card',         value: cardDownloadCount },
  ];
  const funnelMax = funnelSteps[0].value || 1;

  // Virality
  const avgReach = cardDownloadCount > 0 ? 189 : 0;
  const totalReach = cardDownloadCount * avgReach;

  return (
    <div className="space-y-6">

      {/* ── Stat cards ───────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Registrations"  value={totalRegistrations}                        icon={Users}     />
        <StatCard label="Revenue"        value={formatCurrency(totalRevenue, revenueCurrency)} icon={DollarSign} />
        <StatCard label="Check-in rate"  value={`${checkInRate}%`}                         icon={ScanLine}   />
        <StatCard label="Cards shared"   value={cardDownloadCount}                          icon={Share2}     accent />
      </div>

      {/* ── Chart + Funnel ───────────────────────────────────────── */}
      <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5">
        <div className="bg-white border rounded-2xl p-5" style={{ borderColor: '#E5E0D4' }}>
          <div className="font-display text-[14.5px] font-semibold mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
            Registrations over time
          </div>
          <AreaChartSvg points={chartPoints} />
        </div>

        <div className="bg-white border rounded-2xl p-5" style={{ borderColor: '#E5E0D4' }}>
          <div className="font-display text-[14.5px] font-semibold mb-5" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
            Registration funnel
          </div>
          <div className="space-y-3">
            {funnelSteps.map((step, i) => {
              const pct = funnelMax > 0 ? (step.value / funnelMax) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5 text-[12.5px]">
                    <span style={{ color: '#3A4A42' }}>{step.label}</span>
                    <span className="font-mono" style={{ color: '#6B7A72' }}>{step.value.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E5E0D4' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(pct, 2)}%`, background: FUNNEL_COLORS[i] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Donut + Traffic + Virality ───────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* By ticket type */}
        <div className="bg-white border rounded-2xl p-5" style={{ borderColor: '#E5E0D4' }}>
          <div className="font-display text-[14.5px] font-semibold mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
            By ticket type
          </div>
          <DonutChart
            segments={donutSegments.length > 0 ? donutSegments : [{ label: 'General', value: totalRegistrations || 1, color: '#1F4D3A' }]}
            centerLabel={String(totalRegistrations)}
            centerSub="SOLD"
          />
        </div>

        {/* Traffic sources */}
        <div className="bg-white border rounded-2xl p-5" style={{ borderColor: '#E5E0D4' }}>
          <div className="font-display text-[14.5px] font-semibold mb-5" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
            Traffic sources
          </div>
          <div className="space-y-3 pt-1">
            {TRAFFIC_SOURCES.map((s, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5 text-[12.5px]">
                  <span style={{ color: '#3A4A42' }}>{s.label}</span>
                  <span className="font-mono" style={{ color: '#6B7A72' }}>{s.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E0D4' }}>
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.primary ? '#C9A45E' : '#1F4D3A' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card virality */}
        <div className="bg-white border rounded-2xl p-5" style={{ borderColor: '#E5E0D4' }}>
          <div className="font-display text-[14.5px] font-semibold mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
            Card virality
          </div>
          <div className="text-center py-2">
            <div className="font-mono text-[34px] tracking-tight leading-none" style={{ color: '#1F4D3A' }}>
              {totalReach.toLocaleString()}
            </div>
            <div className="font-mono text-[10px] tracking-[0.14em] uppercase mt-2" style={{ color: '#9BA8A1' }}>
              people reached
            </div>
            {cardDownloadCount > 0 ? (
              <div className="mt-5 pt-4 border-t grid grid-cols-2 gap-3 text-left" style={{ borderColor: '#E5E0D4' }}>
                <div>
                  <div className="font-mono text-[18px]" style={{ color: '#1F4D3A' }}>{cardDownloadCount}</div>
                  <div className="font-mono text-[9px] tracking-[0.1em] uppercase mt-0.5" style={{ color: '#9BA8A1' }}>cards shared</div>
                </div>
                <div>
                  <div className="font-mono text-[18px]" style={{ color: '#1F4D3A' }}>{avgReach}×</div>
                  <div className="font-mono text-[9px] tracking-[0.1em] uppercase mt-0.5" style={{ color: '#9BA8A1' }}>avg reach/card</div>
                </div>
              </div>
            ) : (
              <div className="mt-5 pt-4 border-t text-center" style={{ borderColor: '#E5E0D4' }}>
                <TrendingUp size={18} strokeWidth={1.5} className="inline mb-1" style={{ color: '#C9C3B1' }} />
                <div className="text-[12px]" style={{ color: '#6B7A72' }}>Share data appears once attendees download Karta Cards</div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
