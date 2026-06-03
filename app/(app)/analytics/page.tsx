export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Portfolio Analytics' };

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(n: number) {
  if (n === 0) return '$0';
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
}

function fmtPct(n: number) {
  return `${Math.round(n)}%`;
}

/** Map a value from [minV,maxV] → [minP,maxP] */
function scale(value: number, minV: number, maxV: number, minP: number, maxP: number) {
  if (maxV === minV) return (minP + maxP) / 2;
  return minP + ((value - minV) / (maxV - minV)) * (maxP - minP);
}

/** Build SVG polyline points string from an array of 4 quarterly values */
function buildPolylinePoints(series: number[], allValues: number[]): string {
  const minV = Math.min(...allValues, 0);
  const maxV = Math.max(...allValues, 1);
  const xs = [40, 293, 547, 780];
  return series
    .map((v, i) => `${xs[i]},${scale(v, minV, maxV, 190, 10).toFixed(1)}`)
    .join(' ');
}

// ── page ─────────────────────────────────────────────────────────────────────

export default async function AnalyticsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  // 1. Fetch events
  const { data: eventsRaw } = await admin
    .from('events')
    .select('id, name, created_at, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const events = eventsRaw ?? [];
  const eventIds = events.map((e) => e.id);

  // 2. Fetch registrations
  const { data: regsRaw } = eventIds.length > 0
    ? await admin
        .from('registrations')
        .select('event_id, status, amount_paid, karta_card_url, created_at')
        .in('event_id', eventIds)
        .in('status', ['confirmed', 'checked_in', 'pending'])
        .limit(5000)
    : { data: [] };

  const regs = (regsRaw ?? []) as {
    event_id: string;
    status: string;
    amount_paid: number | null;
    karta_card_url: string | null;
    created_at: string;
  }[];

  // ── aggregations ─────────────────────────────────────────────────────────

  const totalEvents = events.length;
  const totalRegs = regs.length;
  const totalRevenue = regs.reduce((s, r) => s + (r.amount_paid ?? 0), 0);
  const totalCards = regs.filter((r) => r.karta_card_url != null).length;
  const cardsPct = totalRegs > 0 ? Math.round((totalCards / totalRegs) * 100) : 0;

  // avg check-in rate across events
  let avgCheckinRate = 0;
  if (events.length > 0) {
    const perEvent = events.map((ev) => {
      const evRegs = regs.filter((r) => r.event_id === ev.id);
      if (evRegs.length === 0) return 0;
      const checkedIn = evRegs.filter((r) => r.status === 'checked_in').length;
      return (checkedIn / evRegs.length) * 100;
    });
    avgCheckinRate = perEvent.reduce((s, v) => s + v, 0) / perEvent.length;
  }

  // per-event stats sorted by regsCount desc
  const perEventStats = events
    .map((ev) => {
      const evRegs = regs.filter((r) => r.event_id === ev.id);
      const regsCount = evRegs.length;
      const revenue = evRegs.reduce((s, r) => s + (r.amount_paid ?? 0), 0);
      const checkedIn = evRegs.filter((r) => r.status === 'checked_in').length;
      const checkinRate = regsCount > 0 ? Math.round((checkedIn / regsCount) * 100) : 0;
      const cards = evRegs.filter((r) => r.karta_card_url != null).length;
      const cardRate = regsCount > 0 ? Math.round((cards / regsCount) * 100) : 0;
      return { id: ev.id, name: ev.name, created_at: ev.created_at, regsCount, revenue, checkinRate, cardRate };
    })
    .sort((a, b) => b.regsCount - a.regsCount);

  // ── quarterly trends ──────────────────────────────────────────────────────

  const now = new Date();
  const thisYear = now.getFullYear();
  const lastYear = thisYear - 1;

  const currentPeriod = [0, 0, 0, 0];
  const lastPeriod = [0, 0, 0, 0];

  for (const r of regs) {
    const d = new Date(r.created_at);
    const yr = d.getFullYear();
    const q = Math.floor(d.getMonth() / 3);
    if (yr === thisYear) currentPeriod[q]++;
    else if (yr === lastYear) lastPeriod[q]++;
  }

  const allChartValues = [...currentPeriod, ...lastPeriod];
  const currentPoints = buildPolylinePoints(currentPeriod, allChartValues);
  const lastPoints = buildPolylinePoints(lastPeriod, allChartValues);

  // gold dot at end of current line
  const endXs = [40, 293, 547, 780];
  const allV = allChartValues;
  const minV = Math.min(...allV, 0);
  const maxV = Math.max(...allV, 1);
  const dotX = endXs[3];
  const dotY = scale(currentPeriod[3], minV, maxV, 190, 10);

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#FAF6EE',
        fontFamily: 'Inter, sans-serif',
        color: '#0F1F18',
        padding: '48px 0',
      }}
    >
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 32px' }}>

        {/* ── Page header ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 32,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h1
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: '#1F4D3A',
              margin: 0,
            }}
          >
            Your Events Portfolio
          </h1>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
              color: '#3A4A42',
              background: '#FFFFFF',
              border: '1px solid #E5E0D4',
              borderRadius: 9999,
              padding: '6px 14px',
              cursor: 'pointer',
            }}
          >
            1 year
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="#6B7A72" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* ── Metrics strip ── */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E0D4',
            borderRadius: 14,
            padding: '20px 28px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px 4px',
            alignItems: 'baseline',
            fontSize: 14,
            color: '#3A4A42',
            boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)',
            marginBottom: 56,
          }}
        >
          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#1F4D3A', fontWeight: 600 }}>
            {totalEvents}
          </span>
          <span style={{ margin: '0 2px' }}> events &middot; </span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#1F4D3A', fontWeight: 600 }}>
            {totalRegs.toLocaleString()}
          </span>
          <span style={{ margin: '0 2px' }}> total registrations &middot; </span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#1F4D3A', fontWeight: 600 }}>
            {fmtMoney(totalRevenue)}
          </span>
          <span style={{ margin: '0 2px' }}> total revenue &middot; </span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#1F4D3A', fontWeight: 600 }}>
            {fmtPct(avgCheckinRate)}
          </span>
          <span style={{ margin: '0 2px' }}> avg check-in rate &middot; </span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#1F4D3A', fontWeight: 600 }}>
            {totalCards.toLocaleString()}
          </span>
          <span style={{ margin: '0 2px' }}> Karta Cards downloaded (</span>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#1F4D3A', fontWeight: 600 }}>
            {cardsPct}%
          </span>
          <span>)</span>
        </div>

        {/* ── Registrations over time ── */}
        <section style={{ marginBottom: 64 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                fontFamily: 'DM Sans, sans-serif',
                fontSize: 22,
                fontWeight: 400,
                letterSpacing: '-0.015em',
                color: '#1F4D3A',
                margin: 0,
              }}
            >
              Registrations
            </h2>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 24, height: 2, background: '#1F4D3A', borderRadius: 1 }} />
                <span style={{ fontSize: 12, color: '#3A4A42' }}>This period</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="24" height="2" viewBox="0 0 24 2">
                  <line x1="0" y1="1" x2="24" y2="1" stroke="#A9BDB2" strokeWidth="2" strokeDasharray="4 3" />
                </svg>
                <span style={{ fontSize: 12, color: '#6B7A72' }}>Last period</span>
              </div>
            </div>
          </div>

          {/* SVG chart */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E0D4',
              borderRadius: 14,
              padding: '20px 0 0',
              boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)',
              overflow: 'hidden',
            }}
          >
            <svg
              viewBox="0 0 820 220"
              preserveAspectRatio="none"
              width="100%"
              height="220"
              style={{ display: 'block' }}
            >
              {/* grid lines */}
              {[10, 70, 130, 190].map((y) => (
                <line key={y} x1="40" y1={y} x2="780" y2={y} stroke="#E5E0D4" strokeWidth="1" />
              ))}

              {/* last period dashed */}
              {lastPeriod.some((v) => v > 0) && (
                <polyline
                  points={lastPoints}
                  fill="none"
                  stroke="#A9BDB2"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* current period solid */}
              <polyline
                points={currentPoints}
                fill="none"
                stroke="#1F4D3A"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* gold dot at last data point */}
              <circle cx={dotX} cy={dotY} r="5" fill="#E8C57E" stroke="#FFFFFF" strokeWidth="2" />
            </svg>

            {/* Q labels */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 24px 16px',
                borderTop: '1px solid #E5E0D4',
              }}
            >
              {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => (
                <span
                  key={q}
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                    color: '#6B7A72',
                    letterSpacing: '0.05em',
                  }}
                >
                  {q}
                </span>
              ))}
            </div>
          </div>

          {/* Insight */}
          <p style={{ fontSize: 15, color: '#6B7A72', marginTop: 14, lineHeight: 1.6 }}>
            {currentPeriod.reduce((a, b) => a + b, 0) > lastPeriod.reduce((a, b) => a + b, 0)
              ? `Registration volume is up compared to last year. Strong momentum in Q${currentPeriod.indexOf(Math.max(...currentPeriod)) + 1}.`
              : totalRegs === 0
              ? 'No registrations yet. Publish an event to start collecting data.'
              : `Tracking registrations across ${totalEvents} event${totalEvents !== 1 ? 's' : ''}. Data updates in real time.`}
          </p>
        </section>

        {/* ── Top events table ── */}
        <section style={{ marginBottom: 64 }}>
          <h2
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 22,
              fontWeight: 400,
              letterSpacing: '-0.015em',
              color: '#1F4D3A',
              marginBottom: 20,
            }}
          >
            Top performing events
          </h2>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E0D4',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)',
            }}
          >
            {perEventStats.length === 0 ? (
              <div style={{ padding: '40px 28px', color: '#6B7A72', fontSize: 14, textAlign: 'center' }}>
                No events yet. Create your first event to see analytics here.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E5E0D4' }}>
                    {['Event', 'Date', 'Registrations', 'Revenue', 'Check-in %', 'Cards shared %'].map(
                      (col, i) => (
                        <th
                          key={col}
                          style={{
                            padding: '12px 16px',
                            textAlign: i === 0 ? 'left' : 'right',
                            fontWeight: 500,
                            fontSize: 12,
                            color: '#6B7A72',
                            letterSpacing: '0.03em',
                            whiteSpace: 'nowrap',
                            // hide date + check-in on narrow screens via className
                          }}
                          className={i === 1 || i === 4 ? 'hidden md:table-cell' : undefined}
                        >
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {perEventStats.map((ev, idx) => (
                    <tr
                      key={ev.id}
                      style={{
                        background: idx === 0 ? '#E8EFEB' : undefined,
                        borderBottom: idx < perEventStats.length - 1 ? '1px solid #E5E0D4' : undefined,
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            fontWeight: idx === 0 ? 600 : 400,
                            color: idx === 0 ? '#1F4D3A' : '#0F1F18',
                          }}
                        >
                          {ev.name}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          textAlign: 'right',
                          color: '#6B7A72',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 12,
                        }}
                        className="hidden md:table-cell"
                      >
                        {new Date(ev.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          textAlign: 'right',
                          fontFamily: 'JetBrains Mono, monospace',
                          color: '#1F4D3A',
                          fontWeight: 600,
                        }}
                      >
                        {ev.regsCount.toLocaleString()}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          textAlign: 'right',
                          fontFamily: 'JetBrains Mono, monospace',
                          color: '#0F1F18',
                        }}
                      >
                        {fmtMoney(ev.revenue)}
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          textAlign: 'right',
                          fontFamily: 'JetBrains Mono, monospace',
                          color: '#0F1F18',
                        }}
                        className="hidden md:table-cell"
                      >
                        {ev.checkinRate}%
                      </td>
                      <td
                        style={{
                          padding: '14px 16px',
                          textAlign: 'right',
                          fontFamily: 'JetBrains Mono, monospace',
                          color: '#0F1F18',
                        }}
                      >
                        {ev.cardRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* ── Card sharing ── */}
        <section style={{ marginBottom: 64 }}>
          <h2
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 22,
              fontWeight: 400,
              letterSpacing: '-0.015em',
              color: '#1F4D3A',
              marginBottom: 20,
            }}
          >
            Card sharing across your events
          </h2>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E0D4',
              borderRadius: 14,
              padding: '24px 28px',
              boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)',
            }}
          >
            {perEventStats.length === 0 ? (
              <p style={{ color: '#6B7A72', fontSize: 14, margin: 0 }}>No data yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {perEventStats.slice(0, 6).map((ev) => (
                  <div key={ev.id}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 7,
                        fontSize: 13,
                        color: '#3A4A42',
                      }}
                    >
                      <span>{ev.name}</span>
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          color: '#1F4D3A',
                          fontWeight: 600,
                        }}
                      >
                        {ev.cardRate}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 10,
                        background: '#E8EFEB',
                        borderRadius: 9999,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${ev.cardRate}%`,
                          background: '#1F4D3A',
                          borderRadius: 9999,
                          transition: 'width 0.6s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p style={{ fontSize: 15, color: '#6B7A72', marginTop: 14, lineHeight: 1.6 }}>
            {cardsPct >= 50
              ? `Great adoption — ${cardsPct}% of attendees downloaded their Karta Card.`
              : cardsPct > 0
              ? `${cardsPct}% of attendees have downloaded a Karta Card so far. Sharing the link directly in your event comms can boost this significantly.`
              : 'Card sharing data will appear here once attendees start downloading their personalized cards.'}
          </p>
        </section>

        {/* ── Revenue ── */}
        <section style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize: 22,
              fontWeight: 400,
              letterSpacing: '-0.015em',
              color: '#1F4D3A',
              marginBottom: 20,
            }}
          >
            Revenue
          </h2>

          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E0D4',
              borderRadius: 14,
              padding: '24px 28px',
              boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)',
            }}
          >
            {totalRevenue === 0 ? (
              <p style={{ color: '#6B7A72', fontSize: 14, margin: 0, textAlign: 'center', padding: '16px 0' }}>
                No paid tickets yet. Add ticket pricing to your events to track revenue here.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Leader: ticket sales */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '14px 0',
                    borderBottom: '1px solid #E5E0D4',
                  }}
                >
                  <span style={{ fontSize: 14, color: '#3A4A42', flex: 1 }}>Ticket sales</span>
                  <div style={{ flex: 1, height: 1, background: '#E5E0D4', margin: '0 12px' }} />
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#1F4D3A',
                    }}
                  >
                    {fmtMoney(totalRevenue)}
                  </span>
                </div>
                {/* Per-event breakdown */}
                {perEventStats
                  .filter((ev) => ev.revenue > 0)
                  .map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 0',
                      }}
                    >
                      <span style={{ fontSize: 13, color: '#6B7A72', flex: 1, paddingLeft: 12 }}>
                        {ev.name}
                      </span>
                      <div style={{ flex: 1, height: 1, background: '#E5E0D4', margin: '0 12px' }} />
                      <span
                        style={{
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 13,
                          color: '#3A4A42',
                        }}
                      >
                        {fmtMoney(ev.revenue)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
