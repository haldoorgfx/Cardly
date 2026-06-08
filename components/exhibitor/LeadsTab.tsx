'use client';

import { useState, useTransition } from 'react';

interface Lead {
  id: string;
  attendee_name: string | null;
  attendee_email: string | null;
  company: string | null;
  role: string | null;
  rating: string | null;
  note: string | null;
  captured_at: string | null;
  created_at: string;
}

interface Props {
  leads: Lead[];
  token: string;
}

const RATING_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  hot:  { bg: 'rgba(45,122,79,0.08)',  color: '#2D7A4F', border: 'rgba(45,122,79,0.2)' },
  warm: { bg: 'rgba(232,197,126,0.2)', color: '#C9A45E', border: 'rgba(232,197,126,0.4)' },
  cold: { bg: 'rgba(15,31,24,0.05)',   color: '#6B7A72', border: '#E5E0D4' },
};

function Avatar({ name, idx }: { name: string; idx: number }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const grads = [
    'linear-gradient(135deg,#3E7E5E,#C9A45E)',
    'linear-gradient(135deg,#1F4D3A,#2A6A50)',
  ];
  return (
    <span
      className="rounded-full grid place-items-center text-cream font-display font-semibold shrink-0 text-[13px]"
      style={{ width: 38, height: 38, background: grads[idx % 2] }}
    >
      {initials}
    </span>
  );
}

