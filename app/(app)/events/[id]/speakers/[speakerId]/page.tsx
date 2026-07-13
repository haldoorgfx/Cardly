export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { resolveEventRef } from '@/lib/events/resolveEventRef';
import Link from 'next/link';
import { ChevronLeft, CalendarDays, Star, ExternalLink } from 'lucide-react';

interface Props { params: Promise<{ id: string; speakerId: string }> }

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
      <span className=" text-[12px] tracking-[0.12em] uppercase" style={{ color: '#6B7A72' }}>{label}</span>
      <span className="text-[13.5px] text-right" style={{ color: '#0F1F18' }}>{children}</span>
    </div>
  );
}

const TYPE_LABELS: Record<string, string> = {
  keynote: 'Keynote', speaker: 'Speaker', panelist: 'Panelist', workshop: 'Workshop', mc: 'MC',
};

export default async function SpeakerDetailPage({ params }: Props) {
  const { id: _ref, speakerId } = await params;
  const _ev = await resolveEventRef(_ref);
  if (!_ev) redirect('/dashboard');
  const id = _ev.id;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const [{ data: event }, { data: speaker }] = await Promise.all([
    admin.from('events').select('id, name, slug').eq('id', id).eq('user_id', user.id).single(),
    admin.from('speakers').select('*').eq('id', speakerId).eq('event_id', id).single(),
  ]);

  if (!event || !speaker) redirect(`/events/${_ev.slug}/speakers`);

  // Get sessions for this speaker
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionSpeakers } = await (admin as any)
    .from('session_speakers')
    .select('sessions(id, title, starts_at, room, tracks(name, color))')
    .eq('speaker_id', speakerId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessions = (sessionSpeakers ?? []).map((ss: any) => ss.sessions).filter(Boolean);

  const gradIdx = speaker.name.charCodeAt(0) % AVATAR_GRADS.length;
  const avatarGrad = AVATAR_GRADS[gradIdx];

  const links = [
    speaker.twitter_url && { label: 'Twitter / X', url: speaker.twitter_url },
    speaker.linkedin_url && { label: 'LinkedIn', url: speaker.linkedin_url },
    speaker.website_url && { label: 'Website', url: speaker.website_url },
  ].filter(Boolean) as { label: string; url: string }[];

  return (
    <div className="min-h-full" style={{ background: '#FAF6EE' }}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Back */}
        <Link href={`/events/${_ev.slug}/speakers`}
          className="inline-flex items-center gap-1.5 text-[13px] mb-5 hover:opacity-80 transition-opacity"
          style={{ color: '#6B7A72' }}>
          <ChevronLeft size={15} /> Speakers
        </Link>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          {speaker.photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={speaker.photo_url} alt={speaker.name}
              className="w-16 h-16 rounded-2xl object-cover shrink-0" style={{ border: '1px solid #E5E0D4' }} />
          ) : (
            <div className="w-16 h-16 rounded-2xl grid place-items-center shrink-0 text-white font-display text-[20px] font-semibold"
              style={{ background: avatarGrad }}>
              {initials(speaker.name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-semibold text-[26px] sm:text-[30px] leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
              {speaker.name}
            </h1>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {speaker.is_featured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[12px] font-medium"
                  style={{ background: 'rgba(232,197,126,0.2)', color: '#C9A45E' }}>
                  <Star size={10} /> Featured
                </span>
              )}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium"
                style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                {TYPE_LABELS[speaker.speaker_type] ?? 'Speaker'}
              </span>
              {speaker.company && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium"
                  style={{ background: '#F5F0E8', color: '#3A4A42' }}>
                  {speaker.company}
                </span>
              )}
            </div>
            {speaker.role && (
              <div className="text-[13.5px] mt-2" style={{ color: '#3A4A42' }}>{speaker.role}</div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-5">

          {/* Left */}
          <div className="grid gap-5 content-start">
            {/* Bio */}
            {speaker.bio && (
              <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="font-display text-[14.5px] font-semibold mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>Bio</div>
                <p className="text-[14px] leading-[1.65]" style={{ color: '#3A4A42' }}>{speaker.bio}</p>
              </div>
            )}

            {/* Assigned sessions */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
              <div className="font-display text-[14.5px] font-semibold mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
                Assigned sessions
              </div>
              {sessions.length === 0 ? (
                <div className="text-[13px] py-3" style={{ color: '#6B7A72' }}>No sessions assigned yet.</div>
              ) : (
                <div className="grid gap-2.5">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {sessions.map((s: any) => (
                    <Link key={s.id} href={`/events/${_ev.slug}/agenda/${s.id}`}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 hover:opacity-80 transition-opacity"
                      style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', textDecoration: 'none' }}>
                      <span className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
                        style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                        <CalendarDays size={15} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium truncate" style={{ color: '#0F1F18' }}>{s.title}</div>
                        <div className=" text-[12.5px] mt-0.5" style={{ color: '#6B7A72' }}>
                          {s.starts_at ? new Date(s.starts_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                          {s.room ? ` · ${s.room}` : ''}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="grid gap-5 content-start">
            {/* Details */}
            <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
              <div className="font-display text-[14.5px] font-semibold mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>Details</div>
              {speaker.role && <InfoRow label="Role">{speaker.role}</InfoRow>}
              {speaker.company && <InfoRow label="Company">{speaker.company}</InfoRow>}
              <InfoRow label="Type">{TYPE_LABELS[speaker.speaker_type] ?? 'Speaker'}</InfoRow>
              <InfoRow label="Sessions" last>{sessions.length}</InfoRow>
            </div>

            {/* Links */}
            {links.length > 0 && (
              <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}>
                <div className="font-display text-[14.5px] font-semibold mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>Links</div>
                <div className="grid gap-2">
                  {links.map((l, i) => (
                    <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors hover:opacity-80"
                      style={{ border: '1px solid #E5E0D4', color: '#3A4A42', textDecoration: 'none' }}>
                      <ExternalLink size={15} /> {l.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
