'use client';

import { useState, useTransition } from 'react';

interface Resource {
  id: string;
  name: string;
  url: string;
  kind: string | null;
  file_size_bytes: number | null;
  opens: number;
}

interface Props {
  resources: Resource[];
  token: string;
}

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function kindLabel(kind: string | null, bytes: number | null) {
  const parts: string[] = [];
  if (kind) parts.push(kind.toUpperCase());
  const size = formatSize(bytes);
  if (size) parts.push(size);
  return parts.join(' · ') || 'Link';
}

function ExternalIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
    </svg>
  );
}

export function ResourcesTab({ resources: initial, token }: Props) {
  const [resources, setResources] = useState(initial);
  const [showAdd, setShowAdd]     = useState(false);
  const [name, setName]           = useState('');
  const [url, setUrl]             = useState('');
  const [isPending, startTransition] = useTransition();

  function handleAdd() {
    if (!name || !url) return;
    startTransition(async () => {
      const res = await fetch('/api/exhibitor/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, url }),
      });
      const data = await res.json();
      if (data.resource) {
        setResources(prev => [data.resource, ...prev]);
        setName(''); setUrl(''); setShowAdd(false);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await fetch(`/api/exhibitor/resources?id=${id}&token=${token}`, { method: 'DELETE' });
      setResources(prev => prev.filter(r => r.id !== id));
    });
  }

  return (
    <div className="bg-white rounded-2xl border" style={{ borderColor: '#E5E0D4' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(229,224,212,0.7)' }}>
        <div className="font-display text-[14px] font-semibold tracking-tight" style={{ color: '#0F1F18' }}>Booth resources</div>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-medium transition-colors border"
          style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}
        >
          <svg width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add resource
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="px-5 py-4 border-b grid gap-3" style={{ borderColor: 'rgba(229,224,212,0.7)', background: 'rgba(250,246,238,0.5)' }}>
          <input
            type="text" aria-label="Resource name" placeholder="Resource name" value={name} onChange={e => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2.5 text-[13.5px] outline-none focus:ring-2 bg-white"
            style={{ borderColor: '#E5E0D4', color: '#0F1F18', '--tw-ring-color': 'rgba(31,77,58,0.15)' } as React.CSSProperties}
          />
          <input
            type="url" aria-label="Resource URL" placeholder="https://…" value={url} onChange={e => setUrl(e.target.value)}
            className="w-full border rounded-lg px-3 py-2.5 text-[13.5px] outline-none focus:ring-2 bg-white"
            style={{ borderColor: '#E5E0D4', color: '#0F1F18', '--tw-ring-color': 'rgba(31,77,58,0.15)' } as React.CSSProperties}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd} disabled={isPending || !name || !url}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13.5px] font-medium text-white"
              style={{ background: '#1F4D3A', opacity: (!name || !url) ? 0.6 : 1 }}
            >
              {isPending ? 'Adding…' : 'Add'}
            </button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-xl text-[13.5px] border" style={{ borderColor: '#E5E0D4', color: '#65736B' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {resources.length === 0 ? (
        <div className="px-5 py-10 text-center text-[13.5px]" style={{ color: '#65736B' }}>
          No resources yet. Add a one-pager, demo video, or job listings.
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'rgba(229,224,212,0.6)' }}>
          {resources.map(r => (
            <div key={r.id} className="group flex items-center gap-3.5 px-5 py-3.5">
              <span className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                <ExternalIcon size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium truncate" style={{ color: '#0F1F18' }}>{r.name}</div>
                <div className=" text-[11px] mt-0.5" style={{ color: '#65736B' }}>{kindLabel(r.kind, r.file_size_bytes)}</div>
              </div>
              <span className=" text-[11px] shrink-0 whitespace-nowrap" style={{ color: '#65736B' }}>{r.opens} opens</span>
              <button
                onClick={() => handleDelete(r.id)}
                className="w-10 h-10 grid place-items-center rounded-lg transition-colors shrink-0 opacity-60 sm:opacity-0 sm:group-hover:opacity-100"
                style={{ color: '#B8423C' }}
                title="Remove"
              >
                <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
