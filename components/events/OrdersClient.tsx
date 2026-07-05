'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';

interface Order {
  id: string;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_phone: string | null;
  status: string;
  payment_status: string | null;
  amount_paid: number | null;
  currency: string | null;
  created_at: string;
  ticket_types?: { name: string } | null;
}

interface Props {
  eventId: string;
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

/** Per-order amount: 0 → "Free", null → "—". */
function fmtAmount(amount: number | null, currency: string | null) {
  if (amount == null) return '—';
  if (amount === 0) return 'Free';
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD', minimumFractionDigits: 0 }).format(amount); }
  catch { return `${currency} ${amount.toLocaleString()}`; }
}

/** Money total: always shows a value (0 → "$0"). */
function fmtMoney(amount: number, currency: string | null) {
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD', minimumFractionDigits: 0 }).format(amount); }
  catch { return `${currency ?? ''} ${amount.toLocaleString()}`.trim(); }
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
  const headers = ['Name', 'Email', 'Phone', 'Ticket', 'Amount', 'Currency', 'Status', 'Payment', 'Date'];
  const rows = orders.map(o => [
    o.attendee_name ?? '',
    o.attendee_email ?? '',
    o.attendee_phone ?? '',
    o.ticket_types?.name ?? '',
    o.amount_paid?.toString() ?? '0',
    o.currency ?? '',
    o.status,
    o.payment_status ?? '',
    new Date(o.created_at).toLocaleDateString(),
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'orders.csv'; a.click();
}

export function OrdersClient({ eventId, orders: initialOrders }: Props) {
  const [tab, setTab] = useState('all');
  const [sel, setSel] = useState<string | null>(initialOrders[0]?.id ?? null);
  const [search, setSearch] = useState('');
  // Local status overrides (e.g. after a refund) so list, detail and stats all update
  const [statusOverride, setStatusOverride] = useState<Record<string, string>>({});
  const [refunding, setRefunding] = useState(false);
  const [confirmRefund, setConfirmRefund] = useState<string | null>(null);
  const [refundError, setRefundError] = useState('');

  const orders = initialOrders.map(o => ({ ...o, status: statusOverride[o.id] ?? o.status }));

  const filtered = orders
    .filter(o => tab === 'all' || o.status === tab || (tab === 'confirmed' && o.status === 'checked_in'))
    .filter(o => !search || (o.attendee_name ?? '').toLowerCase().includes(search.toLowerCase()) || (o.attendee_email ?? '').toLowerCase().includes(search.toLowerCase()));

  const selectedOrder = orders.find(o => o.id === sel) ?? filtered[0] ?? null;

  const totalRevenue = orders.filter(o => ['confirmed', 'checked_in'].includes(o.status)).reduce((s, o) => s + (o.amount_paid ?? 0), 0);
  const currencies = Array.from(new Set(orders.map(o => o.currency).filter(Boolean)));
  const primaryCurrency = currencies.length === 1 ? currencies[0] : null;

  // Customer history for the selected order (Woo-inspired)
  const customerOrders = selectedOrder
    ? orders.filter(o => o.attendee_email && o.attendee_email === selectedOrder.attendee_email)
    : [];
  const customerSpent = customerOrders.reduce((s, o) => s + (o.amount_paid ?? 0), 0);

  const canRefund = !!selectedOrder
    && (selectedOrder.amount_paid ?? 0) > 0
    && !['refunded', 'cancelled'].includes(selectedOrder.status);

  async function refundOrder(id: string) {
    setConfirmRefund(null);
    setRefunding(true);
    setRefundError('');
    setStatusOverride(p => ({ ...p, [id]: 'refunded' }));
    try {
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: id, status: 'refunded' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Refund failed');
      }
    } catch (e) {
      setStatusOverride(p => { const n = { ...p }; delete n[id]; return n; }); // revert
      setRefundError(e instanceof Error ? e.message : 'Refund failed. Please try again.');
    } finally {
      setRefunding(false);
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-semibold text-[26px] sm:text-[30px] leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>Orders</h1>
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
          { label: 'Gross revenue', value: fmtMoney(totalRevenue, primaryCurrency) },
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
            const isFree = (selectedOrder.amount_paid ?? 0) === 0;
            const paymentLabel = isFree ? 'Free' : (selectedOrder.payment_status ? statusLabel(selectedOrder.payment_status) : 'Paid');
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
                    <div className="min-w-0">
                      <div className="text-[14px] font-medium truncate" style={{ color: '#0F1F18' }}>{selectedOrder.attendee_name ?? '—'}</div>
                      {selectedOrder.attendee_email && (
                        <a href={`mailto:${selectedOrder.attendee_email}`} className="block text-[11px] truncate hover:underline" style={{ color: '#6B7A72' }}>{selectedOrder.attendee_email}</a>
                      )}
                      {selectedOrder.attendee_phone && (
                        <a href={`tel:${selectedOrder.attendee_phone}`} className="block text-[11px] hover:underline" style={{ color: '#6B7A72' }}>{selectedOrder.attendee_phone}</a>
                      )}
                    </div>
                  </div>
                  {[
                    { label: 'Ticket', value: selectedOrder.ticket_types?.name ?? '—' },
                    { label: 'Amount', value: fmtAmount(selectedOrder.amount_paid, selectedOrder.currency) },
                    { label: 'Payment', value: paymentLabel },
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

                {/* Customer history (Woo-inspired) */}
                {customerOrders.length > 1 && (
                  <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4' }}>
                    <div className="font-display text-[13px] font-semibold mb-3" style={{ color: '#0F1F18' }}>Customer history</div>
                    <div className="flex items-center justify-between text-[13px]">
                      <span style={{ color: '#6B7A72' }}>Orders at this event</span>
                      <span style={{ color: '#0F1F18' }}>{customerOrders.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-[13px] mt-1.5">
                      <span style={{ color: '#6B7A72' }}>Total spent</span>
                      <span style={{ color: '#1F4D3A' }}>{fmtMoney(customerSpent, selectedOrder.currency)}</span>
                    </div>
                  </div>
                )}

                {refundError && (
                  <div className="px-4 py-2.5 rounded-xl text-[12.5px] font-medium" style={{ background: '#FEF2F2', color: '#B8423C', border: '1px solid #FECACA' }}>
                    {refundError}
                  </div>
                )}

                {/* Refund — only for paid, non-refunded orders */}
                {canRefund ? (
                  <button
                    onClick={() => setConfirmRefund(selectedOrder.id)}
                    disabled={refunding}
                    className="w-full px-4 py-2.5 rounded-xl text-[13px] font-medium border transition-colors disabled:opacity-60"
                    style={{ borderColor: 'rgba(184,66,60,0.3)', color: '#B8423C', background: 'rgba(184,66,60,0.04)' }}>
                    {refunding ? 'Refunding…' : 'Refund order'}
                  </button>
                ) : selectedOrder.status === 'refunded' ? (
                  <div className="w-full px-4 py-2.5 rounded-xl text-[13px] font-medium text-center" style={{ background: '#F5F3EE', color: '#6B7A72' }}>
                    Refunded
                  </div>
                ) : null}
              </div>
            );
          })()}
        </div>
      )}

      {/* Refund confirm — unified modal (replaces native confirm) */}
      <Modal
        open={!!confirmRefund}
        onClose={() => setConfirmRefund(null)}
        title="Refund this order?"
        maxWidth={420}
        footer={
          <>
            <button onClick={() => setConfirmRefund(null)} className="h-10 px-4 rounded-xl text-[13px] font-medium border" style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>Cancel</button>
            <button onClick={() => confirmRefund && refundOrder(confirmRefund)} disabled={refunding} className="h-10 px-5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-60" style={{ background: '#B8423C' }}>
              {refunding ? 'Refunding…' : 'Refund order'}
            </button>
          </>
        }
      >
        <p className="text-[14px] leading-relaxed" style={{ color: '#3A4A42' }}>
          This marks the order as <strong>refunded</strong> in Eventera and updates your revenue totals. Process the actual money refund in your payment provider separately.
        </p>
      </Modal>
    </div>
  );
}
