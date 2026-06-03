'use client';

import { useState, useCallback } from 'react';
import { Search, ChevronDown, CreditCard } from 'lucide-react';

type Status = 'pending' | 'confirmed' | 'checked_in' | 'cancelled' | 'refunded';

interface Registration {
  id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  status: Status;
  payment_status: string;
  amount_paid: number;
  currency: string;
  karta_card_url: string | null;
  checked_in_at: string | null;
  created_at: string;
  ticket_types: { name: string; price: number } | null;
}

interface Props {
  eventId: string;
  eventSlug: string;
  initialRegistrations: Registration[];
  totalCount: number;
}

// Deterministic gradient from attendee name
const GRADS = [
  'linear-gradient(135deg,#1F4D3A,#2A6A50)',
  'linear-gradient(135deg,#2A6A50,#C9A45E)',
  'linear-gradient(135deg,#163828,#3E7E5E)',
  'linear-gradient(135deg,#C9A45E,#1F4D3A)',
  'linear-gradient(135deg,#3E7E5E,#C9A45E)',
  'linear-gradient(135deg,#163828,#2A6A50)',
];
function nameGrad(name: string): string {
  const h = name.split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0);
  return GRADS[Math.abs(h) % GRADS.length];
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function ticketPill(name: string) {
  if (name === 'Speaker' || name.toLowerCase().includes('speaker'))
    return { bg: '#E8EFEB', color: '#1F4D3A' };
  if (name === 'VIP' || name.toLowerCase().includes('vip'))
    return { bg: 'rgba(232,197,126,0.2)', color: '#C9A45E' };
  return { bg: 'rgba(15,31,24,0.06)', color: '#6B7A72' };
}

