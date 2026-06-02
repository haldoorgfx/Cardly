export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Settings2, Video, Users, Eye, MessageSquare, Clock } from 'lucide-react';
import { PageShell, Btn, GateNotice, Panel, Pill } from '@/components/dashboard/ui';

interface Props { params: Promise<{ id: string }> }

const SESSIONS = [
  { title: 'Opening Keynote', speaker: 'Amara Osei', viewers: 1240, duration: '45 min', status: 'ended' },
  { title: 'The Future of African Fintech', speaker: 'Kofi Mensah', viewers: 986, duration: '30 min', status: 'ended' },
  { title: 'Fireside: Building in Public', speaker: 'Zara Diallo', viewers: 0, duration: '45 min', status: 'upcoming' },
  { title: 'Closing Panel', speaker: 'Multiple', viewers: 0, duration: '60 min', status: 'upcoming' },
];

export default async function VirtualPage({ params }: Props) {
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
      title="Virtual"
      subtitle="Stream sessions to online attendees"
      actions={
        <>
          <Btn variant="ghost" icon={Settings2}>Settings</Btn>
          <Btn variant="primary" icon={Video}>Go live</Btn>
        </>
      }
    >
      {isLocked && <GateNotice featureLabel="Virtual streaming" planLabel="Studio" />}

      <div className="grid gap-5 mb-6" style={{ gridTemplateColumns: '1.4fr 1fr' }}>
        {/* Video preview */}
        <Panel className="overflow-hidden" pad="p-0">
          <div
            className="relative flex flex-col items-center justify-center"
            style={{ height: 280, background: 'linear-gradient(135deg, #0F1F18 0%, #163828 50%, #1F4D3A 100%)' }}
          >
            <div
              className="h-16 w-16 rounded-2xl grid place-items-center mb-3"
              style={{ background: 'rgba(232,197,126,0.15)', border: '1px solid rgba(232,197,126,0.25)' }}
            >
              <Video size={28} strokeWidth={1.6} color="#E8C57E" />
            </div>
            <div className="font-display font-semibold text-[16px] text-[#FAF6EE] mb-1">Stream offline</div>
            <div className="text-[13px]" style={{ color: 'rgba(250,246,238,0.5)' }}>No active session</div>
            <div className="absolute top-4 right-4">
              <span
                className="font-mono text-[10px] px-2 py-1 rounded-full uppercase tracking-widest"
                style={{ background: 'rgba(15,31,24,0.7)', color: 'rgba(250,246,238,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Offline
              </span>
            </div>
          </div>
          <div className="px-5 py-4 border-t" style={{ borderColor: '#E5E0D4' }}>
            <div className="font-display font-semibold text-[14px] text-[#0F1F18] mb-1">Next: Fireside Chat</div>
            <div className="text-[13px]" style={{ color: '#6B7A72' }}>Starts in 2 hours · 45 min session</div>
          </div>
        </Panel>

        {/* Stats */}
        <div className="space-y-4">
          {[
            { icon: Eye, label: 'Total viewers', value: '2,226', color: '#1F4D3A' },
            { icon: Users, label: 'Peak concurrent', value: '1,240', color: '#2A6A50' },
            { icon: MessageSquare, label: 'Chat messages', value: '3,891', color: '#E8C57E' },
            { icon: Clock, label: 'Avg watch time', value: '28 min', color: '#3A6B8C' },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white border rounded-2xl p-4 flex items-center gap-4"
              style={{ borderColor: '#E5E0D4' }}
            >
              <div
                className="h-10 w-10 rounded-xl grid place-items-center shrink-0"
                style={{ background: '#E8EFEB' }}
              >
                <stat.icon size={18} strokeWidth={1.7} color={stat.color} />
              </div>
              <div>
                <div className="font-mono text-[20px] font-bold text-[#1F4D3A]">{stat.value}</div>
                <div className="text-[12px] text-[#6B7A72]">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Panel title="Sessions">
        <div className="space-y-0">
          {SESSIONS.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-4 py-3.5"
              style={{ borderTop: i > 0 ? '1px solid #E5E0D4' : undefined }}
            >
              <div
                className="h-9 w-9 rounded-lg grid place-items-center shrink-0"
                style={{ background: s.status === 'ended' ? '#E8EFEB' : 'rgba(232,197,126,0.15)' }}
              >
                <Video size={15} strokeWidth={1.8} color={s.status === 'ended' ? '#6B7A72' : '#C9A45E'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[13.5px] text-[#0F1F18] truncate">{s.title}</div>
                <div className="text-[12px] text-[#6B7A72]">{s.speaker} · {s.duration}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {s.viewers > 0 && (
                  <span className="font-mono text-[12px] text-[#6B7A72]">{s.viewers.toLocaleString()} viewers</span>
                )}
                <Pill tone={s.status === 'ended' ? 'neutral' : 'gold'}>
                  {s.status === 'ended' ? 'Ended' : 'Upcoming'}
                </Pill>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </PageShell>
  );
}
