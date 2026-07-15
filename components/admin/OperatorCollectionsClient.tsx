'use client';

import { useState } from 'react';
import { Plus, CheckCircle2, XCircle, Radio, Clock, LayoutGrid, List, AlertCircle, Loader2, X } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Collection = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Promoted = any;

function qualityScore(q: Record<string, boolean>) {
  const checks = Object.values(q);
  return checks.filter(Boolean).length;
}

export function OperatorCollectionsClient({ collections, promoted: dbPromoted }: { collections: Collection[]; promoted: Promoted[] }) {
  // Real DB data only — no fabricated demo rows (admins must never see fiction
  // they can "approve"). Empty states below handle the no-data case honestly.
  const [promoted, setPromoted] = useState<Promoted[]>(dbPromoted);
  const [activeTab, setActiveTab] = useState<'collections' | 'review'>('collections');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; text: string } | null>(null);
  const [notice, setNotice] = useState('');

  // Bulk selection (review queue)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const allSelected = promoted.length > 0 && promoted.every((p: Promoted) => selectedIds.has(p.id));
  const clearSelection = () => setSelectedIds(new Set());
  const toggleOne = (id: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelectedIds(allSelected ? new Set() : new Set(promoted.map((p: Promoted) => p.id)));

  // Bulk approve / reject — loops the existing per-listing PATCH endpoint so its
  // permission checks apply to every row. Rows drop as the batch resolves.
  async function runBulk(action: 'approve' | 'reject') {
    if (action === 'reject' &&
        !confirm(`Reject ${selectedIds.size} promoted listing${selectedIds.size === 1 ? '' : 's'}? The organizer${selectedIds.size === 1 ? '' : 's'} will need to resubmit.`)) {
      return;
    }
    setBulkBusy(true);
    setActionError(null);
    const ids = Array.from(selectedIds);
    try {
      const results = await Promise.allSettled(
        ids.map(id =>
          fetch(`/api/admin/promoted/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action }),
          }),
        ),
      );
      const okIds = ids.filter(
        (_, i) => results[i].status === 'fulfilled' &&
          (results[i] as PromiseFulfilledResult<Response>).value.ok,
      );
      setPromoted(prev => prev.filter(p => !okIds.includes(p.id)));
      clearSelection();
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleAction(id: string, action: 'approve' | 'reject') {
    if (action === 'reject' && !confirm('Reject this promoted listing? The organizer will need to resubmit.')) return;
    setProcessingId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/promoted/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError({ id, text: data.error ?? `Could not ${action} — please try again.` });
        return;
      }
      // Only drop the row once the server confirms the change.
      setPromoted(prev => prev.filter(p => p.id !== id));
    } catch {
      setActionError({ id, text: 'Network error — please try again.' });
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div>
      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display font-bold text-[28px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
              Marketplace curation
            </h1>
            <p className="text-[14px] mt-1" style={{ color: '#6B7A72' }}>
              Manage event collections and review promoted listing requests
            </p>
          </div>
          <button
            onClick={() => setNotice('Collection creation is managed server-side for now — new collections are seeded via migration. A create form is coming to this panel.')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1F4D3A]"
            style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
            <Plus size={15} /> New collection
          </button>
        </div>

        {notice && (
          <div className="mb-4 rounded-xl px-4 py-3 flex items-start justify-between gap-3 text-[13px]" role="status"
            style={{ background: '#E8EFEB', border: '1px solid rgba(31,77,58,0.18)', color: '#1F4D3A' }}>
            <span>{notice}</span>
            <button onClick={() => setNotice('')} className="shrink-0 text-[12.5px] underline">Dismiss</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: '#E5E0D4' }}>
          {[
            { key: 'collections', label: 'Collections', icon: LayoutGrid },
            { key: 'review', label: `Pending review ${promoted.length > 0 ? `(${promoted.length})` : ''}`, icon: List },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as 'collections' | 'review')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition"
              style={{
                background: activeTab === tab.key ? '#FFFFFF' : 'transparent',
                color: activeTab === tab.key ? '#0F1F18' : '#6B7A72',
                boxShadow: activeTab === tab.key ? '0 1px 3px rgba(15,31,24,0.08)' : 'none',
              }}>
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Collections tab */}
        {activeTab === 'collections' && (
          <div className="grid grid-cols-1 gap-3">
            {collections.length === 0 && (
              <div className="rounded-2xl py-16 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
                <LayoutGrid size={30} style={{ color: '#C9C3B1' }} className="mx-auto mb-3" />
                <p className="font-medium text-[15px]" style={{ color: '#0F1F18' }}>No collections yet</p>
                <p className="text-[13px] mt-1" style={{ color: '#3A4A42' }}>Curated marketplace collections will appear here once created.</p>
              </div>
            )}
            {collections.map((col: Collection) => (
              <div key={col.id} className="rounded-2xl p-5 flex items-center gap-5"
                style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
                {/* Color swatch */}
                <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center"
                  style={{ background: col.cover_color ?? '#1F4D3A' }}>
                  <LayoutGrid size={18} style={{ color: 'rgba(255,255,255,0.7)' }} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-[15px]" style={{ color: '#0F1F18' }}>{col.name}</span>
                    {col.status === 'live' ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[12.5px] font-semibold"
                        style={{ background: 'rgba(45,122,79,0.1)', color: '#2D7A4F' }}>
                        <Radio size={9} className="animate-pulse" /> Live
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[12.5px] font-semibold"
                        style={{ background: 'rgba(107,122,114,0.1)', color: '#6B7A72' }}>
                        <Clock size={9} /> Scheduled
                      </span>
                    )}
                  </div>
                  {col.description && (
                    <p className="text-[12px] truncate" style={{ color: '#6B7A72' }}>{col.description}</p>
                  )}
                </div>

                {/* Count */}
                <div className="text-right shrink-0">
                  <div className="font-bold text-[20px]" style={{ color: '#0F1F18', fontFamily: 'Inter, system-ui, sans-serif' }}>
                    {col.event_count ?? 0}
                  </div>
                  <div className="text-[12.5px]" style={{ color: '#6B7A72' }}>events</div>
                </div>
              </div>
            ))}

            {/* Feed rules card */}
            <div className="rounded-2xl p-5" style={{ background: '#E8EFEB', border: '1px solid rgba(31,77,58,0.18)' }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={15} style={{ color: '#6B7A72' }} />
                <span className="font-semibold text-[13px]" style={{ color: '#0F1F18' }}>Feed rules</span>
              </div>
              <p className="text-[12px]" style={{ color: '#3A4A42' }}>
                Collections with <strong>Live</strong> status appear on the marketplace homepage. Events are sorted by starts_at. Each collection can hold up to 50 events. Promoted listings appear at the top of relevant collections after operator approval.
              </p>
            </div>
          </div>
        )}

        {/* Review tab */}
        {activeTab === 'review' && (
          <div className="flex flex-col gap-4">
            {/* Select all */}
            {promoted.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer text-[13px] w-fit" style={{ color: '#6B7A72' }}>
                <input
                  type="checkbox"
                  aria-label="Select all listings"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer"
                />
                Select all
              </label>
            )}

            {/* Bulk action bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1F4D3A]/25 bg-[#E8EFEB]">
                <span className="text-[13px] font-medium text-[#1F4D3A]">
                  {selectedIds.size} selected
                </span>
                <div className="flex-1" />
                {bulkBusy && <Loader2 size={14} className="animate-spin text-[#1F4D3A]" />}
                <button
                  disabled={bulkBusy}
                  onClick={() => runBulk('approve')}
                  className="h-8 px-3 rounded-lg text-[12px] font-medium text-white hover:opacity-90 transition disabled:opacity-50"
                  style={{ background: '#1F4D3A' }}
                >
                  Approve
                </button>
                <button
                  disabled={bulkBusy}
                  onClick={() => runBulk('reject')}
                  className="h-8 px-3 rounded-lg text-[12px] font-medium border border-[#E5E0D4] bg-white text-[#B8423C] hover:bg-[rgba(184,66,60,0.08)] transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
                <button
                  disabled={bulkBusy}
                  onClick={clearSelection}
                  title="Clear selection"
                  className="h-8 w-8 grid place-items-center rounded-lg border border-[#E5E0D4] bg-white text-[#6B7A72] hover:bg-[#FAF6EE] transition-colors disabled:opacity-50"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {promoted.length === 0 ? (
              <div className="rounded-2xl py-20 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
                <CheckCircle2 size={32} style={{ color: '#C9C3B1' }} className="mx-auto mb-3" />
                <p className="font-medium text-[15px]" style={{ color: '#0F1F18' }}>All caught up</p>
                <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>No promoted listings awaiting review</p>
              </div>
            ) : (
              promoted.map((p: Promoted) => {
                const ep = p.event_pages;
                const q = p.quality ?? {};
                const score = qualityScore(q);
                const total = Object.keys(q).length || 4;
                const qualityChecks = [
                  { key: 'cover', label: 'Cover image' },
                  { key: 'description', label: 'Description' },
                  { key: 'tickets', label: 'Tickets live' },
                  { key: 'external_links', label: 'No ext links' },
                ];

                return (
                  <div key={p.id} className="rounded-2xl overflow-hidden"
                    style={{ background: '#FFFFFF', border: `1px solid ${selectedIds.has(p.id) ? '#1F4D3A' : '#E5E0D4'}` }}>
                    <div className="p-5">
                      <div className="flex items-start gap-4 mb-4">
                        {/* Select checkbox */}
                        <input
                          type="checkbox"
                          aria-label={`Select ${ep?.title ?? 'listing'}`}
                          checked={selectedIds.has(p.id)}
                          onChange={() => toggleOne(p.id)}
                          className="mt-1 h-4 w-4 rounded border-[#E5E0D4] accent-[#1F4D3A] cursor-pointer shrink-0"
                        />
                        {/* Cover */}
                        <div className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center"
                          style={{ background: '#E8EFEB' }}>
                          {ep?.cover_image_url
                            // eslint-disable-next-line @next/next/no-img-element
                            ? <img src={ep.cover_image_url} alt="" className="w-14 h-14 rounded-xl object-cover" />
                            : <LayoutGrid size={20} style={{ color: '#1F4D3A' }} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[15px] mb-0.5" style={{ color: '#0F1F18' }}>
                            {ep?.title ?? 'Untitled event'}
                          </h3>
                          <p className="text-[12px]" style={{ color: '#6B7A72' }}>
                            {ep?.city && ep?.venue_name ? `${ep.venue_name}, ${ep.city}` : ep?.city ?? ep?.venue_name ?? 'Location TBA'}
                            {ep?.starts_at ? ` · ${new Date(ep.starts_at).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                          </p>
                          <p className="text-[12.5px] mt-0.5" style={{ color: '#C9C3B1', fontFamily: 'Inter, system-ui, sans-serif' }}>
                            Submitted {new Date(p.submitted_at).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>

                        {/* Quality score */}
                        <div className="text-right shrink-0">
                          <div className="font-bold text-[18px]" style={{ color: score >= total ? '#2D7A4F' : score >= total - 1 ? '#C97A2D' : '#B8423C', fontFamily: 'Inter, system-ui, sans-serif' }}>
                            {score}/{total}
                          </div>
                          <div className="text-[12px]" style={{ color: '#6B7A72' }}>quality</div>
                        </div>
                      </div>

                      {/* Quality checks */}
                      <div className="grid grid-cols-2 gap-1.5 mb-4">
                        {qualityChecks.map(qc => {
                          const passed = q[qc.key] !== false;
                          return (
                            <div key={qc.key} className="flex items-center gap-1.5 text-[12px]"
                              style={{ color: passed ? '#2D7A4F' : '#B8423C' }}>
                              {passed
                                ? <CheckCircle2 size={12} />
                                : <XCircle size={12} />}
                              {qc.label}
                            </div>
                          );
                        })}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          disabled={processingId === p.id}
                          onClick={() => handleAction(p.id, 'approve')}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-50"
                          style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
                          <CheckCircle2 size={14} /> Approve
                        </button>
                        <button
                          disabled={processingId === p.id}
                          onClick={() => handleAction(p.id, 'reject')}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-50"
                          style={{ background: 'rgba(184,66,60,0.08)', color: '#B8423C', border: '1px solid rgba(184,66,60,0.25)' }}>
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                      {actionError && actionError.id === p.id && (
                        <p role="alert" className="text-[12px] mt-2.5" style={{ color: '#B8423C' }}>{actionError.text}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