function exportCSV(leads: Lead[]) {
  const headers = ['Name', 'Email', 'Company', 'Role', 'Rating', 'Note', 'Captured'];
  const rows = leads.map(l => [
    l.attendee_name ?? '',
    l.attendee_email ?? '',
    l.company ?? '',
    l.role ?? '',
    l.rating ?? '',
    l.note ?? '',
    new Date(l.captured_at ?? l.created_at).toLocaleDateString(),
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'leads.csv'; a.click();
  URL.revokeObjectURL(url);
}

/* ── Lead detail panel ─────────────────────────────────────────────────── */
function LeadPanel({
  lead, token, onClose, onUpdate, onDelete,
}: {
  lead: Lead;
  token: string;
  onClose: () => void;
  onUpdate: (updated: Lead) => void;
  onDelete: (id: string) => void;
}) {
  const [rating, setRating] = useState(lead.rating ?? 'warm');
  const [note, setNote]     = useState(lead.note ?? '');
  const [isPending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);

  function handleSave() {
    startTransition(async () => {
      const res = await fetch('/api/exhibitor/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, lead_id: lead.id, rating, note }),
      });
      const data = await res.json();
      if (data.lead) onUpdate(data.lead);
      onClose();
    });
  }

  function handleDelete() {
    if (!confirm('Delete this lead? This cannot be undone.')) return;
    setDeleting(true);
    startTransition(async () => {
      await fetch(`/api/exhibitor/leads?id=${lead.id}&token=${token}`, { method: 'DELETE' });
      onDelete(lead.id);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-[400px]" style={{ border: '1px solid #E5E0D4', boxShadow: '0 8px 40px rgba(15,31,24,0.18)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <div className="font-display text-[15px] font-semibold" style={{ color: '#0F1F18' }}>Lead detail</div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg grid place-items-center hover:bg-[#F5F3EE]" style={{ color: '#6B7A72' }}>
            <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Info */}
        <div className="px-5 py-4 space-y-3">
          <div>
            <div className="font-display text-[16px] font-semibold" style={{ color: '#0F1F18' }}>{lead.attendee_name ?? 'Unknown'}</div>
            {lead.attendee_email && <div className="font-mono text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>{lead.attendee_email}</div>}
            {(lead.role || lead.company) && (
              <div className="text-[13px] mt-0.5" style={{ color: '#3A4A42' }}>
                {[lead.role, lead.company].filter(Boolean).join(' · ')}
              </div>
            )}
            {(lead.captured_at || lead.created_at) && (
              <div className="font-mono text-[11px] mt-1" style={{ color: '#6B7A72' }}>
                Captured {new Date(lead.captured_at ?? lead.created_at).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Rating */}
          <div>
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase mb-2" style={{ color: '#6B7A72' }}>Rating</div>
            <div className="flex gap-2">
              {(['hot', 'warm', 'cold'] as const).map(r => {
                const s = RATING_STYLES[r];
                const active = rating === r;
                return (
                  <button
                    key={r}
                    onClick={() => setRating(r)}
                    className="flex-1 py-2 rounded-xl text-[13px] font-medium capitalize border transition-all"
                    style={{
                      background: active ? s.bg : 'white',
                      color: active ? s.color : '#6B7A72',
                      borderColor: active ? s.border : '#E5E0D4',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div>
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase mb-2" style={{ color: '#6B7A72' }}>Note</div>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Add a note about this lead…"
              className="w-full rounded-xl px-3 py-2.5 text-[13.5px] outline-none resize-none"
              style={{ border: '1px solid #E5E0D4', background: '#FAF6EE', color: '#0F1F18' }}
              onFocus={e => (e.target.style.borderColor = 'rgba(31,77,58,0.4)')}
              onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2.5 rounded-xl text-[13.5px] font-medium border transition"
            style={{ borderColor: 'rgba(184,66,60,0.3)', color: '#B8423C', background: 'rgba(184,66,60,0.05)' }}
          >
            {deleting ? 'Deleting…' : 'Delete lead'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-[13.5px] font-medium border"
            style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex-1 py-2.5 rounded-xl text-[13.5px] font-medium text-cream transition"
            style={{ background: '#1F4D3A', opacity: isPending ? 0.6 : 1 }}
          >
            {isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
export function LeadsTab({ leads: initialLeads, token }: Props) {
  const [leads, setLeads] = useState(initialLeads);
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const filtered = search
    ? leads.filter(l =>
        (l.attendee_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (l.company ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : leads;

  function handleUpdate(updated: Lead) {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
  }

  function handleDelete(id: string) {
    setLeads(prev => prev.filter(l => l.id !== id));
  }

  return (
    <div className="bg-white rounded-2xl border" style={{ borderColor: '#E5E0D4' }}>
      {selectedLead && (
        <LeadPanel
          lead={selectedLead}
          token={token}
          onClose={() => setSelectedLead(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}

      {/* Panel header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b" style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
        <div className="font-display text-[14px] font-semibold tracking-tight" style={{ color: '#0F1F18' }}>
          Captured leads · {leads.length}
        </div>
        <button
          onClick={() => exportCSV(leads)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors border"
          style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
        >
          <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Search */}
      <div className="px-5 py-3 border-b" style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search leads…"
          className="w-full rounded-lg px-3 py-2 text-[13.5px] border outline-none focus:ring-2"
          style={{ borderColor: '#E5E0D4', background: '#FAF6EE', color: '#0F1F18', '--tw-ring-color': 'rgba(31,77,58,0.15)' } as React.CSSProperties}
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="px-5 py-10 text-center text-[13.5px]" style={{ color: '#6B7A72' }}>
          {leads.length === 0 ? 'No leads captured yet.' : 'No leads match your search.'}
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'rgba(229,224,212,0.6)' }}>
          {filtered.map((lead, i) => {
            const rs = RATING_STYLES[lead.rating ?? 'cold'] ?? RATING_STYLES.cold;
            const subtitle = [lead.role, lead.company].filter(Boolean).join(' · ');
            return (
              <div
                key={lead.id}
                className="flex items-center gap-3.5 px-5 py-3.5 cursor-pointer hover:bg-[#FAF6EE] transition-colors"
                onClick={() => setSelectedLead(lead)}
              >
                <Avatar name={lead.attendee_name ?? '?'} idx={i} />
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium truncate" style={{ color: '#0F1F18' }}>
                    {lead.attendee_name ?? 'Unknown'}
                  </div>
                  <div className="font-mono text-[11px] truncate mt-0.5" style={{ color: '#6B7A72' }}>
                    {subtitle || lead.attendee_email || '—'}
                  </div>
                </div>
                {lead.rating && (
                  <span
                    className="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full border capitalize"
                    style={{ background: rs.bg, color: rs.color, borderColor: rs.border }}
                  >
                    {lead.rating}
                  </span>
                )}
                <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" style={{ color: '#C9C3B1', flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
