export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { CalendarDays, Users, DollarSign, Share2 } from 'lucide-react';
export const metadata: Metadata = { title: 'Analytics' };

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}
function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
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

export default async function AnalyticsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  const { data: events } = await admin
    .from('events')
    .select('id, name, slug, status, download_count, updated_at, event_pages(starts_at)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const allEvents = events ?? [];
  const eventIds = allEvents.map(e => e.id);

  const { data: regs } = eventIds.length > 0
    ? await admin
        .from('registrations')
        .select('event_id, status, amount_paid, created_at')
        .in('event_id', eventIds)
    : { data: [] };

  const allRegs = regs ?? [];

  // Aggregate stats
  const totalEvents    = allEvents.filter(e => e.status !== 'archived').length;
  const totalRegs      = allRegs.filter(r => ['confirmed', 'checked_in'].includes(r.status)).length;
  const totalRevenue   = allRegs.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
  const totalCards     = allEvents.reduce((s, e) => s + (e.download_count ?? 0), 0);

  // Per-event aggregates
  const regsByEvent: Record<string, { count: number; revenue: number; checkedIn: number }> = {};
  for (const r of allRegs) {
    if (!['confirmed', 'checked_in'].includes(r.status)) continue;
    if (!regsByEvent[r.event_id]) regsByEvent[r.event_id] = { count: 0, revenue: 0, checkedIn: 0 };
    regsByEvent[r.event_id].count++;
    regsByEvent[r.event_id].revenue += Number(r.amount_paid ?? 0);
    if (r.status === 'checked_in') regsByEvent[r.event_id].checkedIn++;
  }

  // Monthly revenue for trend chart (last 6 months)
  const now = new Date();
  const revenueMonths: { label: string; v: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const v = allRegs.filter(r => {
      const rd = new Date(r.created_at);
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
    }).reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
    revenueMonths.push({ label, v });
  }
  const maxRevMonth = Math.max(...revenueMonths.map(m => m.v), 1);

  // Top events for bar chart + table
  const topEvents = allEvents
    .filter(e => e.status !== 'archived')
    .map(e => ({ ...e, regs: regsByEvent[e.id]?.count ?? 0, revenue: regsByEvent[e.id]?.revenue ?? 0 }))
    .sort((a, b) => b.regs - a.regs)
    .slice(0, 6);

  const maxRegsForBar = Math.max(...topEvents.map(e => e.regs), 1);

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-[24px] font-semibold" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>Analytics</h1>
            <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>Across all your events</p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total events"    value={totalEvents}          icon={CalendarDays} />
          <StatCard label="Registrations"   value={fmtNum(totalRegs)}    icon={Users}        />
          <StatCard label="Revenue"         value={fmtMoney(totalRevenue)} icon={DollarSign}  />
          <StatCard label="Cards shared"    value={fmtNum(totalCards)}   icon={Share2}       accent />
        </div>

        {/* Bars per event + Revenue trend */}
        <div className="grid lg:grid-cols-[1.5fr_1fr] gap-5 mb-5">
          {/* Registrations across events */}
          <div className="bg-white border rounded-2xl p-5" style={{ borderColor: '#E5E0D4' }}>
            <div className="font-display text-[14.5px] font-semibold mb-5" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
              Registrations across events
            </div>
            {topEvents.length === 0 ? (
              <div className="h-[160px] grid place-items-center text-[13px]" style={{ color: '#6B7A72' }}>No events yet.</div>
            ) : (
              <div className="space-y-3">
                {topEvents.map((e, i) => {
                  const pct = maxRegsForBar > 0 ? (e.regs / maxRegsForBar) * 100 : 0;
                  const barColors = ['#1F4D3A', '#2A6A50', '#A8C2B5', '#3A7B60', '#4E9075', '#6BA88C'];
                  return (
                    <div key={e.id}>
                      <div className="flex items-center justify-between mb-1.5 text-[12.5px]">
                        <span className="truncate max-w-[200px]" style={{ color: '#3A4A42' }}>{e.name}</span>
                        <span className="font-mono shrink-0 ml-2" style={{ color: '#6B7A72' }}>{fmtNum(e.regs)}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E5E0D4' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${Math.max(pct, e.regs > 0 ? 2 : 0)}%`, background: barColors[i % barColors.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Revenue trend */}
          <div className="bg-white border rounded-2xl p-5" style={{ borderColor: '#E5E0D4' }}>
            <div className="font-display text-[14.5px] font-semibold mb-5" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
              Revenue trend
            </div>
            <div className="flex items-end gap-1.5 h-[120px]">
              {revenueMonths.map((m, i) => {
                const heightPct = maxRevMonth > 0 ? (m.v / maxRevMonth) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <div className="relative w-full flex flex-col justify-end" style={{ height: '100px' }}>
                      <div title={fmtMoney(m.v)}
                        className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                        style={{
                          height: `${Math.max(heightPct, m.v > 0 ? 4 : 0)}%`,
                          background: '#C9A45E',
                          minHeight: m.v > 0 ? '4px' : '0',
                        }} />
                    </div>
                    <span className="font-mono text-[9px]" style={{ color: '#9BA8A1' }}>{m.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Event performance table */}
        <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: '#E5E0D4' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E5E0D4' }}>
            <div className="font-display text-[14.5px] font-semibold" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
              Event performance
            </div>
            <Link href="/dashboard" className="text-[12.5px] font-medium hover:underline" style={{ color: '#1F4D3A' }}>
              View all →
            </Link>
          </div>
          {topEvents.length === 0 ? (
            <div className="px-6 py-12 text-center text-[13px]" style={{ color: '#6B7A72' }}>No events yet.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E0D4', background: '#FAFAF9' }}>
                  {['Event', 'Date', 'Registrations', 'Revenue', 'Cards', 'Check-in'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-mono text-[10.5px] tracking-[0.12em] uppercase"
                      style={{ color: '#6B7A72' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topEvents.map(e => {
                  const dateStr = (e.event_pages as { starts_at: string }[] | null)?.[0]?.starts_at
                    ? new Date((e.event_pages as { starts_at: string }[])[0].starts_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                    : null;
                  const checkedIn = regsByEvent[e.id]?.checkedIn ?? 0;
                  const checkInRate = e.regs > 0 ? Math.round((checkedIn / e.regs) * 100) : 0;
                  const statusStyle = e.status === 'published'
                    ? { dot: '#2D7A4F', label: 'Live', color: '#2D7A4F', bg: '#E8F5EE' }
                    : { dot: '#C9A45E', label: 'Draft', color: '#C97A2D', bg: '#FEF9EE' };
                  return (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-[#FAFAF9] transition-colors"
                      style={{ borderColor: '#E5E0D4' }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg shrink-0" style={{ background: 'linear-gradient(135deg,#1F4D3A,#2A6A50)' }} />
                          <Link href={`/events/${e.id}`}
                            className="font-medium text-[13.5px] truncate hover:text-[#1F4D3A] transition-colors"
                            style={{ maxWidth: '200px', color: '#0F1F18', display: 'block' }}>
                            {e.name}
                          </Link>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[12px] whitespace-nowrap" style={{ color: '#6B7A72' }}>
                        {dateStr ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[13px] font-medium" style={{ color: '#0F1F18' }}>
                        {fmtNum(e.regs)}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[13px]" style={{ color: '#0F1F18' }}>
                        {e.revenue > 0 ? fmtMoney(e.revenue) : <span style={{ color: '#6B7A72' }}>—</span>}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[13px]" style={{ color: '#0F1F18' }}>
                        {e.download_count ?? 0}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[13px]" style={{ color: '#6B7A72' }}>
                        {checkInRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
