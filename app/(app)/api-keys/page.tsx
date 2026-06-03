'use client';

import { Key, Copy, Trash2, Info } from 'lucide-react';
import { PageShell, Btn, Table, Row, Cell, Pill } from '@/components/dashboard/ui';

const MOCK_KEYS = [
  { name: 'Production', key: 'krt_live_sk_••••••••••••••••••••••••••••XkZ3', scope: ['Read', 'Write'], lastUsed: '2 hours ago', created: 'Jan 12, 2025' },
  { name: 'Check-in app', key: 'krt_live_sk_••••••••••••••••••••••••••••mN8q', scope: ['Check-in'], lastUsed: '5 min ago', created: 'Feb 3, 2025' },
  { name: 'Analytics export', key: 'krt_live_sk_••••••••••••••••••••••••••••p2Jv', scope: ['Read only'], lastUsed: '1 day ago', created: 'Mar 7, 2025' },
];

export default function ApiKeysPage() {
  return (
    <PageShell
      title="API Keys"
      subtitle="Authenticate requests to the Karta API"
      actions={<Btn variant="primary" icon={Key}>Create key</Btn>}
    >
      {/* Info banner */}
      <div
        className="flex items-start gap-3 px-5 py-4 rounded-xl border mb-6"
        style={{ background: '#E8EFEB/40', borderColor: 'rgba(31,77,58,0.15)', backgroundColor: 'rgba(232,239,235,0.4)' }}
      >
        <Info size={15} strokeWidth={1.8} color="#1F4D3A" className="shrink-0 mt-0.5" />
        <p className="text-[13px]" style={{ color: '#3A4A42' }}>
          Keep your API keys secret. Never expose them in client-side code or public repositories.
          Regenerate any key you believe has been compromised.
        </p>
      </div>

      {/* Keys table */}
      <Table head={['Name', 'Key', 'Scope', 'Last used', 'Created', '']}>
        {MOCK_KEYS.map((k, i) => (
          <Row key={i}>
            <Cell>
              <span className="font-medium text-[#0F1F18]">{k.name}</span>
            </Cell>
            <Cell>
              <span
                className="font-mono text-[12px] px-2 py-1 rounded border"
                style={{ background: '#FAF6EE', borderColor: '#E5E0D4', color: '#3A4A42' }}
              >
                {k.key}
              </span>
            </Cell>
            <Cell>
              <div className="flex gap-1.5 flex-wrap">
                {k.scope.map(s => (
                  <Pill key={s} tone="forest">{s}</Pill>
                ))}
              </div>
            </Cell>
            <Cell>
              <span className="font-mono text-[12px]">{k.lastUsed}</span>
            </Cell>
            <Cell>
              <span className="font-mono text-[12px]">{k.created}</span>
            </Cell>
            <Cell>
              <div className="flex items-center gap-2">
                <button
                  className="h-7 w-7 rounded-lg grid place-items-center transition hover:bg-[#E8EFEB]"
                  title="Copy key"
                >
                  <Copy size={13} strokeWidth={1.8} color="#6B7A72" />
                </button>
                <button
                  className="h-7 w-7 rounded-lg grid place-items-center transition hover:bg-red-50"
                  title="Revoke key"
                >
                  <Trash2 size={13} strokeWidth={1.8} color="#B8423C" />
                </button>
              </div>
            </Cell>
          </Row>
        ))}
      </Table>

      {/* Docs note */}
      <div className="mt-6 text-[13px]" style={{ color: '#6B7A72' }}>
        Read the{' '}
        <a href="/docs/api" className="text-[#1F4D3A] font-medium hover:underline">
          API documentation
        </a>{' '}
        to get started. Base URL:{' '}
        <code
          className="font-mono text-[12px] px-1.5 py-0.5 rounded"
          style={{ background: '#E8EFEB', color: '#1F4D3A' }}
        >
          https://karta.cre8so.com/api/v1
        </code>
      </div>
    </PageShell>
  );
}
