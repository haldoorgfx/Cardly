'use client';

import { useMemo } from 'react';

interface DailyPoint { date: string; count: number }

interface TicketRevenue {
  name: string;
  revenue: number;
  count: number;
  currency: string;
}

export interface SessionAnalytic {
  id: string;
  title: string;
  registrationsCount: number;
  attendedCount: number;
  avgRating: number | null;
  feedbackCount: number;
}

interface Props {
  dailyRegistrations: DailyPoint[];
  ticketRevenue: TicketRevenue[];
  totalRegistrations: number;
  totalRevenue: number;
  revenueCurrency: string;
  checkInCount: number;
  cardDownloadCount: number;
  sessions?: SessionAnalytic[];
}

const W = 800, H = 220, PAD = { top: 12, right: 16, bottom: 32, left: 40 };
const innerW = W - PAD.left - PAD.right;
const innerH = H - PAD.top - PAD.bottom;

function toX(i: number, len: number) {
  return PAD.left + (i / Math.max(len - 1, 1)) * innerW;
}
function toY(v: number, max: number) {
  return PAD.top + innerH - (v / max) * innerH;
}

function formatCurrency(amount: number, currency: string) {
  if (amount === 0) return '$0';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency,
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function LineChart({ points }: { points: DailyPoint[] }) {
  const max = Math.max(...points.map(p => p.count), 1);
  const len = points.length;

  const polyPoints = points.map((p, i) => `${toX(i, len)},${toY(p.count, max)}`).join(' ');

  const months = useMemo(() => {
    const seen = new Set<string>();
    const result: { label: string; x: number }[] = [];
    points.forEach((p, i) => {
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({
          label: d.toLocaleDateString('en-US', { month: 'short' }),
          x: toX(i, len),
        });
      }
    });
    return result;
  }, [points, len]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: 220, overflow: 'visible' }}
    >
      <line x1={PAD.left} y1={H - PAD.bottom} x2={PAD.left + innerW} y2={H - PAD.bottom}
        stroke="#E5E0D4" strokeWidth="1" />
      <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom}
        stroke="#E5E0D4" strokeWidth="1" />
      {len > 1 && (
        <polyline
          fill="none"
          stroke="#1F4D3A"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polyPoints}
        />
      )}
      {len > 0 && (
        <circle
          cx={toX(len - 1, len)}
          cy={toY(points[len - 1].count, max)}
          r="5" fill="#E8C57E" stroke="#FAF6EE" strokeWidth="2"
        />
      )}
      {months.map(m => (
        <text key={m.label} x={m.x} y={H - 6} textAnchor="middle"
          fontSize="11" fill="#6B7A72" fontFamily="JetBrains Mono, monospace">
          {m.label}
        </text>
      ))}
    </svg>
  );
}

