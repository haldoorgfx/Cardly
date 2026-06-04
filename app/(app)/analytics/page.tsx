export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Portfolio' };

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

export default async function AnalyticsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  // Fetch all events + their registrations
  const { data: events } = await admin
    .from('events')
    .select('id, name, slug, status, download_count, updated_at, event_pages(starts_at)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const allEvents = events ?? [];
  const eventIds = allEvents.map(e => e.id);

  // Fetch registrations for all events
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
  const totalCheckedIn = allRegs.filter(r => r.status === 'checked_in').length;
  const totalRevenue   = allRegs.reduce((s, r) => s + Number(r.amount_paid ?? 0), 0);
  const totalCards     = allEvents.reduce((s, e) => s + (e.download_count ?? 0), 0);
  const checkInRate    = totalRegs > 0 ? Math.round((totalCheckedIn / totalRegs) * 100) : 0;
  const cardRate       = totalRegs > 0 ? Math.round((totalCards / totalRegs) * 100) : 0;

  // Registrations per event (for top events table)
  const regsByEvent: Record<string, { count: number; revenue: number; checkedIn: number }> = {};
  for (const r of allRegs) {
    if (!['confirmed', 'checked_in'].includes(r.status)) continue;
    if (!regsByEvent[r.event_id]) regsByEvent[r.event_id] = { count: 0, revenue: 0, checkedIn: 0 };
    regsByEvent[r.event_id].count++;
    regsByEvent[r.event_id].revenue += Number(r.amount_paid ?? 0);
    if (r.status === 'checked_in') regsByEvent[r.event_id].checkedIn++;
  }

  // Monthly registrations over last 12 months for chart
  const now = new Date();
  const months: { label: string; count: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-US', { month: 'short', year: i === 0 || i === 11 ? 'numeric' : undefined });
    const count = allRegs.filter(r => {
      if (!['confirmed', 'checked_in'].includes(r.status)) return false;
      const rd = new Date(r.created_at);
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth();
    }).length;
    months.push({ label, count });
  }
  const maxMonthCount = Math.max(...months.map(m => m.count), 1);

  // Top events by registrations
  const topEvents = allEvents
    .filter(e => e.status !== 'archived')
    .map(e => ({ ...e, regs: regsByEvent[e.id]?.count ?? 0, revenue: regsByEvent[e.id]?.revenue ?? 0 }))
    .sort((a, b) => b.regs - a.regs)
    .slice(0, 6);

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[1100px] mx-auto px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-[26px] font-semibold text-[#1F4D3A] tracking-[-0.02em]">
              Your Events Portfolio
            </h1>
          </div>
          <select className="h-8 text-[12px] rounded-lg px-3 cursor-pointer outline-none"
            style={{ background: 'white', border: '1px solid #E5E0D4', color: '#3A4A42' }}>
            <option>1 year</option>
            <option>6 months</option>
            <option>All time</option>
          </select>
        </div>

        {/* Stats strip */}
        <div className="bg-white border rounded-2xl px-6 py-4 mb-6 flex flex-wrap items-center gap-x-5 gap-y-2"
          style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
          {[
            { value: totalEvents,          label: 'events' },
            { value: fmtNum(totalRegs),    label: 'total registrations' },
            { value: fmtMoney(totalRevenue), label: 'total revenue' },
            { value: `${checkInRate}%`,    label: 'avg check-in rate' },
            { value: fmtNum(totalCards),   label: `Karta Cards downloaded (${cardRate}%)` },
          ].map((s, i, arr) => (
            <div key={i} className="flex items-center gap-5">
              <div>
                <span className="font-mono text-[20px] text-[#1F4D3A] tracking-tight">{s.value}</span>
                <span className="ml-2 text-[13px] text-[#6B7A72]">{s.label}</span>
              </div>
              {i < arr.length - 1 && <span className="text-[#E5E0D4] hidden sm:inline">·</span>}
            </div>
          ))}
        </div>

        {/* Registrations over time chart */}
        <div className="bg-white border rounded-2xl p-6 mb-6"
          style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
          <div className="font-display text-[15px] font-semibold text-[#0F1F18] mb-5">Registrations over time</div>
          <div className="flex items-end gap-1.5 h-[120px]">
            {months.map((m, i) => {
              const heightPct = maxMonthCount > 0 ? (m.count / maxMonthCount) * 100 : 0;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="relative w-full flex flex-col justify-end" style={{ height: '100px' }}>
                    <div title={`${m.count} registrations`}
                      className="w-full rounded-t-sm transition-all duration-300 group-hover:opacity-80"
                      style={{ height: `${Math.max(heightPct, m.count > 0 ? 4 : 1)}%`, background: '#1F4D3A', minHeight: m.count > 0 ? '4px' : '1px' }} />
                  </div>
                  {(i === 0 || i === 5 || i === 11) && (
                    <span className="font-mono text-[9px] text-[#6B7A72] whitespace-nowrap">{m.label}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Top events table */}
        <div className="bg-white border rounded-2xl overflow-hidden"
          style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E5E0D4' }}>
            <div className="font-display text-[15px] font-semibold text-[#0F1F18]">Top events</div>
            <Link href="/dashboard" className="text-[12.5px] font-medium text-[#1F4D3A] hover:underline">
              View all →
            </Link>
          </div>
          {topEvents.length === 0 ? (
            <div className="px-6 py-12 text-center text-[13px] text-[#6B7A72]">No events yet.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #E5E0D4', background: '#FAFAF9' }}>
                  {['Event', 'Date', 'Registrations', 'Revenue', 'Status'].map(h => (
                    <th key={h} className="px-5 py-3 text-left font-mono text-[10.5px] tracking-[0.12em] uppercase"
                      style={{ color: '#6B7A72' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topEvents.map(e => {
                  const dateStr = e.event_pages?.[0]?.starts_at
                    ? new Date(e.event_pages[0].starts_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                    : null;
                  const statusStyle = e.status === 'published'
                    ? { dot: '#2D7A4F', label: 'Live',  cls: 'text-emerald-700' }
                    : { dot: '#C9A45E', label: 'Draft', cls: 'text-amber-700' };
                  return (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-[#FAFAF9] transition-colors"
                      style={{ borderColor: '#E5E0D4' }}>
                      <td className="px-5 py-3.5">
                        <Link href={`/events/${e.id}`}
                          className="font-display text-[14px] font-semibold text-[#0F1F18] hover:text-[#1F4D3A] transition-colors truncate block"
                          style={{ maxWidth: '240px' }}>
                          {e.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[12px] text-[#6B7A72] whitespace-nowrap">
                        {dateStr ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[13px] font-medium text-[#0F1F18]">
                        {fmtNum(e.regs)}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[13px] text-[#0F1F18]">
                        {e.revenue > 0 ? fmtMoney(e.revenue) : <span className="text-[#6B7A72]">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[12.5px] font-medium ${statusStyle.cls}`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle.dot }} />
                          {statusStyle.label}
                        </span>
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
