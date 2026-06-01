'use client';

import { useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Tag, Users } from 'lucide-react';
import type { Database } from '@/types/database';

type TicketRow = Database['public']['Tables']['ticket_types']['Row'];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR', 'UGX', 'TZS'];

interface FormState {
  name: string;
  description: string;
  isFree: boolean;
  price: string;
  currency: string;
  isLimited: boolean;
  quantity: string;
  hasSalesWindow: boolean;
  sales_start: string;
  sales_end: string;
  min_per_order: string;
  max_per_order: string;
  is_visible: boolean;
}

function blankForm(): FormState {
  return {
    name: '', description: '', isFree: true, price: '', currency: 'USD',
    isLimited: false, quantity: '',
    hasSalesWindow: false, sales_start: '', sales_end: '',
    min_per_order: '1', max_per_order: '10', is_visible: true,
  };
}

function rowToForm(t: TicketRow): FormState {
  return {
    name: t.name,
    description: t.description ?? '',
    isFree: t.price === 0,
    price: t.price === 0 ? '' : String(t.price),
    currency: t.currency,
    isLimited: t.quantity !== null,
    quantity: t.quantity !== null ? String(t.quantity) : '',
    hasSalesWindow: !!(t.sales_start || t.sales_end),
    sales_start: t.sales_start ? t.sales_start.slice(0, 16) : '',
    sales_end: t.sales_end ? t.sales_end.slice(0, 16) : '',
    min_per_order: String(t.min_per_order),
    max_per_order: String(t.max_per_order),
    is_visible: t.is_visible,
  };
}

function formToBody(f: FormState) {
  return {
    name: f.name.trim(),
    description: f.description.trim() || null,
    price: f.isFree ? 0 : parseFloat(f.price) || 0,
    currency: f.currency,
    quantity: f.isLimited && f.quantity ? parseInt(f.quantity) : null,
    sales_start: f.hasSalesWindow && f.sales_start ? new Date(f.sales_start).toISOString() : null,
    sales_end: f.hasSalesWindow && f.sales_end ? new Date(f.sales_end).toISOString() : null,
    min_per_order: parseInt(f.min_per_order) || 1,
    max_per_order: parseInt(f.max_per_order) || 10,
    is_visible: f.is_visible,
  };
}

interface Props {
  eventId: string;
  initialTickets: TicketRow[];
}

type PanelState = 'closed' | 'new' | { editing: string };

