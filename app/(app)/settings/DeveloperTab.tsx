'use client';

import { useState, useEffect } from 'react';
import { Key, Webhook, Plus, Trash2, Copy, Check, ExternalLink } from 'lucide-react';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import { AUTO_DISABLE_AFTER } from '@/lib/webhooks/constants';

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
  /** Full value only on the create response; truncated in the list. */
  secret?: string;
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
      style={{ color: copied ? '#1F4D3A' : '#65736B' }}
      title="Copy"
    >
      {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} />}
    </button>
  );
}

// ─── API Keys section ─────────────────────────────────────────────────────────

const BASE_URL = `${(process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')}/api/v1`;

function ApiKeysSection({ plan }: { plan: string }) {
  const confirm = useConfirm();
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
    if (!(await confirm({
      title: 'Revoke this key?',
      body: 'Any integrations using it will stop working immediately.',
      confirmLabel: 'Revoke',
      danger: true,
    }))) return;
    await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    setKeys(prev => prev.filter(k => k.id !== id));
  }

  async function rotate(id: string) {
    if (!(await confirm({
      title: 'Rotate this key?',
      body: 'The current key stops working immediately and a new one is issued.',
      confirmLabel: 'Rotate',
      danger: true,
    }))) return;
    const res = await fetch(`/api/keys/${id}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'rotate' }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Failed to rotate key.'); return; }
    // Swap the old key row for the freshly issued one and reveal the new secret.
    setKeys(prev => [data.record, ...prev.filter(k => k.id !== id)]);
    setNewKey(data.key);
  }

  if (plan !== 'studio') {
    return (
      <div className="text-center py-8">
        <Key size={28} strokeWidth={1.4} color="#C9C3B1" className="mx-auto mb-3" />
        <p className="text-[13px] text-[#65736B] mb-4">API keys are available on the Studio plan.</p>
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
        <span className="text-[13px]" style={{ color: '#65736B' }}>Base URL:</span>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full  text-[13px]" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}>
          {BASE_URL}
          <CopyBtn text={BASE_URL} />
        </div>
        <a href="/developers" target="_blank" rel="noopener noreferrer" className="ml-auto text-[13px] font-semibold" style={{ color: '#C9A45E' }}>
          View API docs →
        </a>
      </div>

      {/* New key revealed modal */}
      {newKey && (
        <div className="mb-5 rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 4px 12px rgba(15,31,24,0.08)' }}>
          <div className="font-display font-medium text-[18px] mb-1" style={{ color: '#0F1F18' }}>Your new API key</div>
          <div className="text-[13px] mb-4" style={{ color: '#65736B' }}>Copy this key now — it won&apos;t be shown again.</div>
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
              style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#65736B' }}
            >
              I&apos;ve copied my key
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      <div className="rounded-2xl p-5 mb-5" style={{ background: 'white', border: '1px solid #E5E0D4' }}>
        <div className="font-display font-medium text-[16px] mb-4" style={{ color: '#0F1F18' }}>Create API key</div>
        <form onSubmit={create}>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className="block text-[12px] mb-1.5" style={{ color: '#65736B' }}>Key name</label>
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
              <label className="block text-[12px] mb-1.5" style={{ color: '#65736B' }}>Scope</label>
              <select
                value={newScopes}
                onChange={e => setNewScopes(e.target.value)}
                className="w-full h-10 px-3 text-[13px] rounded-lg border outline-none appearance-none"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
              >
                {SCOPE_OPTIONS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
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
      <div className="font-display font-medium text-[16px] mb-3" style={{ color: '#0F1F18' }}>Active keys</div>
      {loading ? (
        <div className="text-[13px] text-[#65736B]">Loading…</div>
      ) : keys.length === 0 ? (
        <div className="text-center py-8 rounded-2xl text-[13px]" style={{ background: 'white', border: '1px solid #E5E0D4', color: '#65736B' }}>
          No API keys yet.
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
          {/* Desktop table (md+) */}
          <div className="hidden md:block overflow-x-auto">
          <table className="w-full" style={{ minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #E5E0D4', background: '#FAF6EE' }}>
                {['Name', 'Key', 'Scopes', 'Last used', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[12.5px] font-semibold uppercase tracking-wider" style={{ color: '#65736B' }}>
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
                    <span className="font-display font-medium text-[14px]" style={{ color: '#0F1F18' }}>{k.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full  text-[12px] w-fit" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}>
                      {k.key_prefix}…
                      <CopyBtn text={k.key_prefix} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(k.scopes ?? ['events:read']).map(s => (
                        <span key={s} className="inline-flex items-center h-5 px-2 rounded-full text-[12.5px] font-medium" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3  text-[12px] whitespace-nowrap" style={{ color: '#65736B' }}>
                    {k.last_used_at ? relativeTime(k.last_used_at) : '—'}
                  </td>
                  <td className="px-4 py-3  text-[12px] whitespace-nowrap" style={{ color: '#65736B' }}>
                    {new Date(k.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 whitespace-nowrap">
                      <button onClick={() => rotate(k.id)} className="text-[13px] font-medium" style={{ color: '#3A4A42' }}>
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

          {/* Mobile cards (below md) — no sideways scrolling */}
          <div className="md:hidden divide-y" style={{ borderColor: '#F0EBE3' }}>
            {keys.map(k => (
              <div key={k.id} className="p-4" style={{ background: 'white' }}>
                <div className="flex items-start justify-between gap-3">
                  <span className="font-display font-medium text-[14px]" style={{ color: '#0F1F18' }}>{k.name}</span>
                  <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
                    <button onClick={() => rotate(k.id)} className="text-[13px] font-medium" style={{ color: '#3A4A42' }}>
                      Rotate
                    </button>
                    <button onClick={() => revoke(k.id)} className="text-[13px] font-medium" style={{ color: '#B8423C' }}>
                      Revoke
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 mt-2.5 rounded-full text-[12px] w-fit" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}>
                  {k.key_prefix}…
                  <CopyBtn text={k.key_prefix} />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {(k.scopes ?? ['events:read']).map(s => (
                    <span key={s} className="inline-flex items-center h-5 px-2 rounded-full text-[12.5px] font-medium whitespace-nowrap" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-x-3 gap-y-1 flex-wrap mt-2.5 text-[12px]" style={{ color: '#65736B' }}>
                  <span className="whitespace-nowrap">Last used {k.last_used_at ? relativeTime(k.last_used_at) : '—'}</span>
                  <span className="whitespace-nowrap">· Created {new Date(k.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
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

function WebhooksSection({ plan }: { plan: string }) {
  const confirm = useConfirm();
  const [hooks, setHooks] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['card.generated']);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  // Shown once, immediately after create or rotate. Never re-fetchable — the
  // list endpoint only ever returns a truncated secret.
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

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
    // The create response is the one moment the full signing secret exists
    // client-side. Surfacing it here is what makes signature verification
    // possible at all — previously it was returned and silently dropped.
    if (data.secret) setRevealedSecret(data.secret);
    setUrl('');
    setSelectedEvents(['card.generated']);
    setCreating(false);
  }

  async function rotateSecret(id: string) {
    if (!(await confirm({
      title: 'Issue a new signing secret?',
      body: 'The current secret stops verifying immediately. Update your receiver with the new one.',
      confirmLabel: 'Rotate secret',
      danger: true,
    }))) return;
    const res = await fetch(`/api/webhooks/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'rotate_secret' }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Failed to rotate secret.'); return; }
    setRevealedSecret(data.secret);
  }

  async function toggle(id: string, enabled: boolean) {
    await fetch(`/api/webhooks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled }) });
    setHooks(prev => prev.map(h => h.id === id ? { ...h, enabled } : h));
  }

  async function remove(id: string) {
    if (!(await confirm({
      title: 'Delete this webhook?',
      body: 'It will stop receiving events immediately.',
      confirmLabel: 'Delete',
      danger: true,
    }))) return;
    await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
    setHooks(prev => prev.filter(h => h.id !== id));
  }

  if (plan !== 'studio') {
    return (
      <div className="text-center py-8">
        <Webhook size={28} strokeWidth={1.4} color="#C9C3B1" className="mx-auto mb-3" />
        <p className="text-[13px] text-[#65736B] mb-4">Webhooks are available on the Studio plan.</p>
        <a href="/settings/billing" className="inline-flex items-center gap-1.5 h-8 px-4 text-[13px] font-semibold text-white rounded-lg" style={{ background: '#1F4D3A' }}>
          Upgrade to Studio →
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Signing secret — shown once, on create or rotate. */}
      {revealedSecret && (
        <div className="mb-5 rounded-2xl p-5" style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 4px 12px rgba(15,31,24,0.08)' }}>
          <div className="font-display font-medium text-[18px] mb-1" style={{ color: '#0F1F18' }}>Your webhook signing secret</div>
          <div className="text-[13px] mb-4" style={{ color: '#65736B' }}>
            Copy this now — it won&apos;t be shown again. Use it to verify the{' '}
            <code className="text-[12.5px] bg-[#FAF6EE] px-1 py-0.5 rounded-md">X-Eventera-Signature</code> header on every delivery.
          </div>
          <div className="rounded-xl px-4 py-3 text-[14px] break-all mb-4" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
            {revealedSecret}
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => navigator.clipboard.writeText(revealedSecret)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold text-white"
              style={{ background: '#1F4D3A' }}
            >
              <Copy size={13} /> Copy secret
            </button>
            <button
              onClick={() => setRevealedSecret(null)}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
              style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#65736B' }}
            >
              I&apos;ve copied my secret
            </button>
          </div>
        </div>
      )}

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
        <div className="text-[13px] text-[#65736B]">Loading…</div>
      ) : hooks.length === 0 ? (
        <div className="text-center py-6 text-[13px] text-[#65736B]">No webhooks yet.</div>
      ) : (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#E5E0D4' }}>
          {hooks.map((h, i) => (
            <div
              key={h.id}
              className="flex items-start sm:items-center gap-3 flex-wrap px-4 py-3"
              style={{ borderBottom: i < hooks.length - 1 ? '1px solid #E5E0D4' : 'none', opacity: h.enabled ? 1 : 0.5 }}
            >
              <Webhook size={13} strokeWidth={2} color="#65736B" className="shrink-0 mt-1 sm:mt-0" />
              <div className="flex-1 min-w-0 basis-[60%]">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-[#0F1F18] truncate">{h.url}</span>
                  <a href={h.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[#65736B] hover:text-[#1F4D3A]">
                    <ExternalLink size={11} strokeWidth={2} />
                  </a>
                </div>
                <div className="text-[13px] text-[#65736B] mt-0.5">
                  {h.events.join(', ')}
                  {h.last_fired_at && ` · last fired ${relativeTime(h.last_fired_at)}`}
                  {h.failure_count > 0 && <span className="text-[#C97A2D] ml-1">· {h.failure_count} failure{h.failure_count !== 1 ? 's' : ''}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                <button
                  onClick={() => rotateSecret(h.id)}
                  className="text-[12.5px] px-2 py-1 rounded-lg transition hover:bg-[#FAF6EE] whitespace-nowrap"
                  style={{ color: '#3A4A42' }}
                  title="Issue a new signing secret"
                >
                  Rotate secret
                </button>
                <button
                  onClick={() => toggle(h.id, !h.enabled)}
                  className="text-[12.5px] px-2 py-1 rounded-lg transition whitespace-nowrap"
                  style={{ background: h.enabled ? 'rgba(31,77,58,0.08)' : '#F5F5F0', color: h.enabled ? '#1F4D3A' : '#65736B' }}
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
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-[12px] text-[#65736B]">
        Each request includes an <code className="font-sans text-[12.5px] bg-[#FAF6EE] px-1 py-0.5 rounded-md">X-Eventera-Signature</code> header (HMAC-SHA256 of the raw body, keyed with your signing secret). The secret is shown once when you add a webhook — use <span style={{ color: '#3A4A42' }}>Rotate secret</span> to issue a new one if you lose it. A webhook is switched off automatically after {AUTO_DISABLE_AFTER} consecutive failed deliveries.
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
          <Key size={15} strokeWidth={2} color="#65736B" />
          <div className="text-[13.5px] font-semibold text-[#0F1F18]">API keys</div>
          {plan === 'studio' && (
            <span className="ml-auto text-[12px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(31,77,58,0.08)', color: '#1F4D3A' }}>
              STUDIO
            </span>
          )}
        </div>
        <ApiKeysSection plan={plan} />
      </div>

      {/* Webhooks */}
      <div className="bg-white rounded-2xl p-6 border" style={{ borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Webhook size={15} strokeWidth={2} color="#65736B" />
          <div className="text-[13.5px] font-semibold text-[#0F1F18]">Webhooks</div>
          {plan === 'studio' && (
            <span className="ml-auto text-[12px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(31,77,58,0.08)', color: '#1F4D3A' }}>
              STUDIO
            </span>
          )}
        </div>
        <WebhooksSection plan={plan} />
      </div>
    </div>
  );
}
