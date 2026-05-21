'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface AuditEntry {
  id: string;
  actor_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  changes: { before?: Record<string, unknown>; after?: Record<string, unknown> } | null;
  created_at: string;
}

function ActionBadge({ action }: { action: string }) {
  const [ns] = action.split('.');
  const colors: Record<string, { bg: string; color: string }> = {
    theme:     { bg: 'rgba(31,77,58,0.12)',    color: '#1F4D3A' },
    changelog: { bg: 'rgba(58,107,140,0.12)',  color: '#3A6B8C' },
    user:      { bg: 'rgba(201,122,45,0.12)',  color: '#C97A2D' },
  };
  const style = colors[ns] ?? { bg: 'rgba(107,122,114,0.12)', color: '#6B7A72' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] tracking-[0.1em]"
      style={style}
    >
      {action}
    </span>
  );
}

function ChangesExpander({ changes }: { changes: AuditEntry['changes'] }) {
  const [open, setOpen] = useState(false);
  if (!changes) return <span className="text-[#6B7A72] text-[12px]">—</span>;

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-[12px] text-[#3A6B8C] hover:text-[#1F4D3A] transition-colors font-mono"
      >
        {open ? <ChevronDown size={12} strokeWidth={2} /> : <ChevronRight size={12} strokeWidth={2} />}
        {open ? 'Hide' : 'Show'} changes
      </button>
      {open && (
        <pre
          className="mt-2 p-3 rounded-lg text-[11px] leading-relaxed overflow-x-auto"
          style={{ background: '#F5F5F4', border: '1px solid #E5E0D4', color: '#3A4A42', maxWidth: 420 }}
        >
          {JSON.stringify(changes, null, 2)}
        </pre>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function AuditLogTable({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="py-16 text-center text-[14px] text-[#6B7A72]">
        No audit log entries yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border" style={{ borderColor: '#E5E0D4' }}>
      <table className="w-full text-[13px]">
        <thead>
          <tr style={{ background: '#FAF6EE', borderBottom: '1px solid #E5E0D4' }}>
            <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Time</th>
            <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Actor</th>
            <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Action</th>
            <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Entity</th>
            <th className="text-left px-4 py-3 font-mono text-[10px] tracking-[0.14em] uppercase text-[#6B7A72]">Changes</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y" style={{ borderColor: '#E5E0D4' }}>
          {entries.map(e => (
            <tr key={e.id} className="hover:bg-[#FAF6EE]/60 transition-colors">
              <td className="px-4 py-3 font-mono text-[11px] text-[#6B7A72] whitespace-nowrap">
                {formatDate(e.created_at)}
              </td>
              <td className="px-4 py-3 text-[#3A4A42] whitespace-nowrap">
                {e.actor_email ?? '—'}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <ActionBadge action={e.action} />
              </td>
              <td className="px-4 py-3 font-mono text-[11px] text-[#6B7A72]">
                {e.entity_type ? (
                  <span>
                    {e.entity_type}
                    {e.entity_id && <span className="text-[#6B7A72]/60"> #{e.entity_id.slice(0, 8)}</span>}
                  </span>
                ) : '—'}
              </td>
              <td className="px-4 py-3">
                <ChangesExpander changes={e.changes} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
