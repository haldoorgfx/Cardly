'use client';

import { useState } from 'react';
import { Plus, Trash2, Copy, Check } from 'lucide-react';

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
}

interface Props {
  eventId: string;
  initialCodes: PromoCode[];
}

const INPUT = 'w-full rounded-lg px-3 py-2.5 text-[14px] outline-none';
const INPUT_STYLE = { background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' };

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="flex items-center gap-1.5 font-mono text-[13px] font-semibold tracking-wider px-2.5 py-1 rounded-md transition-colors"
      style={{ background: '#E8EFEB', color: '#1F4D3A' }}
      title="Copy code"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {code}
    </button>
  );
}

export function PromoCodesManager({ eventId, initialCodes }: Props) {
  const [codes, setCodes] = useState(initialCodes);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    code: '',
    discount_type: 'percent' as 'percent' | 'fixed',
    discount_value: '',
    max_uses: '',
    valid_from: '',
    valid_until: '',
  });

  const resetForm = () => {
    setForm({ code: '', discount_type: 'percent', discount_value: '', max_uses: '', valid_from: '', valid_until: '' });
    setError('');
    setShowForm(false);
  };

  const handleCreate = async () => {
    if (!form.code || !form.discount_value) {
      setError('Code and discount value are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/events/${eventId}/promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          discount_type: form.discount_type,
          discount_value: parseFloat(form.discount_value),
          max_uses: form.max_uses ? parseInt(form.max_uses) : null,
          valid_from: form.valid_from || null,
          valid_until: form.valid_until || null,
        }),
      });
      const data = await res.json() as { promo_code?: PromoCode; error?: string };
      if (!res.ok) { setError(data.error ?? 'Failed to create code'); return; }
      if (data.promo_code) setCodes(c => [data.promo_code!, ...c]);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promo code?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/events/${eventId}/promo?codeId=${id}`, { method: 'DELETE' });
      setCodes(c => c.filter(x => x.id !== id));
    } finally {
      setDeleting(null);
    }
  };

  const usagePct = (c: PromoCode) =>
    c.max_uses ? Math.round((c.uses_count / c.max_uses) * 100) : null;

  return (
    <div>
      {/* Create button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium mb-6"
          style={{ background: '#1F4D3A', color: 'white' }}
        >
          <Plus size={15} />
          Create promo code
        </button>
      )}

      {/* Create form */}
      {showForm && (
        <div className="rounded-2xl p-5 mb-6" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
          <h3 className="font-display font-medium text-[16px] mb-4" style={{ color: '#0F1F18' }}>New promo code</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>Code *</label>
              <input
                className={INPUT}
                style={INPUT_STYLE}
                placeholder="e.g. EARLY20"
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              />
            </div>
            <div>
              <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>Discount type</label>
              <select
                className={INPUT}
                style={INPUT_STYLE}
                value={form.discount_type}
                onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as 'percent' | 'fixed' }))}
              >
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>
                {form.discount_type === 'percent' ? 'Discount (%)' : 'Discount amount'} *
              </label>
              <input
                type="number"
                min="0"
                max={form.discount_type === 'percent' ? 100 : undefined}
                className={INPUT}
                style={INPUT_STYLE}
                placeholder={form.discount_type === 'percent' ? '20' : '10.00'}
                value={form.discount_value}
                onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>Max uses (leave blank for unlimited)</label>
              <input
                type="number"
                min="1"
                className={INPUT}
                style={INPUT_STYLE}
                placeholder="100"
                value={form.max_uses}
                onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>Valid from</label>
              <input
                type="datetime-local"
                className={INPUT}
                style={INPUT_STYLE}
                value={form.valid_from}
                onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>Valid until</label>
              <input
                type="datetime-local"
                className={INPUT}
                style={INPUT_STYLE}
                value={form.valid_until}
                onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))}
              />
            </div>
          </div>

          {error && <p className="text-[13px] mt-3" style={{ color: '#B8423C' }}>{error}</p>}

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-[13px] font-medium"
              style={{ background: '#1F4D3A', color: 'white', opacity: saving ? 0.6 : 1 }}
            >
              {saving ? 'Creating…' : 'Create code'}
            </button>
            <button
              onClick={resetForm}
              className="px-5 py-2.5 rounded-xl text-[13px] font-medium"
              style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#6B7A72' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Codes list */}
      {codes.length === 0 ? (
        <div
          className="rounded-2xl py-16 text-center"
          style={{ background: 'white', border: '1px solid #E5E0D4' }}
        >
          <div className="text-[14px]" style={{ color: '#6B7A72' }}>No promo codes yet. Create one to offer discounts.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {codes.map(c => (
            <div
              key={c.id}
              className="flex items-center gap-4 rounded-2xl px-5 py-4"
              style={{ background: 'white', border: '1px solid #E5E0D4' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <CopyCode code={c.code} />
                  <span className="text-[13px]" style={{ color: '#3A4A42' }}>
                    {c.discount_type === 'percent'
                      ? `${c.discount_value}% off`
                      : `${c.discount_value} off`}
                  </span>
                </div>

                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  {/* Usage */}
                  <div className="flex items-center gap-2">
                    <div className="font-mono text-[12px]" style={{ color: '#6B7A72' }}>
                      {c.uses_count} used{c.max_uses ? ` / ${c.max_uses}` : ''}
                    </div>
                    {c.max_uses && (
                      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: '#E5E0D4' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${usagePct(c)}%`, background: (usagePct(c) ?? 0) >= 90 ? '#C97A2D' : '#1F4D3A' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  {c.valid_from && (
                    <span className="font-mono text-[11px]" style={{ color: '#6B7A72' }}>
                      From {new Date(c.valid_from).toLocaleDateString()}
                    </span>
                  )}
                  {c.valid_until && (
                    <span className="font-mono text-[11px]" style={{ color: new Date(c.valid_until) < new Date() ? '#B8423C' : '#6B7A72' }}>
                      Until {new Date(c.valid_until).toLocaleDateString()}
                      {new Date(c.valid_until) < new Date() && ' (expired)'}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDelete(c.id)}
                disabled={deleting === c.id}
                className="p-2 rounded-lg transition-colors hover:opacity-80"
                style={{ color: '#B8423C', opacity: deleting === c.id ? 0.4 : undefined }}
                title="Delete code"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
