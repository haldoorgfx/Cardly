'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plug, Plus, Key, X, Trash2, Copy, Check, AlertTriangle } from 'lucide-react';
import { PageShell, PageHeader } from '@/components/dash';

interface Props {
  eventId: string;
  eventName: string;
}

interface Webhook {
  id: string;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  created_at: string;
  last_fired_at: string | null;
  failure_count: number;
}

// The three events the platform actually fires (see lib/webhooks).
const ALL_EVENTS = ['card.generated', 'event.published', 'event.viewed'] as const;
const EVENT_LABEL: Record<string, string> = {
  'card.generated': 'Card generated',
  'event.published': 'Event published',
  'event.viewed': 'Event viewed',
};

function timeAgo(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function WebhooksView(_props: Props) {
  const [hooks, setHooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/webhooks');
      if (!res.ok) throw new Error(`Failed to load (${res.status})`);
      const data = (await res.json()) as Webhook[];
      setHooks(Array.isArray(data) ? data : []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load webhooks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleEnabled(h: Webhook) {
    setBusyId(h.id);
    try {
      const res = await fetch(`/api/webhooks/${h.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !h.enabled }),
      });
      if (res.ok) setHooks(prev => prev.map(x => (x.id === h.id ? { ...x, enabled: !x.enabled } : x)));
    } finally {
      setBusyId(null);
    }
  }

  async function doDelete(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
      if (res.ok) setHooks(prev => prev.filter(x => x.id !== id));
    } finally {
      setBusyId(null);
      setConfirmDelete(null);
    }
  }

  const atLimit = hooks.length >= 5;

  return (
    <PageShell width="wide">

      {/* Header */}
      <PageHeader
        title="Webhooks"
        subtitle="Receive real-time notifications on your account's events"
        actions={
          <button
            onClick={() => setShowModal(true)}
            disabled={atLimit}
            title={atLimit ? 'Maximum 5 webhooks per account' : 'Add a webhook endpoint'}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-white text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#1F4D3A' }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Add endpoint
          </button>
        }
      />

      {/* Info banner */}
      <div
        className="flex items-start gap-2.5 px-4 py-3 rounded-xl mb-7 text-[12.5px]"
        style={{ background: '#F5F7F5', border: '1px solid #E5E0D4' }}
      >
        <Key size={14} strokeWidth={2} style={{ color: '#1F4D3A', flexShrink: 0, marginTop: 1 }} />
        <span style={{ color: '#3A4A42' }}>
          Each endpoint gets a signing secret. Verify the{' '}
          <code className="px-1 py-0.5 rounded text-[12.5px]" style={{ background: '#EDE9E0' }}>
            X-Eventera-Signature
          </code>{' '}
          header (HMAC-SHA256) on every request. Webhooks apply account-wide, across all your events.
        </span>
      </div>

      {/* Endpoints */}
      <h2 className="text-[12.5px] font-semibold mb-3" style={{ color: '#3A4A42', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Endpoints
      </h2>

      {loading ? (
        <div className="space-y-2.5">
          {[0, 1].map(i => (
            <div key={i} className="h-[68px] rounded-2xl animate-pulse" style={{ background: '#F0EDE6' }} />
          ))}
        </div>
      ) : loadError ? (
        <div className="rounded-2xl px-5 py-6 flex items-center gap-3" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
          <AlertTriangle size={16} style={{ color: '#B8423C' }} />
          <span className="text-[13px] flex-1" style={{ color: '#3A4A42' }}>{loadError}</span>
          <button onClick={load} className="text-[12.5px] font-medium px-3 py-1.5 rounded-lg border" style={{ borderColor: '#E5E0D4', color: '#1F4D3A' }}>
            Retry
          </button>
        </div>
      ) : hooks.length === 0 ? (
        <div className="rounded-2xl border border-dashed py-12 px-6 text-center" style={{ borderColor: '#E5E0D4' }}>
          <div className="mx-auto h-10 w-10 rounded-xl grid place-items-center mb-3" style={{ background: '#E8EFEB' }}>
            <Plug size={16} strokeWidth={1.8} style={{ color: '#1F4D3A' }} />
          </div>
          <p className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>No webhook endpoints yet</p>
          <p className="text-[13px] mt-1 max-w-[360px] mx-auto" style={{ color: '#3A4A42' }}>
            Add an endpoint to get a POST request whenever a card is generated or your event is published or viewed.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg text-white text-[12.5px] font-semibold transition hover:opacity-90"
            style={{ background: '#1F4D3A' }}
          >
            <Plus size={13} strokeWidth={2.5} /> Add endpoint
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {hooks.map(ep => {
            const failing = ep.failure_count > 0;
            return (
              <div
                key={ep.id}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl"
                style={{ background: 'white', border: '1px solid #E5E0D4', opacity: ep.enabled ? 1 : 0.65 }}
              >
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: failing ? 'rgba(184,66,60,0.08)' : 'rgba(31,77,58,0.08)' }}
                >
                  <Plug size={15} strokeWidth={2} style={{ color: failing ? '#B8423C' : '#1F4D3A' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] truncate" style={{ color: '#0F1F18' }}>{ep.url}</p>
                  <p className="text-[12.5px] mt-0.5 truncate" style={{ color: '#3A4A42' }}>
                    {ep.events.map(e => EVENT_LABEL[e] ?? e).join(', ')} · last fired {timeAgo(ep.last_fired_at)}
                    {failing && ` · ${ep.failure_count} failure${ep.failure_count === 1 ? '' : 's'}`}
                  </p>
                </div>
                {/* Enable toggle */}
                <button
                  onClick={() => toggleEnabled(ep)}
                  disabled={busyId === ep.id}
                  role="switch"
                  aria-checked={ep.enabled}
                  aria-label={ep.enabled ? 'Disable webhook' : 'Enable webhook'}
                  className="relative h-5 w-9 rounded-full shrink-0 transition disabled:opacity-50"
                  style={{ background: ep.enabled ? '#1F4D3A' : '#C9C3B1' }}
                >
                  <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all" style={{ left: ep.enabled ? 18 : 2 }} />
                </button>
                {/* Delete */}
                {confirmDelete === ep.id ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => doDelete(ep.id)} disabled={busyId === ep.id}
                      className="text-[13px] font-medium px-2.5 py-1 rounded-lg text-white disabled:opacity-60" style={{ background: '#B8423C' }}>
                      {busyId === ep.id ? '…' : 'Delete'}
                    </button>
                    <button onClick={() => setConfirmDelete(null)}
                      className="text-[13px] font-medium px-2.5 py-1 rounded-lg border" style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(ep.id)}
                    aria-label="Delete webhook"
                    className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition hover:bg-[#FEF2F2]"
                    style={{ color: '#6B7A72' }}
                  >
                    <Trash2 size={14} strokeWidth={1.8} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add endpoint modal */}
      {showModal && (
        <AddEndpointModal
          onClose={() => setShowModal(false)}
          onCreated={(hook) => {
            setHooks(prev => [hook, ...prev]);
          }}
        />
      )}
    </PageShell>
  );
}

/* ── Add endpoint modal ─────────────────────────────────────────────────────── */
function AddEndpointModal({ onClose, onCreated }: { onClose: () => void; onCreated: (h: Webhook) => void }) {
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['card.generated']);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<Webhook | null>(null);
  const [copied, setCopied] = useState(false);

  function toggleEvent(ev: string) {
    setSelectedEvents(prev => (prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]));
  }

  async function handleSave() {
    const trimmed = url.trim();
    if (!trimmed) { setError('URL is required'); return; }
    try { new URL(trimmed); } catch { setError('Enter a valid URL (e.g. https://your-server.com/webhook)'); return; }
    if (selectedEvents.length === 0) { setError('Select at least one event type'); return; }
    setError('');
    setSaving(true);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, events: selectedEvents }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError((data && data.error) || `Failed to create (${res.status})`); return; }
      setCreated(data as Webhook);
      onCreated(data as Webhook);
    } catch {
      setError('Something went wrong. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  function copySecret() {
    if (!created) return;
    navigator.clipboard.writeText(created.secret).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,31,24,0.45)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[480px] rounded-2xl" style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 24px 60px rgba(31,77,58,0.18)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <h2 className="font-display font-semibold text-[17px]" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
            {created ? 'Endpoint created' : 'Add webhook endpoint'}
          </h2>
          <button onClick={onClose} aria-label="Close" className="h-7 w-7 rounded-lg flex items-center justify-center transition hover:bg-[#FAF6EE]" style={{ color: '#6B7A72' }}>
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {created ? (
          /* Secret reveal — shown once */
          <div className="px-6 py-5 space-y-4">
            <p className="text-[13px]" style={{ color: '#3A4A42' }}>
              Save this signing secret now — it won&apos;t be shown in full again. Use it to verify the
              {' '}<code className="px-1 py-0.5 rounded text-[12.5px]" style={{ background: '#EDE9E0' }}>X-Eventera-Signature</code> header.
            </p>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: '#0F1F18' }}>
              <code className="flex-1 text-[12px] break-all" style={{ color: '#E8C57E' }}>{created.secret}</code>
              <button onClick={copySecret} className="shrink-0 flex items-center gap-1 text-[12px] px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.1)', color: copied ? '#7BD6A0' : 'rgba(255,255,255,0.7)' }}>
                {copied ? <Check size={11} /> : <Copy size={11} />}{copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="flex justify-end pt-1">
              <button onClick={onClose} className="h-9 px-5 rounded-xl text-[13px] font-semibold text-white" style={{ background: '#1F4D3A' }}>Done</button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-4 sm:px-6 py-5 space-y-5">
              {error && (
                <div className="px-4 py-3 rounded-xl text-[13px] font-medium" style={{ background: '#FEF2F2', color: '#B8423C', border: '1px solid #FECACA' }}>
                  {error}
                </div>
              )}
              {/* URL */}
              <div>
                <label className="block text-[12.5px] font-medium mb-1.5" style={{ color: '#0F1F18' }}>
                  Endpoint URL <span style={{ color: '#B8423C' }}>*</span>
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={e => { setUrl(e.target.value); setError(''); }}
                  placeholder="https://your-server.com/webhook"
                  autoFocus
                  className="w-full h-10 rounded-xl px-3 text-[13px] outline-none transition"
                  style={{ border: error ? '1.5px solid #B8423C' : '1.5px solid #E5E0D4', color: '#0F1F18' }}
                  onFocus={e => { if (!error) e.currentTarget.style.borderColor = '#1F4D3A'; }}
                  onBlur={e => { if (!error) e.currentTarget.style.borderColor = '#E5E0D4'; }}
                />
                <p className="text-[13px] mt-1.5" style={{ color: '#6B7A72' }}>Must be HTTPS and publicly reachable.</p>
              </div>

              {/* Event types */}
              <div>
                <label className="block text-[12.5px] font-medium mb-2" style={{ color: '#0F1F18' }}>Event types</label>
                <div className="grid gap-2">
                  {ALL_EVENTS.map(ev => {
                    const on = selectedEvents.includes(ev);
                    return (
                      <label key={ev} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition"
                        style={{ border: `1.5px solid ${on ? '#1F4D3A' : '#E5E0D4'}`, background: on ? 'rgba(31,77,58,0.06)' : 'white' }}>
                        <input type="checkbox" checked={on} onChange={() => toggleEvent(ev)} className="sr-only" />
                        <div className="h-4 w-4 rounded flex items-center justify-center shrink-0"
                          style={{ border: `1.5px solid ${on ? '#1F4D3A' : '#C9C3B1'}`, background: on ? '#1F4D3A' : 'white' }}>
                          {on && (
                            <svg width="9" height="7" viewBox="0 0 8 6" fill="none"><path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          )}
                        </div>
                        <span className="text-[12.5px] font-medium" style={{ color: on ? '#1F4D3A' : '#0F1F18' }}>{EVENT_LABEL[ev]}</span>
                        <code className="ml-auto text-[12.5px]" style={{ color: '#6B7A72' }}>{ev}</code>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #E5E0D4' }}>
              <button onClick={onClose} className="h-9 px-4 rounded-xl text-[13px] font-medium transition hover:bg-[#FAF6EE]" style={{ border: '1px solid #E5E0D4', color: '#3A4A42' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="h-9 px-5 rounded-xl text-[13px] font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                style={{ background: '#1F4D3A', minWidth: 120 }}>
                {saving ? 'Saving…' : 'Add endpoint'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
