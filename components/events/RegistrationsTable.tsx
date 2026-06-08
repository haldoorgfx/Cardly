'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Download, CheckCircle2, Clock, XCircle, RotateCcw, ExternalLink, UserPlus, X, MoreHorizontal, Upload, AlertCircle, CheckCircle, ChevronDown } from 'lucide-react';

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

/* ── Row actions menu ───────────────────────────────────────────────────────── */
function RowActionsMenu({
  reg,
  eventId,
  onStatusChange,
  onDeleted,
}: {
  reg: Registration;
  eventId: string;
  onStatusChange: (id: string, status: Status) => void;
  onDeleted: (id: string) => void;
}) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function changeStatus(status: Status) {
    setOpen(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: reg.id, status }),
      });
      if (res.ok) onStatusChange(reg.id, status);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setOpen(false);
    if (!confirm(`Delete registration for ${reg.attendee_name}? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/registrations?regId=${reg.id}`, { method: 'DELETE' });
      if (res.ok) onDeleted(reg.id);
    } finally {
      setLoading(false);
    }
  }

  const canCancel  = ['pending', 'confirmed', 'checked_in'].includes(reg.status);
  const canConfirm = reg.status === 'cancelled' || reg.status === 'pending';
  const canRefund  = reg.status === 'confirmed' || reg.status === 'checked_in';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={loading}
        className="w-7 h-7 rounded-lg grid place-items-center transition-colors hover:bg-[#F0EBE3]"
        style={{ color: loading ? '#C9C3B1' : '#6B7A72' }}
        title="Actions"
      >
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-white z-20 py-1"
          style={{ border: '1px solid #E5E0D4', boxShadow: '0 4px 12px rgba(15,31,24,0.10), 0 1px 3px rgba(15,31,24,0.06)' }}
        >
          {canConfirm && (
            <button onClick={() => changeStatus('confirmed')} className="w-full text-left px-4 py-2 text-[13px] hover:bg-[#F5F3EE] transition-colors" style={{ color: '#1F4D3A' }}>
              ✓ Mark confirmed
            </button>
          )}
          {canCancel && (
            <button onClick={() => changeStatus('cancelled')} className="w-full text-left px-4 py-2 text-[13px] hover:bg-[#F5F3EE] transition-colors" style={{ color: '#C97A2D' }}>
              Cancel registration
            </button>
          )}
          {canRefund && (
            <button onClick={() => changeStatus('refunded')} className="w-full text-left px-4 py-2 text-[13px] hover:bg-[#F5F3EE] transition-colors" style={{ color: '#3A6B8C' }}>
              Mark as refunded
            </button>
          )}
          <div style={{ height: 1, background: '#E5E0D4', margin: '4px 0' }} />
          <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-[13px] hover:bg-[#FEF2F2] transition-colors" style={{ color: '#B8423C' }}>
            Delete registration
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Import CSV modal ───────────────────────────────────────────────────────── */
interface ParsedRow { name: string; email: string; phone: string; rowIndex: number; error?: string }

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Detect header columns (case-insensitive)
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim().toLowerCase());
  const col = (candidates: string[]) => candidates.map(c => headers.indexOf(c)).find(i => i >= 0) ?? -1;
  const nameCol  = col(['name', 'full name', 'attendee name', 'full_name', 'attendee_name']);
  const emailCol = col(['email', 'email address', 'attendee email', 'attendee_email']);
  const phoneCol = col(['phone', 'phone number', 'mobile', 'telephone', 'attendee_phone']);

  if (nameCol === -1 || emailCol === -1) return [];

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Simple CSV parse (handles quoted fields)
    const cells: string[] = [];
    let cur = '', inQ = false;
    for (const ch of line + ',') {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    const name  = cells[nameCol]  ?? '';
    const email = cells[emailCol] ?? '';
    const phone = phoneCol >= 0 ? (cells[phoneCol] ?? '') : '';
    const error = !name ? 'Missing name' : !email ? 'Missing email' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Invalid email' : undefined;
    rows.push({ name, email, phone, rowIndex: i, error });
  }
  return rows;
}

