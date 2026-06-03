'use client';

import { Plug, CheckCircle2, XCircle } from 'lucide-react';
import { PageShell, Btn, SectionLabel, Panel, Table, Row, Cell, Pill } from '@/components/dashboard/ui';

const ENDPOINTS = [
  {
    url: 'https://api.myapp.com/karta/events',
    events: ['registration.created', 'registration.checked_in'],
    lastPing: '2 min ago',
    status: 'active',
  },
  {
    url: 'https://hooks.zapier.com/hooks/catch/12345/abcde',
    events: ['registration.created'],
    lastPing: '1 hour ago',
    status: 'active',
  },
  {
    url: 'https://api.crm.io/webhooks/karta',
    events: ['event.published', 'registration.created', 'registration.checked_in'],
    lastPing: '3 days ago',
    status: 'failing',
  },
];

const DELIVERIES = [
  { event: 'registration.created', code: 200, when: '2 min ago', ok: true },
  { event: 'registration.checked_in', code: 200, when: '15 min ago', ok: true },
  { event: 'registration.created', code: 500, when: '1 hour ago', ok: false },
  { event: 'event.published', code: 200, when: '3 hours ago', ok: true },
  { event: 'registration.created', code: 200, when: '5 hours ago', ok: true },
];

export default function WebhooksPage() {
  return (
    <PageShell
      title="Webhooks"
      subtitle="Receive real-time event notifications"
      actions={<Btn variant="primary" icon={Plug}>Add endpoint</Btn>}
    >
      <SectionLabel>Endpoints</SectionLabel>

      <div className="space-y-3 mb-7">
        {ENDPOINTS.map((ep, i) => (
          <div
            key={i}
            className="bg-white border rounded-2xl p-5"
            style={{ borderColor: '#E5E0D4' }}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3">
                <div
                  className="h-9 w-9 rounded-xl grid place-items-center shrink-0 mt-0.5"
                  style={{ background: '#E8EFEB' }}
                >
                  <Plug size={16} strokeWidth={1.8} color="#1F4D3A" />
                </div>
                <div>
                  <div
                    className="font-mono text-[13px] font-medium"
                    style={{ color: '#0F1F18' }}
                  >
                    {ep.url}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {ep.events.map(ev => (
                      <span
                        key={ev}
                        className="font-mono text-[11px] px-2 py-0.5 rounded-full border"
                        style={{ background: '#FAF6EE', borderColor: '#E5E0D4', color: '#3A4A42' }}
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[12px] font-mono" style={{ color: '#6B7A72' }}>
                  Last ping: {ep.lastPing}
                </span>
                <Pill tone={ep.status === 'active' ? 'green' : 'red'} dot={ep.status === 'active' ? '#2D7A4F' : '#B8423C'}>
                  {ep.status === 'active' ? 'Active' : 'Failing'}
                </Pill>
                <Btn variant="ghost">Edit</Btn>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Panel title="Recent deliveries">
        <Table head={['Event', 'Response', 'When']}>
          {DELIVERIES.map((d, i) => (
            <Row key={i}>
              <Cell>
                <span className="font-mono text-[12px]">{d.event}</span>
              </Cell>
              <Cell>
                <div className="flex items-center gap-2">
                  {d.ok
                    ? <CheckCircle2 size={14} strokeWidth={2} color="#2D7A4F" />
                    : <XCircle size={14} strokeWidth={2} color="#B8423C" />}
                  <span className={`font-mono text-[12px] font-medium ${d.ok ? 'text-emerald-700' : 'text-red-700'}`}>
                    {d.code}
                  </span>
                </div>
              </Cell>
              <Cell>
                <span className="font-mono text-[12px]" style={{ color: '#6B7A72' }}>{d.when}</span>
              </Cell>
            </Row>
          ))}
        </Table>
      </Panel>
    </PageShell>
  );
}
