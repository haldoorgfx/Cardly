export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import {
  StatCards, Panel, BarsChart, AreaChart, Table, Row, Cell, Pill,
} from '@/components/dashboard/ui';

function fmtMoney(n: number, currency = 'USD') {
  if (n === 0) return '$0';
  try {
    const fmt = new Intl.NumberFormat('en-US', {
      style: 'currency', currency,
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(n);
    if (n >= 1_000_000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency', currency,
        minimumFractionDigits: 1, maximumFractionDigits: 1,
        notation: 'compact',
      }).format(n);
    }
    if (n >= 1000) {
      const sym = fmt.replace(/[\d,. ]/g, '').trim();
      return `${sym}${(n / 1000).toFixed(1)}k`;
    }
    return fmt;
  } catch {
    return `${n.toLocaleString()}`;
  }
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

const STATUS_DOT: Record<string, string> = {
  published: '#2D7A4F',
  draft:     '#C9A45E',
  archived:  '#6B7A72',
};
const STATUS_TONE: Record<string, 'green' | 'amber' | 'neutral'> = {
  published: 'green',
  draft:     'amber',
  archived:  'neutral',
};
const STATUS_LABEL: Record<string, string> = {
  published: 'Live',
  draft:     'Draft',
  archived:  'Archived',
};

export default async function AnalyticsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const { data: eventsData } = await admin
    .from('events')
    .select('id, name, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const allEvents = eventsData ?? [];
  const eventIds = allEvents.map(e => e.id);

  const [regResult, cardResult] = await Promise.all([
    eventIds.length > 0
      ? admin
          .from('registrations')
          .select('event_id, amount_paid, status, created_at, currency')
          .in('event_id', eventIds)
          .in('status', ['confirmed', 'checked_in'])
      : Promise.resolve({ data: [] as { event_id: string; amount_paid: number; status: string; created_at: string; currency: string }[] }),
    eventIds.length > 0
      ? admin
          .from('generated_cards')
          .select('event_id, created_at')
          .in('event_id', eventIds)
      : Promise.resolve({ data: [] as { event_id: string; created_at: string }[] }),
  ]);

  const allRegs  = (regResult.data  ?? []) as { event_id: string; amount_paid: number; status: string; created_at: string; currency: string }[];
  const allCards = (cardResult.data ?? []) as { event_id: string; created_at: string }[];

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalEvents = allEvents.length;
  const totalRegs   = allRegs.length;
  const totalCards  = allCards.length;

  // Revenue currency: use most-common currency with non-zero amount_paid
  const currencyCount: Record<string, number> = {};
  for (const r of allRegs) {
    if (Number(r.amount_paid) > 0) {
      currencyCount[r.currency] = (currencyCount[r.currency] ?? 0) + 1;
    }
  }
  const revCurrency = Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'USD';
  const totalRevenue = allRegs.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);

  // Month-on-month: registrations + revenue added this calendar month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthRegs    = allRegs.filter(r => r.created_at >= monthStart).length;
  const monthRevenue = allRegs.filter(r => r.created_at >= monthStart).reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);

  // ── Per-event stats ───────────────────────────────────────────────────────
  const eventStats = allEvents.map(ev => {
    const evRegs      = allRegs.filter(r => r.event_id === ev.id);
    const evCheckedIn = evRegs.filter(r => r.status === 'checked_in').length;
    const evRevenue   = evRegs.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
    const evCards     = allCards.filter(c => c.event_id === ev.id).length;
    return {
      ...ev,
      regs:         evRegs.length,
      checkedIn:    evCheckedIn,
      checkInRate:  evRegs.length > 0 ? Math.round((evCheckedIn / evRegs.length) * 100) : 0,
      revenue:      evRevenue,
      cards:        evCards,
    };
  });

  // ── Monthly revenue trend (last 6 months) ────────────────────────────────
  const trendMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      key:     `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label:   d.toLocaleDateString('en', { month: 'short' }),
      revenue: 0,
    };
  });
  for (const r of allRegs) {
    const mk = r.created_at.slice(0, 7);
    const m = trendMonths.find(m => m.key === mk);
    if (m) m.revenue += Number(r.amount_paid ?? 0);
  }

  // ── Bar chart: registrations by event (top 6) ────────────────────────────
  const barData = [...eventStats]
    .sort((a, b) => b.regs - a.regs)
    .slice(0, 6)
    .map(ev => ({
      label: ev.name.length > 12 ? ev.name.slice(0, 11) + '…' : ev.name,
      value: ev.regs,
    }));

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="border-b px-6 pt-7 pb-6" style={{ background: 'white', borderColor: '#E5E0D4' }}>
        <div className="max-w-[1100px] mx-auto flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-[28px] text-[#0F1F18] leading-tight tracking-tight">
              Analytics
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: '#6B7A72' }}>Across all your events</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-8 px-3 rounded-lg text-[12.5px] font-medium flex items-center gap-1.5 border"
              style={{ background: '#FAF6EE', borderColor: '#E5E0D4', color: '#3A4A42' }}>
              Last 90 days
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 3.5L5 6.5L8 3.5" stroke="#6B7A72" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </span>
            <a href="/api/export-data" download
              className="h-8 px-3 rounded-lg text-[12.5px] font-medium flex items-center gap-1.5 border transition hover:bg-[#FAF6EE]"
              style={{ borderColor: '#E5E0D4', color: '#1F4D3A' }}>
              <ArrowUpRight size={13} strokeWidth={2} /> Export
            </a>
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="max-w-[1100px] mx-auto px-6 py-7 space-y-6">

        {/* Stat cards */}
        <StatCards cols={4} items={[
          { value: totalEvents,                          label: 'TOTAL EVENTS' },
          { value: fmtNum(totalRegs),                    label: 'REGISTRATIONS', delta: monthRegs > 0 ? `+${monthRegs} mo` : undefined, deltaUp: true },
          { value: fmtMoney(totalRevenue, revCurrency),  label: 'REVENUE',       delta: monthRevenue > 0 ? `+${fmtMoney(monthRevenue, revCurrency)} mo` : undefined, deltaUp: true, accent: true },
          { value: fmtNum(totalCards),                   label: 'CARDS SHARED' },
        ]} />

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Panel title="Registrations across events">
            {barData.length === 0 ? (
              <div className="py-12 text-center text-[13px]" style={{ color: '#6B7A72' }}>
                No events yet.{' '}
                <Link href="/events/new" className="text-[#1F4D3A] hover:underline">Create your first →</Link>
              </div>
            ) : (
              <BarsChart data={barData} height={200} />
            )}
          </Panel>

          <Panel title="Revenue trend">
            {trendMonths.every(m => m.revenue === 0) ? (
              <div className="py-12 text-center text-[13px]" style={{ color: '#6B7A72' }}>
                No revenue data yet.
              </div>
            ) : (
              <AreaChart
                points={trendMonths.map(m => ({ label: m.label, v: m.revenue }))}
                height={200}
                color="#E8C57E"
              />
            )}
          </Panel>
        </div>

        {/* Event performance table */}
        <Panel title="Event performance">
          {eventStats.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-[13px]" style={{ color: '#6B7A72' }}>No events yet.</p>
              <Link href="/events/new"
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1F4D3A] hover:underline">
                Create your first event →
              </Link>
            </div>
          ) : (
            <Table head={['Event', 'Status', 'Registrations', 'Revenue', 'Cards', 'Check-in']}>
              {eventStats.map(ev => (
                <Row key={ev.id}>
                  <Cell>
                    <Link href={`/events/${ev.id}`}
                      className="font-medium hover:text-[#1F4D3A] transition-colors"
                      style={{ color: '#0F1F18' }}>
                      {ev.name}
                    </Link>
                  </Cell>
                  <Cell>
                    <Pill
                      tone={STATUS_TONE[ev.status] ?? 'neutral'}
                      dot={STATUS_DOT[ev.status]}
                    >
                      {STATUS_LABEL[ev.status] ?? ev.status}
                    </Pill>
                  </Cell>
                  <Cell>
                    <span className="font-mono text-[13px]">{ev.regs.toLocaleString()}</span>
                  </Cell>
                  <Cell>
                    <span className="font-mono text-[13px]">
                      {ev.revenue > 0 ? fmtMoney(ev.revenue, revCurrency) : '$0'}
                    </span>
                  </Cell>
                  <Cell>
                    <span className="font-mono text-[13px]">{ev.cards}</span>
                  </Cell>
                  <Cell>
                    <span className="font-mono text-[13px]">
                      {ev.checkInRate > 0 ? `${ev.checkInRate}%` : '—'}
                    </span>
                  </Cell>
                </Row>
              ))}
            </Table>
          )}
        </Panel>

      </div>
    </div>
  );
}
