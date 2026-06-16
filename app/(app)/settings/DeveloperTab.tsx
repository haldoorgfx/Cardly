'use client';

import { useState, useEffect } from 'react';
import { Key, Webhook, Plus, Trash2, Copy, Check, ExternalLink } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
}

const SCOPE_OPTIONS = [
  { value: 'events:read',         label: 'events:read' },
  { value: 'registrations:read',  label: 'registrations:read' },
  { value: 'analytics:read',      label: 'analytics:read' },
  { value: 'checkin:write',       label: 'checkin:write' },
  { value: 'full_access',         label: 'full_access' },
] as const;

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

const BASE_URL = 'https://karta.cre8so.com/api/v1';

function ApiKeysSection({ plan }: { plan: string }) {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newScopes, setNewScopes] = useState('events:read, registrations:read');
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/keys').then(r => r.json()).then(d => { setKeys(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true); setError('');
    const scopes = newScopes.split(',').map(s => s.trim()).filter(Boolean);
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), scopes }),
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
      {/* Base URL strip */}
      <div className="flex items-center gap-3 flex-wrap py-4 mb-2" style={{ borderBottom: '1px solid #E5E0D4' }}>
        <span className="text-[13px]" style={{ color: '#6B7A72' }}>Base URL:</span>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full  text-[13px]" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#1F4D3A' }}>
          {BASE_URL}
          <CopyBtn text={BASE_URL} />
        </div>
        <a href="#" className="ml-auto text-[13px] font-semibold" style={{ color: '#C9A45E' }}>
          View API docs →
        </a>
      </div>

      {/* New key revealed modal */}
      {newKey && (
        <div className="mb-5 rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 4px 12px rgba(15,31,24,0.08)' }}>
          <div className="font-display font-medium text-[18px] mb-1" style={{ color: '#1F4D3A' }}>Your new API key</div>
          <div className="text-[13px] mb-4" style={{ color: '#6B7A72' }}>Copy this key now — it won&apos;t be shown again.</div>
          <div className="rounded-xl px-4 py-3  text-[14px] break-all mb-4" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
            {newKey}
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => navigator.clipboard.writeText(newKey)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white"
              style={{ background: '#1F4D3A' }}
            >
              <Copy size={13} /> Copy key
            </button>
            <button
              onClick={() => setNewKey(null)}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
              style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#6B7A72' }}
            >
              I&apos;ve copied my key
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
        <div className="font-display font-medium text-[16px] mb-4" style={{ color: '#1F4D3A' }}>Create API key</div>
        <form onSubmit={create}>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>Key name</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. My CRM integration"
                maxLength={60}
                className="w-full h-10 px-3 text-[13px] rounded-lg border outline-none transition focus:border-[#1F4D3A] focus:ring-[3px] focus:ring-[rgba(31,77,58,0.1)]"
                style={{ borderColor: '#E5E0D4' }}
              />
            </div>
            <div>
              <label className="block text-[12px] mb-1.5" style={{ color: '#6B7A72' }}>Scope</label>
              <select
                value={newScopes}
                onChange={e => setNewScopes(e.target.value)}
                className="w-full h-10 px-3 text-[13px] rounded-lg border outline-none appearance-none"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
              >
                {SCOPE_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
                <option value="events:read, registrations:read">events:read, registrations:read</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={creating || !newName.trim()}
                className="h-10 px-5 text-[13px] font-semibold text-white rounded-lg disabled:opacity-50 inline-flex items-center gap-1.5 whitespace-nowrap"
                style={{ background: '#1F4D3A' }}
              >
                <Plus size={12} strokeWidth={2.8} />
                {creating ? 'Creating…' : 'Create key'}
              </button>
            </div>
          </div>
          {error && <p className="text-[12px] text-red-600 mt-2">{error}</p>}
        </form>
      </div>

      {/* Keys table */}
      <div className="font-display font-medium text-[16px] mb-3" style={{ color: '#1F4D3A' }}>Active keys</div>
      {loading ? (
        <div className="text-[13px] text-[#6B7A72]">Loading…</div>
      ) : keys.length === 0 ? (
        <div className="text-center py-8 rounded-2xl text-[13px]" style={{ background: 'white', border: '1px solid #E5E0D4', color: '#6B7A72' }}>
          No API keys yet.
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
          <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E0D4', background: '#FAF6EE' }}>
                {['Name', 'Key', 'Scopes', 'Last used', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#6B7A72' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((k, i) => (
                <tr
                  key={k.id}
                  style={{ borderBottom: i < keys.length - 1 ? '1px solid #F0EBE3' : 'none', background: 'white' }}
                >
                  <td className="px-4 py-3">
                    <span className="font-display font-medium text-[14px]" style={{ color: '#1F4D3A' }}>{k.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full  text-[12px] w-fit" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#1F4D3A' }}>
                      {k.key_prefix}…
                      <CopyBtn text={k.key_prefix} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(k.scopes ?? ['events:read']).map(s => (
                        <span key={s} className="inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3  text-[12px]" style={{ color: '#6B7A72' }}>
                    {k.last_used_at ? relativeTime(k.last_used_at) : '—'}
                  </td>
                  <td className="px-4 py-3  text-[12px]" style={{ color: '#6B7A72' }}>
                    {new Date(k.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button className="text-[13px] font-medium" style={{ color: '#3A4A42' }}>
                        Rotate
                      </button>
                      <button
                        onClick={() => revoke(k.id)}
                        className="text-[13px] font-medium"
                        style={{ color: '#B8423C' }}
                      >
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
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
                  <span className="text-[13px] text-[#0F1F18] truncate">{h.url}</span>
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
                className="text-[11px] px-2 py-1 rounded-lg transition"
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
        Each request includes an <code className=" text-[11px] bg-[#FAF6EE] px-1 py-0.5 rounded-md">X-Eventera-Signature</code> header (HMAC-SHA256) for verification.
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
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(31,77,58,0.08)', color: '#1F4D3A' }}>
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
