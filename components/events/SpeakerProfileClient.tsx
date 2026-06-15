'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Speaker, Session } from '@/types/database';

interface Props {
  speaker: Speaker;
  sessions: Session[];
  eventSlug: string;
}

const TYPE_LABELS: Record<string, string> = {
  speaker: 'Speaker',
  keynote: 'Keynote',
  panelist: 'Panelist',
  workshop: 'Workshop',
  mc: 'MC',
};

function formatTimeRange(start: string, end: string) {
  if (!start || !end) return '';
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}–${e.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}`;
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

export default function SpeakerProfileClient({ speaker, sessions, eventSlug }: Props) {
  return (
    <div>
      {/* Hero */}
      <div className="relative w-full overflow-hidden" style={{ height: 360, background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #163828 100%)' }}>
        {speaker.photo_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${speaker.photo_url})` }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <span className="font-bold text-white leading-none" style={{ fontSize: 160 }}>
              {getInitials(speaker.name)}
            </span>
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 20%, rgba(15,31,24,0.7) 100%)' }}
        />

        {/* Name, role + social icons — bottom left, matching w14 reference */}
        <div className="absolute left-6" style={{ bottom: 28 }}>
          <h1 className="font-display font-normal leading-tight text-white" style={{ fontSize: 36 }}>
            {speaker.name}
          </h1>
          {(speaker.role || speaker.company) && (
            <p className="text-[16px] mt-1" style={{ color: '#E8C57E' }}>
              {[speaker.role, speaker.company].filter(Boolean).join(' · ')}
            </p>
          )}
          {/* Social icons below name */}
          <div className="flex gap-2 mt-3">
            {speaker.linkedin_url && (
              <a href={speaker.linkedin_url} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white transition hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                <LinkedInIcon />
              </a>
            )}
            {speaker.twitter_url && (
              <a href={speaker.twitter_url} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white transition hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                <TwitterIcon />
              </a>
            )}
            {speaker.website_url && (
              <a href={speaker.website_url} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full flex items-center justify-center text-white transition hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                <GlobeIcon />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[900px] mx-auto px-5 py-8">
        <div className="flex flex-col md:flex-row gap-12">
          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* About */}
            <section>
              <h2 className="font-display text-[15px] font-semibold mb-3" style={{ color: '#0F1F18' }}>About</h2>
              {speaker.bio ? (
                <p className="text-[16px] leading-relaxed" style={{ color: '#3A4A42', lineHeight: 1.6 }}>
                  {speaker.bio}
                </p>
              ) : (
                <p className="text-[15px]" style={{ color: '#6B7A72' }}>No bio available.</p>
              )}
            </section>

            {/* Sessions */}
            <section>
              <h2 className="font-display text-[15px] font-semibold mb-3" style={{ color: '#0F1F18' }}>Sessions</h2>
              {sessions.length === 0 ? (
                <p className="text-[15px]" style={{ color: '#6B7A72' }}>No sessions assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <Link
                      key={session.id}
                      href={`/e/${eventSlug}/sessions/${session.id}`}
                      className="block border rounded-xl p-4 hover:border-[#E8C57E] transition-colors"
                      style={{ borderColor: '#E5E0D4', background: '#fff' }}
                    >
                      <p className="font-display text-[15px] font-medium" style={{ color: '#0F1F18' }}>
                        {session.title}
                      </p>
                      <p className=" text-[12px] mt-1" style={{ color: '#6B7A72' }}>
                        {formatTimeRange(session.starts_at, session.ends_at)}
                        {session.room ? ` · ${session.room}` : ''}
                      </p>
                      {session.tracks && (
                        <span
                          className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full mt-2"
                          style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: session.tracks.color }}
                          />
                          {session.tracks.name}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right sidebar */}
          <aside
            className="w-full md:w-72 shrink-0 self-start md:sticky"
            style={{ top: 96 }}
          >
            <div className="bg-white border rounded-2xl p-6 space-y-4" style={{ borderColor: '#E5E0D4' }}>
              {/* Photo */}
              <div className="flex flex-col items-center gap-3">
                {speaker.photo_url ? (
                  <Image
                    src={speaker.photo_url}
                    alt={speaker.name}
                    width={72}
                    height={72}
                    className="w-[72px] h-[72px] rounded-full object-cover"
                    style={{ border: '2px solid #E8C57E' }}
                  />
                ) : (
                  <div
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-xl font-semibold"
                    style={{ background: '#E8EFEB', color: '#1F4D3A', border: '2px solid #E8C57E' }}
                  >
                    {getInitials(speaker.name)}
                  </div>
                )}
                <div className="text-center">
                  <p className="text-[16px] font-medium" style={{ color: '#0F1F18' }}>{speaker.name}</p>
                  {speaker.headline && (
                    <p className="text-[14px] mt-0.5" style={{ color: '#6B7A72' }}>{speaker.headline}</p>
                  )}
                  {speaker.role && (
                    <p className="text-[13px]" style={{ color: '#6B7A72' }}>{speaker.role}</p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2" style={{ borderColor: '#E5E0D4' }}>
                <span
                  className="inline-block text-[12px] font-medium px-3 py-1 rounded-full"
                  style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                >
                  {TYPE_LABELS[speaker.speaker_type] ?? speaker.speaker_type}
                </span>
              </div>

              <button
                className="w-full text-sm font-medium py-2 rounded-lg border transition-colors"
                style={{ borderColor: '#E5E0D4', color: '#1F4D3A' }}
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: speaker.name,
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                  }
                }}
              >
                Share profile
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
