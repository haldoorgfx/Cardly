export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import { Video, Users, BarChart2, Clock, Radio } from 'lucide-react';

interface Props { params: Promise<{ id: string }> }

export default async function VirtualPage({ params }: Props) {
  const { id: _ref } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: sessions }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    admin.from('sessions')
      .select('id, title, starts_at, ends_at, session_type, is_published, registrations_count')
      .eq('event_id', id)
      .order('starts_at', { ascending: true }),
  ]);
  if (!event) redirect('/dashboard');

  const allSessions = sessions ?? [];
  const now = new Date();

  const stats = [
    { label: 'Sessions',       value: String(allSessions.length),                                             icon: Video },
    { label: 'Registrations',  value: String(allSessions.reduce((s, ss) => s + (ss.registrations_count ?? 0), 0)), icon: Users },
    { label: 'Live now',       value: String(allSessions.filter(ss => {
      const s = new Date(ss.starts_at); const e = new Date(ss.ends_at);
      return s <= now && now <= e && ss.is_published;
    }).length),                                                                                                 icon: Radio },
    { label: 'Upcoming',       value: String(allSessions.filter(ss => new Date(ss.starts_at) > now).length),  icon: Clock },
  ];

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-8">

        {/* Stream panel */}
        <div className="rounded-2xl overflow-hidden mb-8 relative"
          style={{ background: '#163828', minHeight: 220 }}>
          {/* Radial glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(232,197,126,0.12) 0%, transparent 70%)' }} />
          <div className="relative flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl grid place-items-center mb-4"
              style={{ background: 'rgba(232,197,126,0.15)', border: '1px solid rgba(232,197,126,0.25)' }}>
              <Video size={24} strokeWidth={1.6} style={{ color: '#E8C57E' }} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
              style={{ background: 'rgba(45,122,79,0.3)', border: '1px solid rgba(45,122,79,0.5)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#2D7A4F' }} />
              <span className=" text-[11px] tracking-widest uppercase" style={{ color: '#A8C2B5' }}>Live Stream</span>
            </div>
            <h2 className="font-display text-[22px] font-semibold mb-2" style={{ color: 'white', letterSpacing: '-0.02em' }}>
              {event.name}
            </h2>
            <p className="text-[14px] mb-6" style={{ color: '#A8C2B5' }}>
              Configure your virtual event stream and session recordings.
            </p>
            <div className="flex items-center gap-3">
              <button className="px-5 py-2.5 rounded-xl text-[13.5px] font-medium transition hover:opacity-90"
                style={{ background: '#E8C57E', color: '#0F1F18' }}>
                Go live
              </button>
              <button className="px-5 py-2.5 rounded-xl text-[13.5px] font-medium border transition hover:border-[#E8C57E]/60"
                style={{ border: '1px solid rgba(232,197,126,0.3)', color: '#E8C57E', background: 'transparent' }}>
                Configure stream
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5"
              style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
              <div className="w-9 h-9 rounded-xl grid place-items-center mb-3"
                style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                <s.icon size={16} strokeWidth={1.8} />
              </div>
              <div className=" text-[24px] font-medium leading-none" style={{ color: '#0F1F18' }}>{s.value}</div>
              <div className="text-[12.5px] mt-1.5" style={{ color: '#6B7A72' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Sessions list */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#E5E0D4' }}>
            <div className="font-display text-[14.5px] font-semibold" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>Sessions</div>
            <BarChart2 size={15} strokeWidth={1.8} style={{ color: '#6B7A72' }} />
          </div>
          {allSessions.length === 0 ? (
            <div className="px-6 py-12 text-center text-[13px]" style={{ color: '#6B7A72' }}>
              No sessions yet. Add sessions in the Agenda tab.
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: '#E5E0D4' }}>
              {allSessions.map(ss => {
                const start = new Date(ss.starts_at);
                const end = new Date(ss.ends_at);
                const isLive = start <= now && now <= end && ss.is_published;
                const isUpcoming = start > now;
                const statusLabel = isLive ? 'Live' : isUpcoming ? 'Upcoming' : 'Ended';
                const statusStyle = isLive
                  ? { bg: 'rgba(45,122,79,0.15)', color: '#2D7A4F' }
                  : isUpcoming
                  ? { bg: '#E8EFEB', color: '#1F4D3A' }
                  : { bg: '#F0F0EC', color: '#6B7A72' };
                return (
                  <div key={ss.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
                      style={{ background: isLive ? 'rgba(45,122,79,0.15)' : '#E8EFEB', color: isLive ? '#2D7A4F' : '#1F4D3A' }}>
                      <Video size={14} strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-medium truncate" style={{ color: '#0F1F18' }}>{ss.title}</div>
                      <div className=" text-[11px] mt-0.5" style={{ color: '#6B7A72' }}>
                        {start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0"
                      style={{ background: statusStyle.bg, color: statusStyle.color }}>
                      {isLive && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#2D7A4F' }} />}
                      {statusLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
