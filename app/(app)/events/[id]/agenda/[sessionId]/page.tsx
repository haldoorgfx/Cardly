export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import Link from 'next/link';
import { ChevronLeft, Clock, MapPin } from 'lucide-react';

interface Props { params: Promise<{ id: string; sessionId: string }> }

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_GRADS = [
  'linear-gradient(135deg,#1F4D3A,#2A6A50)',
  'linear-gradient(135deg,#3E7E5E,#C9A45E)',
  'linear-gradient(135deg,#163828,#3E7E5E)',
  'linear-gradient(135deg,#2A6A50,#E8C57E)',
];

function InfoRow({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-2.5 ${last ? '' : 'border-b'}`} style={{ borderColor: '#E5E0D4' }}>
      <span className=" text-[10px] tracking-[0.12em] uppercase" style={{ color: '#6B7A72' }}>{label}</span>
      <span className="text-[13.5px] text-right" style={{ color: '#0F1F18' }}>{children}</span>
    </div>
  );
}

const SESSION_TYPE_LABELS: Record<string, string> = {
  talk: 'Talk', keynote: 'Keynote', workshop: 'Workshop', panel: 'Panel',
  fireside: 'Fireside', lightning: 'Lightning', break: 'Break',
};

export default async function SessionDetailPage({ params }: Props) {
  const { id: _ref, sessionId } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: session }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    admin.from('sessions')
      .select('*, tracks(id, name, color), session_speakers(speaker_id, position, speakers(id, name, photo_url, company, role))')
      .eq('id', sessionId)
      .eq('event_id', id)
      .single(),
  ]);

  if (!event || !session) redirect(`/events/${id}/agenda`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const track = (session as any).tracks as { id: string; name: string; color: string } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const speakers = ((session as any).session_speakers ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => a.position - b.position)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((ss: any) => ss.speakers)
    .filter(Boolean);

  const startsAt = session.starts_at ? new Date(session.starts_at) : null;
  const endsAt = session.ends_at ? new Date(session.ends_at) : null;
  const timeStr = startsAt
    ? startsAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })
    : '—';
  const dateStr = startsAt
    ? startsAt.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
    : null;
  const durationMin = startsAt && endsAt
    ? Math.round((endsAt.getTime() - startsAt.getTime()) / 60000)
    : null;

  const fillPct = session.capacity && session.capacity > 0
    ? Math.min(100, Math.round((session.registrations_count / session.capacity) * 100))
    : 0;

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Back */}
        <Link href={`/events/${id}/agenda`}
          className="inline-flex items-center gap-1.5 text-[13px] mb-5 hover:opacity-80 transition-opacity"
          style={{ color: '#6B7A72' }}>
          <ChevronLeft size={15} /> Agenda
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              {track && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium"
                  style={{ background: `${track.color}20`, color: track.color }}>
                  {track.name}
                </span>
              )}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium"
                style={{ background: session.is_published ? '#D1FAE5' : '#FEF3C7', color: session.is_published ? '#065F46' : '#92400E' }}>
                {session.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
            <h1 className="font-display text-[24px] font-semibold leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
              {session.title}
            </h1>
            <div className="flex items-center gap-4 mt-2  text-[12.5px] flex-wrap" style={{ color: '#6B7A72' }}>
              {startsAt && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} /> {timeStr}{durationMin ? ` · ${durationMin}m` : ''}
                  {dateStr && <span className="ml-1">{dateStr}</span>}
                </span>
              )}
              {session.room && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={13} /> {session.room}
                </span>
              )}
            </div>
          </div>
          <Link href={`/events/${id}/agenda`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium border hover:opacity-80 transition-opacity shrink-0"
            style={{ border: '1px solid #E5E0D4', color: '#3A4A42', background: 'white', textDecoration: 'none' }}>
            Edit session
          </Link>
        </div>

        {/* Body */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-5">

          {/* Left */}
          <div className="grid gap-5 content-start">
            {/* Description */}
            {session.description && (
              <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="font-display text-[14.5px] font-semibold mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>Description</div>
                <p className="text-[14px] leading-[1.65]" style={{ color: '#3A4A42' }}>{session.description}</p>
              </div>
            )}

            {/* Speakers */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
              <div className="font-display text-[14.5px] font-semibold mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>Speakers</div>
              {speakers.length === 0 ? (
                <div className="text-[13px]" style={{ color: '#6B7A72' }}>No speakers assigned.</div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {speakers.map((sp: any) => {
                    const gradIdx = sp.name.charCodeAt(0) % AVATAR_GRADS.length;
                    return (
                      <Link key={sp.id} href={`/events/${id}/speakers/${sp.id}`}
                        className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 hover:opacity-80 transition-opacity"
                        style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', textDecoration: 'none' }}>
                        {sp.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={sp.photo_url} alt={sp.name}
                            className="w-8 h-8 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg grid place-items-center shrink-0 text-white text-[11px] font-semibold"
                            style={{ background: AVATAR_GRADS[gradIdx] }}>
                            {initials(sp.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium truncate" style={{ color: '#0F1F18' }}>{sp.name}</div>
                          {sp.company && <div className=" text-[10.5px]" style={{ color: '#6B7A72' }}>{sp.company}</div>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="grid gap-5 content-start">
            {/* Attendance */}
            {session.capacity && session.capacity > 0 && (
              <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="font-display text-[14.5px] font-semibold mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>Attendance</div>
                <div className="text-center py-1">
                  <div className=" text-[30px] font-medium leading-none tracking-tight" style={{ color: '#1F4D3A' }}>
                    {session.registrations_count}
                  </div>
                  <div className=" text-[10px] tracking-[0.12em] uppercase mt-1.5" style={{ color: '#6B7A72' }}>
                    registered · cap {session.capacity}
                  </div>
                  <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: '#E5E0D4' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${fillPct}%`, background: '#1F4D3A' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Details */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
              <div className="font-display text-[14.5px] font-semibold mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>Details</div>
              {track && <InfoRow label="Track">{track.name}</InfoRow>}
              {session.room && <InfoRow label="Room">{session.room}</InfoRow>}
              {startsAt && <InfoRow label="Time">{timeStr}</InfoRow>}
              {durationMin && <InfoRow label="Duration">{durationMin}m</InfoRow>}
              <InfoRow label="Type">{SESSION_TYPE_LABELS[session.session_type] ?? session.session_type}</InfoRow>
              <InfoRow label="Published" last>{session.is_published ? 'Yes' : 'Draft'}</InfoRow>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
