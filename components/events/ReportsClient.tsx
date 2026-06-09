'use client';

import { useState } from 'react';

interface Reg {
  id: string;
  attendee_name: string | null;
  status: string;
  amount_paid: number | null;
  currency: string | null;
  created_at: string;
  ticket_type_id: string | null;
}

interface TicketType { id: string; name: string; price: number | null; currency: string | null; }

interface Props {
  eventId: string;
  eventName: string;
  totalRevenue: number;
  regCount: number;
  checkedIn: number;
  regs: Reg[];
  ticketTypes: TicketType[];
}

function fmtCurrency(amount: number, currency: string | null) {
  if (!currency) return amount.toLocaleString();
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount); }
  catch { return `${currency} ${amount.toLocaleString()}`; }
}

const TABS = [
  { id: 'roi',       label: 'ROI dashboard' },
  { id: 'builder',   label: 'Report builder' },
  { id: 'scheduled', label: 'Scheduled' },
];

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4' }}>
      <div className="font-mono text-[9.5px] tracking-[0.14em] uppercase mb-2" style={{ color: '#6B7A72' }}>{label}</div>
      <div className="font-mono text-[24px] leading-none tracking-tight" style={{ color: '#1F4D3A' }}>{value}</div>
    </div>
  );
}

function Panel({ title, children, pad = 'p-5' }: { title?: string; children: React.ReactNode; pad?: string }) {
  return (
    <div className="bg-white rounded-2xl" style={{ border: '1px solid #E5E0D4' }}>
      {title && (
        <div className="px-5 pt-4 pb-3 border-b font-display text-[14px] font-semibold tracking-tight" style={{ borderColor: 'rgba(229,224,212,0.7)', color: '#0F1F18' }}>
          {title}
        </div>
      )}
      <div className={pad}>{children}</div>
    </div>
  );
}

