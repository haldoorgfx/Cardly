'use client';

import { useMemo, useState } from 'react';
import { Download, TrendingUp, Users, CreditCard } from 'lucide-react';
import { escapeCsvCell } from '@/lib/csv';

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
        <span className="text-[12px] font-medium uppercase tracking-wider" style={{ color: '#65736B', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <p className="font-display font-semibold text-[28px] leading-none" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>{value}</p>
      {sub && <p className="text-[12px]" style={{ color: '#65736B' }}>{sub}</p>}
    </div>
  );
}

export function RevenueView({ registrations }: Props) {
  const [tab, setTab] = useState<'tickets' | 'promoters' | 'utm'>('tickets');

  // Revenue is summed over the confirmed set (already filtered to confirmed+
  // checked_in server-side); amount_paid is the source of truth and free tickets
  // contribute 0. NOT gated on payment_status — that gate dropped comp/manual
  // rows with amount_paid>0 that Overview/Analytics/Reports all count, so the
  // Revenue total read lower than every other surface.
  const paidRegs = registrations;
  const totalRevenue = useMemo(() => paidRegs.reduce((s, r) => s + (r.amount_paid ?? 0), 0), [paidRegs]);
  const totalFee = useMemo(() => paidRegs.reduce((s, r) => s + (r.platform_fee ?? 0), 0), [paidRegs]);
  const totalNet = useMemo(
    () => paidRegs.reduce((s, r) => s + (r.organizer_net ?? ((r.amount_paid ?? 0) - (r.platform_fee ?? 0))), 0),
    [paidRegs],
  );
  // True only when the fee columns (migration 040) are actually populated. When
  // they are absent the select falls back to base columns and every fee reads
  // undefined, making totalNet collapse to gross — labelling that "Net payable /
  // what you'll receive" promises the organizer money the platform fee will take.
  const hasFeeData = paidRegs.some(r => r.platform_fee != null || r.organizer_net != null);

  // A single event can sell tickets priced in more than one currency. Summing
  // those into one number under one symbol is meaningless, so detect it and say so.
  const currencies = Array.from(new Set(paidRegs.filter(r => r.amount_paid > 0).map(r => r.currency).filter(Boolean)));
  const isMixedCurrency = currencies.length > 1;
  const primaryCurrency = currencies[0] ?? 'USD';
  const totalCount = registrations.length;
  const paidCount = registrations.filter(r => (r.amount_paid ?? 0) > 0).length;
  const freeCount = registrations.filter(r => (r.amount_paid ?? 0) === 0).length;

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
    const csv = [headers, ...rows].map(r => r.map(escapeCsvCell).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `revenue-export.csv`;
    a.click();
  };

  return (
    <div>
      {/* Stats — the money story: gross → fee → what you're owed */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
        <StatCard
          icon={<TrendingUp size={16} />}
          label="Gross collected"
          value={isMixedCurrency ? 'Mixed' : fmtShort(totalRevenue, primaryCurrency)}
          sub={`${paidCount} paid · ${freeCount} free`}
        />
        <StatCard icon={<CreditCard size={16} />} label="Platform fee" value={hasFeeData && totalFee > 0 ? fmtShort(totalFee, primaryCurrency) : '—'} />
        <StatCard
          icon={<TrendingUp size={16} />}
          label={hasFeeData ? 'Net payable' : 'Net payable (est.)'}
          value={isMixedCurrency ? 'Mixed' : fmtShort(totalNet, primaryCurrency)}
          sub={hasFeeData ? "what you'll receive" : 'before platform fee'}
        />
        <StatCard icon={<Users size={16} />} label="Attendees" value={String(totalCount)} />
      </div>
      <p className="text-[12px] mb-8" style={{ color: '#65736B' }}>
        {hasFeeData
          ? <>Net payable is your revenue after Eventera&apos;s platform fee. Payouts are processed manually for now — we&apos;ll be in touch to settle.</>
          : <>No platform fee has been recorded against these registrations yet, so net payable currently equals gross. Your final payout will be lower once fees are applied.</>}
        {isMixedCurrency && (
          <> This event sold tickets in {currencies.join(', ')}; totals across different currencies aren&apos;t comparable, so per-currency figures are shown in the table below.</>
        )}
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
                : { color: '#65736B' }}
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
            <div className="grid grid-cols-3 px-4 py-2.5 text-[12.5px] font-semibold uppercase tracking-wider" style={{ background: '#F4F1EB', color: '#65736B', letterSpacing: '0.06em' }}>
              <span>Ticket type</span><span className="text-right">Registrations</span><span className="text-right">Revenue</span>
            </div>
            {byTicket.length === 0 && (
              <div className="py-12 text-center text-[14px]" style={{ color: '#65736B' }}>No data yet</div>
            )}
            {byTicket.map((t, i) => (
              <div
                key={t.name}
                className="grid grid-cols-3 px-4 py-3.5 items-center"
                style={{ borderTop: i > 0 ? '1px solid #F0EDE6' : undefined }}
              >
                <span className="font-medium text-[14px]" style={{ color: '#0F1F18' }}>{t.name}</span>
                <span className="text-right  text-[14px]" style={{ color: '#3A4A42' }}>{t.count}</span>
                <span className="text-right  font-semibold text-[14px]" style={{ color: '#0F1F18' }}>
                  {t.revenue > 0 ? fmt(t.revenue, t.currency) : <span style={{ color: '#65736B', fontWeight: 400 }}>Free</span>}
                </span>
              </div>
            ))}
            {/* Total row */}
            {byTicket.length > 0 && (
              <div className="grid grid-cols-3 px-4 py-3.5 items-center" style={{ borderTop: '2px solid #E5E0D4', background: '#F9F6F0' }}>
                <span className="font-semibold text-[13px]" style={{ color: '#3A4A42' }}>Total</span>
                <span className="text-right  font-semibold text-[14px]" style={{ color: '#0F1F18' }}>{totalCount}</span>
                <span className="text-right  font-semibold text-[14px]" style={{ color: '#0F1F18' }}>
                  {/* Per-row revenue is already per-currency; a cross-currency grand total is not a number. */}
                  {isMixedCurrency ? '—' : fmt(totalRevenue, primaryCurrency)}
                </span>
              </div>
            )}
          </>
        ) : tab === 'promoters' ? (
          <>
            <div className="grid grid-cols-3 px-4 py-2.5 text-[12.5px] font-semibold uppercase tracking-wider" style={{ background: '#F4F1EB', color: '#65736B', letterSpacing: '0.06em' }}>
              <span>Promoter code</span><span className="text-right">Registrations</span><span className="text-right">Revenue</span>
            </div>
            {byPromoter.length === 0 && (
              <div className="py-12 text-center text-[14px]" style={{ color: '#65736B' }}>No data yet</div>
            )}
            {byPromoter.map((p, i) => (
              <div
                key={p.code}
                className="grid grid-cols-3 px-4 py-3.5 items-center"
                style={{ borderTop: i > 0 ? '1px solid #F0EDE6' : undefined }}
              >
                <span className=" text-[13px] font-semibold px-2.5 py-0.5 rounded-md inline-block" style={p.code === 'Direct' ? { color: '#65736B' } : { background: '#E8EFEB', color: '#1F4D3A' }}>
                  {p.code}
                </span>
                <span className="text-right  text-[14px]" style={{ color: '#3A4A42' }}>{p.count}</span>
                <span className="text-right  font-semibold text-[14px]" style={{ color: '#0F1F18' }}>
                  {p.revenue > 0 ? fmt(p.revenue, p.currency) : <span style={{ color: '#65736B', fontWeight: 400 }}>—</span>}
                </span>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="grid grid-cols-3 px-4 py-2.5 text-[12.5px] font-semibold uppercase tracking-wider" style={{ background: '#F4F1EB', color: '#65736B', letterSpacing: '0.06em' }}>
              <span>UTM source</span><span className="text-right">Registrations</span><span className="text-right">Revenue</span>
            </div>
            {bySource.length === 0 && (
              <div className="py-12 text-center text-[14px]" style={{ color: '#65736B' }}>No UTM data yet</div>
            )}
            {bySource.map((s, i) => (
              <div
                key={s.source}
                className="grid grid-cols-3 px-4 py-3.5 items-center"
                style={{ borderTop: i > 0 ? '1px solid #F0EDE6' : undefined }}
              >
                <span className=" text-[13px] font-semibold px-2.5 py-0.5 rounded-md inline-block" style={s.source === 'Direct' ? { color: '#65736B' } : { background: '#E8EFEB', color: '#1F4D3A' }}>
                  {s.source}
                </span>
                <span className="text-right  text-[14px]" style={{ color: '#3A4A42' }}>{s.count}</span>
                <span className="text-right  font-semibold text-[14px]" style={{ color: '#0F1F18' }}>
                  {s.revenue > 0 ? fmt(s.revenue, s.currency) : <span style={{ color: '#65736B', fontWeight: 400 }}>—</span>}
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
