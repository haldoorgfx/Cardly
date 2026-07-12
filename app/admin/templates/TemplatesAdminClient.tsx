/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, Loader2, AlertTriangle, X } from 'lucide-react';
import type { Database } from '@/types/database';

type Template = Database['public']['Tables']['templates']['Row'];
type MinPlan = 'free' | 'pro' | 'studio';

const MIN_PLAN_STYLES: Record<MinPlan, { bg: string; color: string }> = {
  free:   { bg: '#F5F5F4',               color: '#6B7A72' },
  pro:    { bg: 'rgba(232,197,126,0.15)', color: '#C9A45E' },
  studio: { bg: 'rgba(31,77,58,0.12)',   color: '#1F4D3A' },
};

interface FormState {
  name: string;
  category: string;
  thumbnail_url: string;
  background_url: string;
  min_plan: MinPlan;
  featured: boolean;
  published: boolean;
}

const BLANK_FORM: FormState = {
  name: '',
  category: '',
  thumbnail_url: '',
  background_url: '',
  min_plan: 'free',
  featured: false,
  published: false,
};

// ── Template form modal ───────────────────────────────────────────────────────

function TemplateModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: FormState;
  onSave: (form: FormState) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = (k: keyof FormState, v: FormState[keyof FormState]) =>
    setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl border border-[#E5E0D4] w-full max-w-[520px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E0D4] sticky top-0 bg-white z-10">
          <h2 className="font-display font-semibold text-[17px] text-[#0F1F18]">
            {initial.name ? 'Edit template' : 'New template'}
          </h2>
          <button onClick={onClose} className="h-8 w-8 rounded-lg grid place-items-center hover:bg-[#F5F5F4] transition-colors">
            <X size={15} strokeWidth={2} className="text-[#6B7A72]" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="text-[12px] font-medium text-[#3A4A42] mb-1.5 block">Name *</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="E.g. Conference Card"
              className="w-full border border-[#E5E0D4] rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 text-[#0F1F18]"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-[12px] font-medium text-[#3A4A42] mb-1.5 block">Category</label>
            <input
              value={form.category}
              onChange={e => set('category', e.target.value)}
              placeholder="E.g. conference, wedding, corporate"
              className="w-full border border-[#E5E0D4] rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 text-[#0F1F18]"
            />
          </div>

          {/* Thumbnail URL */}
          <div>
            <label className="text-[12px] font-medium text-[#3A4A42] mb-1.5 block">Thumbnail URL</label>
            <input
              value={form.thumbnail_url}
              onChange={e => set('thumbnail_url', e.target.value)}
              placeholder="https://… (from Supabase templates bucket)"
              className="w-full border border-[#E5E0D4] rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 text-[#0F1F18]"
            />
            <p className="text-[11px] text-[#6B7A72] mt-1">Upload to the &ldquo;templates&rdquo; Supabase storage bucket, paste the public URL here.</p>
          </div>

          {/* Background URL */}
          <div>
            <label className="text-[12px] font-medium text-[#3A4A42] mb-1.5 block">Background image URL</label>
            <input
              value={form.background_url}
              onChange={e => set('background_url', e.target.value)}
              placeholder="https://… (full-res background for editor)"
              className="w-full border border-[#E5E0D4] rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 text-[#0F1F18]"
            />
          </div>

          {/* Min plan */}
          <div>
            <label className="text-[12px] font-medium text-[#3A4A42] mb-1.5 block">Minimum plan</label>
            <select
              value={form.min_plan}
              onChange={e => set('min_plan', e.target.value as MinPlan)}
              className="w-full border border-[#E5E0D4] rounded-lg px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#1F4D3A]/20 bg-white text-[#0F1F18]"
            >
              <option value="free">Free — available to everyone</option>
              <option value="pro">Pro — requires Pro plan</option>
              <option value="studio">Studio — requires Studio plan</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => set('published', !form.published)}
                className={`w-9 h-5 rounded-full transition-colors relative ${form.published ? 'bg-[#1F4D3A]' : 'bg-[#E5E0D4]'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.published ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-[13px] text-[#3A4A42]">Published</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => set('featured', !form.featured)}
                className={`w-9 h-5 rounded-full transition-colors relative ${form.featured ? 'bg-[#E8C57E]' : 'bg-[#E5E0D4]'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.featured ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-[13px] text-[#3A4A42]">Featured</span>
            </label>
          </div>
        </div>

        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] text-[#6B7A72] border border-[#E5E0D4] hover:bg-[#FAF6EE] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving || !form.name.trim()}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-white transition hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            style={{ background: '#1F4D3A' }}
          >
            {saving && <Loader2 size={12} strokeWidth={2} className="animate-spin" />}
            {initial.name ? 'Save changes' : 'Create template'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function TemplatesAdminClient({ initialTemplates }: { initialTemplates: Template[] }) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<Template | null>(null);
  const [saving, setSaving]       = useState(false);
  const [busy, setBusy]           = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Template | null>(null);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState<null | 'delete' | 'publish' | 'unpublish'>(null);

  const allSelected = templates.length > 0 && templates.every(t => selected.has(t.id));
  const clearSelection = () => setSelected(new Set());
  const toggleOne = (id: string) =>
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(templates.map(t => t.id)));

  // Bulk runner — loops the existing per-template endpoints so their permission
  // checks + audit logging apply to every affected row. Rows update as the batch
  // resolves; failures are left untouched.
  const runBulk = async (action: 'delete' | 'publish' | 'unpublish') => {
    setBulkConfirm(null);
    setBulkBusy(true);
    const ids = Array.from(selected);
    try {
      const results = await Promise.allSettled(
        ids.map(id =>
          action === 'delete'
            ? fetch(`/api/admin/templates/${id}`, { method: 'DELETE' })
            : fetch(`/api/admin/templates/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ published: action === 'publish' }),
              }),
        ),
      );
      const okIds = ids.filter(
        (_, i) => results[i].status === 'fulfilled' &&
          (results[i] as PromiseFulfilledResult<Response>).value.ok,
      );
      setTemplates(prev =>
        action === 'delete'
          ? prev.filter(t => !okIds.includes(t.id))
          : prev.map(t =>
              okIds.includes(t.id) ? { ...t, published: action === 'publish' } : t,
            ),
      );
      clearSelection();
    } finally {
      setBulkBusy(false);
    }
  };

  const openNew  = () => { setEditing(null); setShowForm(true); };
  const openEdit = (t: Template) => { setEditing(t); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  const getInitialForm = (): FormState => editing ? {
    name:           editing.name,
    category:       editing.category ?? '',
    thumbnail_url:  editing.thumbnail_url ?? '',
    background_url: editing.background_url ?? '',
    min_plan:       editing.min_plan as MinPlan,
    featured:       editing.featured,
    published:      editing.published,
  } : BLANK_FORM;

  const handleSave = async (form: FormState) => {
    setSaving(true);
    try {
      if (editing) {
        // Update
        const res = await fetch(`/api/admin/templates/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const { template } = await res.json();
          setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
          closeForm();
        }
      } else {
        // Create
        const res = await fetch('/api/admin/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          const { template } = await res.json();
          setTemplates(prev => [template, ...prev]);
          closeForm();
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (t: Template) => {
    setBusy(t.id);
    try {
      const res = await fetch(`/api/admin/templates/${t.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !t.published }),
      });
      if (res.ok) {
        const { template } = await res.json();
        setTemplates(prev => prev.map(x => x.id === template.id ? template : x));
      }
    } finally {
      setBusy(null);
    }
  };

  const doDelete = async (t: Template) => {
    setConfirmDelete(null);
    setBusy(t.id);
    try {
      const res = await fetch(`/api/admin/templates/${t.id}`, { method: 'DELETE' });
      if (res.ok) {
        setTemplates(prev => prev.filter(x => x.id !== t.id));
      }
    } finally {
      setBusy(null);
    }
  };

  const published = templates.filter(t => t.published).length;

  return (
    <div>
      {/* Header row */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {templates.length > 0 && (
            <label className="flex items-center gap-2 cursor-pointer text-[12px] text-[#6B7A72]">
              <input
                type="checkbox"
                aria-label="Select all templates"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer"
              />
              Select all
            </label>
          )}
          <div className="text-[12px] text-[#6B7A72]">
            {templates.length} template{templates.length !== 1 ? 's' : ''}
            {' '}&mdash; {published} published
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium text-white transition hover:opacity-90"
          style={{ background: '#1F4D3A' }}
        >
          <Plus size={14} strokeWidth={2.2} />
          New template
        </button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1F4D3A]/25 bg-[#E8EFEB]">
          <span className="text-[13px] font-medium text-[#1F4D3A]">
            {selected.size} selected
          </span>
          <div className="flex-1" />
          {bulkBusy && <Loader2 size={14} strokeWidth={2} className="animate-spin text-[#1F4D3A]" />}
          <button
            disabled={bulkBusy}
            onClick={() => setBulkConfirm('publish')}
            className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[#E5E0D4] bg-white text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50"
          >
            Publish
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => setBulkConfirm('unpublish')}
            className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[#E5E0D4] bg-white text-[#6B7A72] hover:bg-[#FAF6EE] transition-colors disabled:opacity-50"
          >
            Unpublish
          </button>
          <button
            disabled={bulkBusy}
            onClick={() => setBulkConfirm('delete')}
            className="h-8 px-3 rounded-lg text-[12px] font-medium text-white hover:opacity-90 transition disabled:opacity-50"
            style={{ background: '#B8423C' }}
          >
            Delete
          </button>
          <button
            disabled={bulkBusy}
            onClick={clearSelection}
            title="Clear selection"
            className="h-8 w-8 grid place-items-center rounded-lg border border-[#E5E0D4] bg-white text-[#6B7A72] hover:bg-[#FAF6EE] transition-colors disabled:opacity-50"
          >
            <X size={13} strokeWidth={2} />
          </button>
        </div>
      )}

      {/* Grid */}
      {templates.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-[14px] text-[#6B7A72] mb-4">No templates yet.</p>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium text-white"
            style={{ background: '#1F4D3A' }}
          >
            <Plus size={14} strokeWidth={2.2} />Create the first template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(t => {
            const planStyle = MIN_PLAN_STYLES[t.min_plan as MinPlan] ?? MIN_PLAN_STYLES.free;
            const isBusy = busy === t.id;

            return (
              <div
                key={t.id}
                className={`bg-white border rounded-2xl overflow-hidden transition-opacity ${!t.published ? 'opacity-60' : ''} ${selected.has(t.id) ? 'border-[#1F4D3A] ring-1 ring-[#1F4D3A]/30' : 'border-[#E5E0D4]'}`}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-[#FAF6EE] border-b border-[#E5E0D4] overflow-hidden relative">
                  {/* Select checkbox */}
                  <label className="absolute top-2 left-2 z-10 h-6 w-6 grid place-items-center rounded-md bg-white/90 border border-[#E5E0D4] cursor-pointer">
                    <input
                      type="checkbox"
                      aria-label={`Select ${t.name}`}
                      checked={selected.has(t.id)}
                      onChange={() => toggleOne(t.id)}
                      className="h-4 w-4 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer"
                    />
                  </label>
                  {t.thumbnail_url ? (
                    <img src={t.thumbnail_url} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-[#6B7A72]">
                      <svg className="w-8 h-8 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M4.5 19.5h15M3.75 6.75h16.5" />
                      </svg>
                    </div>
                  )}
                  {t.featured && (
                    <div className="absolute top-2 right-2 bg-[#E8C57E] rounded-full p-1">
                      <Star size={10} strokeWidth={2} className="text-[#0F1F18]" fill="currentColor" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-[14px] text-[#0F1F18] leading-snug">{t.name}</h3>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full  text-[9px] tracking-[0.1em] uppercase shrink-0" style={planStyle}>
                      {t.min_plan}
                    </span>
                  </div>
                  {t.category && (
                    <div className="text-[11px] text-[#6B7A72] mb-3">{t.category}</div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-[#E5E0D4]">
                    <button
                      onClick={() => openEdit(t)}
                      disabled={isBusy}
                      className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-[#E5E0D4] text-[12px] text-[#3A4A42] hover:bg-[#FAF6EE] transition-colors disabled:opacity-50"
                    >
                      <Pencil size={11} strokeWidth={2} /> Edit
                    </button>
                    <button
                      onClick={() => togglePublished(t)}
                      disabled={isBusy}
                      title={t.published ? 'Unpublish' : 'Publish'}
                      className={`h-8 w-8 rounded-lg border border-[#E5E0D4] grid place-items-center transition-colors disabled:opacity-50 ${t.published ? 'text-emerald-600 hover:bg-emerald-50' : 'text-[#6B7A72] hover:bg-[#FAF6EE]'}`}
                    >
                      {isBusy ? (
                        <Loader2 size={12} strokeWidth={2} className="animate-spin" />
                      ) : t.published ? (
                        <Eye size={12} strokeWidth={2} />
                      ) : (
                        <EyeOff size={12} strokeWidth={2} />
                      )}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(t)}
                      disabled={isBusy}
                      title="Delete"
                      className="h-8 w-8 rounded-lg border border-[#E5E0D4] grid place-items-center text-[#B8423C] hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={12} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <TemplateModal
          initial={getInitialForm()}
          onSave={handleSave}
          onClose={closeForm}
          saving={saving}
        />
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-[#E5E0D4] p-6 max-w-sm w-full">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} strokeWidth={1.8} className="text-[#B8423C]" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px] text-[#0F1F18]">Delete template?</h3>
                <p className="text-[13px] text-[#6B7A72] mt-1">
                  &ldquo;{confirmDelete.name}&rdquo; will be permanently removed.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg text-[13px] text-[#6B7A72] border border-[#E5E0D4] hover:bg-[#FAF6EE] transition-colors">Cancel</button>
              <button onClick={() => doDelete(confirmDelete)} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-[#B8423C] hover:opacity-90 transition">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirm */}
      {bulkConfirm === 'delete' && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setBulkConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-[#E5E0D4] p-6 max-w-sm w-full">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} strokeWidth={1.8} className="text-[#B8423C]" />
              </div>
              <div>
                <h3 className="font-semibold text-[15px] text-[#0F1F18]">
                  Delete {selected.size} template{selected.size === 1 ? '' : 's'}?
                </h3>
                <p className="text-[13px] text-[#6B7A72] mt-1">
                  The selected template{selected.size === 1 ? '' : 's'} will be permanently removed.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setBulkConfirm(null)} className="px-4 py-2 rounded-lg text-[13px] text-[#6B7A72] border border-[#E5E0D4] hover:bg-[#FAF6EE] transition-colors">Cancel</button>
              <button onClick={() => runBulk('delete')} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-[#B8423C] hover:opacity-90 transition">Delete {selected.size}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk publish / unpublish confirm */}
      {(bulkConfirm === 'publish' || bulkConfirm === 'unpublish') && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setBulkConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl border border-[#E5E0D4] p-6 max-w-sm w-full">
            <h3 className="font-semibold text-[15px] text-[#0F1F18]">
              {bulkConfirm === 'publish' ? 'Publish' : 'Unpublish'} {selected.size} template{selected.size === 1 ? '' : 's'}?
            </h3>
            <p className="text-[13px] text-[#6B7A72] mt-1 mb-5">
              {bulkConfirm === 'publish'
                ? 'The selected templates will become available to organizers.'
                : 'The selected templates will be hidden from organizers.'}
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setBulkConfirm(null)} className="px-4 py-2 rounded-lg text-[13px] text-[#6B7A72] border border-[#E5E0D4] hover:bg-[#FAF6EE] transition-colors">Cancel</button>
              <button onClick={() => runBulk(bulkConfirm)} className="px-4 py-2 rounded-lg text-[13px] font-medium text-white hover:opacity-90 transition" style={{ background: '#1F4D3A' }}>
                {bulkConfirm === 'publish' ? 'Publish' : 'Unpublish'} {selected.size}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