export function ReportsClient({ eventName, totalRevenue, regCount, checkedIn, regs, ticketTypes }: Props) {
  const [tab, setTab] = useState('roi');

  const currencies = Array.from(new Set(regs.map(r => r.currency).filter(Boolean)));
  const primaryCurrency = currencies.length === 1 ? currencies[0] ?? null : null;
  const checkInPct = regCount > 0 ? Math.round((checkedIn / regCount) * 100) : 0;

  // Ticket breakdown
  const byTicket = ticketTypes.map(tt => {
    const count = regs.filter(r => r.ticket_type_id === tt.id && ['confirmed', 'checked_in'].includes(r.status)).length;
    const revenue = regs.filter(r => r.ticket_type_id === tt.id && ['confirmed', 'checked_in'].includes(r.status)).reduce((s, r) => s + (r.amount_paid ?? 0), 0);
    return { ...tt, count, revenue };
  });

  // Daily reg trend (last 14 days)
  const now = Date.now();
  const days: { date: string; count: number }[] = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now - (13 - i) * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const count = regs.filter(r => r.created_at.startsWith(dateStr)).length;
    return { date: d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }), count };
  });
  const maxDay = Math.max(...days.map(d => d.count), 1);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>Reports</h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>{eventName}</p>
        </div>
        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13.5px] font-medium border"
          style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: 'white' }}>
          <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1 mb-6 w-fit" style={{ background: '#F5F3EE', border: '1px solid #E5E0D4' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap"
            style={tab === t.id ? { background: '#1F4D3A', color: 'white' } : { color: '#6B7A72' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ROI Dashboard */}
      {tab === 'roi' && (
        <>
          {/* Hero banner */}
          <div className="rounded-2xl p-6 mb-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0D1F17,#1F4D3A 60%,#235741)' }}>
            <div aria-hidden className="absolute inset-0" style={{ background: 'radial-gradient(60% 100% at 90% 0%, rgba(232,197,126,0.26), transparent 55%)' }} />
            <div className="relative grid sm:grid-cols-[1.4fr_1fr] gap-5 items-center">
              <div>
                <div className="font-mono text-[10px] tracking-[0.16em] uppercase mb-2" style={{ color: '#E8C57E' }}>Event revenue</div>
                <div className="font-mono text-[40px] leading-none" style={{ color: '#FAF6EE' }}>
                  {primaryCurrency ? fmtCurrency(totalRevenue, primaryCurrency) : totalRevenue.toLocaleString()}
                </div>
                <div className="text-[13px] mt-2" style={{ color: 'rgba(250,246,238,0.75)' }}>
                  {regCount} confirmed registrations · {checkInPct}% checked in
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Registrations', regCount],
                  ['Checked in', checkedIn],
                  ['Avg. order', primaryCurrency && regCount > 0 ? fmtCurrency(Math.round(totalRevenue / regCount), primaryCurrency) : '—'],
                  ['Check-in rate', `${checkInPct}%`],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-xl px-3 py-2.5" style={{ background: 'rgba(250,246,238,0.1)', border: '1px solid rgba(250,246,238,0.15)' }}>
                    <div className="font-mono text-[16px]" style={{ color: '#FAF6EE' }}>{value}</div>
                    <div className="font-mono text-[8.5px] tracking-[0.12em] uppercase mt-1" style={{ color: 'rgba(250,246,238,0.55)' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Revenue" value={primaryCurrency ? fmtCurrency(totalRevenue, primaryCurrency) : '—'} />
            <StatCard label="Registrations" value={regCount} />
            <StatCard label="Check-in rate" value={`${checkInPct}%`} />
            <StatCard label="Ticket types" value={ticketTypes.length} />
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-5 mb-5">
            {/* Daily registrations */}
            <Panel title="Registrations · last 14 days">
              <div className="flex items-end gap-1" style={{ height: 120 }}>
                {days.map(d => {
                  const barH = Math.max(Math.round((d.count / maxDay) * 92), d.count > 0 ? 8 : 3);
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center justify-end" style={{ height: 120 }} title={`${d.date}: ${d.count}`}>
                      <div className="w-full rounded-sm transition-all" style={{ height: barH, background: d.count > 0 ? '#1F4D3A' : '#E8EFEB' }} />
                      <div className="font-mono text-[8px] rotate-45 origin-left mt-1 shrink-0" style={{ color: '#9BA8A1' }}>{d.date.split(' ')[1]}</div>
                    </div>
                  );
                })}
              </div>
            </Panel>

            {/* By ticket */}
            <Panel title="Revenue by ticket type">
              {byTicket.length === 0 ? (
                <p className="text-[13px]" style={{ color: '#6B7A72' }}>No ticket types defined.</p>
              ) : (
                <div className="grid gap-3">
                  {byTicket.map(tt => {
                    const pct = totalRevenue > 0 ? Math.round((tt.revenue / totalRevenue) * 100) : 0;
                    return (
                      <div key={tt.id}>
                        <div className="flex items-center justify-between mb-1.5 text-[13px]">
                          <span style={{ color: '#3A4A42' }}>{tt.name}</span>
                          <span className="font-mono" style={{ color: '#6B7A72' }}>
                            {tt.count} sold · {tt.revenue === 0 ? 'Free' : (primaryCurrency ? fmtCurrency(tt.revenue, primaryCurrency) : tt.revenue.toLocaleString())}
                          </span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E8EFEB' }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#1F4D3A' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          </div>
        </>
      )}

      {/* Report builder */}
      {tab === 'builder' && (
        <div className="grid lg:grid-cols-[260px_1fr] gap-5">
          <Panel title="Data source">
            <div className="grid gap-1.5">
              {[['Registrations', 'People who registered'], ['Orders', 'Transactions and revenue'], ['Sessions', 'Agenda attendance']].map(([label, desc]) => (
                <button key={label} className="flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-lg text-[13px] border transition-colors text-left hover:border-[#1F4D3A]/40"
                  style={{ borderColor: label === 'Registrations' ? '#1F4D3A' : '#E5E0D4', background: label === 'Registrations' ? '#E8EFEB' : 'transparent', color: label === 'Registrations' ? '#1F4D3A' : '#3A4A42' }}>
                  <span className="font-medium">{label}</span>
                  <span className="text-[11.5px]" style={{ color: '#6B7A72' }}>{desc}</span>
                </button>
              ))}
            </div>
          </Panel>
          <Panel title="Preview">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b" style={{ borderColor: '#E5E0D4' }}>
                    {['Name', 'Ticket', 'Amount', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-left py-2 px-3 font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: '#6B7A72' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'rgba(229,224,212,0.5)' }}>
                  {regs.slice(0, 8).map(r => (
                    <tr key={r.id} className="hover:bg-[#FAF6EE] transition-colors">
                      <td className="py-2.5 px-3 font-medium" style={{ color: '#0F1F18' }}>{r.attendee_name ?? '—'}</td>
                      <td className="py-2.5 px-3" style={{ color: '#3A4A42' }}>
                        {ticketTypes.find(t => t.id === r.ticket_type_id)?.name ?? '—'}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[12px]" style={{ color: '#1F4D3A' }}>
                        {fmtCurrency(r.amount_paid ?? 0, r.currency)}
                      </td>
                      <td className="py-2.5 px-3" style={{ color: '#6B7A72' }}>
                        {r.status === 'checked_in' ? 'Checked In'
                          : r.status.charAt(0).toUpperCase() + r.status.slice(1).replace(/_/g, ' ')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]" style={{ color: '#6B7A72' }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {regs.length > 8 && (
                <div className="px-3 py-2.5 font-mono text-[11px]" style={{ color: '#6B7A72', borderTop: '1px solid rgba(229,224,212,0.6)' }}>
                  Showing 8 of {regs.length} rows
                </div>
              )}
            </div>
          </Panel>
        </div>
      )}

      {/* Scheduled */}
      {tab === 'scheduled' && (
        <div className="bg-white rounded-2xl py-16 text-center" style={{ border: '1px solid #E5E0D4' }}>
          <div className="w-12 h-12 rounded-2xl grid place-items-center mx-auto mb-3" style={{ background: '#E8EFEB' }}>
            <svg width={20} height={20} fill="none" stroke="#1F4D3A" strokeWidth={1.5} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <p className="text-[14px] font-medium mb-1" style={{ color: '#0F1F18' }}>Scheduled reports</p>
          <p className="text-[13px]" style={{ color: '#6B7A72' }}>Set up automatic exports — daily, weekly, or post-event.</p>
        </div>
      )}
    </div>
  );
}
