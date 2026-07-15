'use client';

import { useState } from 'react';

interface Stats {
  leads: number;
  resources: number;
  hot: number;
  warm: number;
  cold: number;
}

interface Props {
  sponsorId: string;
  token: string;
  stats: Stats;
  boothNumber: string | null;
  eventName: string;
}

// ── Lead capture modal ────────────────────────────────────────────────────────

const RATINGS = [
  { value: 'hot',  label: 'Hot',  desc: 'Ready to buy', color: '#2D7A4F', bg: 'rgba(45,122,79,0.1)',  border: 'rgba(45,122,79,0.3)' },
  { value: 'warm', label: 'Warm', desc: 'Interested',   color: '#C9A45E', bg: 'rgba(232,197,126,0.2)', border: 'rgba(201,164,94,0.4)' },
  { value: 'cold', label: 'Cold', desc: 'Browsing',     color: '#6B7A72', bg: 'rgba(107,122,114,0.08)', border: '#E5E0D4' },
] as const;

function LeadModal({ token, onClose, onAdded }: { token: string; onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    attendee_name: '', attendee_email: '', company: '', role: '', note: '', rating: 'warm' as string,
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  function set(k: keyof typeof form) {
    return (v: string) => setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSubmit() {
    if (!form.attendee_name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/exhibitor/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, ...form }),
    });
    setSaving(false);
    if (res.ok) { onAdded(); onClose(); }
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Failed to save lead'); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: 'rgba(15,31,24,0.55)' }}>
      <div className="w-full max-w-md bg-white rounded-2xl" style={{ boxShadow: '0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.12)' }}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#E5E0D4' }}>
          <div className="font-display text-[15px] font-semibold" style={{ color: '#0F1F18' }}>Capture lead</div>
          <button onClick={onClose} className="w-7 h-7 grid place-items-center rounded-lg transition-colors" style={{ color: '#6B7A72' }}>
            <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 grid gap-3.5">
          {/* Name + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className=" text-[9.5px] tracking-[0.14em] uppercase mb-1" style={{ color: '#6B7A72' }}>Name *</div>
              <input
                type="text" placeholder="Jane Smith" value={form.attendee_name} onChange={e => set('attendee_name')(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-[13.5px] outline-none focus:ring-2 bg-white"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18', '--tw-ring-color': 'rgba(31,77,58,0.15)' } as React.CSSProperties}
              />
            </div>
            <div>
              <div className=" text-[9.5px] tracking-[0.14em] uppercase mb-1" style={{ color: '#6B7A72' }}>Email</div>
              <input
                type="email" placeholder="jane@…" value={form.attendee_email} onChange={e => set('attendee_email')(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-[13.5px] outline-none focus:ring-2 bg-white"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18', '--tw-ring-color': 'rgba(31,77,58,0.15)' } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Company + Role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className=" text-[9.5px] tracking-[0.14em] uppercase mb-1" style={{ color: '#6B7A72' }}>Company</div>
              <input
                type="text" placeholder="Acme Corp" value={form.company} onChange={e => set('company')(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-[13.5px] outline-none focus:ring-2 bg-white"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18', '--tw-ring-color': 'rgba(31,77,58,0.15)' } as React.CSSProperties}
              />
            </div>
            <div>
              <div className=" text-[9.5px] tracking-[0.14em] uppercase mb-1" style={{ color: '#6B7A72' }}>Role</div>
              <input
                type="text" placeholder="CTO" value={form.role} onChange={e => set('role')(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-[13.5px] outline-none focus:ring-2 bg-white"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18', '--tw-ring-color': 'rgba(31,77,58,0.15)' } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <div className=" text-[9.5px] tracking-[0.14em] uppercase mb-2" style={{ color: '#6B7A72' }}>Lead rating</div>
            <div className="grid grid-cols-3 gap-2">
              {RATINGS.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => set('rating')(r.value)}
                  className="flex flex-col items-center py-2.5 rounded-xl border transition-all text-center"
                  style={form.rating === r.value
                    ? { background: r.bg, borderColor: r.border, color: r.color }
                    : { background: 'white', borderColor: '#E5E0D4', color: '#6B7A72' }
                  }
                >
                  <span className="text-[13px] font-semibold">{r.label}</span>
                  <span className="text-[10.5px] mt-0.5">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className=" text-[9.5px] tracking-[0.14em] uppercase mb-1" style={{ color: '#6B7A72' }}>Notes</div>
            <textarea
              rows={2} placeholder="What did you discuss…" value={form.note} onChange={e => set('note')(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-[13.5px] outline-none focus:ring-2 resize-none bg-white"
              style={{ borderColor: '#E5E0D4', color: '#0F1F18', '--tw-ring-color': 'rgba(31,77,58,0.15)' } as React.CSSProperties}
            />
          </div>

          {error && <p className="text-[12px]" style={{ color: '#B8423C' }}>{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2.5">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-[13.5px] font-semibold text-white transition-colors disabled:opacity-60"
            style={{ background: '#1F4D3A' }}
          >
            {saving ? 'Saving…' : 'Save lead'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-[13.5px] border transition-colors"
            style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

function Stat({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={
        accent
          ? { background: 'rgba(232,197,126,0.12)', borderColor: 'rgba(232,197,126,0.5)' }
          : { background: '#FFFFFF', borderColor: '#E5E0D4' }
      }
    >
      <div className=" text-[9.5px] tracking-[0.14em] uppercase mb-2" style={{ color: '#6B7A72' }}>{label}</div>
      <div className=" text-[26px] tracking-tight leading-none" style={{ color: '#0F1F18' }}>{value}</div>
      {sub && <div className=" text-[11px] mt-2" style={{ color: '#2D7A4F' }}>{sub}</div>}
    </div>
  );
}

function Panel({ title, children, pad = 'p-5' }: { title?: string; children: React.ReactNode; pad?: string }) {
  return (
    <div className="bg-white rounded-2xl border" style={{ borderColor: '#E5E0D4' }}>
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
          <div className="font-display text-[14px] font-semibold tracking-tight" style={{ color: '#0F1F18' }}>{title}</div>
        </div>
      )}
      <div className={pad}>{children}</div>
    </div>
  );
}

const QUALITY_BARS = [
  { label: 'Hot · ready to buy', color: '#1F4D3A' },
  { label: 'Warm · interested',  color: '#2A6A50' },
  { label: 'Cold · browsing',    color: '#A8C2B5' },
];

export function OverviewTab({ stats: initialStats, token }: Props) {
  const [stats, setStats]     = useState(initialStats);
  const [showModal, setShowModal] = useState(false);

  const total = stats.leads || 1;
  const bars = [
    { ...QUALITY_BARS[0], count: stats.hot },
    { ...QUALITY_BARS[1], count: stats.warm },
    { ...QUALITY_BARS[2], count: stats.cold },
  ];

  function handleLeadAdded() {
    // Optimistically bump stats
    setStats(s => ({ ...s, leads: s.leads + 1, warm: s.warm + 1 }));
  }

  return (
    <>
      {showModal && (
        <LeadModal
          token={token}
          onClose={() => setShowModal(false)}
          onAdded={handleLeadAdded}
        />
      )}

      {/* Scan CTA */}
      <div
        className="rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ background: 'rgba(232,197,126,0.14)', border: '1px solid rgba(232,197,126,0.4)' }}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-11 h-11 rounded-xl grid place-items-center shrink-0"
            style={{ background: 'rgba(232,197,126,0.25)', color: '#C9A45E' }}
          >
            <svg width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
            </svg>
          </span>
          <div>
            <div className="font-display text-[15px] font-semibold" style={{ color: '#163828' }}>Capture leads at your booth</div>
            <div className="text-[13px] mt-0.5" style={{ color: '#3A4A42' }}>Add an attendee&apos;s details to save them as a lead instantly.</div>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-semibold whitespace-nowrap transition-opacity hover:opacity-90"
          style={{ background: '#E8C57E', color: '#163828' }}
        >
          <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add lead
        </button>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat label="Leads captured"   value={stats.leads} />
        <Stat label="Booth visits"     value="—" />
        <Stat label="Resources opened" value={stats.resources} />
        <Stat label="Meetings booked"  value="—" accent />
      </div>

      {/* Lead quality + sessions */}
      <div className="grid lg:grid-cols-2 gap-5">
        <Panel title="Lead quality">
          <div className="grid gap-3">
            {bars.map((bar, i) => {
              const pct = Math.round((bar.count / total) * 100);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5 text-[13px]">
                    <span style={{ color: '#3A4A42' }}>{bar.label}</span>
                    <span className="" style={{ color: '#6B7A72' }}>{bar.count} · {pct}%</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(232,239,235,0.6)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: bar.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Your sessions">
          <div className="grid gap-2.5">
            {/* No exhibitor-session data source exists yet — this used to fabricate
                a "Product demo at booth" entry for any sponsor with a booth number,
                regardless of whether a demo was ever actually scheduled. */}
            <p className="text-[13px] py-3" style={{ color: '#6B7A72' }}>No sessions scheduled yet.</p>
          </div>
        </Panel>
      </div>
    </>
  );
}
