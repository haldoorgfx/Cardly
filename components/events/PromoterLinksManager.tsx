'use client';

import { useState } from 'react';
import { Plus, Trash2, Copy, Check, Link2, TrendingUp } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface PromoterCode {
  id: string;
  code: string;
  label: string | null;
  uses: number;
  revenue: number;
  created_at: string;
}

interface Props {
  eventId: string;
  eventSlug: string;
  initialCodes: PromoterCode[];
  appUrl: string;
}

const INPUT = 'w-full rounded-lg px-3 py-2.5 text-[14px] outline-none';
const INPUT_STYLE = { background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' };

function fmt(n: number) {
  try {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
  } catch {
    return String(n);
  }
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-md transition-colors"
      style={{ background: copied ? '#E8EFEB' : '#F4F1EB', color: copied ? '#1F4D3A' : '#6B7A72' }}
      title={`Copy ${label}`}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied' : label}
    </button>
  );
}

export function PromoterLinksManager({ eventId, eventSlug, initialCodes, appUrl }: Props) {
  const [codes, setCodes] = useState(initialCodes);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ code: '', label: '' });

  const baseUrl = `${appUrl}/e/${eventSlug}/register`;

  const handleCreate = async () => {
    if (!form.code.trim()) { setError('Code is required'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`/api/events/${eventId}/promoter-codes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: form.code.trim(), label: form.label.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? 'Failed to create'); return; }
      setCodes(prev => [json, ...prev]);
      setForm({ code: '', label: '' });
      setShowForm(false);
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await fetch(`/api/events/${eventId}/promoter-codes/${id}`, { method: 'DELETE' });
      setCodes(prev => prev.filter(c => c.id !== id));
    } catch { /* non-blocking */ }
    finally { setDeleting(null); }
  };

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-[13px]" style={{ color: '#6B7A72' }}>
          Share tracking links with partners or promoters. Each registration via their link is counted and attributed.
        </p>
        <button
          onClick={() => { setShowForm(true); setError(''); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap"
          style={{ background: '#1F4D3A', color: '#FAF6EE' }}
        >
          <Plus size={14} />
          New link
        </button>
      </div>

      {/* Create form */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setError(''); setForm({ code: '', label: '' }); }}
        title="New promoter link"
        footer={
          <>
            <button onClick={() => { setShowForm(false); setError(''); setForm({ code: '', label: '' }); }} className="h-10 px-4 rounded-xl text-[13px] font-medium border" style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="h-10 px-5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-60" style={{ background: '#1F4D3A' }}>
              {saving ? 'Creating…' : 'Create link'}
            </button>
          </>
        }
      >
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>Code *</label>
              <input
                className={INPUT}
                style={INPUT_STYLE}
                placeholder="JOHNDOE"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, '') }))}
              />
              <p className="text-[11px] mt-1" style={{ color: '#6B7A72' }}>Letters, numbers, hyphens only</p>
            </div>
            <div>
              <label className="block text-[12px] font-medium mb-1.5" style={{ color: '#3A4A42' }}>Label (optional)</label>
              <input
                className={INPUT}
                style={INPUT_STYLE}
                placeholder="e.g. John Doe — Instagram"
                value={form.label}
                onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              />
            </div>
          </div>

          {/* Preview */}
          {form.code && (
            <div className="rounded-lg px-3 py-2 mb-3  text-[12px] break-all" style={{ background: '#F4F1EB', color: '#3A4A42' }}>
              {baseUrl}?ref={form.code}
            </div>
          )}

          {error && <p className="text-[13px]" style={{ color: '#B8423C' }}>{error}</p>}
        </div>
      </Modal>

      {/* Empty state */}
      {codes.length === 0 && !showForm && (
        <div className="rounded-xl py-14 flex flex-col items-center gap-3 text-center" style={{ border: '1.5px dashed #E5E0D4' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#E8EFEB' }}>
            <Link2 size={18} style={{ color: '#1F4D3A' }} />
          </div>
          <div>
            <p className="font-medium text-[14px]" style={{ color: '#0F1F18' }}>No promoter links yet</p>
            <p className="text-[13px] mt-0.5" style={{ color: '#6B7A72' }}>Create links to track who drives registrations</p>
          </div>
        </div>
      )}

      {/* Codes list */}
      {codes.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
          {codes.map((c, i) => {
            const link = `${baseUrl}?ref=${c.code}`;
            return (
              <div
                key={c.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-4"
                style={{ borderTop: i > 0 ? '1px solid #F0EDE6' : undefined }}
              >
                {/* Left: code + label + link */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className=" font-semibold text-[14px] tracking-wider px-2.5 py-0.5 rounded-md" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                      {c.code}
                    </span>
                    {c.label && <span className="text-[13px]" style={{ color: '#6B7A72' }}>{c.label}</span>}
                  </div>
                  <p className=" text-[11px] mt-1.5 truncate" style={{ color: '#9BA6A0' }}>{link}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <p className=" font-semibold text-[15px]" style={{ color: '#0F1F18' }}>{c.uses}</p>
                    <p className="text-[11px]" style={{ color: '#6B7A72' }}>registrations</p>
                  </div>
                  {c.revenue > 0 && (
                    <div className="text-center">
                      <p className=" font-semibold text-[15px] flex items-center gap-1" style={{ color: '#1F4D3A' }}>
                        <TrendingUp size={12} />{fmt(c.revenue)}
                      </p>
                      <p className="text-[11px]" style={{ color: '#6B7A72' }}>revenue</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <CopyButton text={link} label="Copy link" />
                  <CopyButton text={c.code} label="Copy code" />
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deleting === c.id}
                    className="p-1.5 rounded-md transition-colors"
                    style={{ color: '#B8423C', opacity: deleting === c.id ? 0.5 : 1 }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