export function TicketTypesManager({ eventId, initialTickets }: Props) {
  const [tickets, setTickets] = useState<TicketRow[]>(initialTickets);
  const [panel, setPanel] = useState<PanelState>('closed');
  const [form, setForm] = useState<FormState>(blankForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openNew = () => { setForm(blankForm()); setError(''); setPanel('new'); };
  const openEdit = (t: TicketRow) => { setForm(rowToForm(t)); setError(''); setPanel({ editing: t.id }); };
  const closePanel = () => { setPanel('closed'); setError(''); };

  const isEditing = typeof panel === 'object' && 'editing' in panel;
  const editingId = isEditing ? (panel as { editing: string }).editing : null;

  const setF = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  async function handleSave() {
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.isFree && (!form.price || parseFloat(form.price) <= 0)) {
      setError('Enter a price greater than 0'); return;
    }
    setSaving(true); setError('');
    try {
      if (isEditing && editingId) {
        const res = await fetch(`/api/events/${eventId}/tickets`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: editingId, ...formToBody(form) }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Save failed');
        setTickets(prev => prev.map(t => t.id === editingId ? data.ticket : t));
      } else {
        const res = await fetch(`/api/events/${eventId}/tickets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formToBody(form), position: tickets.length }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Save failed');
        setTickets(prev => [...prev, data.ticket]);
      }
      closePanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/tickets?ticketId=${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setTickets(prev => prev.filter(t => t.id !== id));
      setConfirmDelete(null);
      if (editingId === id) closePanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggleVisibility(t: TicketRow) {
    const res = await fetch(`/api/events/${eventId}/tickets`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticketId: t.id, is_visible: !t.is_visible }),
    });
    if (res.ok) {
      const data = await res.json();
      setTickets(prev => prev.map(x => x.id === t.id ? data.ticket : x));
    }
  }

  async function handleMove(idx: number, dir: -1 | 1) {
    const next = [...tickets];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setTickets(next);
    // Persist positions
    await Promise.all([
      fetch(`/api/events/${eventId}/tickets`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: next[idx].id, position: idx }),
      }),
      fetch(`/api/events/${eventId}/tickets`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: next[swapIdx].id, position: swapIdx }),
      }),
    ]);
  }

  const soldOut = (t: TicketRow) => t.quantity !== null && t.quantity_sold >= t.quantity;
  const remaining = (t: TicketRow) => t.quantity !== null ? t.quantity - t.quantity_sold : null;

  return (
    <div>

      {/* ── Ticket list ──────────────────────────────────────────── */}
      {tickets.length === 0 && panel === 'closed' ? (
        <div
          className="rounded-2xl flex flex-col items-center justify-center py-16 text-center mb-6"
          style={{ background: 'white', border: '2px dashed #E5E0D4' }}
        >
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(31,77,58,0.08)' }}
          >
            <Tag size={20} strokeWidth={1.8} style={{ color: '#1F4D3A' }} />
          </div>
          <div className="font-display font-semibold text-[17px] mb-1" style={{ color: '#0F1F18' }}>
            No ticket types yet
          </div>
          <div className="text-[14px] mb-6 max-w-[320px]" style={{ color: '#6B7A72' }}>
            Add at least one ticket type before publishing your event. Free tickets need no payment setup.
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl text-white text-[14px] font-semibold transition hover:opacity-90"
            style={{ background: '#1F4D3A' }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Add ticket type
          </button>
        </div>
      ) : (
        <div className="space-y-3 mb-4">
          {tickets.map((t, idx) => (
            <TicketCard
              key={t.id}
              ticket={t}
              idx={idx}
              total={tickets.length}
              isEditing={editingId === t.id}
              soldOut={soldOut(t)}
              remaining={remaining(t)}
              onEdit={() => openEdit(t)}
              onDelete={() => setConfirmDelete(t.id)}
              onToggleVisibility={() => handleToggleVisibility(t)}
              onMove={dir => handleMove(idx, dir)}
            />
          ))}
        </div>
      )}

      {/* ── Add / Edit panel ─────────────────────────────────────── */}
      {panel !== 'closed' && (
        <div
          className="rounded-2xl mb-4"
          style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid #E5E0D4' }}
          >
            <h3 className="font-display font-semibold text-[16px]" style={{ color: '#0F1F18' }}>
              {isEditing ? 'Edit ticket type' : 'New ticket type'}
            </h3>
            <button
              onClick={closePanel}
              className="text-[13px] font-medium transition hover:text-[#1F4D3A]"
              style={{ color: '#6B7A72' }}
            >
              Cancel
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Name */}
            <FField label="Name *">
              <input
                value={form.name}
                onChange={e => setF('name', e.target.value)}
                placeholder="General Admission"
                autoFocus
                className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
              />
            </FField>

            {/* Description */}
            <FField label="Description">
              <input
                value={form.description}
                onChange={e => setF('description', e.target.value)}
                placeholder="Includes access to all sessions"
                className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
              />
            </FField>

            {/* Free / Paid */}
            <FField label="Pricing">
              <div className="flex gap-2">
                {(['Free', 'Paid'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setF('isFree', opt === 'Free')}
                    className="flex-1 h-10 rounded-lg text-[14px] font-medium transition"
                    style={{
                      background: (opt === 'Free') === form.isFree ? '#1F4D3A' : 'white',
                      color: (opt === 'Free') === form.isFree ? 'white' : '#3A4A42',
                      border: `1px solid ${(opt === 'Free') === form.isFree ? '#1F4D3A' : '#E5E0D4'}`,
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </FField>

            {/* Price + Currency */}
            {!form.isFree && (
              <div className="grid grid-cols-2 gap-3">
                <FField label="Price *">
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setF('price', e.target.value)}
                    placeholder="25.00"
                    min={0.01}
                    step={0.01}
                    className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                    style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                    onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                    onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                  />
                </FField>
                <FField label="Currency">
                  <select
                    value={form.currency}
                    onChange={e => setF('currency', e.target.value)}
                    className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                    style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FField>
              </div>
            )}

            {/* Quantity */}
            <FField label="Quantity">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setF('isLimited', false)}
                  className="flex-1 h-10 rounded-lg text-[14px] font-medium transition"
                  style={{
                    background: !form.isLimited ? '#1F4D3A' : 'white',
                    color: !form.isLimited ? 'white' : '#3A4A42',
                    border: `1px solid ${!form.isLimited ? '#1F4D3A' : '#E5E0D4'}`,
                  }}
                >
                  Unlimited
                </button>
                <button
                  onClick={() => setF('isLimited', true)}
                  className="flex-1 h-10 rounded-lg text-[14px] font-medium transition"
                  style={{
                    background: form.isLimited ? '#1F4D3A' : 'white',
                    color: form.isLimited ? 'white' : '#3A4A42',
                    border: `1px solid ${form.isLimited ? '#1F4D3A' : '#E5E0D4'}`,
                  }}
                >
                  Limited
                </button>
              </div>
              {form.isLimited && (
                <input
                  type="number"
                  value={form.quantity}
                  onChange={e => setF('quantity', e.target.value)}
                  placeholder="e.g. 200"
                  min={1}
                  className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                  style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              )}
            </FField>

            {/* Per-order limits */}
            <div className="grid grid-cols-2 gap-3">
              <FField label="Min per order">
                <input
                  type="number"
                  value={form.min_per_order}
                  onChange={e => setF('min_per_order', e.target.value)}
                  min={1}
                  className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                  style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </FField>
              <FField label="Max per order">
                <input
                  type="number"
                  value={form.max_per_order}
                  onChange={e => setF('max_per_order', e.target.value)}
                  min={1}
                  className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                  style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                  onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                  onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                />
              </FField>
            </div>

            {/* Sales window toggle */}
            <div>
              <button
                type="button"
                onClick={() => setF('hasSalesWindow', !form.hasSalesWindow)}
                className="flex items-center gap-2 text-[13px] font-medium transition"
                style={{ color: form.hasSalesWindow ? '#1F4D3A' : '#6B7A72' }}
              >
                <div
                  className="w-8 h-4 rounded-full transition-all relative"
                  style={{ background: form.hasSalesWindow ? '#1F4D3A' : '#E5E0D4' }}
                >
                  <div
                    className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
                    style={{ left: form.hasSalesWindow ? 18 : 2, boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                  />
                </div>
                Set sales window (optional)
              </button>

              {form.hasSalesWindow && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <FField label="Sales start">
                    <input
                      type="datetime-local"
                      value={form.sales_start}
                      onChange={e => setF('sales_start', e.target.value)}
                      className="w-full h-10 px-3 rounded-lg text-[13px] outline-none transition"
                      style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                      onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                      onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                    />
                  </FField>
                  <FField label="Sales end">
                    <input
                      type="datetime-local"
                      value={form.sales_end}
                      onChange={e => setF('sales_end', e.target.value)}
                      className="w-full h-10 px-3 rounded-lg text-[13px] outline-none transition"
                      style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                      onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                      onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                    />
                  </FField>
                </div>
              )}
            </div>

            {/* Visibility */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>Visible to attendees</div>
                <div className="text-[12px]" style={{ color: '#6B7A72' }}>Hidden tickets can be shared via direct link only.</div>
              </div>
              <button
                type="button"
                onClick={() => setF('is_visible', !form.is_visible)}
                className="w-10 h-5 rounded-full transition-all relative shrink-0"
                style={{ background: form.is_visible ? '#1F4D3A' : '#E5E0D4' }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: form.is_visible ? 22 : 2, boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                />
              </button>
            </div>

            {/* Error + actions */}
            {error && <p className="text-[13px]" style={{ color: '#B8423C' }}>{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={closePanel}
                className="h-9 px-4 text-[13px] font-medium rounded-lg border transition hover:border-[#3A4A42]"
                style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="h-9 px-5 text-white text-[13px] font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-60"
                style={{ background: '#1F4D3A' }}
              >
                {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add ticket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add button (when list exists) ────────────────────────── */}
      {tickets.length > 0 && panel === 'closed' && (
        <button
          onClick={openNew}
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-[14px] font-medium border transition hover:border-[#1F4D3A] hover:text-[#1F4D3A]"
          style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: 'white' }}
        >
          <Plus size={14} strokeWidth={2.5} />
          Add ticket type
        </button>
      )}

      {/* ── Delete confirm ───────────────────────────────────────── */}
      {confirmDelete && (() => {
        const target = tickets.find(t => t.id === confirmDelete);
        const hasSales = (target?.quantity_sold ?? 0) > 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmDelete(null)} />
            <div
              className="relative w-full max-w-[400px] rounded-2xl p-6"
              style={{ background: 'white', border: '1px solid #E5E0D4' }}
            >
              <h3 className="font-display font-semibold text-[18px] mb-2" style={{ color: '#0F1F18' }}>
                Delete &ldquo;{target?.name}&rdquo;?
              </h3>
              {hasSales ? (
                <p className="text-[14px] mb-5" style={{ color: '#C97A2D' }}>
                  This ticket has <strong>{target?.quantity_sold}</strong> sale{target?.quantity_sold !== 1 ? 's' : ''}. Deleting it will not refund or cancel those registrations.
                </p>
              ) : (
                <p className="text-[14px] mb-5" style={{ color: '#6B7A72' }}>
                  This cannot be undone.
                </p>
              )}
              {error && <p className="text-[13px] mb-3" style={{ color: '#B8423C' }}>{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => { setConfirmDelete(null); setError(''); }}
                  className="flex-1 h-10 rounded-xl text-[14px] font-medium border transition"
                  style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  disabled={deleting}
                  className="flex-1 h-10 rounded-xl text-white text-[14px] font-semibold transition hover:opacity-90 disabled:opacity-60"
                  style={{ background: '#B8423C' }}
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

/* ── Ticket card ── */
function TicketCard({
  ticket, idx, total, isEditing, soldOut, remaining,
  onEdit, onDelete, onToggleVisibility, onMove,
}: {
  ticket: TicketRow;
  idx: number;
  total: number;
  isEditing: boolean;
  soldOut: boolean;
  remaining: number | null;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisibility: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const isFree = ticket.price === 0;

  return (
    <div
      className="rounded-xl transition"
      style={{
        background: 'white',
        border: `1px solid ${isEditing ? '#1F4D3A' : '#E5E0D4'}`,
        boxShadow: isEditing ? '0 0 0 3px rgba(31,77,58,0.12)' : '0 1px 2px rgba(15,31,24,0.04)',
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">

        {/* Reorder arrows */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            onClick={() => onMove(-1)}
            disabled={idx === 0}
            className="h-5 w-5 rounded flex items-center justify-center transition disabled:opacity-20"
            style={{ color: '#6B7A72' }}
          >
            <ChevronUp size={13} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={idx === total - 1}
            className="h-5 w-5 rounded flex items-center justify-center transition disabled:opacity-20"
            style={{ color: '#6B7A72' }}
          >
            <ChevronDown size={13} strokeWidth={2.5} />
          </button>
        </div>

        {/* Name + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-medium text-[14px]"
              style={{ color: ticket.is_visible ? '#0F1F18' : '#6B7A72' }}
            >
              {ticket.name}
            </span>
            {!ticket.is_visible && (
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: '#F5F5F4', color: '#6B7A72' }}
              >
                HIDDEN
              </span>
            )}
            {soldOut && (
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(184,66,60,0.1)', color: '#B8423C' }}
              >
                SOLD OUT
              </span>
            )}
          </div>
          {ticket.description && (
            <div className="text-[12px] mt-0.5 truncate" style={{ color: '#6B7A72' }}>
              {ticket.description}
            </div>
          )}
        </div>

        {/* Quantity */}
        <div className="text-right shrink-0">
          <div
            className="flex items-center gap-1 text-[12px]"
            style={{ color: '#6B7A72', fontFamily: 'JetBrains Mono, monospace' }}
          >
            <Users size={11} strokeWidth={2} />
            {ticket.quantity === null
              ? <span title="Unlimited">∞</span>
              : <span style={{ color: soldOut ? '#B8423C' : remaining !== null && remaining <= 10 ? '#C97A2D' : '#3A4A42' }}>
                  {ticket.quantity_sold} / {ticket.quantity}
                </span>
            }
          </div>
        </div>

        {/* Price */}
        <div
          className="shrink-0 text-[14px] font-medium min-w-[48px] text-right"
          style={{ fontFamily: 'JetBrains Mono, monospace', color: isFree ? '#2D7A4F' : '#1F4D3A' }}
        >
          {isFree ? 'Free' : `${ticket.currency} ${ticket.price}`}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
          <button
            onClick={onToggleVisibility}
            title={ticket.is_visible ? 'Hide' : 'Show'}
            className="h-8 w-8 rounded-lg flex items-center justify-center transition"
            style={{ color: '#6B7A72' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F5F5F4')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {ticket.is_visible
              ? <Eye size={15} strokeWidth={2} />
              : <EyeOff size={15} strokeWidth={2} />
            }
          </button>
          <button
            onClick={onEdit}
            title="Edit"
            className="h-8 w-8 rounded-lg flex items-center justify-center transition"
            style={{ color: '#6B7A72' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F5F5F4')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <Pencil size={14} strokeWidth={2} />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="h-8 w-8 rounded-lg flex items-center justify-center transition"
            style={{ color: '#6B7A72' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,66,60,0.08)'; e.currentTarget.style.color = '#B8423C'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7A72'; }}
          >
            <Trash2 size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}

function FField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>{label}</label>
      {children}
    </div>
  );
}
