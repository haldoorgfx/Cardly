export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Settings2 } from 'lucide-react';
import {
  PageShell, Btn, StatCards, GateNotice, Panel, AreaChart, Toggle,
} from '@/components/dashboard/ui';

interface Props { params: Promise<{ id: string }> }

const AREA_POINTS = [
  { label: 'Jan 1', v: 12 }, { label: 'Jan 5', v: 28 }, { label: 'Jan 10', v: 45 },
  { label: 'Jan 15', v: 89 }, { label: 'Jan 20', v: 134 }, { label: 'Jan 25', v: 210 },
  { label: 'Jan 30', v: 286 }, { label: 'Feb 5', v: 340 }, { label: 'Feb 10', v: 412 },
  { label: 'Feb 15', v: 486 },
];

const TOP_CONNECTORS = [
  { name: 'Amara Osei', connections: 42, org: 'Paystack' },
  { name: 'Kofi Mensah', connections: 38, org: 'Andela' },
  { name: 'Zara Diallo', connections: 31, org: 'Google Africa' },
  { name: 'Emmanuel Okonkwo', connections: 27, org: 'Lagos Angels' },
  { name: 'Fatima Al-Hassan', connections: 24, org: 'Kuda Bank' },
];

export default async function NetworkingPage({ params }: Props) {
  const { id } = await params;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: profile }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    admin.from('profiles').select('plan').eq('id', user.id).single(),
  ]);

  if (!event) redirect('/dashboard');

  const plan = profile?.plan ?? 'free';
  const isLocked = plan === 'free';

  return (
    <PageShell
      title="Networking"
      subtitle="Attendee connections & AI matchmaking"
      actions={<Btn variant="primary" icon={Settings2}>Matchmaking settings</Btn>}
    >
      {isLocked && (
        <GateNotice featureLabel="Networking" planLabel="Pro" />
      )}

      <StatCards items={[
        { value: '486', label: 'Connections made' },
        { value: '1,204', label: 'Messages sent' },
        { value: '92', label: 'Meetings booked' },
        { value: '68%', label: 'Match acceptance' },
      ]} />

      <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
        <Panel title="Connections over time">
          <AreaChart points={AREA_POINTS} height={180} />
        </Panel>
        <Panel title="Top connectors">
          <div className="space-y-3">
            {TOP_CONNECTORS.map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-full grid place-items-center font-bold text-[11px] text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg,#1F4D3A,#2A6A50)' }}
                >
                  {c.name.split(' ').map(w => w[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#0F1F18] truncate">{c.name}</div>
                  <div className="text-[11px] text-[#6B7A72]">{c.org}</div>
                </div>
                <span className="font-mono text-[12px] text-[#1F4D3A] font-semibold shrink-0">
                  {c.connections} connections
                </span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="AI matchmaking">
        <div className="space-y-0">
          {[
            { label: 'Match by interests', desc: 'Connect attendees with similar professional interests', on: true },
            { label: 'Match by goals', desc: 'Pair attendees who want to meet investors, find jobs, or find collaborators', on: true },
            { label: 'Suggest sessions', desc: 'Recommend agenda sessions based on attendee profile', on: false },
          ].map((row, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-4"
              style={{ borderTop: i > 0 ? '1px solid #E5E0D4' : undefined }}
            >
              <div>
                <div className="text-[13.5px] font-medium text-[#0F1F18]">{row.label}</div>
                <div className="text-[12.5px] mt-0.5" style={{ color: '#6B7A72' }}>{row.desc}</div>
              </div>
              <Toggle on={row.on} onChange={() => {}} />
            </div>
          ))}
        </div>
      </Panel>
    </PageShell>
  );
}
