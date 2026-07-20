'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Speaker, Session } from '@/types/database';

interface Props {
  speaker: Speaker;
  sessions: Session[];
  eventSlug: string;
  timezone?: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  speaker: 'Speaker',
  keynote: 'Keynote',
  panelist: 'Panelist',
  workshop: 'Workshop',
  mc: 'MC',
};

// Session times belong to the EVENT's timezone, not the viewer's — without the
// explicit timeZone a 09:00 Djibouti talk showed as 06:00 to anyone abroad.
function formatTimeRange(start: string, end: string, tz: string) {
  if (!start || !end) return '';
  const opts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz };
  try {
    return `${new Date(start).toLocaleTimeString('en', opts)}–${new Date(end).toLocaleTimeString('en', opts)}`;
  } catch {
    return '';
  }
}

function LinkedInIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

export default function SpeakerProfileClient({ speaker, sessions, eventSlug, timezone }: Props) {
  const tz = timezone || 'UTC';
  const typeLabel = TYPE_LABELS[speaker.speaker_type] ?? speaker.speaker_type;
  const roleLine = [speaker.role, speaker.company].filter(Boolean).join(' · ');
  const hasSocials = speaker.linkedin_url || speaker.twitter_url || speaker.website_url;

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: speaker.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <div className="mx-auto px-6 lg:px-10 pt-6 pb-20" style={{ maxWidth: 920 }}>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] mb-5" style={{ color: '#65736B' }}>
          <Link href={`/e/${eventSlug}?tab=speakers`} className="hover:text-[#1F4D3A] transition-colors" style={{ color: '#65736B' }}>
            Speakers
          </Link>
          <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0" fill="none" stroke="#C9C3B1" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
          <span className="font-medium truncate" style={{ color: '#0F1F18' }}>{speaker.name}</span>
        </nav>

        {/* Profile header card */}
        <div className="bg-white border rounded-[20px] p-6 sm:p-8" style={{ borderColor: '#E5E0D4', boxShadow: '0 4px 24px rgba(15,31,24,0.05)' }}>
          <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-7">
            {/* Avatar */}
            {speaker.photo_url ? (
              <Image
                src={speaker.photo_url}
                alt={speaker.name}
                width={120}
                height={120}
                className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-full object-cover shrink-0"
                style={{ border: '3px solid #E8C57E' }}
              />
            ) : (
              <div
                className="w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] rounded-full flex items-center justify-center shrink-0 font-display font-semibold"
                style={{ background: 'linear-gradient(135deg, #E8EFEB 0%, #D5E3DB 100%)', color: '#1F4D3A', border: '3px solid #E8C57E', fontSize: 36 }}
              >
                {getInitials(speaker.name)}
              </div>
            )}

            {/* Identity */}
            <div className="flex-1 min-w-0">
              <span
                className="inline-block text-[12.5px] font-semibold uppercase tracking-[0.06em] px-2.5 py-1 rounded-full mb-2.5"
                style={{ background: '#E8EFEB', color: '#1F4D3A' }}
              >
                {typeLabel}
              </span>
              <h1 className="font-display font-bold leading-tight" style={{ color: '#0F1F18', fontSize: 'clamp(26px,4vw,34px)', letterSpacing: '-0.02em' }}>
                {speaker.name}
              </h1>
              {roleLine && (
                <p className="text-[15px] mt-1.5" style={{ color: '#3A4A42' }}>{roleLine}</p>
              )}
              {speaker.headline && speaker.headline !== roleLine && (
                <p className="text-[14px] mt-1" style={{ color: '#65736B' }}>{speaker.headline}</p>
              )}

              {/* Socials + share */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                {speaker.linkedin_url && (
                  <a href={speaker.linkedin_url} target="_blank" rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="w-9 h-9 rounded-full flex items-center justify-center transition hover:opacity-80"
                    style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    <LinkedInIcon />
                  </a>
                )}
                {speaker.twitter_url && (
                  <a href={speaker.twitter_url} target="_blank" rel="noopener noreferrer"
                    aria-label="X / Twitter"
                    className="w-9 h-9 rounded-full flex items-center justify-center transition hover:opacity-80"
                    style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    <TwitterIcon />
                  </a>
                )}
                {speaker.website_url && (
                  <a href={speaker.website_url} target="_blank" rel="noopener noreferrer"
                    aria-label="Website"
                    className="w-9 h-9 rounded-full flex items-center justify-center transition hover:opacity-80"
                    style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    <GlobeIcon />
                  </a>
                )}
                <button
                  onClick={handleShare}
                  className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-[13px] font-medium transition hover:opacity-90 ${hasSocials ? 'sm:ml-1' : ''}`}
                  style={{ background: '#1F4D3A', color: '#FAF6EE' }}
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a1 1 0 001 1h14a1 1 0 001-1v-8M16 6l-4-4-4 4M12 2v14" />
                  </svg>
                  Share profile
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-white border rounded-[20px] p-6 sm:p-8 mt-5" style={{ borderColor: '#E5E0D4' }}>
          <h2 className="font-display text-[18px] font-bold mb-3" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>About</h2>
          {speaker.bio ? (
            <p className="text-[15px] whitespace-pre-line" style={{ color: '#3A4A42', lineHeight: 1.7 }}>
              {speaker.bio}
            </p>
          ) : (
            <p className="text-[15px]" style={{ color: '#65736B' }}>No bio available yet.</p>
          )}
        </div>

        {/* Sessions */}
        <div className="bg-white border rounded-[20px] p-6 sm:p-8 mt-5" style={{ borderColor: '#E5E0D4' }}>
          <h2 className="font-display text-[18px] font-bold mb-4" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
            Sessions {sessions.length > 0 && <span style={{ color: '#65736B', fontWeight: 400 }}>· {sessions.length}</span>}
          </h2>
          {sessions.length === 0 ? (
            <p className="text-[15px]" style={{ color: '#65736B' }}>No sessions assigned yet.</p>
          ) : (
            <div className="space-y-2.5">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/e/${eventSlug}/sessions/${session.id}`}
                  className="block border rounded-xl p-4 transition-colors hover:border-[#E8C57E]"
                  style={{ borderColor: '#E5E0D4', background: '#FAF6EE' }}
                >
                  <p className="font-display text-[15px] font-semibold" style={{ color: '#0F1F18' }}>
                    {session.title}
                  </p>
                  <p className="text-[12px] mt-1" style={{ color: '#65736B' }}>
                    {formatTimeRange(session.starts_at, session.ends_at, tz)}
                    {session.room ? ` · ${session.room}` : ''}
                  </p>
                  {session.tracks && (
                    <span
                      className="inline-flex items-center gap-1.5 text-[12.5px] font-medium px-2 py-0.5 rounded-full mt-2"
                      style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: session.tracks.color }} />
                      {session.tracks.name}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
