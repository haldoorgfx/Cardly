'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Download, CheckCircle2, Clock, XCircle, RotateCcw, ExternalLink, UserPlus, X } from 'lucide-react';

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

interface TicketOption {
  id: string;
  name: string;
  price: number;
  currency: string;
}

interface Props {
  eventId: string;
  eventSlug: string;
  initialRegistrations: Registration[];
  totalCount: number;
  ticketTypes: TicketOption[];
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
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[12px] font-medium" style={{ background: s.bg, color: s.color }}>
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

/* ── Add manually modal ─────────────────────────────────────────────────────── */
function AddManuallyModal({
  eventId, ticketTypes, onClose, onAdded,
}: {
  eventId: string;
  ticketTypes: TicketOption[];
  onClose: () => void;
  onAdded: (reg: Registration) => void;
}) {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [ticketId, setTicketId] = useState(ticketTypes[0]?.id ?? '');
  const [notes, setNotes]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  async function handleSave() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!EMAIL_RE.test(email)) errs.email = 'Enter a valid email';
    if (!ticketId) errs.ticketId = 'Select a ticket type';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    setApiError('');
    try {
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendee_name: name.trim(), attendee_email: email.trim(), attendee_phone: phone.trim() || undefined, ticket_type_id: ticketId, notes: notes.trim() || undefined }),
      });
      const data = await res.json() as { registration?: Registration; error?: string };
      if (!res.ok) { setApiError(data.error ?? 'Failed to add registration'); return; }
      onAdded(data.registration!);
      onClose();
    } catch {
      setApiError('Something went wrong. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-[420px]" style={{ border: '1px solid #E5E0D4', boxShadow: '0 8px 40px rgba(15,31,24,0.18)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <div>
            <h3 className="font-display text-[16px] font-semibold" style={{ color: '#0F1F18' }}>Add attendee manually</h3>
            <p className="text-[12.5px] mt-0.5" style={{ color: '#6B7A72' }}>Walk-in or offline registration</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-lg grid place-items-center hover:bg-[#F5F3EE]" style={{ color: '#6B7A72' }}>
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4">
          {apiError && (
            <div className="px-4 py-3 rounded-xl text-[13px] font-medium" style={{ background: '#FEF2F2', color: '#B8423C', border: '1px solid #FECACA' }}>
              {apiError}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: errors.name ? '#B8423C' : '#6B7A72' }}>Full name *</label>
            <input
              value={name} onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: '' })); }}
              placeholder="Amina Osman" autoFocus
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none"
              style={{ border: `1.5px solid ${errors.name ? '#B8423C' : '#E5E0D4'}`, background: 'white', color: '#0F1F18' }}
            />
            {errors.name && <p className="text-[12px] mt-1" style={{ color: '#B8423C' }}>{errors.name}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: errors.email ? '#B8423C' : '#6B7A72' }}>Email *</label>
            <input
              type="email" value={email} onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: '' })); }}
              placeholder="amina@example.com"
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none"
              style={{ border: `1.5px solid ${errors.email ? '#B8423C' : '#E5E0D4'}`, background: 'white', color: '#0F1F18' }}
            />
            {errors.email && <p className="text-[12px] mt-1" style={{ color: '#B8423C' }}>{errors.email}</p>}
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#6B7A72' }}>Phone (optional)</label>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+254 700 000 000"
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none"
              style={{ border: '1.5px solid #E5E0D4', background: 'white', color: '#0F1F18' }}
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: errors.ticketId ? '#B8423C' : '#6B7A72' }}>Ticket type *</label>
            {ticketTypes.length === 0 ? (
              <p className="text-[13px]" style={{ color: '#6B7A72' }}>No ticket types created yet.</p>
            ) : (
              <select
                value={ticketId} onChange={e => { setTicketId(e.target.value); if (errors.ticketId) setErrors(p => ({ ...p, ticketId: '' })); }}
                className="w-full h-10 px-3 rounded-lg text-[13px] outline-none"
                style={{ border: `1.5px solid ${errors.ticketId ? '#B8423C' : '#E5E0D4'}`, background: 'white', color: '#0F1F18' }}
              >
                {ticketTypes.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.price === 0 ? 'Free' : formatCurrency(t.price, t.currency)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#6B7A72' }}>Notes (optional)</label>
            <input
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="VIP guest, walk-in at gate…"
              className="w-full h-10 px-3 rounded-lg text-[14px] outline-none"
              style={{ border: '1.5px solid #E5E0D4', background: 'white', color: '#0F1F18' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-xl text-[13px] font-medium border transition" style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>
            Cancel
          </button>
          <button
            onClick={handleSave} disabled={saving || ticketTypes.length === 0}
            className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white transition disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
            style={{ background: '#1F4D3A' }}
          >
            {saving ? 'Adding…' : <><UserPlus size={13} strokeWidth={2} /> Add attendee</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main table ─────────────────────────────────────────────────────────────── */
export function RegistrationsTable({ eventId, eventSlug, initialRegistrations, totalCount, ticketTypes }: Props) {
  const [rows, setRows]               = useState(initialRegistrations);
  const [total, setTotal]             = useState(totalCount);
  const [query, setQuery]             = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [loading, setLoading]         = useState(false);
  const [addOpen, setAddOpen]         = useState(false);
  const searchTimeout                 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const PAGE = 50;

  // Server-side search: debounce 300ms then re-fetch from offset 0
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = new URL(`/api/events/${eventId}/registrations`, window.location.origin);
        url.searchParams.set('offset', '0');
        url.searchParams.set('limit', String(PAGE));
        if (query) url.searchParams.set('q', query);
        if (statusFilter !== 'all') url.searchParams.set('status', statusFilter);
        const res = await fetch(url.toString());
        const data = await res.json() as { registrations: Registration[]; total: number };
        setRows(data.registrations ?? []);
        setTotal(data.total ?? 0);
      } finally {
        setLoading(false);
      }
    }, 300);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, statusFilter, eventId]);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL(`/api/events/${eventId}/registrations`, window.location.origin);
      url.searchParams.set('offset', String(rows.length));
      url.searchParams.set('limit', String(PAGE));
      if (query) url.searchParams.set('q', query);
      if (statusFilter !== 'all') url.searchParams.set('status', statusFilter);
      const res = await fetch(url.toString());
      const data = await res.json() as { registrations: Registration[]; total: number };
      setRows(r => [...r, ...data.registrations]);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [eventId, rows.length, query, statusFilter]);

  const checkedInCount = rows.filter(r => r.status === 'checked_in').length;
  const pendingCount   = rows.filter(r => r.status === 'pending').length;
  const cardDownloaded = rows.filter(r => r.karta_card_url).length;
  // Group revenue by currency
  const revenueByCurrency = rows.reduce<Record<string, number>>((acc, r) => {
    if ((r.amount_paid ?? 0) <= 0) return acc;
    const cur = r.currency || 'USD';
    acc[cur] = (acc[cur] ?? 0) + (r.amount_paid ?? 0);
    return acc;
  }, {});
  const revenueDisplay = Object.entries(revenueByCurrency).length === 0
    ? '—'
    : Object.entries(revenueByCurrency)
        .map(([cur, amt]) => {
          try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, minimumFractionDigits: 0 }).format(amt); }
          catch { return `${cur} ${amt.toLocaleString()}`; }
        })
        .join(' + ');
  const checkInPct     = total > 0 ? `${Math.round((checkedInCount / total) * 100)}%` : '0%';

  return (
    <div>
      {addOpen && (
        <AddManuallyModal
          eventId={eventId}
          ticketTypes={ticketTypes}
          onClose={() => setAddOpen(false)}
          onAdded={(reg) => {
            setRows(r => [reg as unknown as Registration, ...r]);
            setTotal(t => t + 1);
          }}
        />
      )}

      {/* ── Stats strip ── */}
      <div className="bg-white border rounded-2xl px-5 py-4 mb-5 flex flex-wrap items-center gap-x-5 gap-y-2" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
        {[
          { value: total,                                          label: 'Total' },
          { value: `${checkedInCount} (${checkInPct})`,           label: 'Checked in' },
          { value: pendingCount,                                   label: 'Pending' },
          { value: revenueDisplay, label: 'Revenue' },
          { value: cardDownloaded, label: 'Karta Cards downloaded', last: true },
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

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap gap-3 mb-4">
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

        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => exportCSV(rows, eventSlug)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-medium"
            style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
          >
            <Download size={14} />
            Export CSV
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-medium text-white transition hover:opacity-90"
            style={{ background: '#1F4D3A' }}
          >
            <UserPlus size={14} />
            Add manually
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
        {loading && rows.length === 0 ? (
          <div className="py-16 text-center" style={{ background: 'white' }}>
            <div className="text-[14px]" style={{ color: '#6B7A72' }}>Searching…</div>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-16 text-center" style={{ background: 'white' }}>
            <div className="text-[14px]" style={{ color: '#6B7A72' }}>
              {query || statusFilter !== 'all' ? 'No registrations match your filter' : 'No registrations yet'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ background: '#FAF6EE', borderBottom: '1px solid #E5E0D4' }}>
                  {['Name', 'Ticket', 'Amount', 'Status', 'Card', 'Registered', 'Checked in'].map(h => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#6B7A72' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((reg, i) => (
                  <tr key={reg.id} style={{ background: i % 2 === 0 ? 'white' : '#FDFCFA', borderBottom: '1px solid #F0EBE3' }}>
                    <td className="px-4 py-3">
                      <Link href={`/events/${eventId}/registrations/${reg.id}`}
                        className="font-medium text-[14px] hover:underline block" style={{ color: '#0F1F18', textDecoration: 'none' }}>
                        {reg.attendee_name}
                      </Link>
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
                            <ExternalLink size={12} /> View
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

      {/* ── Load more ── */}
      {rows.length < total && !loading && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            className="px-6 py-2.5 rounded-full text-[13px] font-medium"
            style={{ background: '#1F4D3A', color: 'white' }}
          >
            Load more ({total - rows.length} remaining)
          </button>
        </div>
      )}
      {loading && rows.length > 0 && (
        <div className="mt-4 text-center text-[13px]" style={{ color: '#6B7A72' }}>Loading…</div>
      )}
    </div>
  );
}
