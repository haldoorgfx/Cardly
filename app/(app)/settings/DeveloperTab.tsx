'use client';

import { useState, useEffect } from 'react';
import { Key, Webhook, Plus, Trash2, Copy, Check, Eye, EyeOff, ExternalLink } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
}

interface WebhookRow {
  id: string;
  url: string;
  events: string[];
  enabled: boolean;
  created_at: string;
  last_fired_at: string | null;
  failure_count: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}
      className="h-7 w-7 rounded-lg grid place-items-center transition hover:bg-[#FAF6EE]"
      style={{ color: copied ? '#1F4D3A' : '#6B7A72' }}
      title="Copy"
    >
      {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} />}
    </button>
  );
}

// ─── API Keys section ─────────────────────────────────────────────────────────

function ApiKeysSection({ plan }: { plan: string }) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/keys').then(r => r.json()).then(d => { setKeys(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true); setError('');
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Failed to create key.'); setCreating(false); return; }
    setNewKey(data.key);
    setKeys(prev => [data.record, ...prev]);
    setNewName('');
    setCreating(false);
  }

  async function revoke(id: string) {
    if (!confirm('Revoke this key? Any integrations using it will stop working.')) return;
    await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    setKeys(prev => prev.filter(k => k.id !== id));
  }

  if (plan !== 'studio') {
    return (
      <div className="text-center py-8">
        <Key size={28} strokeWidth={1.4} color="#C9C3B1" className="mx-auto mb-3" />
        <p className="text-[13px] text-[#6B7A72] mb-4">API keys are available on the Studio plan.</p>
        <a href="/settings/billing" className="inline-flex items-center gap-1.5 h-8 px-4 text-[13px] font-semibold text-white rounded-lg" style={{ background: '#1F4D3A' }}>
          Upgrade to Studio →
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Reveal new key */}
      {newKey && (
        <div className="mb-4 rounded-xl p-4" style={{ background: 'rgba(31,77,58,0.06)', border: '1px solid rgba(31,77,58,0.2)' }}>
          <div className="text-[12px] font-semibold text-[#1F4D3A] mb-2">Your new API key — copy it now, it won&apos;t be shown again</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-[12px] break-all text-[#0F1F18]">
              {showKey ? newKey : newKey.slice(0, 16) + '…'}
            </code>
            <button onClick={() => setShowKey(s => !s)} className="h-7 w-7 grid place-items-center text-[#6B7A72] hover:text-[#0F1F18]">
              {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <CopyBtn text={newKey} />
          </div>
          <button onClick={() => setNewKey(null)} className="mt-2 text-[11px] text-[#6B7A72] hover:underline">Dismiss</button>
        </div>
      )}

      {/* Create form */}
      <form onSubmit={create} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Key name (e.g. Production)"
          maxLength={60}
          className="flex-1 h-9 px-3 text-[13px] rounded-lg border outline-none transition focus:border-[#1F4D3A] focus:ring-[3px] focus:ring-[rgba(31,77,58,0.1)]"
          style={{ borderColor: '#E5E0D4' }}
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="h-9 px-4 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50 inline-flex items-center gap-1.5"
          style={{ background: '#1F4D3A' }}
        >
          <Plus size={12} strokeWidth={2.8} />
          {creating ? 'Creating…' : 'Create'}
        </button>
      </form>
      {error && <p className="text-[12px] text-red-600 mb-3">{error}</p>}

      {/* Keys list */}
      {loading ? (
        <div className="text-[13px] text-[#6B7A72]">Loading…</div>
      ) : keys.length === 0 ? (
        <div className="text-center py-6 text-[13px] text-[#6B7A72]">No API keys yet.</div>
      ) : (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#E5E0D4' }}>
          {keys.map((k, i) => (
            <div
              key={k.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: i < keys.length - 1 ? '1px solid #E5E0D4' : 'none' }}
            >
              <Key size={13} strokeWidth={2} color="#6B7A72" className="shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[#0F1F18]">{k.name}</div>
                <div className="text-[11.5px] font-mono text-[#6B7A72]">
                  {k.key_prefix}… · created {relativeTime(k.created_at)}
                  {k.last_used_at && ` · last used ${relativeTime(k.last_used_at)}`}
                </div>
              </div>
              <button
                onClick={() => revoke(k.id)}
                className="h-7 w-7 grid place-items-center rounded-lg transition hover:bg-red-50"
                style={{ color: '#B8423C' }}
                title="Revoke key"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-[12px] text-[#6B7A72]">
        Use as a Bearer token: <code className="font-mono text-[11px] bg-[#FAF6EE] px-1.5 py-0.5 rounded-md">Authorization: Bearer sk_live_…</code> · API endpoint: <code className="font-mono text-[11px] bg-[#FAF6EE] px-1.5 py-0.5 rounded-md">POST /api/v1/render</code>
      </p>
    </div>
  );
}

// ─── Webhooks section ─────────────────────────────────────────────────────────

const ALL_EVENTS = [
  { value: 'card.generated', label: 'Card generated', desc: 'Fires when an attendee generates a card' },
  { value: 'event.published', label: 'Event published', desc: 'Fires when you publish an event' },
  { value: 'event.viewed', label: 'Event viewed', desc: 'Fires on each attendee page visit' },
];

function WebhooksSection() {
  const [hooks, setHooks] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['card.generated']);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/webhooks').then(r => r.json()).then(d => { setHooks(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  function toggleEvent(ev: string) {
    setSelectedEvents(prev => prev.includes(ev) ? prev.filter(e => e !== ev) : [...prev, ev]);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || selectedEvents.length === 0) return;
    setCreating(true); setError('');
    const res = await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim(), events: selectedEvents }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Failed.'); setCreating(false); return; }
    setHooks(prev => [data, ...prev]);
    setUrl('');
    setSelectedEvents(['card.generated']);
    setCreating(false);
  }

  async function toggle(id: string, enabled: boolean) {
    await fetch(`/api/webhooks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled }) });
    setHooks(prev => prev.map(h => h.id === id ? { ...h, enabled } : h));
  }

  async function remove(id: string) {
    if (!confirm('Delete this webhook?')) return;
    await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
    setHooks(prev => prev.filter(h => h.id !== id));
  }

  return (
    <div>
      <form onSubmit={create} className="space-y-3 mb-4">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://your-server.com/webhook"
          className="w-full h-9 px-3 text-[13px] rounded-lg border outline-none transition focus:border-[#1F4D3A] focus:ring-[3px] focus:ring-[rgba(31,77,58,0.1)]"
          style={{ borderColor: '#E5E0D4' }}
        />
        <div className="flex items-center gap-3 flex-wrap">
          {ALL_EVENTS.map(ev => (
            <label key={ev.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedEvents.includes(ev.value)}
                onChange={() => toggleEvent(ev.value)}
                className="rounded"
              />
              <span className="text-[12.5px] text-[#3A4A42]">{ev.label}</span>
            </label>
          ))}
          <button
            type="submit"
            disabled={creating || !url.trim() || selectedEvents.length === 0}
            className="ml-auto h-9 px-4 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50 inline-flex items-center gap-1.5"
            style={{ background: '#1F4D3A' }}
          >
            <Plus size={12} strokeWidth={2.8} />
            {creating ? 'Adding…' : 'Add webhook'}
          </button>
        </div>
        {error && <p className="text-[12px] text-red-600">{error}</p>}
      </form>

      {loading ? (
        <div className="text-[13px] text-[#6B7A72]">Loading…</div>
      ) : hooks.length === 0 ? (
        <div className="text-center py-6 text-[13px] text-[#6B7A72]">No webhooks yet.</div>
      ) : (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#E5E0D4' }}>
          {hooks.map((h, i) => (
            <div
              key={h.id}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: i < hooks.length - 1 ? '1px solid #E5E0D4' : 'none', opacity: h.enabled ? 1 : 0.5 }}
            >
              <Webhook size={13} strokeWidth={2} color="#6B7A72" className="shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-mono text-[#0F1F18] truncate">{h.url}</span>
                  <a href={h.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[#6B7A72] hover:text-[#1F4D3A]">
                    <ExternalLink size={11} strokeWidth={2} />
                  </a>
                </div>
                <div className="text-[11.5px] text-[#6B7A72] mt-0.5">
                  {h.events.join(', ')}
                  {h.last_fired_at && ` · last fired ${relativeTime(h.last_fired_at)}`}
                  {h.failure_count > 0 && <span className="text-[#C97A2D] ml-1">· {h.failure_count} failure{h.failure_count !== 1 ? 's' : ''}</span>}
                </div>
              </div>
              <button
                onClick={() => toggle(h.id, !h.enabled)}
                className="text-[11px] font-mono px-2 py-1 rounded-lg transition"
                style={{ background: h.enabled ? 'rgba(31,77,58,0.08)' : '#F5F5F0', color: h.enabled ? '#1F4D3A' : '#6B7A72' }}
              >
                {h.enabled ? 'Enabled' : 'Disabled'}
              </button>
              <button
                onClick={() => remove(h.id)}
                className="h-7 w-7 grid place-items-center rounded-lg transition hover:bg-red-50"
                style={{ color: '#B8423C' }}
                title="Delete webhook"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-[12px] text-[#6B7A72]">
        Each request includes an <code className="font-mono text-[11px] bg-[#FAF6EE] px-1 py-0.5 rounded-md">X-Karta-Signature</code> header (HMAC-SHA256) for verification.
      </p>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function DeveloperTab({ plan }: { plan: string }) {
  return (
    <div className="space-y-5">
      {/* API Keys */}
      <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Key size={15} strokeWidth={2} color="#1F4D3A" />
          <div className="text-[13.5px] font-semibold text-[#0F1F18]">API keys</div>
          {plan === 'studio' && (
            <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(31,77,58,0.08)', color: '#1F4D3A' }}>
              STUDIO
            </span>
          )}
        </div>
        <ApiKeysSection plan={plan} />
      </div>

      {/* Webhooks */}
      <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Webhook size={15} strokeWidth={2} color="#1F4D3A" />
          <div className="text-[13.5px] font-semibold text-[#0F1F18]">Webhooks</div>
        </div>
        <WebhooksSection />
      </div>
    </div>
  );
}
