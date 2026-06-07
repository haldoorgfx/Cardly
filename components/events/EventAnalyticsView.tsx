'use client';

import { useMemo } from 'react';

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
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function LineChart({ points }: { points: DailyPoint[] }) {
  const W = 600, H = 140, PAD = { top: 12, right: 8, bottom: 28, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const max = Math.max(...points.map(p => p.count), 1);
  const toX = (i: number) => PAD.left + (i / Math.max(points.length - 1, 1)) * innerW;
  const toY = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.count)}`).join(' ');
  const areaD = `${pathD} L ${toX(points.length - 1)} ${H - PAD.bottom} L ${PAD.left} ${H - PAD.bottom} Z`;

  // Show label every N points to avoid crowding
  const labelEvery = Math.ceil(points.length / 6);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
      {/* Y-axis guide lines */}
      {[0, 0.5, 1].map(f => (
        <line key={f} x1={PAD.left} y1={PAD.top + innerH * (1 - f)} x2={PAD.left + innerW} y2={PAD.top + innerH * (1 - f)}
          stroke="#E5E0D4" strokeWidth="1" strokeDasharray="4 4" />
      ))}
      {/* Area fill */}
      <path d={areaD} fill="#1F4D3A" fillOpacity="0.07" />
      {/* Line */}
      <path d={pathD} fill="none" stroke="#1F4D3A" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {/* Dots */}
      {points.map((p, i) => p.count > 0 && (
        <circle key={i} cx={toX(i)} cy={toY(p.count)} r="3" fill="#1F4D3A" />
      ))}
      {/* Gold dot at last data point */}
      {points.length > 0 && (
        <circle cx={toX(points.length - 1)} cy={toY(points[points.length - 1].count)} r="4" fill="#E8C57E" />
      )}
      {/* X-axis labels */}
      {points.map((p, i) => i % labelEvery === 0 && (
        <text key={i} x={toX(i)} y={H - 4} textAnchor="middle" fontSize="10" fill="#6B7A72" fontFamily="JetBrains Mono, monospace">
          {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </text>
      ))}
      {/* Y-axis max label */}
      <text x={PAD.left - 6} y={PAD.top + 4} textAnchor="end" fontSize="10" fill="#6B7A72" fontFamily="JetBrains Mono, monospace">
        {max}
      </text>
    </svg>
  );
}

function HorizontalBar({ label, value, max, currency }: { label: string; value: number; max: number; currency: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="text-[13px] min-w-[120px] truncate" style={{ color: '#3A4A42' }}>{label}</div>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#E5E0D4' }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#1F4D3A' }} />
      </div>
      <div className="font-mono text-[13px] min-w-[60px] text-right" style={{ color: value === 0 ? '#2D7A4F' : '#1F4D3A' }}>
        {value === 0 ? 'Free' : formatCurrency(value, currency)}
      </div>
    </div>
  );
}

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
  const maxRevenue  = useMemo(() => Math.max(...ticketRevenue.map(t => t.revenue), 1), [ticketRevenue]);

  return (
    <div className="space-y-6">

      {/* ── Summary strip ─────────────────────────────────────── */}
      <div
        className="rounded-2xl px-6 py-5"
        style={{ background: 'white', border: '1px solid #E5E0D4' }}
      >
        <div className="flex flex-wrap gap-x-8 gap-y-1 items-baseline">
          {[
            { value: totalRegistrations, label: 'registrations' },
            { value: formatCurrency(totalRevenue, revenueCurrency), label: 'revenue' },
            { value: `${checkInRate}%`, label: 'check-in rate' },
            { value: `${cardRate}%`, label: 'cards downloaded' },
          ].map((s, i) => (
            <span key={i}>
              <span className="font-mono font-medium text-[20px]" style={{ color: '#1F4D3A' }}>{s.value}</span>
              <span className="text-[13px] ml-1.5" style={{ color: '#6B7A72' }}>{s.label}</span>
              {i < 3 && <span className="mx-3 text-[13px]" style={{ color: '#E5E0D4' }}>·</span>}
            </span>
          ))}
        </div>
      </div>

      {/* ── Registrations over time ───────────────────────────── */}
      <div className="rounded-2xl px-6 py-5" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
        <h2 className="font-display font-medium text-[18px] mb-4" style={{ color: '#1F4D3A' }}>
          Registrations over time
        </h2>
        {dailyRegistrations.length < 2 ? (
          <div className="py-8 text-center text-[13px]" style={{ color: '#6B7A72' }}>
            Not enough data yet
          </div>
        ) : (
          <LineChart points={dailyRegistrations} />
        )}
      </div>

      {/* ── Revenue by ticket type ────────────────────────────── */}
      {ticketRevenue.length > 0 && (
        <div className="rounded-2xl px-6 py-5" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
          <h2 className="font-display font-medium text-[18px] mb-4" style={{ color: '#1F4D3A' }}>Revenue by ticket type</h2>
          <div className="space-y-3">
            {ticketRevenue.map(t => (
              <HorizontalBar key={t.name} label={t.name} value={t.revenue} max={maxRevenue} currency={t.currency} />
            ))}
          </div>
          <div className="mt-4 pt-4 flex justify-between" style={{ borderTop: '1px solid #E5E0D4' }}>
            <span className="text-[13px]" style={{ color: '#6B7A72' }}>Total revenue</span>
            <span className="font-mono font-medium text-[15px]" style={{ color: '#1F4D3A' }}>
              {formatCurrency(totalRevenue, revenueCurrency)}
            </span>
          </div>
        </div>
      )}

      {/* ── Check-in & card rates ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Check-in rate', value: checkInCount, total: totalRegistrations, pct: checkInRate, note: `${checkInCount} of ${totalRegistrations} attendees checked in` },
          { label: 'Karta Card downloads', value: cardDownloadCount, total: totalRegistrations, pct: cardRate, note: `${cardDownloadCount} of ${totalRegistrations} attendees downloaded their card` },
        ].map(s => (
          <div key={s.label} className="rounded-2xl px-6 py-5" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
            <div className="font-display font-medium text-[16px] mb-3" style={{ color: '#1F4D3A' }}>{s.label}</div>
            <div className="font-mono font-medium text-[32px]" style={{ color: '#0F1F18' }}>{s.pct}%</div>
            <div className="w-full h-2 rounded-full overflow-hidden mt-3 mb-2" style={{ background: '#E5E0D4' }}>
              <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: '#1F4D3A' }} />
            </div>
            <div className="text-[12px]" style={{ color: '#6B7A72' }}>{s.note}</div>
          </div>
        ))}
      </div>

    </div>
  );
}