function LeaderList({ items, total }: {
  items: { label: string; value: string }[];
  total?: { label: string; value: string };
}) {
  return (
    <div style={{ maxWidth: 520 }}>
      {items.map((item, i) => (
        <div key={i} className="flex items-center py-[11px]" style={{ borderBottom: '1px solid #F0ECE4' }}>
          <span className="text-[14px]" style={{ color: '#3A4A42' }}>{item.label}</span>
          <span className="flex-1 mx-4" style={{ height: 1, background: '#E5E0D4' }} />
          <span className="font-mono text-[14px] font-medium" style={{ color: '#1F4D3A' }}>{item.value}</span>
        </div>
      ))}
      {total && (
        <div className="flex items-center pt-4 mt-1">
          <span className="font-display font-semibold text-[15px]" style={{ color: '#0F1F18' }}>{total.label}</span>
          <span className="flex-1 mx-4" style={{ height: 1, background: '#E5E0D4' }} />
          <span className="font-mono text-[20px] font-semibold" style={{ color: '#1F4D3A' }}>{total.value}</span>
        </div>
      )}
    </div>
  );
}

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-[13px]" style={{ color: '#6B7A72' }}>—</span>;
  return (
    <span className="font-mono text-[13px] font-medium" style={{ color: '#C9A45E' }}>
      {rating.toFixed(1)}★
    </span>
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
  sessions = [],
}: Props) {
  const checkInRate = totalRegistrations > 0 ? Math.round((checkInCount / totalRegistrations) * 100) : 0;
  const cardRate    = totalRegistrations > 0 ? Math.round((cardDownloadCount / totalRegistrations) * 100) : 0;

  const revenueItems = ticketRevenue.map(t => ({
    label: t.name,
    value: formatCurrency(t.revenue, t.currency || revenueCurrency),
  }));

  return (
    <div>

      {/* ── Summary strip ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-8 gap-y-2 items-baseline mb-12">
        {[
          { value: String(totalRegistrations), label: 'registrations' },
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

      {/* ── Registrations over time ─────────────────────────────── */}
      <section>
        <h2 className="font-display mb-5" style={{ fontWeight: 400, fontSize: 22, color: '#1F4D3A', letterSpacing: '-0.015em' }}>
          Registrations
        </h2>
        {dailyRegistrations.length < 2 ? (
          <div className="py-16 text-center text-[14px]" style={{ color: '#6B7A72' }}>
            Not enough data yet
          </div>
        ) : (
          <LineChart points={dailyRegistrations} />
        )}
        {dailyRegistrations.length >= 2 && (
          <p className="mt-4 text-[15px]" style={{ color: '#6B7A72', maxWidth: 720 }}>
            {totalRegistrations} total registrations across {dailyRegistrations.length} days.
          </p>
        )}
      </section>

      {/* ── Sessions ────────────────────────────────────────────── */}
      {sessions.length > 0 && (
        <section style={{ marginTop: 56 }}>
          <h2 className="font-display mb-5" style={{ fontWeight: 400, fontSize: 22, color: '#1F4D3A', letterSpacing: '-0.015em' }}>
            Sessions
          </h2>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
            <table className="w-full">
              <thead>
                <tr style={{ background: '#F5F2EB' }}>
                  {['Session', 'Registered', 'Attended', 'Rating', 'Feedback'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[11px] font-medium tracking-wide uppercase ${i === 0 ? 'text-left' : 'text-right'} ${[2, 4].includes(i) ? 'hidden md:table-cell' : ''}`}
                      style={{ color: '#6B7A72' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={s.id} style={{ background: i === 0 ? '#E8EFEB' : '#FFFFFF', borderTop: '1px solid #F0ECE4' }}>
                    <td className="px-4 py-3">
                      <span
                        className="text-[14px]"
                        style={{ fontWeight: i === 0 ? 500 : 400, color: i === 0 ? '#1F4D3A' : '#0F1F18' }}
                      >
                        {s.title}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[13px]" style={{ color: '#0F1F18' }}>
                      {s.registrationsCount}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] hidden md:table-cell" style={{ color: '#0F1F18' }}>
                      {s.attendedCount > 0 ? s.attendedCount : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <StarRating rating={s.avgRating} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[13px] hidden md:table-cell" style={{ color: '#6B7A72' }}>
                      {s.feedbackCount > 0 ? `${s.feedbackCount} notes` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── Revenue ──────────────────────────────────────────────── */}
      {ticketRevenue.length > 0 && totalRevenue > 0 && (
        <section style={{ marginTop: 56 }}>
          <h2 className="font-display mb-5" style={{ fontWeight: 400, fontSize: 22, color: '#1F4D3A', letterSpacing: '-0.015em' }}>
            Revenue
          </h2>
          <LeaderList
            items={revenueItems}
            total={{ label: 'Total', value: formatCurrency(totalRevenue, revenueCurrency) }}
          />
        </section>
      )}

      {/* ── Karta Card sharing ───────────────────────────────────── */}
      <section style={{ marginTop: 56, maxWidth: 760 }}>
        <h2 className="font-display mb-5" style={{ fontWeight: 400, fontSize: 22, color: '#1F4D3A', letterSpacing: '-0.015em' }}>
          Karta Card sharing
        </h2>
        <p className="text-[15px]" style={{ color: '#3A4A42' }}>
          <span className="font-mono font-medium" style={{ color: '#1F4D3A' }}>{cardDownloadCount}</span>{' '}
          of{' '}
          <span className="font-mono font-medium" style={{ color: '#1F4D3A' }}>{totalRegistrations}</span>{' '}
          attendees (<span className="font-mono font-medium" style={{ color: '#C9A45E' }}>{cardRate}%</span>) downloaded their card.
        </p>
        <p className="text-[15px] mt-5" style={{ color: '#6B7A72', maxWidth: 680 }}>
          Every shared card puts your event in front of new people — the cheapest acquisition channel you have.
        </p>
      </section>

      <div style={{ height: 64 }} />
    </div>
  );
}
