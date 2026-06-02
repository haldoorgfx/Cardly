export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Download, Plus } from 'lucide-react';
import { PageShell, Btn, StatCards, GateNotice, SectionLabel, Pill, ProgressBar } from '@/components/dashboard/ui';

interface Props { params: Promise<{ id: string }> }

const TIERS = [
  {
    name: 'Platinum',
    color: '#E8C57E',
    sponsors: [
      { name: 'Paystack', leads: 180, booth: true },
      { name: 'Andela', leads: 142, booth: true },
    ],
  },
  {
    name: 'Gold',
    color: '#C0C0C0',
    sponsors: [
      { name: 'Flutterwave', leads: 96, booth: true },
      { name: 'Kuda Bank', leads: 72, booth: false },
      { name: 'Carbon', leads: 54, booth: false },
    ],
  },
  {
    name: 'Silver',
    color: '#CD7F32',
    sponsors: [
      { name: 'Risevest', leads: 28, booth: false },
      { name: 'Moniepoint', leads: 18, booth: false },
      { name: 'Brass', leads: 12, booth: false },
      { name: 'PiggyVest', leads: 8, booth: false },
    ],
  },
];

const MAX_LEADS = 180;

export default async function SponsorsPage({ params }: Props) {
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
  const isLocked = plan !== 'studio';

  return (
    <PageShell
      title="Sponsors"
      subtitle="9 sponsors · 590 leads captured"
      actions={
        <>
          <Btn variant="ghost" icon={Download}>Export leads</Btn>
          <Btn variant="primary" icon={Plus}>Add sponsor</Btn>
        </>
      }
    >
      {isLocked && <GateNotice featureLabel="Sponsors" planLabel="Studio" />}

      <StatCards items={[
        { value: '9', label: 'Sponsors' },
        { value: '590', label: 'Leads captured' },
        { value: '66', label: 'Avg leads / sponsor' },
        { value: '3', label: 'Booth sessions' },
      ]} />

      <div className="space-y-6">
        {TIERS.map((tier) => (
          <div key={tier.name}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 w-2 rounded-full" style={{ background: tier.color }} />
              <SectionLabel className="mb-0">{tier.name}</SectionLabel>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tier.sponsors.map((sp, i) => (
                <div
                  key={i}
                  className="bg-white border rounded-2xl p-4"
                  style={{ borderColor: '#E5E0D4' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="h-10 w-10 rounded-xl border grid place-items-center font-display font-bold text-[14px]"
                      style={{ borderColor: '#E5E0D4', background: '#FAF6EE', color: '#1F4D3A' }}
                    >
                      {sp.name[0]}
                    </div>
                    {sp.booth && <Pill tone="forest">Booth</Pill>}
                  </div>
                  <div className="font-semibold text-[14px] text-[#0F1F18] mb-2">{sp.name}</div>
                  <div className="flex items-center justify-between text-[12px] mb-1.5">
                    <span style={{ color: '#6B7A72' }}>Leads captured</span>
                    <span className="font-mono font-semibold text-[#1F4D3A]">{sp.leads}</span>
                  </div>
                  <ProgressBar pct={(sp.leads / MAX_LEADS) * 100} height={5} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
