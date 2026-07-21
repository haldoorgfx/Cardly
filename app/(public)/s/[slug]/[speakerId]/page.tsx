export const dynamic = 'force-dynamic';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Mic, Clock, MapPin, Link2, Globe, AtSign, ArrowLeft } from 'lucide-react';
import { resolvePublicSlug } from '@/lib/events/resolvePublicSlug';
import { ownedSpeaker } from '@/lib/rbac/ownership';
import { PublicNav } from '@/components/events/PublicNav';
import type { Metadata } from 'next';

interface Props { params: { slug: string; speakerId: string } }

// Every speaker profile previously emitted the literal title "Speaker", so all
// of them collided as one indistinguishable result in search and link previews.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const admin = createAdminClient();
  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) return { title: 'Speaker' };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: speaker } = await (admin as any)
    .from('speakers')
    .select('name, headline, company, role, photo_url')
    .eq('id', params.speakerId)
    .eq('event_id', resolved.event.id)
    .maybeSingle();

  if (!speaker?.name) return { title: 'Speaker' };

  const eventName = resolved.event.name as string | undefined;
  const title = eventName ? `${speaker.name} — speaking at ${eventName}` : speaker.name;
  const description =
    speaker.headline ??
    ([speaker.role, speaker.company].filter(Boolean).join(' at ') ||
      `${speaker.name}${eventName ? ` is speaking at ${eventName}` : ''}.`);

  const images = speaker.photo_url
    ? [{ url: speaker.photo_url as string, alt: speaker.name as string }]
    : [{ url: '/og-default.png', width: 1200, height: 630, alt: speaker.name as string }];

  const url = `/s/${params.slug}/${params.speakerId}`;

  return {
    title: speaker.name as string,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'profile', url, siteName: 'Eventera', title, description, images },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: images.map((i) => i.url),
    },
  };
}

// PUBLIC read-only speaker profile — what a stranger sees.
// The speaker's own MANAGEMENT workspace (profile editing, slides, card) lives
// in the dashboard at /speaking/[speakerId]; a logged-in owner landing here is
// redirected there. The old open editing portal on this route is retired —
// it allowed anyone to edit any speaker profile.
export default async function PublicSpeakerPage({ params }: Props) {
  const admin = createAdminClient();

  const resolved = await resolvePublicSlug(params.slug);
  if (!resolved) notFound();
  const { event } = resolved;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: speaker } = await (admin as any)
    .from('speakers')
    .select('id, name, headline, bio, photo_url, company, role, linkedin_url, twitter_url, website_url, event_id')
    .eq('id', params.speakerId)
    .eq('event_id', event.id)
    .single();

  if (!speaker) notFound();

  // Owner? → their workspace lives inside the dashboard.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const owned = await ownedSpeaker(user.id, params.speakerId);
    if (owned) redirect(`/speaking/${params.speakerId}`);
  }

  const { data: eventPage } = await admin
    .from('event_pages')
    .select('timezone')
    .eq('event_id', event.id)
    .maybeSingle();
  const eventTimezone = eventPage?.timezone || 'UTC';

  // Public sessions for this speaker
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionSpeakers } = await (admin as any)
    .from('session_speakers')
    .select('sessions(id, title, starts_at, ends_at, room, is_published)')
    .eq('speaker_id', params.speakerId);

  const sessions = (sessionSpeakers ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((ss: any) => ss.sessions)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((s: any) => Boolean(s) && s.is_published !== false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  // This is a SERVER component — `undefined` timeZone resolves to the server's
  // clock (UTC on Vercel), so every session time rendered in UTC regardless of
  // where the event is. Always format in the event's own timezone.
  function fmtTime(iso: string | null): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('en', {
        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
        timeZone: eventTimezone,
      });
    } catch { return ''; }
  }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <PublicNav />
      <div className="max-w-[680px] mx-auto px-5 py-10">
        <Link href={`/e/${params.slug}?tab=speakers`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-6"
          style={{ color: '#65736B' }}>
          <ArrowLeft size={14} strokeWidth={2} /> {event.name}
        </Link>

        <div className="bg-white rounded-2xl border p-6 sm:p-8" style={{ borderColor: '#E5E0D4' }}>
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 grid place-items-center"
              style={{ background: '#E8EFEB' }}>
              {speaker.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={speaker.photo_url} alt={speaker.name} className="w-full h-full object-cover" />
              ) : (
                <Mic size={26} strokeWidth={1.6} style={{ color: '#1F4D3A' }} />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-display font-semibold text-[24px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
                {speaker.name}
              </h1>
              {(speaker.role || speaker.company) && (
                <p className="text-[14px] mt-1" style={{ color: '#3A4A42' }}>
                  {[speaker.role, speaker.company].filter(Boolean).join(' · ')}
                </p>
              )}
              {speaker.headline && (
                <p className="text-[13px] mt-1" style={{ color: '#65736B' }}>{speaker.headline}</p>
              )}
              <div className="flex items-center gap-3 mt-3">
                {speaker.linkedin_url && (
                  <a href={speaker.linkedin_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1F4D3A' }}>
                    <Link2 size={16} strokeWidth={1.8} />
                  </a>
                )}
                {speaker.website_url && (
                  <a href={speaker.website_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1F4D3A' }}>
                    <Globe size={16} strokeWidth={1.8} />
                  </a>
                )}
                {speaker.twitter_url && (
                  <a href={speaker.twitter_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1F4D3A' }} aria-label="X / Twitter">
                    <AtSign size={16} strokeWidth={1.8} />
                  </a>
                )}
              </div>
            </div>
          </div>

          {speaker.bio && (
            <p className="text-[14px] leading-[1.7] mt-6 whitespace-pre-line" style={{ color: '#3A4A42' }}>
              {speaker.bio}
            </p>
          )}
        </div>

        {sessions.length > 0 && (
          <div className="bg-white rounded-2xl border mt-4 overflow-hidden" style={{ borderColor: '#E5E0D4' }}>
            <div className="px-6 py-4 font-display font-semibold text-[15px]" style={{ color: '#0F1F18', borderBottom: '1px solid #E5E0D4' }}>
              Sessions
            </div>
            <ul>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {sessions.map((s: any, i: number) => (
                <li key={s.id} className="px-6 py-4 flex items-start gap-3"
                  style={{ borderTop: i > 0 ? '1px solid #F0EDE6' : 'none' }}>
                  <span className="grid place-items-center w-8 h-8 rounded-lg shrink-0 mt-0.5"
                    style={{ background: '#FAF6EE', color: '#1F4D3A', border: '1px solid #E5E0D4' }}>
                    <Mic size={14} strokeWidth={1.8} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>{s.title}</div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[12.5px]" style={{ color: '#65736B' }}>
                      {s.starts_at && (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={12} strokeWidth={1.9} /> {fmtTime(s.starts_at)}
                        </span>
                      )}
                      {s.room && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin size={12} strokeWidth={1.9} /> {s.room}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
