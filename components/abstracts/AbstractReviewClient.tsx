'use client';

import { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';

type AbstractStatus = 'pending' | 'accept' | 'reject' | 'revision' | 'waitlist';

interface Abstract {
  id: string;
  title: string;
  authors: string;
  category: string;
  keywords: string[];
  body: string;
  pdf_url?: string | null;
  status: AbstractStatus;
  submitted_at: string;
  review_notes?: string | null;
  assigned_session?: string | null;
}

interface Session { id: string; title: string }

type FilterTab = 'all' | AbstractStatus;

const STATUS_LABEL: Record<AbstractStatus, string> = {
  pending: 'Pending', accept: 'Accepted', reject: 'Rejected',
  revision: 'Revision', waitlist: 'Waitlisted',
};

const STATUS_STYLE: Record<AbstractStatus, { bg: string; color: string }> = {
  pending: { bg: '#F5F5F0', color: '#6B7A72' },
  accept: { bg: '#E8EFEB', color: '#1F4D3A' },
  reject: { bg: 'rgba(184,66,60,0.1)', color: '#B8423C' },
  revision: { bg: '#FEF3C7', color: '#C97A2D' },
  waitlist: { bg: '#E8EFEB', color: '#6B7A72' },
};

const DECISIONS: { key: AbstractStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'accept', label: 'Accept' },
  { key: 'reject', label: 'Reject' },
  { key: 'revision', label: 'Request revision' },
  { key: 'waitlist', label: 'Waitlist' },
];

function relDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function AbstractReviewClient({
  eventId,
  initialAbstracts,
  sessions,
}: {
  eventId: string;
  initialAbstracts: Abstract[];
  sessions: Session[];
}) {
  const [abstracts, setAbstracts] = useState(initialAbstracts);
  const [activeId, setActiveId] = useState(initialAbstracts[0]?.id ?? null);
  const [tab, setTab] = useState<FilterTab>('all');
  const [decision, setDecision] = useState<Record<string, AbstractStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [assignedSession, setAssignedSession] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const filtered = abstracts.filter(a => tab === 'all' || a.status === tab);
  const active = abstracts.find(a => a.id === activeId);

  const counts = {
    total: abstracts.length,
    accepted: abstracts.filter(a => a.status === 'accept').length,
    rejected: abstracts.filter(a => a.status === 'reject').length,
    pending: abstracts.filter(a => a.status === 'pending').length,
  };

  const currentDecision = (id: string) => decision[id] ?? abstracts.find(a => a.id === id)?.status ?? 'pending';

  const saveDecision = async (abstractId: string) => {
    setSaving(abstractId);
    try {
      const res = await fetch(`/api/events/${eventId}/abstracts`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abstractId,
          status: currentDecision(abstractId),
          review_notes: notes[abstractId],
          assigned_session: assignedSession[abstractId],
        }),
      });
      const data = await res.json() as { abstract: Abstract };
      if (data.abstract) {
        setAbstracts(prev => prev.map(a => a.id === abstractId ? data.abstract : a));
      }
    } finally {
      setSaving(null);
    }
  };

  const goNext = () => {
    const idx = filtered.findIndex(a => a.id === activeId);
    if (idx < filtered.length - 1) setActiveId(filtered[idx + 1].id);
  };

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'accept', label: 'Accepted' },
    { key: 'reject', label: 'Rejected' },
    { key: 'revision', label: 'Revision Requested' },
  ];

  return (
    <div style={{ background: '#FAF6EE' }}>
      {/* Stats + tabs header */}
      <div className="px-4 sm:px-6 lg:px-10 pt-7 pb-0">
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-5">
          {[
            { label: 'submitted', value: counts.total },
            { label: 'accepted', value: counts.accepted },
            { label: 'rejected', value: counts.rejected },
            { label: 'pending review', value: counts.pending },
          ].map(s => (
            <span key={s.label} className="text-[14px]" style={{ color: '#6B7A72' }}>
              <b className="font-title font-bold text-[16px]" style={{ color: '#0F1F18' }}>{s.value}</b>{' '}{s.label}
            </span>
          ))}
        </div>

        <div className="flex gap-0" style={{ borderBottom: '1px solid #E5E0D4' }}>
          {FILTER_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-px"
              style={{
                color: tab === t.key ? '#1F4D3A' : '#6B7A72',
                borderBottomColor: tab === t.key ? '#1F4D3A' : 'transparent',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Split panel */}
      <div
        className="flex flex-col lg:grid"
        style={{
          gridTemplateColumns: '400px 1fr',
          minHeight: 500,
          height: 'auto',
        }}
      >
        {/* Left: abstract list */}
        <div className="overflow-y-auto max-h-[50vh] lg:max-h-full" style={{ borderRight: '1px solid #E5E0D4' }}>
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-[13px]" style={{ color: '#6B7A72' }}>No abstracts in this filter.</div>
          ) : (
            filtered.map(a => {
              const st = a.status;
              return (
                <div
                  key={a.id}
                  onClick={() => setActiveId(a.id)}
                  className="px-6 py-4 cursor-pointer transition-colors"
                  style={{
                    borderBottom: '1px solid #E5E0D4',
                    background: activeId === a.id ? '#E8EFEB' : 'transparent',
                  }}
                >
                  <div className="text-[14px] font-medium leading-snug mb-1" style={{ color: '#0F1F18' }}>{a.title}</div>
                  <div className="text-[12px] mb-2" style={{ color: '#6B7A72' }}>{a.authors?.split('·')[0]?.trim()}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center h-5 px-2.5 rounded-full text-[11px] font-medium" style={{ background: '#F0EBE3', color: '#3A4A42' }}>
                      {a.category}
                    </span>
                    <span className="inline-flex items-center h-5 px-2.5 rounded-full text-[11px] font-medium" style={STATUS_STYLE[st]}>
                      {STATUS_LABEL[st]}
                    </span>
                    <span className="ml-auto text-[11px]" style={{ color: '#6B7A72' }}>{relDate(a.submitted_at)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: detail + review */}
        <div className="overflow-y-auto px-4 sm:px-6 lg:px-10 py-8">
          {!active ? (
            <div className="py-16 text-center text-[14px]" style={{ color: '#6B7A72' }}>Select an abstract to review.</div>
          ) : (
            <>
              <h2 className="font-display font-normal text-[24px] mb-2" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
                {active.title}
              </h2>
              <p className="text-[15px] mb-3" style={{ color: '#6B7A72' }}>{active.authors}</p>

              <div className="flex items-center gap-2.5 mb-4">
                <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-medium" style={{ background: '#F0EBE3', color: '#3A4A42' }}>
                  {active.category}
                </span>
                <span className="text-[13px]" style={{ color: '#6B7A72' }}>
                  Submitted {relDate(active.submitted_at)}
                </span>
              </div>

              {active.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  {active.keywords.map(kw => (
                    <span key={kw} className="inline-flex items-center h-6 px-3 rounded-full text-[12px] font-medium" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              <p className="text-[15px] leading-relaxed mb-4" style={{ color: '#3A4A42' }}>{active.body}</p>

              {active.pdf_url && (
                <a href={active.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[14px] font-semibold mb-6" style={{ color: '#C9A45E' }}>
                  <Download size={14} /> Download full paper (PDF)
                </a>
              )}

              {/* Review panel */}
              <div className="rounded-2xl p-6 mt-2" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
                <h3 className="font-display font-medium text-[16px] mb-4" style={{ color: '#0F1F18' }}>Review decision</h3>

                <div className="flex flex-wrap gap-2 mb-4">
                  {DECISIONS.map(d => (
                    <button
                      key={d.key}
                      onClick={() => setDecision(prev => ({ ...prev, [active.id]: d.key }))}
                      className="inline-flex items-center justify-center h-9 px-4 rounded-full text-[13px] font-medium transition-colors"
                      style={{
                        background: currentDecision(active.id) === d.key ? '#1F4D3A' : 'white',
                        border: `1px solid ${currentDecision(active.id) === d.key ? '#1F4D3A' : '#E5E0D4'}`,
                        color: currentDecision(active.id) === d.key ? 'white' : '#3A4A42',
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={notes[active.id] ?? active.review_notes ?? ''}
                  onChange={e => setNotes(prev => ({ ...prev, [active.id]: e.target.value }))}
                  placeholder="Review notes (optional — shared with authors on acceptance/rejection)"
                  className="w-full rounded-xl px-4 py-3 text-[14px] outline-none resize-y transition"
                  style={{ border: '1px solid #E5E0D4', background: '#FAF6EE', minHeight: 80, color: '#0F1F18' }}
                />

                {sessions.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>Assign to session</label>
                    <div className="relative">
                      <select
                        value={assignedSession[active.id] ?? active.assigned_session ?? ''}
                        onChange={e => setAssignedSession(prev => ({ ...prev, [active.id]: e.target.value }))}
                        className="w-full rounded-xl pl-4 pr-10 py-2.5 text-[14px] outline-none appearance-none cursor-pointer"
                        style={{ border: '1px solid #E5E0D4', background: 'white', color: '#0F1F18' }}
                      >
                        <option value="">— No session assigned —</option>
                        {sessions.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#6B7A72' }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-5">
                  <button
                    onClick={() => saveDecision(active.id)}
                    disabled={saving === active.id}
                    className="px-5 py-2.5 rounded-xl font-medium text-[14px] text-white transition-opacity"
                    style={{ background: '#1F4D3A', opacity: saving === active.id ? 0.6 : 1 }}
                  >
                    {saving === active.id ? 'Saving…' : 'Save decision'}
                  </button>
                  <button onClick={goNext} className="text-[13px] font-semibold" style={{ color: '#C9A45E' }}>
                    Next abstract →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