function exportCSV(rows: Registration[], eventSlug: string) {
  const headers = ['Name', 'Email', 'Phone', 'Ticket', 'Status', 'Card', 'Registered'];
  const lines = rows.map(r => [
    r.attendee_name,
    r.attendee_email,
    r.attendee_phone ?? '',
    r.ticket_types?.name ?? 'General',
    r.status,
    r.karta_card_url ? 'Yes' : 'No',
    new Date(r.created_at).toLocaleString(),
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));

  const csv = [headers.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${eventSlug}-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function RegistrationsTable({ eventId, eventSlug, initialRegistrations, totalCount }: Props) {
  const [rows, setRows]           = useState(initialRegistrations);
  const [total, setTotal]         = useState(totalCount);
  const [query, setQuery]         = useState('');
  const [statusFilter, setStatus] = useState<Status | 'all'>('all');
  const [loading, setLoading]     = useState(false);
  const [offset, setOffset]       = useState(initialRegistrations.length);
  const PAGE = 50;

  const filtered = rows.filter(r => {
    const q = query.toLowerCase();
    const matchQ = !q || r.attendee_name.toLowerCase().includes(q) || r.attendee_email.toLowerCase().includes(q);
    const matchS = statusFilter === 'all' || r.status === statusFilter;
    return matchQ && matchS;
  });

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL(`/api/events/${eventId}/registrations`, window.location.origin);
      url.searchParams.set('offset', String(offset));
      url.searchParams.set('limit', String(PAGE));
      if (statusFilter !== 'all') url.searchParams.set('status', statusFilter);
      const res  = await fetch(url.toString());
      const data = await res.json() as { registrations: Registration[]; total: number };
      setRows(r => [...r, ...data.registrations]);
      setTotal(data.total);
      setOffset(o => o + data.registrations.length);
    } finally {
      setLoading(false);
    }
  }, [eventId, offset, statusFilter]);

  // Unique ticket names for the filter dropdown
  const ticketNames = Array.from(new Set(rows.map(r => r.ticket_types?.name ?? 'General')));

  return (
    <div>
      {/* ── Toolbar ──────────────────────────────────── */}
      <div className="flex items-center gap-2.5 mb-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7A72' }} />
          <input
            type="text"
            placeholder="Search attendees…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg text-[13px] outline-none"
            style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
          />
        </div>

        {/* All tickets dropdown */}
        <div className="relative">
          <select
            className="h-9 pl-3 pr-7 rounded-lg border text-[12.5px] appearance-none cursor-pointer outline-none"
            style={{ background: 'white', borderColor: '#E5E0D4', color: '#6B7A72' }}
            onChange={() => {/* future: ticket filter */}}
          >
            <option>All tickets</option>
            {ticketNames.map(t => <option key={t}>{t}</option>)}
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6B7A72' }} />
        </div>

        {/* All statuses dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={e => setStatus(e.target.value as Status | 'all')}
            className="h-9 pl-3 pr-7 rounded-lg border text-[12.5px] appearance-none cursor-pointer outline-none"
            style={{ background: 'white', borderColor: '#E5E0D4', color: '#6B7A72' }}
          >
            <option value="all">All statuses</option>
            <option value="confirmed">Registered</option>
            <option value="checked_in">Checked in</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6B7A72' }} />
        </div>
      </div>

      {/* ── Table ────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[14px]" style={{ color: '#6B7A72' }}>
              {total === 0 ? 'No registrations yet.' : 'No registrations match your filter'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ background: 'rgba(250,246,238,0.6)', borderBottom: '1px solid #E5E0D4' }}>
                  {['Attendee', 'Ticket', 'Status', 'Card', 'Registered'].map(h => (
                    <th
                      key={h}
                      className="py-3 px-5 font-mono text-[9.5px] tracking-[0.16em] uppercase"
                      style={{ color: '#6B7A72' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(reg => (
                  <tr
                    key={reg.id}
                    className="transition-colors"
                    style={{ borderTop: '1px solid rgba(229,224,212,0.6)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(250,246,238,0.4)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Attendee */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-8 h-8 rounded-full grid place-items-center font-display text-[11px] font-semibold shrink-0"
                          style={{ background: nameGrad(reg.attendee_name), color: '#FAF6EE' }}
                        >
                          {initials(reg.attendee_name)}
                        </span>
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-medium leading-tight" style={{ color: '#0F1F18' }}>
                            {reg.attendee_name}
                          </div>
                          <div className="font-mono text-[11px] truncate" style={{ color: '#6B7A72' }}>
                            {reg.attendee_email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Ticket */}
                    <td className="py-3 px-5">
                      {(() => {
                        const name = reg.ticket_types?.name ?? 'General';
                        const s = ticketPill(name);
                        return (
                          <span
                            className="inline-block text-[11px] font-medium px-2 py-0.5 rounded"
                            style={{ background: s.bg, color: s.color }}
                          >
                            {name}
                          </span>
                        );
                      })()}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-5">
                      {reg.status === 'checked_in' ? (
                        <span className="inline-flex items-center gap-1.5 text-[12.5px]" style={{ color: '#059669' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          Checked in
                        </span>
                      ) : reg.status === 'cancelled' ? (
                        <span className="inline-flex items-center gap-1.5 text-[12.5px]" style={{ color: '#B8423C' }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#B8423C' }} />
                          Cancelled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[12.5px]" style={{ color: '#6B7A72' }}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'rgba(107,122,114,0.5)' }} />
                          Registered
                        </span>
                      )}
                    </td>

                    {/* Card */}
                    <td className="py-3 px-5">
                      <span
                        title={reg.karta_card_url ? 'Card generated' : 'No card yet'}
                        style={{ color: reg.karta_card_url ? '#1F4D3A' : 'rgba(15,31,24,0.2)' }}
                      >
                        <CreditCard size={17} strokeWidth={1.7} />
                      </span>
                    </td>

                    {/* Registered */}
                    <td className="py-3 px-5 font-mono text-[12px]" style={{ color: '#6B7A72' }}>
                      {timeAgo(reg.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Load more ────────────────────────────────── */}
      {rows.length < total && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2.5 rounded-full text-[13px] font-medium transition-opacity"
            style={{ background: '#1F4D3A', color: 'white', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Loading…' : `Load more (${total - rows.length} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}
