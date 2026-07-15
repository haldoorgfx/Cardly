'use client';

import { useState, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, ChevronUp, ChevronDown,
  AlignLeft, AlignJustify, List, CheckSquare, CircleDot, Phone, Link as LinkIcon,
  GripVertical, Calendar, Hash, Heading,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import type { Database } from '@/types/database';

type FieldRow = Database['public']['Tables']['registration_form_fields']['Row'];
type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'phone' | 'url' | 'date' | 'number' | 'section';

const FIELD_TYPES: { value: FieldType; label: string; icon: React.ReactNode; hint: string }[] = [
  { value: 'text',     label: 'Short text',  icon: <AlignLeft size={15} strokeWidth={1.8} />,     hint: 'Single-line answer' },
  { value: 'textarea', label: 'Long text',   icon: <AlignJustify size={15} strokeWidth={1.8} />,  hint: 'Multi-line answer' },
  { value: 'select',   label: 'Dropdown',    icon: <List size={15} strokeWidth={1.8} />,           hint: 'Single choice from a list' },
  { value: 'radio',    label: 'Radio',       icon: <CircleDot size={15} strokeWidth={1.8} />,      hint: 'Single choice, always visible' },
  { value: 'checkbox', label: 'Checkbox',    icon: <CheckSquare size={15} strokeWidth={1.8} />,    hint: 'One or more choices' },
  { value: 'phone',    label: 'Phone',       icon: <Phone size={15} strokeWidth={1.8} />,          hint: 'Phone number with validation' },
  { value: 'url',      label: 'URL',         icon: <LinkIcon size={15} strokeWidth={1.8} />,       hint: 'Website or social link' },
  { value: 'date',     label: 'Date',        icon: <Calendar size={15} strokeWidth={1.8} />,       hint: 'Date picker' },
  { value: 'number',   label: 'Number',      icon: <Hash size={15} strokeWidth={1.8} />,           hint: 'Numeric answer' },
  { value: 'section',   label: 'Section',     icon: <Heading size={15} strokeWidth={1.8} />,        hint: 'Heading / divider (no input)' },
];

const HAS_OPTIONS: FieldType[] = ['select', 'radio', 'checkbox'];

interface FormState {
  label: string;
  field_type: FieldType;
  is_required: boolean;
  options: string[];
}

function blankForm(): FormState {
  return { label: '', field_type: 'text', is_required: false, options: [''] };
}

function rowToForm(r: FieldRow): FormState {
  return {
    label: r.label,
    field_type: r.field_type as FieldType,
    is_required: r.is_required,
    options: Array.isArray(r.options) && r.options.length > 0
      ? (r.options as string[])
      : [''],
  };
}

function formToBody(f: FormState, position: number) {
  return {
    label: f.label.trim(),
    field_type: f.field_type,
    is_required: f.is_required,
    options: HAS_OPTIONS.includes(f.field_type) ? f.options.filter(o => o.trim()) : null,
    position,
  };
}

type PanelState = 'closed' | 'new' | { editing: string };

interface Props {
  eventId: string;
  initialFields: FieldRow[];
}

export function RegistrationFormBuilder({ eventId, initialFields }: Props) {
  const [fields, setFields] = useState<FieldRow[]>(initialFields);
  const [panel, setPanel] = useState<PanelState>('closed');
  const [form, setForm] = useState<FormState>(blankForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const isEditing = typeof panel === 'object';
  const editingId = isEditing ? (panel as { editing: string }).editing : null;

  const openNew = () => { setForm(blankForm()); setError(''); setPanel('new'); };
  const openEdit = (r: FieldRow) => { setForm(rowToForm(r)); setError(''); setPanel({ editing: r.id }); };
  const closePanel = () => { setPanel('closed'); setError(''); };

  const setF = useCallback(<K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: val }));
  }, []);

  async function handleSave() {
    if (!form.label.trim()) { setError('Label is required'); return; }
    if (HAS_OPTIONS.includes(form.field_type) && !form.options.some(o => o.trim())) {
      setError('Add at least one option'); return;
    }
    setSaving(true); setError('');
    try {
      if (isEditing && editingId) {
        const res = await fetch(`/api/events/${eventId}/form`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fieldId: editingId, ...formToBody(form, fields.findIndex(f => f.id === editingId)) }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Save failed');
        setFields(prev => prev.map(f => f.id === editingId ? data.field : f));
      } else {
        const res = await fetch(`/api/events/${eventId}/form`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formToBody(form, fields.length)),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Save failed');
        setFields(prev => [...prev, data.field]);
      }
      closePanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/events/${eventId}/form?fieldId=${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setFields(prev => prev.filter(f => f.id !== id));
      setConfirmDelete(null);
      if (editingId === id) closePanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  async function handleMove(idx: number, dir: -1 | 1) {
    const prev = [...fields];
    const next = [...fields];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setFields(next);
    try {
      const results = await Promise.all([
        fetch(`/api/events/${eventId}/form`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fieldId: next[idx].id, position: idx }),
        }),
        fetch(`/api/events/${eventId}/form`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fieldId: next[swapIdx].id, position: swapIdx }),
        }),
      ]);
      if (results.some(r => !r.ok)) throw new Error('Reorder failed');
    } catch {
      setFields(prev);
      setError('Failed to save new order. Please try again.');
    }
  }

  const typeInfo = (t: string) => FIELD_TYPES.find(f => f.value === t);

  return (
    <div>
      {/* ── Built-in fields notice ─────────────────────────────── */}
      <div
        className="rounded-xl px-4 py-3 flex items-start gap-3 mb-5"
        style={{ background: 'rgba(31,77,58,0.06)', border: '1px solid rgba(31,77,58,0.12)' }}
      >
        <div className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full mt-2" style={{ background: '#1F4D3A' }} />
        <p className="text-[13px]" style={{ color: '#3A4A42', lineHeight: 1.5 }}>
          <strong>Name</strong> and <strong>Email</strong> are always collected. Add custom fields below for anything extra — company, dietary needs, city, etc.
        </p>
      </div>

      {/* ── Built-in field chips ───────────────────────────────── */}
      <div className="flex gap-2 mb-5">
        {[{ label: 'Full name', required: true }, { label: 'Email', required: true }].map(f => (
          <div
            key={f.label}
            className="flex items-center gap-2 h-9 px-3.5 rounded-xl text-[13px]"
            style={{ background: 'white', border: '1px solid #E5E0D4', color: '#6B7A72' }}
          >
            <AlignLeft size={13} strokeWidth={2} />
            {f.label}
            <span
              className="text-[12px] px-1.5 py-0.5 rounded"
              style={{ background: '#F5F5F4', color: '#6B7A72' }}
            >
              required
            </span>
          </div>
        ))}
      </div>

      {/* ── Custom fields list ────────────────────────────────── */}
      {fields.length > 0 && (
        <div className="space-y-2 mb-4">
          {fields.map((f, idx) => {
            const info = typeInfo(f.field_type);
            const opts = Array.isArray(f.options) ? f.options as string[] : [];
            return (
              <div
                key={f.id}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition"
                style={{
                  background: 'white',
                  border: `1px solid ${editingId === f.id ? '#1F4D3A' : '#E5E0D4'}`,
                  boxShadow: editingId === f.id ? '0 0 0 3px rgba(31,77,58,0.12)' : '0 1px 2px rgba(15,31,24,0.04)',
                }}
              >
                {/* Reorder */}
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button onClick={() => handleMove(idx, -1)} disabled={idx === 0}
                    className="h-5 w-5 rounded flex items-center justify-center disabled:opacity-20"
                    style={{ color: '#6B7A72' }}>
                    <ChevronUp size={13} strokeWidth={2.5} />
                  </button>
                  <button onClick={() => handleMove(idx, 1)} disabled={idx === fields.length - 1}
                    className="h-5 w-5 rounded flex items-center justify-center disabled:opacity-20"
                    style={{ color: '#6B7A72' }}>
                    <ChevronDown size={13} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Type icon */}
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(31,77,58,0.08)', color: '#1F4D3A' }}
                >
                  {info?.icon}
                </div>

                {/* Label + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>{f.label}</span>
                    <span className="text-[12.5px]" style={{ color: '#6B7A72' }}>{info?.label}</span>
                    {f.is_required && (
                      <span
                        className="text-[12px] px-1.5 py-0.5 rounded"
                        style={{ background: '#F5F5F4', color: '#6B7A72' }}
                      >
                        required
                      </span>
                    )}
                  </div>
                  {opts.length > 0 && (
                    <div className="text-[12px] mt-0.5 truncate" style={{ color: '#6B7A72' }}>
                      {opts.join(' · ')}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(f)} title="Edit"
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition"
                    style={{ color: '#6B7A72' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F5F5F4')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <Pencil size={14} strokeWidth={2} />
                  </button>
                  <button onClick={() => setConfirmDelete(f.id)} title="Delete"
                    className="h-8 w-8 rounded-lg flex items-center justify-center transition"
                    style={{ color: '#6B7A72' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,66,60,0.08)'; e.currentTarget.style.color = '#B8423C'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7A72'; }}>
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit field modal ────────────────────────────── */}
      <Modal
        open={panel !== 'closed'}
        onClose={closePanel}
        title={isEditing ? 'Edit field' : 'New field'}
        footer={
          <>
            <button onClick={closePanel} className="h-10 px-4 text-[13px] font-medium rounded-lg border transition" style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="h-10 px-5 text-white text-[13px] font-semibold rounded-lg transition hover:opacity-90 disabled:opacity-60" style={{ background: '#1F4D3A' }}>
              {saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add field'}
            </button>
          </>
        }
      >
          <div className="space-y-5">
            {/* Field type selector */}
            <div>
              <label className="block text-[12px] font-medium mb-2" style={{ color: '#3A4A42' }}>Field type</label>
              <div className="grid grid-cols-2 gap-2">
                {FIELD_TYPES.map(ft => (
                  <button
                    key={ft.value}
                    onClick={() => setF('field_type', ft.value)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition"
                    style={{
                      border: `1px solid ${form.field_type === ft.value ? '#1F4D3A' : '#E5E0D4'}`,
                      background: form.field_type === ft.value ? 'rgba(31,77,58,0.05)' : 'white',
                    }}
                  >
                    <span style={{ color: form.field_type === ft.value ? '#1F4D3A' : '#6B7A72' }}>{ft.icon}</span>
                    <div>
                      <div className="text-[13px] font-medium" style={{ color: form.field_type === ft.value ? '#0F1F18' : '#3A4A42' }}>
                        {ft.label}
                      </div>
                      <div className="text-[12.5px]" style={{ color: '#6B7A72' }}>{ft.hint}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Label */}
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>Label *</label>
              <input
                value={form.label}
                onChange={e => setF('label', e.target.value)}
                placeholder={
                  form.field_type === 'phone' ? 'Phone number' :
                  form.field_type === 'url' ? 'LinkedIn profile URL' :
                  form.field_type === 'select' ? 'Job title' :
                  form.field_type === 'checkbox' ? 'Dietary requirements' :
                  'Company / organisation'
                }
                autoFocus
                className="w-full h-10 px-3 rounded-lg text-[14px] outline-none transition"
                style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
              />
            </div>

            {/* Options (for select / radio / checkbox) */}
            {HAS_OPTIONS.includes(form.field_type) && (
              <div>
                <label className="block text-[12px] font-medium mb-2" style={{ color: '#3A4A42' }}>Options *</label>
                <div className="space-y-2">
                  {form.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <GripVertical size={14} strokeWidth={2} style={{ color: '#C9C3B1', flexShrink: 0 }} />
                      <input
                        value={opt}
                        onChange={e => {
                          const next = [...form.options];
                          next[i] = e.target.value;
                          setF('options', next);
                        }}
                        placeholder={`Option ${i + 1}`}
                        className="flex-1 h-9 px-3 rounded-lg text-[13px] outline-none transition"
                        style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                        onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                        onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const next = [...form.options];
                            next.splice(i + 1, 0, '');
                            setF('options', next);
                            setTimeout(() => {
                              const inputs = document.querySelectorAll<HTMLInputElement>('[data-option-input]');
                              inputs[i + 1]?.focus();
                            }, 0);
                          }
                        }}
                        data-option-input=""
                      />
                      {form.options.length > 1 && (
                        <button
                          onClick={() => setF('options', form.options.filter((_, j) => j !== i))}
                          className="h-9 w-9 rounded-lg flex items-center justify-center transition shrink-0"
                          style={{ color: '#6B7A72' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,66,60,0.08)'; e.currentTarget.style.color = '#B8423C'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6B7A72'; }}
                        >
                          <Trash2 size={13} strokeWidth={2} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => setF('options', [...form.options, ''])}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-[13px] font-medium transition"
                    style={{ color: '#1F4D3A', border: '1px dashed rgba(31,77,58,0.3)' }}
                  >
                    <Plus size={12} strokeWidth={2.5} /> Add option
                  </button>
                </div>
              </div>
            )}

            {/* Required toggle */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <div className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>Required</div>
                <div className="text-[12px]" style={{ color: '#6B7A72' }}>Attendee must answer this field.</div>
              </div>
              <button
                type="button"
                onClick={() => setF('is_required', !form.is_required)}
                className="w-10 h-5 rounded-full transition-all relative shrink-0"
                style={{ background: form.is_required ? '#1F4D3A' : '#E5E0D4' }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: form.is_required ? 22 : 2, boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
                />
              </button>
            </div>

            {/* Error */}
            {error && <p className="text-[13px]" style={{ color: '#B8423C' }}>{error}</p>}
          </div>
      </Modal>

      {/* ── Add button ────────────────────────────────────────── */}
      {panel === 'closed' && (
        <button
          onClick={openNew}
          className="flex items-center gap-2 h-10 px-4 rounded-xl text-[14px] font-medium border transition hover:border-[#1F4D3A] hover:text-[#1F4D3A]"
          style={{ borderColor: '#E5E0D4', color: '#3A4A42', background: 'white' }}
        >
          <Plus size={14} strokeWidth={2.5} />
          Add custom field
        </button>
      )}

      {/* ── Delete confirm ────────────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirmDelete(null)} />
          <div
            className="relative w-full max-w-[380px] rounded-2xl p-6"
            style={{ background: 'white', border: '1px solid #E5E0D4' }}
          >
            <h3 className="font-display font-semibold text-[18px] mb-2" style={{ color: '#0F1F18' }}>
              Remove this field?
            </h3>
            <p className="text-[14px] mb-5" style={{ color: '#6B7A72' }}>
              Existing registrations that already answered this field will keep their data — it just won&apos;t show in new forms.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 h-10 rounded-xl text-[14px] font-medium border transition"
                style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 h-10 rounded-xl text-white text-[14px] font-semibold transition hover:opacity-90"
                style={{ background: '#B8423C' }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