function ImportCSVModal({ eventId, ticketTypes, onClose, onImported }: {
  eventId: string;
  ticketTypes: TicketOption[];
  onClose: () => void;
  onImported: (count: number) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows]           = useState<ParsedRow[]>([]);
  const [fileName, setFileName]   = useState('');
  const [ticketId, setTicketId]   = useState(ticketTypes[0]?.id ?? '');
  const [dragging, setDragging]   = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult]       = useState<{ imported: number; skipped: number; invalid: number } | null>(null);
  const [apiError, setApiError]   = useState('');

  const validRows   = rows.filter(r => !r.error);
  const invalidRows = rows.filter(r => r.error);

  function handleFile(file: File) {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setRows(parsed);
      setResult(null);
      setApiError('');
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (validRows.length === 0) return;
    setImporting(true);
    setApiError('');
    try {
      const res = await fetch(`/api/events/${eventId}/registrations/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendees: validRows.map(r => ({ attendee_name: r.name, attendee_email: r.email, attendee_phone: r.phone || undefined })),
          ticket_type_id: ticketId || undefined,
        }),
      });
      const data = await res.json() as { imported?: number; skipped?: number; invalid?: number; error?: string };
      if (!res.ok) { setApiError(data.error ?? 'Import failed'); return; }
      setResult({ imported: data.imported ?? 0, skipped: data.skipped ?? 0, invalid: data.invalid ?? 0 });
      onImported(data.imported ?? 0);
    } catch {
      setApiError('Something went wrong. Check your connection and try again.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-[560px] max-h-[90vh] flex flex-col" style={{ border: '1px solid #E5E0D4', boxShadow: '0 8px 40px rgba(15,31,24,0.18)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 shrink-0" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <div>
            <h3 className="font-display text-[16px] font-semibold" style={{ color: '#0F1F18' }}>Import from CSV</h3>
            <p className="text-[12.5px] mt-0.5" style={{ color: '#6B7A72' }}>Bulk-add attendees from a spreadsheet export</p>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-lg grid place-items-center hover:bg-[#F5F3EE]" style={{ color: '#6B7A72' }}>
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto space-y-4 flex-1">
          {apiError && (
            <div className="px-4 py-3 rounded-xl text-[13px] font-medium flex gap-2 items-start" style={{ background: '#FEF2F2', color: '#B8423C', border: '1px solid #FECACA' }}>
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {apiError}
            </div>
          )}

          {/* Success result */}
          {result && (
            <div className="px-4 py-4 rounded-xl" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <div className="flex items-center gap-2 font-semibold text-[14px] mb-2" style={{ color: '#15803D' }}>
                <CheckCircle size={15} />
                Import complete
              </div>
              <div className="text-[13px] space-y-0.5" style={{ color: '#166534' }}>
                <div>✓ {result.imported} attendee{result.imported !== 1 ? 's' : ''} added</div>
                {result.skipped > 0 && <div>↷ {result.skipped} skipped (already registered)</div>}
                {result.invalid > 0 && <div>✗ {result.invalid} invalid rows skipped</div>}
              </div>
            </div>
          )}

          {/* Drop zone */}
          {!result && (
            <>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                className="rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-2 py-8 transition-colors"
                style={{ borderColor: dragging ? '#1F4D3A' : '#C9C3B1', background: dragging ? '#F0F7F3' : '#FAF6EE' }}
              >
                <Upload size={22} style={{ color: dragging ? '#1F4D3A' : '#9BA8A1' }} />
                {fileName ? (
                  <span className="text-[13px] font-medium" style={{ color: '#1F4D3A' }}>{fileName}</span>
                ) : (
                  <>
                    <span className="text-[13px] font-medium" style={{ color: '#0F1F18' }}>Drop your CSV here, or click to browse</span>
                    <span className="text-[12px]" style={{ color: '#9BA8A1' }}>Required columns: Name, Email · Phone optional</span>
                  </>
                )}
                <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </div>

              {/* Format hint */}
              <div className="rounded-xl px-4 py-3 text-[12px]" style={{ background: '#F5F3EE', color: '#6B7A72' }}>
                <span className="font-semibold" style={{ color: '#3A4A42' }}>Accepted columns: </span>
                Name, Email, Phone — header names are flexible (e.g. "Full Name", "Email Address").
                Export your existing list as a template.
              </div>

              {/* Preview */}
              {rows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-semibold" style={{ color: '#3A4A42' }}>
                      Preview — {validRows.length} valid · {invalidRows.length > 0 ? `${invalidRows.length} invalid` : 'none invalid'}
                    </span>
                  </div>
                  <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E0D4', maxHeight: 240, overflowY: 'auto' }}>
                    <table className="w-full text-left">
                      <thead style={{ background: '#FAF6EE', position: 'sticky', top: 0 }}>
                        <tr>
                          {['Name', 'Email', 'Phone', ''].map(h => (
                            <th key={h} className="px-3 py-2 font-mono text-[9.5px] uppercase tracking-wider" style={{ color: '#6B7A72' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 100).map((r, i) => (
                          <tr key={i} style={{ background: r.error ? '#FFF7F7' : i % 2 === 0 ? 'white' : '#FAF6EE', borderTop: '1px solid #F0EBE3' }}>
                            <td className="px-3 py-2 text-[12px]" style={{ color: '#0F1F18' }}>{r.name || <span style={{ color: '#B8423C' }}>—</span>}</td>
                            <td className="px-3 py-2 text-[12px]" style={{ color: '#6B7A72' }}>{r.email || <span style={{ color: '#B8423C' }}>—</span>}</td>
                            <td className="px-3 py-2 text-[12px]" style={{ color: '#9BA8A1' }}>{r.phone || '—'}</td>
                            <td className="px-3 py-2 text-[11px]" style={{ color: '#B8423C' }}>{r.error ?? ''}</td>
                          </tr>
                        ))}
                        {rows.length > 100 && (
                          <tr style={{ background: '#FAF6EE' }}>
                            <td colSpan={4} className="px-3 py-2 text-[12px] text-center" style={{ color: '#9BA8A1' }}>
                              +{rows.length - 100} more rows not shown
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Ticket type */}
              {ticketTypes.length > 0 && (
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: '#6B7A72' }}>Assign ticket type (optional)</label>
                  <div className="relative">
                    <select
                      value={ticketId}
                      onChange={e => setTicketId(e.target.value)}
                      className="w-full h-10 px-3 pr-8 rounded-lg text-[13px] outline-none appearance-none"
                      style={{ border: '1.5px solid #E5E0D4', background: 'white', color: '#0F1F18' }}
                    >
                      <option value="">No ticket type (free walk-in)</option>
                      {ticketTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.name} — {t.price === 0 ? 'Free' : `${t.currency} ${t.price}`}</option>
                      ))}
                    </select>
                    <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6B7A72' }} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 shrink-0 flex gap-3" style={{ borderTop: '1px solid #F0EBE3' }}>
          <button onClick={onClose} className="flex-1 h-10 rounded-xl text-[13px] font-medium border transition" style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={importing || validRows.length === 0}
              className="flex-1 h-10 rounded-xl text-[13px] font-semibold text-white transition disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              style={{ background: '#1F4D3A' }}
            >
              {importing ? 'Importing…' : validRows.length > 0 ? <><Upload size={13} strokeWidth={2} /> Import {validRows.length} attendee{validRows.length !== 1 ? 's' : ''}</> : 'Upload a CSV first'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
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
    if (ticketTypes.length > 0 && !ticketId) errs.ticketId = 'Select a ticket type';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    setApiError('');
    try {
      const res = await fetch(`/api/events/${eventId}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendee_name: name.trim(), attendee_email: email.trim(), attendee_phone: phone.trim() || undefined, ticket_type_id: ticketId || undefined, notes: notes.trim() || undefined }),
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
            <label className="block text-[11px] font-mono uppercase tracking-widest mb-1.5" style={{ color: errors.ticketId ? '#B8423C' : '#6B7A72' }}>Ticket type {ticketTypes.length > 0 ? '*' : '(optional)'}</label>
            {ticketTypes.length === 0 ? (
              <p className="text-[13px]" style={{ color: '#9BA8A1' }}>No ticket types yet — attendee will be added as a free walk-in.</p>
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
            onClick={handleSave} disabled={saving}
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

  function handleStatusChange(id: string, status: Status) {
    setRows(r => r.map(row => row.id === id ? { ...row, status } : row));
  }

  function handleDeleted(id: string) {
    setRows(r => r.filter(row => row.id !== id));
    setTotal(t => t - 1);
  }
  const [query, setQuery]             = useState('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all');
  const [loading, setLoading]         = useState(false);
  const [addOpen, setAddOpen]         = useState(false);
  const [importOpen, setImportOpen]   = useState(false);
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
      {importOpen && (
        <ImportCSVModal
          eventId={eventId}
          ticketTypes={ticketTypes}
          onClose={() => setImportOpen(false)}
          onImported={(count) => {
            setTotal(t => t + count);
            // Refresh list from server
            setQuery(q => q); // trigger search effect
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
              <span className="font-mono text-[20px] font-medium" style={{ color: '#1F4D3A' }}>{s.value}</span>
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
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-medium"
            style={{ background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' }}
          >
            <Upload size={14} />
            Import CSV
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[13px] font-medium text-white transition hover:opacity-90"
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
                  {['Name', 'Ticket', 'Amount', 'Status', 'Card', 'Registered', 'Checked in', ''].map(h => (
                    <th key={h} className="px-5 py-3 font-mono text-[10px] tracking-[0.12em] uppercase font-semibold whitespace-nowrap" style={{ color: '#6B7A72' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((reg, i) => (
                  <tr key={reg.id} style={{ background: i % 2 === 0 ? 'white' : '#FAF6EE', borderBottom: '1px solid #F0EBE3' }}>
                    <td className="px-5 py-3.5">
                      <Link href={`/events/${eventId}/registrations/${reg.id}`}
                        className="font-medium text-[14px] hover:underline block" style={{ color: '#0F1F18', textDecoration: 'none' }}>
                        {reg.attendee_name}
                      </Link>
                      <div className="text-[12px]" style={{ color: '#6B7A72' }}>{reg.attendee_email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px]" style={{ color: '#3A4A42' }}>
                      {reg.ticket_types?.name ?? 'General'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[13px]" style={{ color: '#1F4D3A' }}>
                      {formatCurrency(reg.amount_paid, reg.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill status={reg.status} />
                    </td>
                    <td className="px-5 py-3.5">
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
                    <td className="px-5 py-3.5 font-mono text-[12px]" style={{ color: '#6B7A72' }}>
                      {new Date(reg.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[12px]" style={{ color: reg.checked_in_at ? '#1F4D3A' : '#C9C3B1' }}>
                      {reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleTimeString() : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <RowActionsMenu
                        reg={reg}
                        eventId={eventId}
                        onStatusChange={handleStatusChange}
                        onDeleted={handleDeleted}
                      />
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
            className="px-6 py-2.5 rounded-xl text-[13px] font-medium"
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
