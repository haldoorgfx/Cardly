'use client';

import { useMemo } from 'react';
import { Users, DollarSign, ScanLine, IdCard, TrendingUp, TrendingDown } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DailyPoint    { date: string; count: number }
interface TicketRevenue { name: string; revenue: number; count: number; currency: string }

interface Props {
  eventName:          string;
  eventStatus:        string;
  viewCount:          number;
  dailyRegistrations: DailyPoint[];
  ticketRevenue:      TicketRevenue[];
  totalRegistrations: number;
  totalRevenue:       number;
  revenueCurrency:    string;
  checkInCount:       number;
  cardDownloadCount:  number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number, currency = 'USD') {
  if (n === 0) return '$0';
  try {
    if (n >= 1_000_000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency', currency, minimumFractionDigits: 1, maximumFractionDigits: 1, notation: 'compact',
      }).format(n);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n.toLocaleString()}`;
  }
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000)      return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

const STATUS_DOT: Record<string, string> = {
  published: '#2D7A4F', draft: '#C9A45E', archived: '#6B7A72',
};
const STATUS_LABEL: Record<string, string> = {
  published: 'live', draft: 'draft', archived: 'archived',
};

// ── Line chart ────────────────────────────────────────────────────────────────

function LineChart({ points }: { points: DailyPoint[] }) {
  const W = 600, H = 140, PAD = { top: 12, right: 8, bottom: 28, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const max = Math.max(...points.map(p => p.count), 1);
  const toX = (i: number) => PAD.left + (i / Math.max(points.length - 1, 1)) * innerW;
  const toY = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.count)}`).join(' ');
  const areaD = `${pathD} L ${toX(points.length - 1)} ${H - PAD.bottom} L ${PAD.left} ${H - PAD.bottom} Z`;
  const every = Math.max(1, Math.ceil(points.length / 6));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
      {[0, 0.5, 1].map(f => (
        <line key={f} x1={PAD.left} y1={PAD.top + innerH * (1 - f)} x2={PAD.left + innerW} y2={PAD.top + innerH * (1 - f)}
          stroke="#E5E0D4" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      <path d={areaD} fill="#1F4D3A" fillOpacity="0.07" />
      <path d={pathD} fill="none" stroke="#1F4D3A" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => p.count > 0 && (
        <circle key={i} cx={toX(i)} cy={toY(p.count)} r="3" fill="#1F4D3A" />
      ))}
      {points.length > 0 && (
        <circle cx={toX(points.length - 1)} cy={toY(points[points.length - 1].count)} r="4" fill="#E8C57E" />
      )}
      {points.map((p, i) => i % every === 0 && (
        <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fontSize="10" fill="#6B7A72" fontFamily="JetBrains Mono, monospace">
          {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </text>
      ))}
      <text x={PAD.left - 6} y={PAD.top + 4} textAnchor="end" fontSize="10" fill="#6B7A72" fontFamily="JetBrains Mono, monospace">
        {max}
      </text>
    </svg>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────────

const DONUT_COLORS = ['#1F4D3A', '#2A6A50', '#E8C57E', '#3A6B8C', '#6B7A72'];

function DonutChart({ segments, size = 120 }: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  const r = 15.91;
  let cumPct = 0;
  return (
    <svg viewBox="0 0 42 42" style={{ width: size, height: size }}>
      <circle cx="21" cy="21" r={r} fill="none" stroke="#E5E0D4" strokeWidth="5" />
      {segments.map((seg, i) => {
        const pct = (seg.value / total) * 100;
        const offset = -(cumPct - 25);
        cumPct += pct;
        return (
          <circle key={i} cx="21" cy="21" r={r} fill="none" stroke={seg.color}
            strokeWidth="5" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={offset} />
        );
      })}
      <text x="21" y="19.5" textAnchor="middle" fontFamily="DM Sans,sans-serif" fontWeight="700" fontSize="5.5" fill="#0F1F18">
        {fmtNum(total)}
      </text>
      <text x="21" y="24" textAnchor="middle" fontFamily="JetBrains Mono,monospace" fontSize="2.5" fill="#6B7A72">
        TOTAL
      </text>
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function EventAnalyticsView({
  eventName, eventStatus, viewCount,
  dailyRegistrations, ticketRevenue,
  totalRegistrations, totalRevenue, revenueCurrency,
  checkInCount, cardDownloadCount,
}: Props) {

  const checkInRate  = totalRegistrations > 0 ? Math.round((checkInCount / totalRegistrations) * 100) : 0;

  // Funnel — first step uses view_count, middle step is estimated
  const startedEst   = viewCount > 0 ? Math.round(viewCount * 0.29) : Math.round(totalRegistrations * 1.4);
  const funnelSteps  = [
    { label: 'Visited event page',   value: viewCount || Math.round(totalRegistrations * 5), pct: 100 },
    { label: 'Started registration', value: startedEst, pct: viewCount > 0 ? Math.round((startedEst / viewCount) * 100) : 29 },
    { label: 'Completed',            value: totalRegistrations, pct: viewCount > 0 ? Math.round((totalRegistrations / viewCount) * 100) : 0 },
    { label: 'Shared a card',        value: cardDownloadCount, pct: viewCount > 0 ? Math.round((cardDownloadCount / viewCount) * 100) : 0 },
  ];
  const funnelMax    = funnelSteps[0].value;

  // Donut segments for ticket types
  const donutSegs    = useMemo(() =>
    ticketRevenue.map((t, i) => ({
      label: t.name,
      value: t.count,
      color: DONUT_COLORS[i % DONUT_COLORS.length],
    })),
    [ticketRevenue],
  );

  // Card vitality estimate: cards × estimated social reach per card
  const EST_REACH    = 189;
  const totalReach   = cardDownloadCount * EST_REACH;

  // Sample traffic sources
  const trafficSrcs  = [
    { label: 'Instagram',  pct: 35, color: '#E8C57E' },
    { label: 'WhatsApp',   pct: 27, color: '#25D366' },
    { label: 'Direct',     pct: 12, color: '#1F4D3A' },
    { label: 'LinkedIn',   pct: 12, color: '#0a66c2' },
    { label: 'Other',      pct: 8,  color: '#6B7A72' },
    { label: 'Unknown',    pct: 4,  color: '#E5E0D4' },
  ];

  const card = (n: string, label: string, Icon: React.ElementType, delta?: string, up = true, accent = false) => (
    <div className="rounded-2xl border p-5" style={accent
      ? { background: 'linear-gradient(135deg,rgba(232,197,126,0.12),rgba(31,77,58,0.05))', borderColor: 'rgba(232,197,126,0.5)' }
      : { background: 'white', borderColor: '#E5E0D4' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono uppercase tracking-[0.14em] text-[9.5px]" style={{ color: '#6B7A72' }}>{label}</span>
        <span className="h-7 w-7 rounded-lg grid place-items-center"
          style={{ background: accent ? 'rgba(232,197,126,0.2)' : '#E8EFEB' }}>
          <Icon size={13} strokeWidth={1.8} color={accent ? '#C9A45E' : '#1F4D3A'} />
        </span>
      </div>
      <div className="font-mono tracking-tight" style={{ fontSize: 26, color: '#1F4D3A', lineHeight: 1 }}>{n}</div>
      {delta && (
        <div className="flex items-center gap-1 mt-2 font-mono" style={{ fontSize: 11, color: up ? '#2D7A4F' : '#B8423C' }}>
          {up ? <TrendingUp size={10} strokeWidth={2} /> : <TrendingDown size={10} strokeWidth={2} />}
          {delta}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {card(fmtNum(totalRegistrations),              'REGISTRATIONS', Users)}
        {card(fmt(totalRevenue, revenueCurrency),      'REVENUE',       DollarSign, undefined, true, true)}
        {card(`${checkInRate}%`,                       'CHECK-IN RATE', ScanLine)}
        {card(fmtNum(cardDownloadCount),               'CARDS SHARED',  IdCard)}
      </div>

      {/* ── Registrations over time + Funnel ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Registrations over time */}
        <div className="lg:col-span-2 rounded-2xl border p-5" style={{ background: 'white', borderColor: '#E5E0D4' }}>
          <div className="font-mono uppercase tracking-[0.18em] mb-1" style={{ fontSize: 9.5, color: '#6B7A72' }}>
            Registrations over time
          </div>
          <div className="font-display font-semibold mb-4" style={{ fontSize: 15, color: '#0F1F18' }}>Last 30 days</div>
          {dailyRegistrations.length < 2 ? (
            <div className="py-10 text-center text-[13px]" style={{ color: '#6B7A72' }}>Not enough data yet</div>
          ) : (
            <LineChart points={dailyRegistrations} />
          )}
        </div>

        {/* Registration funnel */}
        <div className="rounded-2xl border p-5" style={{ background: 'white', borderColor: '#E5E0D4' }}>
          <div className="font-mono uppercase tracking-[0.18em] mb-1" style={{ fontSize: 9.5, color: '#6B7A72' }}>
            Registration funnel
          </div>
          <div className="font-display font-semibold mb-5" style={{ fontSize: 15, color: '#0F1F18' }}>Where they drop</div>
          <div className="space-y-4">
            {funnelSteps.map((step, i) => (
              <div key={step.label}>
                <div className="flex items-center justify-between mb-1.5" style={{ fontSize: 12.5, color: '#3A4A42' }}>
                  <span>{step.label}</span>
                  <span className="font-mono font-semibold" style={{ fontSize: 13, color: '#0F1F18' }}>
                    {fmtNum(step.value)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E8EFEB' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.max(funnelMax > 0 ? (step.value / funnelMax) * 100 : 0, 1)}%`, background: '#1F4D3A' }} />
                </div>
                {i < funnelSteps.length - 1 && (
                  <div className="text-right font-mono mt-0.5" style={{ fontSize: 10, color: '#B8423C' }}>
                    {funnelMax > 0 && funnelSteps[i + 1].value < step.value
                      ? `−${Math.round(100 - (funnelSteps[i + 1].value / Math.max(step.value, 1)) * 100)}% drop`
                      : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── By ticket type + Traffic sources + Card vitality ───────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* By ticket type */}
        <div className="rounded-2xl border p-5" style={{ background: 'white', borderColor: '#E5E0D4' }}>
          <div className="font-mono uppercase tracking-[0.18em] mb-1" style={{ fontSize: 9.5, color: '#6B7A72' }}>By ticket type</div>
          <div className="font-display font-semibold mb-4" style={{ fontSize: 15, color: '#0F1F18' }}>Registrations split</div>
          {donutSegs.length === 0 ? (
            <div className="py-8 text-center text-[13px]" style={{ color: '#6B7A72' }}>No ticket data</div>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <DonutChart segments={donutSegs} size={120} />
              </div>
              <div className="space-y-2">
                {donutSegs.map(seg => (
                  <div key={seg.label} className="flex items-center gap-2.5" style={{ fontSize: 12.5, color: '#3A4A42' }}>
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                    <span className="flex-1 truncate">{seg.label}</span>
                    <span className="font-mono" style={{ fontSize: 12, color: '#6B7A72' }}>{seg.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Traffic sources — sample */}
        <div className="rounded-2xl border p-5" style={{ background: 'white', borderColor: '#E5E0D4' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="font-mono uppercase tracking-[0.18em]" style={{ fontSize: 9.5, color: '#6B7A72' }}>Traffic sources</div>
            <span className="font-mono px-1.5 py-0.5 rounded" style={{ fontSize: 9, background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#6B7A72' }}>
              SAMPLE
            </span>
          </div>
          <div className="font-display font-semibold mb-5" style={{ fontSize: 15, color: '#0F1F18' }}>Where they come from</div>
          <div className="space-y-3">
            {trafficSrcs.map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-[12px]" style={{ color: '#6B7A72' }}>{s.label}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E0D4' }}>
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
                <span className="font-mono w-7 text-right" style={{ fontSize: 11, color: '#6B7A72' }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card vitality */}
        <div className="rounded-2xl border p-5 flex flex-col" style={{ background: 'white', borderColor: '#E5E0D4' }}>
          <div className="font-mono uppercase tracking-[0.18em] mb-1" style={{ fontSize: 9.5, color: '#6B7A72' }}>Card vitality</div>
          <div className="font-display font-semibold mb-5" style={{ fontSize: 15, color: '#0F1F18' }}>Social reach estimate</div>
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="font-display font-bold leading-none" style={{ fontSize: 38, color: '#0F1F18' }}>
              {totalReach > 0 ? fmtNum(totalReach) : '—'}
            </div>
            <div className="mt-1 font-mono uppercase tracking-widest" style={{ fontSize: 9, color: '#6B7A72' }}>
              total reaches
            </div>
            {cardDownloadCount > 0 && (
              <div className="mt-5 rounded-xl px-4 py-3 text-center w-full" style={{ background: '#E8EFEB' }}>
                <div style={{ fontSize: 12.5, color: '#3A4A42' }}>
                  <span className="font-mono font-medium" style={{ color: '#1F4D3A' }}>{cardDownloadCount}</span>
                  {' '}cards shared
                </div>
                <div className="mt-0.5" style={{ fontSize: 12, color: '#6B7A72' }}>
                  <span className="font-mono">{EST_REACH}+</span> est. reach per card
                </div>
              </div>
            )}
            {cardDownloadCount === 0 && (
              <p className="mt-4 text-[12px]" style={{ color: '#6B7A72' }}>
                Share your event to start tracking card vitality.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
