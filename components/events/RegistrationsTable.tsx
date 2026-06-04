'use client';

import { useState, useCallback } from 'react';
import { Search, Download, CheckCircle2, Clock, XCircle, RotateCcw, ExternalLink } from 'lucide-react';

type Status = 'pending' | 'confirmed' | 'checked_in' | 'cancelled' | 'refunded';
type PaymentStatus = 'free' | 'pending' | 'paid' | 'refunded' | 'failed';

interface Registration {
  id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  status: Status;
  payment_status: PaymentStatus;
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

const STATUS_PILL: Record<Status, { label: string; bg: string; color: string }> = {
  confirmed:   { label: 'Confirmed',   bg: '#E8EFEB', color: '#1F4D3A' },
  checked_in:  { label: 'Checked in',  bg: '#D1FAE5', color: '#065F46' },
  pending:     { label: 'Pending',     bg: '#FEF3C7', color: '#92400E' },
  cancelled:   { label: 'Cancelled',   bg: '#FEE2E2', color: '#991B1B' },
  refunded:    { label: 'Refunded',    bg: '#E0E7FF', color: '#3730A3' },
};

function StatusPill({ status }: { status: Status }) {
  const s = STATUS_PILL[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium"
      style={{ background: s.bg, color: s.color }}
    >
      {status === 'checked_in' && <CheckCircle2 size={10} />}
      {status === 'confirmed'  && <Clock size={10} />}
      {status === 'cancelled'  && <XCircle size={10} />}
      {status === 'refunded'   && <RotateCcw size={10} />}
      {s.label}
    </span>
  );
}

function formatCurrency(amount: number, currency: string) {
  if (amount === 0) return 'Free';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}

function exportCSV(rows: Registration[], eventSlug: string) {
  const headers = ['Name', 'Email', 'Phone', 'Ticket', 'Amount', 'Status', 'Card Downloaded', 'Registered At', 'Checked In At'];
  const lines = rows.map(r => [
    r.attendee_name,
    r.attendee_email,
    r.attendee_phone ?? '',
    r.ticket_types?.name ?? 'General',
    formatCurrency(r.amount_paid, r.currency),
    r.status,
    r.karta_card_url ? 'Yes' : 'No',
    new Date(r.created_at).toLocaleString(),
    r.checked_in_at ? new Date(r.checked_in_at).toLocaleString() : '',
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
  const [rows, setRows] = useState(initialRegistrations);
  const [total, setTotal] = useState(totalCount);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(initialRegistrations.length);
  const PAGE = 50;

  const filtered = rows.filter(r => {
    const matchQ = !query || r.attendee_name.toLowerCase().includes(query.toLowerCase()) || r.attendee_email.toLowerCase().includes(query.toLowerCase());
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
      const res = await fetch(url.toString());
      const data = await res.json() as { registrations: Registration[]; total: number };
      setRows(r => [...r, ...data.registrations]);
      setTotal(data.total);
      setOffset(o => o + data.registrations.length);
    } finally {
      setLoading(false);
    }
  }, [eventId, offset, statusFilter]);

  const checkedInCount = rows.filter(r => r.status === 'checked_in').length;
  const pendingCount   = rows.filter(r => r.status === 'pending').length;
  const cardDownloaded = rows.filter(r => r.karta_card_url).length;
  const totalRevenue   = rows.reduce((s, r) => s + (r.amount_paid ?? 0), 0);
  const checkInPct     = total > 0 ? `${Math.round((checkedInCount / total) * 100)}%` : '0%';

  return (
    <div>
      {/* ── Stats strip (inline, matching w03 reference) ── */}
      <div className="bg-white border rounded-2xl px-5 py-4 mb-5 flex flex-wrap items-center gap-x-5 gap-y-2"
        style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
        {[
          { value: total,                             label: 'Total' },
          { value: `${checkedInCount} (${checkInPct})`, label: 'Checked in' },
          { value: pendingCount,                      label: 'Pending' },
          { value: totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : '$0', label: 'Revenue' },
          { value: cardDownloaded,                    label: 'Karta Cards downloaded', last: true },
        ].map((s, i, arr) => (
          <div key={s.label} className="flex items-center gap-5">
            <div>
              <span className="font-mono text-[18px] font-medium" style={{ color: '#1F4D3A' }}>{s.value}</span>
              <span className="ml-2 text-[13px]" style={{ color: '#6B7A72' }}>{s.label}</span>
            </div>
            {i < arr.length - 1 && <span className="hidden sm:inline" style={{ color: '#E5E0D4' }}>·</span>}
          </div>
        ))}
      </div>

      {/* ── Toolbar ─────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7A72' }} />
          <input
            type="text"
            placeholder="Search name or email…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full rounded-lg pl-9 pr-3 py-2 text-[13px] outline-none"
            style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
          />
        </div>

        {/* Status filter */}
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'confirmed', 'checked_in', 'pending', 'cancelled'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors"
              style={{
                background: statusFilter === s ? '#1F4D3A' : 'white',
                color: statusFilter === s ? 'white' : '#6B7A72',
                border: `1px solid ${statusFilter === s ? '#1F4D3A' : '#E5E0D4'}`,
              }}
            >
              {s === 'all' ? 'All' : s === 'checked_in' ? 'Checked in' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Export + Add manually */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => exportCSV(filtered, eventSlug)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-medium"
            style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={() => alert('Add manually feature coming soon')}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-medium text-white transition hover:opacity-90"
            style={{ background: '#1F4D3A' }}
          >
            Add manually
          </button>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
        {filtered.length === 0 ? (
          <div className="py-16 text-center" style={{ background: 'white' }}>
            <div className="text-[14px]" style={{ color: '#6B7A72' }}>No registrations match your filter</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ background: '#FAF6EE', borderBottom: '1px solid #E5E0D4' }}>
                  {['Name', 'Ticket', 'Amount', 'Status', 'Card', 'Registered', 'Checked in'].map(h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
                      style={{ color: '#6B7A72' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((reg, i) => (
                  <tr
                    key={reg.id}
                    style={{
                      background: i % 2 === 0 ? 'white' : '#FDFCFA',
                      borderBottom: '1px solid #F0EBE3',
                    }}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-[14px]" style={{ color: '#0F1F18' }}>{reg.attendee_name}</div>
                      <div className="text-[12px]" style={{ color: '#6B7A72' }}>{reg.attendee_email}</div>
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={{ color: '#3A4A42' }}>
                      {reg.ticket_types?.name ?? 'General'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[13px]" style={{ color: '#1F4D3A' }}>
                      {formatCurrency(reg.amount_paid, reg.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={reg.status} />
                    </td>
                    <td className="px-4 py-3">
                      {reg.karta_card_url ? (
                        <a href={reg.karta_card_url} target="_blank" rel="noopener noreferrer">
                          <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: '#1F4D3A' }}>
                            <ExternalLink size={12} />
                            View
                          </span>
                        </a>
                      ) : (
                        <span className="text-[12px]" style={{ color: '#C9C3B1' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px]" style={{ color: '#6B7A72' }}>
                      {new Date(reg.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px]" style={{ color: reg.checked_in_at ? '#1F4D3A' : '#C9C3B1' }}>
                      {reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleTimeString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Load more ───────────────────────────────── */}
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
