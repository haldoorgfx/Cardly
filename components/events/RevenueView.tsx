'use client';

import { useMemo, useState } from 'react';
import { Download, TrendingUp, Users, CreditCard } from 'lucide-react';

interface Reg {
  id: string;
  amount_paid: number;
  platform_fee?: number | null;
  organizer_net?: number | null;
  currency: string;
  status: string;
  payment_status: string;
  created_at: string;
  referral_code: string | null;
  utm_source: string | null;
  ticket_types: { name: string; price: number } | null;
}

interface Props {
  eventId: string;
  eventSlug: string;
  registrations: Reg[];
}

function fmt(amount: number, currency: string) {
  if (amount === 0) return 'Free';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function fmtShort(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 0, notation: 'compact' }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl p-5 flex flex-col gap-2" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#E8EFEB' }}>
          <span style={{ color: '#1F4D3A' }}>{icon}</span>
        </div>
        <span className="text-[12px] font-medium uppercase tracking-wider" style={{ color: '#6B7A72', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <p className="font-display font-semibold text-[28px] leading-none" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>{value}</p>
      {sub && <p className="text-[12px]" style={{ color: '#6B7A72' }}>{sub}</p>}
    </div>
  );
}

export function RevenueView({ registrations }: Props) {
  const [tab, setTab] = useState<'tickets' | 'promoters' | 'utm'>('tickets');

  const paidRegs = useMemo(() => registrations.filter(r => r.payment_status === 'paid' || r.payment_status === 'free'), [registrations]);
  const totalRevenue = useMemo(() => paidRegs.reduce((s, r) => s + (r.amount_paid ?? 0), 0), [paidRegs]);
  const totalFee = useMemo(() => paidRegs.reduce((s, r) => s + (r.platform_fee ?? 0), 0), [paidRegs]);
  const totalNet = useMemo(
    () => paidRegs.reduce((s, r) => s + (r.organizer_net ?? ((r.amount_paid ?? 0) - (r.platform_fee ?? 0))), 0),
    [paidRegs],
  );
  const primaryCurrency = paidRegs.find(r => r.amount_paid > 0)?.currency ?? 'USD';
  const totalCount = registrations.length;
  const paidCount = paidRegs.filter(r => r.payment_status === 'paid').length;
  const freeCount = paidRegs.filter(r => r.payment_status === 'free').length;

  // By ticket type
  const byTicket = useMemo(() => {
    const map: Record<string, { name: string; count: number; revenue: number; currency: string }> = {};
    for (const r of paidRegs) {
      const key = r.ticket_types?.name ?? 'General';
      if (!map[key]) map[key] = { name: key, count: 0, revenue: 0, currency: r.currency };
      map[key].count++;
      map[key].revenue += r.amount_paid ?? 0;
    }
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [paidRegs]);

  // By UTM source
  const bySource = useMemo(() => {
    const map: Record<string, { source: string; count: number; revenue: number; currency: string }> = {};
    for (const r of paidRegs) {
      const key = r.utm_source ?? '__direct__';
      const label = r.utm_source ?? 'Direct';
      if (!map[key]) map[key] = { source: label, count: 0, revenue: 0, currency: r.currency };
      map[key].count++;
      map[key].revenue += r.amount_paid ?? 0;
    }
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [paidRegs]);

  // By promoter code
  const byPromoter = useMemo(() => {
    const map: Record<string, { code: string; count: number; revenue: number; currency: string }> = {};
    for (const r of paidRegs) {
      const key = r.referral_code ? r.referral_code.toUpperCase() : '__direct__';
      const label = r.referral_code ? r.referral_code.toUpperCase() : 'Direct';
      if (!map[key]) map[key] = { code: label, count: 0, revenue: 0, currency: r.currency };
      map[key].count++;
      map[key].revenue += r.amount_paid ?? 0;
    }
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [paidRegs]);

  // CSV export
  const exportCSV = () => {
    const headers = ['Ticket', 'Amount', 'Currency', 'Status', 'Payment', 'Promoter Code', 'UTM Source', 'Registered At'];
    const rows = registrations.map(r => [
      r.ticket_types?.name ?? 'General',
      r.amount_paid,
      r.currency,
      r.status,
      r.payment_status,
      r.referral_code ?? '',
      r.utm_source ?? '',
      new Date(r.created_at).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `revenue-export.csv`;
    a.click();
  };

  return (
    <div>
      {/* Stats — the money story: gross → fee → what you're owed */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
        <StatCard icon={<TrendingUp size={16} />} label="Gross collected" value={fmtShort(totalRevenue, primaryCurrency)} sub={`${paidCount} paid · ${freeCount} free`} />
        <StatCard icon={<CreditCard size={16} />} label="Platform fee" value={totalFee > 0 ? fmtShort(totalFee, primaryCurrency) : '—'} />
        <StatCard icon={<TrendingUp size={16} />} label="Net payable" value={fmtShort(totalNet, primaryCurrency)} sub="what you'll receive" />
        <StatCard icon={<Users size={16} />} label="Attendees" value={String(totalCount)} />
      </div>
      <p className="text-[12px] mb-8" style={{ color: '#6B7A72' }}>
        Net payable is your revenue after Eventera&apos;s platform fee. Payouts are processed manually for now — we&apos;ll be in touch to settle.
      </p>

      {/* Tab bar + export */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#F0EDE6' }}>
          {(['tickets', 'promoters', 'utm'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all"
              style={tab === t
                ? { background: 'white', color: '#0F1F18', boxShadow: '0 1px 3px rgba(15,31,24,0.08)' }
                : { color: '#6B7A72' }}
            >
              {t === 'tickets' ? 'By ticket' : t === 'promoters' ? 'By promoter' : 'By source'}
            </button>
          ))}
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors"
          style={{ background: '#F4F1EB', color: '#3A4A42', border: '1px solid #E5E0D4' }}
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid #E5E0D4' }}>
      <div className="min-w-[420px]">
        {tab === 'tickets' ? (
          <>
            <div className="grid grid-cols-3 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ background: '#F4F1EB', color: '#6B7A72', letterSpacing: '0.06em' }}>
              <span>Ticket type</span><span className="text-right">Registrations</span><span className="text-right">Revenue</span>
            </div>
            {byTicket.length === 0 && (
              <div className="py-12 text-center text-[14px]" style={{ color: '#6B7A72' }}>No data yet</div>
            )}
            {byTicket.map((t, i) => (
              <div
                key={t.name}
                className="grid grid-cols-3 px-4 py-3.5 items-center"
                style={{ borderTop: i > 0 ? '1px solid #F0EDE6' : undefined }}
              >
                <span className="font-medium text-[14px]" style={{ color: '#0F1F18' }}>{t.name}</span>
                <span className="text-right  text-[14px]" style={{ color: '#3A4A42' }}>{t.count}</span>
                <span className="text-right  font-semibold text-[14px]" style={{ color: '#1F4D3A' }}>
                  {t.revenue > 0 ? fmt(t.revenue, t.currency) : <span style={{ color: '#6B7A72', fontWeight: 400 }}>Free</span>}
                </span>
              </div>
            ))}
            {/* Total row */}
            {byTicket.length > 0 && (
              <div className="grid grid-cols-3 px-4 py-3.5 items-center" style={{ borderTop: '2px solid #E5E0D4', background: '#F9F6F0' }}>
                <span className="font-semibold text-[13px]" style={{ color: '#3A4A42' }}>Total</span>
                <span className="text-right  font-semibold text-[14px]" style={{ color: '#0F1F18' }}>{totalCount}</span>
                <span className="text-right  font-semibold text-[14px]" style={{ color: '#1F4D3A' }}>{fmt(totalRevenue, primaryCurrency)}</span>
              </div>
            )}
          </>
        ) : tab === 'promoters' ? (
          <>
            <div className="grid grid-cols-3 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ background: '#F4F1EB', color: '#6B7A72', letterSpacing: '0.06em' }}>
              <span>Promoter code</span><span className="text-right">Registrations</span><span className="text-right">Revenue</span>
            </div>
            {byPromoter.length === 0 && (
              <div className="py-12 text-center text-[14px]" style={{ color: '#6B7A72' }}>No data yet</div>
            )}
            {byPromoter.map((p, i) => (
              <div
                key={p.code}
                className="grid grid-cols-3 px-4 py-3.5 items-center"
                style={{ borderTop: i > 0 ? '1px solid #F0EDE6' : undefined }}
              >
                <span className=" text-[13px] font-semibold px-2.5 py-0.5 rounded-md inline-block" style={p.code === 'Direct' ? { color: '#6B7A72' } : { background: '#E8EFEB', color: '#1F4D3A' }}>
                  {p.code}
                </span>
                <span className="text-right  text-[14px]" style={{ color: '#3A4A42' }}>{p.count}</span>
                <span className="text-right  font-semibold text-[14px]" style={{ color: '#1F4D3A' }}>
                  {p.revenue > 0 ? fmt(p.revenue, p.currency) : <span style={{ color: '#6B7A72', fontWeight: 400 }}>—</span>}
                </span>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ background: '#F4F1EB', color: '#6B7A72', letterSpacing: '0.06em' }}>
              <span>UTM source</span><span className="text-right">Registrations</span><span className="text-right">Revenue</span>
            </div>
            {bySource.length === 0 && (
              <div className="py-12 text-center text-[14px]" style={{ color: '#6B7A72' }}>No UTM data yet</div>
            )}
            {bySource.map((s, i) => (
              <div
                key={s.source}
                className="grid grid-cols-3 px-4 py-3.5 items-center"
                style={{ borderTop: i > 0 ? '1px solid #F0EDE6' : undefined }}
              >
                <span className=" text-[13px] font-semibold px-2.5 py-0.5 rounded-md inline-block" style={s.source === 'Direct' ? { color: '#6B7A72' } : { background: '#E8EFEB', color: '#1F4D3A' }}>
                  {s.source}
                </span>
                <span className="text-right  text-[14px]" style={{ color: '#3A4A42' }}>{s.count}</span>
                <span className="text-right  font-semibold text-[14px]" style={{ color: '#1F4D3A' }}>
                  {s.revenue > 0 ? fmt(s.revenue, s.currency) : <span style={{ color: '#6B7A72', fontWeight: 400 }}>—</span>}
                </span>
              </div>
            ))}
          </>
        )}
      </div>
      </div>
    </div>
  );
}
