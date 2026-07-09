export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Settings2, Trophy, Zap, ScanLine, Network, MessageSquare, CalendarDays } from 'lucide-react';
import { PageShell, Btn, GateNotice, Panel, ProgressBar, SectionLabel } from '@/components/dashboard/ui';

interface Props { params: Promise<{ id: string }> }

const LEADERBOARD = [
  { rank: 1, name: 'Amara Osei', org: 'Paystack', points: 2840, medal: '#E8C57E' },
  { rank: 2, name: 'Kofi Mensah', org: 'Andela', points: 2340, medal: '#C0C0C0' },
  { rank: 3, name: 'Zara Diallo', org: 'Google Africa', points: 1980, medal: '#CD7F32' },
  { rank: 4, name: 'Emmanuel Okonkwo', org: 'Lagos Angels', points: 1560, medal: undefined },
  { rank: 5, name: 'Fatima Al-Hassan', org: 'Kuda Bank', points: 1240, medal: undefined },
  { rank: 6, name: 'Ahmed Khalil', org: 'African Union', points: 980, medal: undefined },
];

const POINT_SOURCES = [
  { label: 'Check-in', icon: ScanLine, points: 500, color: '#1F4D3A' },
  { label: 'Session attended', icon: CalendarDays, points: 200, color: '#2A6A50' },
  { label: 'Connection made', icon: Network, points: 100, color: '#E8C57E' },
  { label: 'Message sent', icon: MessageSquare, points: 50, color: '#3A6B8C' },
];

const BADGES = [
  { name: 'Early Bird', desc: 'First 50 check-ins', color: '#E8C57E', earned: 48 },
  { name: 'Connector', desc: '10+ connections', color: '#2D7A4F', earned: 134 },
  { name: 'Session Fan', desc: '5+ sessions attended', color: '#3A6B8C', earned: 67 },
  { name: 'Networker', desc: '25+ connections', color: '#C9A45E', earned: 22 },
];

export default async function GamificationPage({ params }: Props) {
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

  const maxPoints = LEADERBOARD[0].points;

  return (
    <PageShell
      title="Gamification"
      subtitle="Points, badges & leaderboard"
      actions={<Btn variant="primary" icon={Settings2}>Configure points</Btn>}
    >
      {isLocked && <GateNotice featureLabel="Gamification" planLabel="Pro" />}

      <div className="grid gap-5" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        {/* Leaderboard */}
        <Panel title="Leaderboard">
          <div className="space-y-3">
            {LEADERBOARD.map((row) => (
              <div key={row.rank} className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-full grid place-items-center font-mono font-bold text-[12px] shrink-0"
                  style={row.medal
                    ? { background: `${row.medal}22`, color: row.medal, border: `1px solid ${row.medal}60` }
                    : { background: '#E8EFEB', color: '#6B7A72' }}
                >
                  {row.rank <= 3 ? <Trophy size={13} strokeWidth={2} /> : row.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#0F1F18] truncate">{row.name}</div>
                  <div className="text-[11px] text-[#6B7A72]">{row.org}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-[13px] font-semibold text-[#1F4D3A]">{row.points.toLocaleString()}</div>
                  <div className="mt-1.5 w-24">
                    <ProgressBar pct={(row.points / maxPoints) * 100} height={4} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Right col */}
        <div className="space-y-5">
          <Panel title="How points are earned">
            <div className="space-y-3">
              {POINT_SOURCES.map((ps, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-lg grid place-items-center shrink-0"
                    style={{ background: '#E8EFEB' }}
                  >
                    <ps.icon size={14} strokeWidth={1.8} color={ps.color} />
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] text-[#3A4A42]">{ps.label}</div>
                  </div>
                  <div
                    className="font-mono text-[12px] font-semibold shrink-0"
                    style={{ color: ps.color }}
                  >
                    +{ps.points} pts
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Badges">
            <div className="grid grid-cols-2 gap-3">
              {BADGES.map((badge, i) => (
                <div
                  key={i}
                  className="rounded-xl p-3 text-center border"
                  style={{ background: `${badge.color}10`, borderColor: `${badge.color}30` }}
                >
                  <div
                    className="h-9 w-9 rounded-full grid place-items-center mx-auto mb-2"
                    style={{ background: `${badge.color}25` }}
                  >
                    <Trophy size={16} strokeWidth={1.8} color={badge.color} />
                  </div>
                  <div className="font-semibold text-[12px] text-[#0F1F18]">{badge.name}</div>
                  <div className="text-[11px] text-[#6B7A72] mt-0.5">{badge.desc}</div>
                  <div className="font-mono text-[11px] mt-1.5" style={{ color: badge.color }}>
                    {badge.earned} earned
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
