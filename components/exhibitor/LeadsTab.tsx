'use client';

import { useState } from 'react';

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

const RATING_STYLES: Record<string, { bg: string; color: string; border: string; dot?: string }> = {
  hot:     { bg: 'rgba(45,122,79,0.08)',   color: '#2D7A4F', border: 'rgba(45,122,79,0.2)' },
  warm:    { bg: 'rgba(232,197,126,0.2)',  color: '#C9A45E', border: 'rgba(232,197,126,0.4)' },
  cold:    { bg: 'rgba(15,31,24,0.05)',    color: '#6B7A72', border: '#E5E0D4' },
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
  const headers = ['Name', 'Email', 'Company', 'Role', 'Rating', 'Captured'];
  const rows = leads.map(l => [
    l.attendee_name ?? '',
    l.attendee_email ?? '',
    l.company ?? '',
    l.role ?? '',
    l.rating ?? '',
    new Date(l.captured_at ?? l.created_at).toLocaleDateString(),
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'leads.csv'; a.click();
  URL.revokeObjectURL(url);
}

export function LeadsTab({ leads }: Props) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? leads.filter(l =>
        (l.attendee_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (l.company ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : leads;

  return (
    <div className="bg-white rounded-2xl border" style={{ borderColor: '#E5E0D4' }}>
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
              <div key={lead.id} className="flex items-center gap-3.5 px-5 py-3.5">
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
                <button
                  className="w-8 h-8 grid place-items-center rounded-lg transition-colors shrink-0"
                  style={{ color: '#6B7A72' }}
                  title="View lead"
                >
                  <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
