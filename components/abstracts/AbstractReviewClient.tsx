'use client';

import { useState } from 'react';
import { Download, ChevronDown, FileText, ExternalLink, Settings } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

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

interface Cfp {
  id: string;
  is_open: boolean;
  deadline_at: string | null;
  max_words: number;
  categories: string[];
}

type FilterTab = 'all' | AbstractStatus;

function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const STATUS_LABEL: Record<AbstractStatus, string> = {
  pending: 'Pending', accept: 'Accepted', reject: 'Rejected',
  revision: 'Revision', waitlist: 'Waitlisted',
};

const STATUS_STYLE: Record<AbstractStatus, { bg: string; color: string }> = {
  pending: { bg: '#F5F5F0', color: '#65736B' },
  accept: { bg: '#E8EFEB', color: '#1F4D3A' },
  reject: { bg: 'rgba(184,66,60,0.1)', color: '#B8423C' },
  revision: { bg: '#FEF3C7', color: '#C97A2D' },
  waitlist: { bg: '#E8EFEB', color: '#65736B' },
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
  eventSlug,
  initialAbstracts,
  sessions,
  initialCfp,
}: {
  eventId: string;
  eventSlug: string;
  initialAbstracts: Abstract[];
  sessions: Session[];
  initialCfp: Cfp | null;
}) {
  const [abstracts, setAbstracts] = useState(initialAbstracts);
  const [activeId, setActiveId] = useState(initialAbstracts[0]?.id ?? null);
  const [tab, setTab] = useState<FilterTab>('all');
  const [decision, setDecision] = useState<Record<string, AbstractStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [assignedSession, setAssignedSession] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── CFP settings (open/close, deadline, word limit, categories) ───────────
  // This is the on/off switch for the public /e/{slug}/cfp page. Before this
  // panel existed there was no way to create the call_for_papers row at all —
  // see app/api/events/[id]/cfp/route.ts.
  const [cfp, setCfp] = useState<Cfp | null>(initialCfp);
  const [cfpOpen, setCfpOpen] = useState(false);
  const [cfpForm, setCfpForm] = useState({
    is_open: initialCfp?.is_open ?? true,
    deadline_at: toDateInputValue(initialCfp?.deadline_at ?? null),
    max_words: String(initialCfp?.max_words ?? 400),
    categories: (initialCfp?.categories ?? []).join(', '),
  });
  const [cfpSaving, setCfpSaving] = useState(false);
  const [cfpError, setCfpError] = useState<string | null>(null);

  function openCfpSettings() {
    setCfpForm({
      is_open: cfp?.is_open ?? true,
      deadline_at: toDateInputValue(cfp?.deadline_at ?? null),
      max_words: String(cfp?.max_words ?? 400),
      categories: (cfp?.categories ?? []).join(', '),
    });
    setCfpError(null);
    setCfpOpen(true);
  }

  async function saveCfpSettings() {
    setCfpSaving(true);
    setCfpError(null);
    try {
      const maxWords = parseInt(cfpForm.max_words, 10);
      const res = await fetch(`/api/events/${eventId}/cfp`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_open: cfpForm.is_open,
          deadline_at: cfpForm.deadline_at ? new Date(`${cfpForm.deadline_at}T23:59:59`).toISOString() : null,
          max_words: Number.isFinite(maxWords) && maxWords > 0 ? maxWords : 400,
          categories: cfpForm.categories.split(',').map(c => c.trim()).filter(Boolean),
        }),
      });
      const data = await res.json().catch(() => null) as { cfp?: Cfp; error?: string } | null;
      if (!res.ok || !data?.cfp) {
        setCfpError(data?.error ? JSON.stringify(data.error) : 'Could not save these settings. Please try again.');
        return;
      }
      setCfp(data.cfp);
      setCfpOpen(false);
    } catch {
      setCfpError('Could not save these settings — check your connection and try again.');
    } finally {
      setCfpSaving(false);
    }
  }

  const cfpSettingsModal = (
    <Modal
      open={cfpOpen}
      onClose={() => setCfpOpen(false)}
      title="Call for papers settings"
      subtitle={`Controls the public form at /e/${eventSlug}/cfp`}
      footer={
        <>
          <button onClick={() => setCfpOpen(false)} className="h-10 px-4 rounded-lg text-[13.5px] font-medium border" style={{ borderColor: '#E5E0D4', color: '#65736B' }}>Cancel</button>
          <button onClick={saveCfpSettings} disabled={cfpSaving} className="h-10 px-5 rounded-lg text-[13.5px] font-semibold text-white disabled:opacity-60" style={{ background: '#1F4D3A' }}>
            {cfpSaving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {cfpError && (
          <div className="px-3 py-2.5 rounded-lg text-[13px]" style={{ background: 'rgba(184,66,60,0.07)', border: '1px solid rgba(184,66,60,0.2)', color: '#B8423C' }}>
            {cfpError}
          </div>
        )}

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={cfpForm.is_open}
            onChange={e => setCfpForm(f => ({ ...f, is_open: e.target.checked }))}
            className="rounded"
          />
          <span className="text-sm" style={{ color: '#0F1F18' }}>Accepting submissions</span>
        </label>

        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: '#65736B' }}>Deadline (optional)</label>
          <input
            type="date"
            value={cfpForm.deadline_at}
            onChange={e => setCfpForm(f => ({ ...f, deadline_at: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: '#65736B' }}>Max abstract length (words)</label>
          <input
            type="number"
            min={50}
            value={cfpForm.max_words}
            onChange={e => setCfpForm(f => ({ ...f, max_words: e.target.value }))}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: '#65736B' }}>Categories (comma-separated — leave blank for the default list)</label>
          <textarea
            value={cfpForm.categories}
            onChange={e => setCfpForm(f => ({ ...f, categories: e.target.value }))}
            placeholder="Engineering, Design, Business…"
            rows={2}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
          />
        </div>
      </div>
    </Modal>
  );

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
    setSaveError(null);
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
      const data = await res.json().catch(() => null) as { abstract?: Abstract; error?: string } | null;

      // The old code was `if (data.abstract) { … }` with no else and no catch:
      // a 403, a 500 or a dropped connection stopped the spinner, changed
      // nothing on screen, and said nothing. A reviewer would record the same
      // decision again and again believing it had not registered — and on a
      // non-JSON error body the unguarded res.json() threw on top of that.
      if (!res.ok || !data?.abstract) {
        setSaveError(data?.error ?? 'That decision was not saved. Please try again.');
        return;
      }
      setAbstracts(prev => prev.map(a => a.id === abstractId ? data.abstract! : a));
    } catch {
      setSaveError('That decision was not saved — check your connection and try again.');
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

  // Nothing submitted yet. The page used to render a row of four zeroes, five
  // filter tabs, and a split panel showing "No abstracts in this filter."
  // beside "Select an abstract to review." — two inert sentences and a lot of
  // furniture for a screen with nothing in it, none of which said why it was
  // empty or what to do about it.
  //
  // There was also no `call_for_papers` row to point at: the "Open the
  // submission page" link used to send the organizer to a public page that
  // always answered "submissions are not currently open", with no button
  // anywhere to change that. `cfp` is null until Settings is used once.
  if (abstracts.length === 0) {
    const isOpen = cfp?.is_open ?? false;
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-16">
        {cfpSettingsModal}
        <div className="max-w-[440px] mx-auto text-center">
          <div
            className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: '#E8EFEB' }}
          >
            <FileText size={20} style={{ color: '#1F4D3A' }} />
          </div>
          <h2 className="font-title font-bold text-[18px] mb-2" style={{ color: '#0F1F18' }}>
            No abstracts submitted yet
          </h2>
          <p className="text-[14px] leading-relaxed mb-6" style={{ color: '#65736B' }}>
            {isOpen
              ? 'Submissions land here as speakers send them in. Share your call-for-papers page to start collecting them.'
              : 'Your call for papers is not open yet — speakers won’t see a submission form until you turn it on.'}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={openCfpSettings}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-5 rounded-xl text-[14px] font-semibold"
              style={{ background: isOpen ? '#E8EFEB' : '#1F4D3A', color: isOpen ? '#1F4D3A' : '#FFFFFF' }}
            >
              <Settings size={14} strokeWidth={2} />
              {isOpen ? 'CFP settings' : 'Open call for papers'}
            </button>
            {isOpen && (
              <a
                href={`/e/${eventSlug}/cfp`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 min-h-[44px] px-5 rounded-xl text-[14px] font-semibold"
                style={{ border: '1px solid #E5E0D4', color: '#1F4D3A', textDecoration: 'none' }}
              >
                Open the submission page
                <ExternalLink size={14} strokeWidth={2} />
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#FAF6EE' }}>
      {cfpSettingsModal}
      {/* Stats + tabs header */}
      <div className="px-4 sm:px-6 lg:px-10 pt-7 pb-0">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 mb-5">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {[
              { label: 'submitted', value: counts.total },
              { label: 'accepted', value: counts.accepted },
              { label: 'rejected', value: counts.rejected },
              { label: 'pending review', value: counts.pending },
            ].map(s => (
              <span key={s.label} className="text-[14px]" style={{ color: '#65736B' }}>
                <b className="font-title font-bold text-[16px]" style={{ color: '#0F1F18' }}>{s.value}</b>{' '}{s.label}
              </span>
            ))}
          </div>
          <button
            onClick={openCfpSettings}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-medium shrink-0"
            style={{
              background: cfp?.is_open ? '#E8EFEB' : 'rgba(201,122,45,0.12)',
              color: cfp?.is_open ? '#1F4D3A' : '#C97A2D',
            }}
          >
            <Settings size={13} strokeWidth={2} />
            {cfp?.is_open ? 'CFP open' : 'CFP closed'}
          </button>
        </div>

        {/* The hairline lives on this wrapper and the -mb-px on the scroller,
            NOT on the buttons. With `overflow-x-auto` the CSS spec forces
            overflow-y to `auto` as well, so buttons carrying -mb-px overflowed
            their scroll container by exactly 1px and summoned a vertical
            scrollbar — the stray up/down arrow widget floating at the end of
            the tab row. */}
        <div style={{ borderBottom: '1px solid #E5E0D4' }}>
          <div className="flex gap-0 overflow-x-auto -mb-px">
            {FILTER_TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 shrink-0 whitespace-nowrap"
                style={{
                  color: tab === t.key ? '#1F4D3A' : '#65736B',
                  borderBottomColor: tab === t.key ? '#1F4D3A' : 'transparent',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
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
            <div className="py-12 text-center text-[13px]" style={{ color: '#65736B' }}>No abstracts in this filter.</div>
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
                  <div className="text-[12px] mb-2" style={{ color: '#65736B' }}>{a.authors?.split('·')[0]?.trim()}</div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center h-5 px-2.5 rounded-full text-[11px] font-medium" style={{ background: '#F0EBE3', color: '#3A4A42' }}>
                      {a.category}
                    </span>
                    <span className="inline-flex items-center h-5 px-2.5 rounded-full text-[11px] font-medium" style={STATUS_STYLE[st]}>
                      {STATUS_LABEL[st]}
                    </span>
                    <span className="ml-auto text-[11px]" style={{ color: '#65736B' }}>{relDate(a.submitted_at)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: detail + review */}
        <div className="overflow-y-auto px-4 sm:px-6 lg:px-10 py-8">
          {!active ? (
            <div className="py-16 text-center text-[14px]" style={{ color: '#65736B' }}>Select an abstract to review.</div>
          ) : (
            <>
              <h2 className="font-display font-normal text-[24px] mb-2" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
                {active.title}
              </h2>
              <p className="text-[15px] mb-3" style={{ color: '#65736B' }}>{active.authors}</p>

              <div className="flex items-center gap-2.5 mb-4">
                <span className="inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-medium" style={{ background: '#F0EBE3', color: '#3A4A42' }}>
                  {active.category}
                </span>
                <span className="text-[13px]" style={{ color: '#65736B' }}>
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
                    <label className="block text-[12px] mb-1.5" style={{ color: '#65736B' }}>Assign to session</label>
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
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#65736B' }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-5">
                  <button
                    onClick={() => saveDecision(active.id)}
                    disabled={saving === active.id}
                    className="px-5 min-h-[44px] rounded-xl font-medium text-[14px] text-white transition-opacity"
                    style={{ background: '#1F4D3A', opacity: saving === active.id ? 0.6 : 1 }}
                  >
                    {saving === active.id ? 'Saving…' : 'Save decision'}
                  </button>
                  <button onClick={goNext} className="text-[13px] font-semibold min-h-[44px] px-1" style={{ color: '#1F4D3A' }}>
                    Next abstract →
                  </button>
                </div>
                {saveError && (
                  <p className="text-[13px] mt-3" style={{ color: '#B8423C' }}>{saveError}</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
