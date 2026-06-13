'use client';

import { useState } from 'react';

interface Order {
  id: string;
  attendee_name: string | null;
  attendee_email: string | null;
  status: string;
  amount_paid: number | null;
  currency: string | null;
  created_at: string;
  ticket_types?: { name: string } | null;
}

interface Props {
  orders: Order[];
}

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  confirmed:   { bg: 'rgba(45,122,79,0.08)',  color: '#2D7A4F', border: 'rgba(45,122,79,0.2)' },
  checked_in:  { bg: 'rgba(45,122,79,0.08)',  color: '#2D7A4F', border: 'rgba(45,122,79,0.2)' },
  pending:     { bg: 'rgba(201,122,45,0.08)', color: '#C97A2D', border: 'rgba(201,122,45,0.2)' },
  refunded:    { bg: 'rgba(15,31,24,0.05)',   color: '#6B7A72', border: '#E5E0D4' },
  waitlisted:  { bg: 'rgba(58,107,140,0.08)', color: '#3A6B8C', border: 'rgba(58,107,140,0.2)' },
  cancelled:   { bg: 'rgba(184,66,60,0.08)',  color: '#B8423C', border: 'rgba(184,66,60,0.2)' },
};

function statusLabel(s: string) {
  if (s === 'checked_in') return 'Checked in';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtAmount(amount: number | null, currency: string | null) {
  if (!amount || !currency) return '—';
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount); }
  catch { return `${currency} ${amount.toLocaleString()}`; }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function Avatar({ name, idx }: { name: string; idx: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const grads = ['linear-gradient(135deg,#1F4D3A,#2A6A50)', 'linear-gradient(135deg,#2A6A50,#C9A45E)', 'linear-gradient(135deg,#163828,#3E7E5E)'];
  return (
    <span className="rounded-full grid place-items-center text-cream font-display font-semibold shrink-0 text-[12px]"
      style={{ width: 36, height: 36, background: grads[idx % grads.length] }}>
      {initials}
    </span>
  );
}

const TABS = [
  { id: 'all',       label: 'All' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'pending',   label: 'Pending' },
  { id: 'refunded',  label: 'Refunded' },
];

function exportCSV(orders: Order[]) {
  const headers = ['Name', 'Email', 'Ticket', 'Amount', 'Currency', 'Status', 'Date'];
  const rows = orders.map(o => [
    o.attendee_name ?? '',
    o.attendee_email ?? '',
    o.ticket_types?.name ?? '',
    o.amount_paid?.toString() ?? '0',
    o.currency ?? '',
    o.status,
    new Date(o.created_at).toLocaleDateString(),
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'orders.csv'; a.click();
}

export function OrdersClient({ orders }: Props) {
  const [tab, setTab] = useState('all');
  const [sel, setSel] = useState<string | null>(orders[0]?.id ?? null);
  const [search, setSearch] = useState('');

  const filtered = orders
    .filter(o => tab === 'all' || o.status === tab || (tab === 'confirmed' && o.status === 'checked_in'))
    .filter(o => !search || (o.attendee_name ?? '').toLowerCase().includes(search.toLowerCase()) || (o.attendee_email ?? '').toLowerCase().includes(search.toLowerCase()));

  const selectedOrder = orders.find(o => o.id === sel) ?? filtered[0] ?? null;

  const totalRevenue = orders.filter(o => ['confirmed', 'checked_in'].includes(o.status)).reduce((s, o) => s + (o.amount_paid ?? 0), 0);
  const currencies = Array.from(new Set(orders.map(o => o.currency).filter(Boolean)));
  const primaryCurrency = currencies.length === 1 ? currencies[0] : null;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>Orders</h1>
          <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>{orders.length} orders</p>
        </div>
        <button onClick={() => exportCSV(orders)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13.5px] font-medium border transition-colors"
          style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: 'white' }}>
          <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Gross revenue', value: primaryCurrency ? fmtAmount(totalRevenue, primaryCurrency) : `${totalRevenue.toLocaleString()}` },
          { label: 'Orders', value: orders.filter(o => ['confirmed', 'checked_in'].includes(o.status)).length },
          { label: 'Pending', value: orders.filter(o => o.status === 'pending').length },
          { label: 'Refunded', value: orders.filter(o => o.status === 'refunded').length },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4' }}>
            <div className=" text-[9.5px] tracking-[0.14em] uppercase mb-2" style={{ color: '#6B7A72' }}>{s.label}</div>
            <div className=" text-[22px] leading-none tracking-tight" style={{ color: '#1F4D3A' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs + search */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-1 rounded-xl p-1" style={{ background: '#F5F3EE', border: '1px solid #E5E0D4' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all"
              style={tab === t.id ? { background: '#1F4D3A', color: 'white' } : { color: '#6B7A72' }}>
              {t.label}
            </button>
          ))}
        </div>
        <input type="search" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="flex-1 max-w-[320px] border rounded-xl px-3 py-2 text-[13px] outline-none"
          style={{ borderColor: '#E5E0D4', background: 'white', color: '#0F1F18' }} />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl py-16 text-center" style={{ border: '1px solid #E5E0D4' }}>
          <p className="text-[13.5px]" style={{ color: '#6B7A72' }}>No orders match your filter.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-5">
          {/* List */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
            <div className="divide-y" style={{ borderColor: 'rgba(229,224,212,0.6)' }}>
              {filtered.map((o, i) => {
                const ss = STATUS_STYLE[o.status] ?? STATUS_STYLE.pending;
                return (
                  <button key={o.id} onClick={() => setSel(o.id)}
                    className="w-full text-left flex items-center gap-3 px-4 py-3.5 transition-colors"
                    style={{ background: sel === o.id ? 'rgba(232,239,235,0.5)' : 'transparent' }}>
                    <Avatar name={o.attendee_name ?? '?'} idx={i} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-medium truncate" style={{ color: '#0F1F18' }}>{o.attendee_name ?? '—'}</div>
                      <div className=" text-[11px] mt-0.5 truncate" style={{ color: '#6B7A72' }}>
                        {o.ticket_types?.name ?? '—'} · {fmtDate(o.created_at)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className=" text-[13.5px]" style={{ color: '#1F4D3A' }}>{fmtAmount(o.amount_paid, o.currency)}</div>
                      <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border mt-0.5"
                        style={{ background: ss.bg, color: ss.color, borderColor: ss.border }}>
                        {statusLabel(o.status)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail */}
          {selectedOrder && (() => {
            const ss = STATUS_STYLE[selectedOrder.status] ?? STATUS_STYLE.pending;
            return (
              <div className="grid gap-4 content-start">
                <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-display text-[14px] font-semibold" style={{ color: '#0F1F18' }}>
                      Order detail
                    </div>
                    <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border"
                      style={{ background: ss.bg, color: ss.color, borderColor: ss.border }}>
                      {statusLabel(selectedOrder.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar name={selectedOrder.attendee_name ?? '?'} idx={0} />
                    <div>
                      <div className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>{selectedOrder.attendee_name ?? '—'}</div>
                      <div className=" text-[11px]" style={{ color: '#6B7A72' }}>{selectedOrder.attendee_email ?? '—'}</div>
                    </div>
                  </div>
                  {[
                    { label: 'Ticket', value: selectedOrder.ticket_types?.name ?? '—' },
                    { label: 'Amount', value: fmtAmount(selectedOrder.amount_paid, selectedOrder.currency) },
                    { label: 'Date', value: fmtDate(selectedOrder.created_at) },
                    { label: 'Order ID', value: selectedOrder.id.slice(0, 8).toUpperCase(), mono: true },
                  ].map((row, i, arr) => (
                    <div key={row.label} className={`flex items-center justify-between py-2.5 ${i < arr.length - 1 ? 'border-b' : ''}`}
                      style={{ borderColor: 'rgba(229,224,212,0.6)' }}>
                      <span className=" text-[10px] tracking-[0.12em] uppercase" style={{ color: '#6B7A72' }}>{row.label}</span>
                      <span className={`text-[13.5px] ${row.mono ? ' text-[12px]' : ''}`} style={{ color: '#0F1F18' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <button className="w-full px-4 py-2.5 rounded-xl text-[13px] font-medium border transition-colors"
                  style={{ borderColor: 'rgba(184,66,60,0.3)', color: '#B8423C', background: 'rgba(184,66,60,0.04)' }}>
                  Refund order
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
