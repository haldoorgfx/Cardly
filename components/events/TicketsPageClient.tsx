'use client';

import { useState } from 'react';
import { ExternalLink, Plus, X, Check } from 'lucide-react';
import Link from 'next/link';
import { TicketTypesManager } from './TicketTypesManager';
import type { Database } from '@/types/database';

type TicketRow = Database['public']['Tables']['ticket_types']['Row'];
type PromoRow  = Database['public']['Tables']['promo_codes']['Row'];

interface Props {
  eventId:      string;
  eventName:    string;
  tickets:      TicketRow[];
  soldByType:   Record<string, number>;
  totalRevenue: number;
  ticketsSold:  number;
  avgOrder:     number;
  conversion:   number;
  promoCodes:   PromoRow[];
}

function fmtMoney(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₦${(n / 1_000).toFixed(0)}k`;
  return `₦${Math.round(n).toLocaleString()}`;
}

/* ── Stat card ─────────────────────────────────────────────────────────────── */
function StatCard({
  label, value, trend, icon, gold,
}: {
  label: string; value: string; trend?: string; icon: React.ReactNode; gold?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl p-5"
      style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-widest"
          style={{ color: gold ? '#C9A45E' : '#6B7A72' }}>
          {label}
        </span>
        <span style={{ color: gold ? '#C9A45E' : '#C9C3B1' }}>{icon}</span>
      </div>
      <div className="font-display text-[30px] font-semibold tracking-tight leading-none"
        style={{ color: gold ? '#B8833A' : '#0F1F18' }}>
        {value}
      </div>
      {trend && (
        <div className="mt-2 text-[12px] font-medium" style={{ color: '#2D7A4F' }}>
          {trend}
        </div>
      )}
    </div>
  );
}

/* ── Ticket row ────────────────────────────────────────────────────────────── */
function TicketTypeRow({ t, sold }: { t: TicketRow; sold: number }) {
  const cap      = t.quantity ?? 0;
  const pct      = cap > 0 ? Math.min(100, Math.round((sold / cap) * 100)) : 0;
  const isSoldOut = cap > 0 && sold >= cap;
  const priceStr  = t.price === 0
    ? 'Free'
    : new Intl.NumberFormat('en-NG', { style: 'currency', currency: t.currency || 'NGN', maximumFractionDigits: 0 }).format(t.price);

  const statusLabel = isSoldOut ? 'Sold out' : t.is_visible ? 'On sale' : 'Scheduled';
  const statusStyle = isSoldOut
    ? { bg: 'rgba(201,164,94,0.12)', color: '#B8833A', border: '1px solid rgba(201,164,94,0.35)' }
    : t.is_visible
    ? { bg: 'rgba(45,122,79,0.1)',   color: '#2D7A4F', border: '1px solid rgba(45,122,79,0.25)' }
    : { bg: '#F5F3EE',               color: '#6B7A72', border: '1px solid #E5E0D4' };

  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFAF9] transition-colors"
      style={{ borderBottom: '1px solid #E5E0D4' }}>
      {/* Icon */}
      <div className="h-9 w-9 rounded-lg grid place-items-center shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
      </div>

      {/* Name + status + date */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="font-display text-[14px] font-semibold" style={{ color: '#0F1F18' }}>{t.name}</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium"
            style={statusStyle}>
            {statusLabel}
          </span>
        </div>
        {t.sales_end && (
          <div className="font-mono text-[11px]" style={{ color: '#6B7A72' }}>
            Until {new Date(t.sales_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
          </div>
        )}
        {cap > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between font-mono text-[10.5px] mb-1" style={{ color: '#9BA8A1' }}>
              <span>{sold}/{cap}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E0D4', width: '140px' }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: isSoldOut ? '#C9A45E' : '#1F4D3A' }} />
            </div>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="font-mono text-[15px] font-semibold shrink-0" style={{ color: '#1F4D3A' }}>
        {priceStr}
      </div>

      {/* Settings icon */}
      <button className="h-7 w-7 rounded-lg grid place-items-center transition hover:bg-[#F5F3EE]" style={{ color: '#9BA8A1' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
    </div>
  );
}

/* ── Toggle ────────────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0"
      style={{ background: checked ? '#1F4D3A' : '#E5E0D4' }}>
      <span
        className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform mt-0.5"
        style={{ transform: checked ? 'translateX(18px)' : 'translateX(2px)' }} />
    </button>
  );
}

/* ── Promo code add modal ──────────────────────────────────────────────────── */
function AddPromoModal({ onClose, eventId }: { onClose: () => void; eventId: string }) {
  const [code, setCode]         = useState('');
  const [type, setType]         = useState<'percent' | 'fixed'>('percent');
  const [value, setValue]       = useState('');
  const [maxUses, setMaxUses]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');

  async function handleSave() {
    if (!code.trim() || !value) { setErr('Code and discount value are required.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discount_type: type,
          discount_value: parseFloat(value),
          max_uses: maxUses ? parseInt(maxUses) : null,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Failed'); }
      onClose();
      window.location.reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-[0_8px_40px_rgba(15,31,24,0.18)] border border-[#E5E0D4] w-full max-w-[400px] p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-[16px] font-semibold" style={{ color: '#0F1F18' }}>Add promo code</h3>
          <button onClick={onClose} className="h-7 w-7 rounded-lg grid place-items-center hover:bg-[#F5F3EE]" style={{ color: '#6B7A72' }}>
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>

        {err && <p className="text-[12px] mb-4 text-red-600">{err}</p>}

        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#6B7A72' }}>Code</label>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="EARLY20" className="w-full h-10 px-3 rounded-lg text-[14px] font-mono outline-none"
              style={{ border: '1.5px solid #E5E0D4', background: 'white', color: '#0F1F18' }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#6B7A72' }}>Type</label>
              <select value={type} onChange={e => setType(e.target.value as 'percent' | 'fixed')}
                className="w-full h-10 px-3 rounded-lg text-[13px] outline-none"
                style={{ border: '1.5px solid #E5E0D4', background: 'white', color: '#0F1F18' }}>
                <option value="percent">Percent off</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#6B7A72' }}>Value</label>
              <input value={value} onChange={e => setValue(e.target.value)}
                placeholder={type === 'percent' ? '20' : '5000'} type="number"
                className="w-full h-10 px-3 rounded-lg text-[13px] font-mono outline-none"
                style={{ border: '1.5px solid #E5E0D4', background: 'white', color: '#0F1F18' }} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#6B7A72' }}>Max uses (optional)</label>
            <input value={maxUses} onChange={e => setMaxUses(e.target.value)}
              placeholder="100" type="number"
              className="w-full h-10 px-3 rounded-lg text-[13px] font-mono outline-none"
              style={{ border: '1.5px solid #E5E0D4', background: 'white', color: '#0F1F18' }} />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl text-[13px] font-medium border transition"
            style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white transition disabled:opacity-60"
            style={{ background: '#1F4D3A' }}>
            {saving ? 'Saving…' : <><Check size={13} strokeWidth={2.5} className="inline mr-1.5" />Add code</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Create ticket modal ───────────────────────────────────────────────────── */
function CreateTicketModal({ onClose, eventId }: { onClose: () => void; eventId: string }) {
  const [name, setName]           = useState('');
  const [price, setPrice]         = useState('15,000');
  const [qty, setQty]             = useState('300');
  const [salesStart, setSalesStart] = useState('');
  const [salesEnd, setSalesEnd]   = useState('');
  const [hidden, setHidden]       = useState(false);
  const [saving, setSaving]       = useState(false);
  const [err, setErr]             = useState('');

  async function handleCreate() {
    if (!name.trim()) { setErr('Ticket name is required.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          price: parseFloat(price.replace(/,/g, '')) || 0,
          currency: 'NGN',
          quantity: qty ? parseInt(qty) : null,
          sales_start: salesStart || null,
          sales_end: salesEnd || null,
          is_visible: !hidden,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? 'Failed'); }
      onClose();
      window.location.reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-[0_8px_40px_rgba(15,31,24,0.18)] border border-[#E5E0D4] w-full max-w-[420px]">
        <div className="px-6 py-5" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-[16px] font-semibold" style={{ color: '#0F1F18' }}>Create ticket type</h3>
              <p className="text-[12.5px] mt-0.5" style={{ color: '#6B7A72' }}>Add a new ticket to this event</p>
            </div>
            <button onClick={onClose} className="h-7 w-7 rounded-lg grid place-items-center hover:bg-[#F5F3EE]" style={{ color: '#6B7A72' }}>
              <X size={14} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {err && <p className="text-[12px] text-red-600">{err}</p>}

          <div>
            <label className="block text-[10.5px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#6B7A72' }}>Ticket Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="General admission" className="w-full h-10 px-3 rounded-lg text-[14px] outline-none"
              style={{ border: '1.5px solid #E5E0D4', background: 'white', color: '#0F1F18' }} autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10.5px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#6B7A72' }}>Price (₦)</label>
              <input value={price} onChange={e => setPrice(e.target.value)}
                placeholder="15,000" className="w-full h-10 px-3 rounded-lg text-[13px] font-mono outline-none"
                style={{ border: '1.5px solid #E5E0D4', background: 'white', color: '#0F1F18' }} />
            </div>
            <div>
              <label className="block text-[10.5px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#6B7A72' }}>Quantity</label>
              <input value={qty} onChange={e => setQty(e.target.value)}
                placeholder="300" className="w-full h-10 px-3 rounded-lg text-[13px] font-mono outline-none"
                style={{ border: '1.5px solid #E5E0D4', background: 'white', color: '#0F1F18' }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10.5px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#6B7A72' }}>Sales Start</label>
              <input type="date" value={salesStart} onChange={e => setSalesStart(e.target.value)}
                className="w-full h-10 px-3 rounded-lg text-[13px] font-mono outline-none"
                style={{ border: '1.5px solid #E5E0D4', background: 'white', color: '#0F1F18' }} />
            </div>
            <div>
              <label className="block text-[10.5px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#6B7A72' }}>Sales End</label>
              <input type="date" value={salesEnd} onChange={e => setSalesEnd(e.target.value)}
                className="w-full h-10 px-3 rounded-lg text-[13px] font-mono outline-none"
                style={{ border: '1.5px solid #E5E0D4', background: 'white', color: '#0F1F18' }} />
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <div className="text-[13.5px] font-medium" style={{ color: '#0F1F18' }}>Hidden ticket</div>
              <div className="text-[12px]" style={{ color: '#6B7A72' }}>Only available via direct link</div>
            </div>
            <Toggle checked={hidden} onChange={setHidden} />
          </div>
        </div>

        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl text-[13px] font-medium border transition"
            style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>Cancel</button>
          <button onClick={handleCreate} disabled={saving}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white transition disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
            style={{ background: '#1F4D3A' }}>
            {saving ? 'Creating…' : <><Check size={13} strokeWidth={2.5} />Create ticket</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────────────────── */
export function TicketsPageClient({
  eventId, tickets, soldByType,
  totalRevenue, ticketsSold, avgOrder, conversion, promoCodes,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [promoOpen, setPromoOpen]   = useState(false);

  // Checkout settings state (UI-only defaults; ideally loaded from event row)
  const [collectDetails, setCollectDetails]     = useState(true);
  const [requireApproval, setRequireApproval]   = useState(false);
  const [showRemaining, setShowRemaining]       = useState(true);
  const [applyVat, setApplyVat]                 = useState(true);

  const subtitle = [
    `${tickets.length} ticket type${tickets.length !== 1 ? 's' : ''}`,
    totalRevenue > 0 ? `${fmtMoney(totalRevenue)} collected` : null,
    ticketsSold > 0  ? `${ticketsSold} sold` : null,
  ].filter(Boolean).join(' · ');

  const statCards = [
    {
      label: 'Revenue',      value: fmtMoney(totalRevenue), trend: null,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    },
    {
      label: 'Tickets Sold', value: ticketsSold.toLocaleString(), trend: null,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
    },
    {
      label: 'Avg. Order',   value: fmtMoney(avgOrder), trend: null,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    },
    {
      label: 'Conversion',   value: `${conversion}%`, trend: conversion > 0 ? `↗ ${Math.min(conversion, 99)}%` : null,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
      gold: true,
    },
  ];

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[1100px] mx-auto px-6 py-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="font-display text-[26px] font-semibold tracking-[-0.02em]" style={{ color: '#0F1F18' }}>Tickets</h1>
            {subtitle && <p className="text-[13.5px] mt-0.5" style={{ color: '#6B7A72' }}>{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/api/events/${eventId}/export`}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-medium border transition hover:bg-[#F5F3EE]"
              style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}>
              <ExternalLink size={13} strokeWidth={1.8} />
              Sales report
            </Link>
            <button onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold text-white transition hover:opacity-90"
              style={{ background: '#1F4D3A' }}>
              <Plus size={14} strokeWidth={2.5} />
              Create ticket type
            </button>
          </div>
        </div>

        {/* ── Stat cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {statCards.map(s => (
            <StatCard key={s.label} label={s.label} value={s.value} trend={s.trend ?? undefined}
              icon={s.icon} gold={s.gold} />
          ))}
        </div>

        {/* ── Ticket types ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl overflow-hidden mb-6"
          style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
          <div className="px-5 py-3.5 border-b" style={{ borderColor: '#E5E0D4' }}>
            <span className="text-[10px] font-mono font-semibold uppercase tracking-widest" style={{ color: '#6B7A72' }}>
              Ticket Types
            </span>
          </div>
          {tickets.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] mb-4" style={{ color: '#6B7A72' }}>No ticket types yet.</p>
              <button onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl text-[13px] font-semibold text-white"
                style={{ background: '#1F4D3A' }}>
                <Plus size={14} strokeWidth={2.5} /> Create first ticket
              </button>
            </div>
          ) : (
            tickets.map(t => (
              <TicketTypeRow key={t.id} t={t} sold={soldByType[t.id] ?? t.quantity_sold ?? 0} />
            ))
          )}
        </div>

        {/* ── Bottom grid: Promo codes + Checkout settings ───────────────── */}
        <div className="grid lg:grid-cols-2 gap-5">

          {/* Promo codes */}
          <div className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#E5E0D4' }}>
              <span className="font-display text-[14px] font-semibold" style={{ color: '#0F1F18' }}>Promo codes</span>
              <button onClick={() => setPromoOpen(true)}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[12px] font-medium transition hover:bg-[#F5F3EE]"
                style={{ color: '#1F4D3A', background: 'rgba(31,77,58,0.06)' }}>
                <Plus size={12} strokeWidth={2.5} /> Add code
              </button>
            </div>
            <div className="p-5">
              {promoCodes.length === 0 ? (
                <p className="text-[13px] text-center py-4" style={{ color: '#6B7A72' }}>No promo codes yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {promoCodes.map(p => {
                    const used = p.uses_count ?? 0;
                    const max  = p.max_uses ?? 0;
                    const discStr = p.discount_type === 'percent'
                      ? `${p.discount_value}% off`
                      : `${fmtMoney(p.discount_value)} off`;
                    const scope = '· all tickets';
                    return (
                      <div key={p.id} className="flex items-center gap-3 py-2.5 border-b last:border-0"
                        style={{ borderColor: '#F0EDE7' }}>
                        <span className="font-mono text-[12px] font-bold px-2.5 py-1 rounded-lg"
                          style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                          {p.code}
                        </span>
                        <span className="text-[13px] flex-1 truncate" style={{ color: '#3A4A42' }}>
                          {discStr} {scope}
                        </span>
                        <span className="font-mono text-[11.5px] shrink-0" style={{ color: '#6B7A72' }}>
                          {used}{max > 0 ? `/${max}` : ''} used
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Checkout settings */}
          <div className="bg-white rounded-2xl overflow-hidden"
            style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
            <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E0D4' }}>
              <span className="font-display text-[14px] font-semibold" style={{ color: '#0F1F18' }}>Checkout settings</span>
            </div>
            <div className="px-5 py-4 space-y-0">
              {[
                { label: 'Collect attendee details', sub: 'Name, email, organization', value: collectDetails, set: setCollectDetails },
                { label: 'Require approval',         sub: 'Manually approve each registrant', value: requireApproval, set: setRequireApproval },
                { label: 'Show remaining tickets',   sub: 'Display scarcity on event page', value: showRemaining, set: setShowRemaining },
                { label: 'Apply 7.5% VAT',           sub: 'Add tax at checkout', value: applyVat, set: setApplyVat },
              ].map((setting, i, arr) => (
                <div key={setting.label}
                  className="flex items-center justify-between py-4"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid #F0EDE7' : 'none' }}>
                  <div>
                    <div className="text-[13.5px] font-medium" style={{ color: '#0F1F18' }}>{setting.label}</div>
                    <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>{setting.sub}</div>
                  </div>
                  <Toggle checked={setting.value} onChange={setting.set} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Full ticket manager (collapsible detail view) ───────────────── */}
        <details className="mt-6">
          <summary className="text-[12.5px] font-medium cursor-pointer py-2 select-none"
            style={{ color: '#6B7A72' }}>
            Advanced ticket management ↓
          </summary>
          <div className="mt-4">
            <TicketTypesManager eventId={eventId} initialTickets={tickets} />
          </div>
        </details>

      </div>

      {createOpen && <CreateTicketModal onClose={() => setCreateOpen(false)} eventId={eventId} />}
      {promoOpen  && <AddPromoModal    onClose={() => setPromoOpen(false)}  eventId={eventId} />}
    </div>
  );
}
