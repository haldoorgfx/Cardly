'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Speaker, Session } from '@/types/database';

interface Props {
  speaker: Speaker;
  sessions: Session[];
  eventSlug: string;
}

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function formatSessionTime(starts: string, ends: string | null) {
  const s = new Date(starts);
  const start = s.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const date = s.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  if (!ends) return `${date} · ${start}`;
  const end = new Date(ends).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} · ${start}–${end}`;
}

function SocialIcon({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center rounded-full transition hover:opacity-80"
      style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(8px)' }}
    >
      {children}
    </a>
  );
}

export default function SpeakerProfileClient({ speaker, sessions, eventSlug }: Props) {
  const [savedSessions, setSavedSessions] = useState<Set<string>>(new Set());

  function toggleSave(id: string) {
    setSavedSessions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const roleDisplay = [speaker.role, speaker.company].filter(Boolean).join(', ') || 'Speaker';

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ height: 480 }}>
        {speaker.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={speaker.photo_url}
            alt={speaker.name}
            className="absolute inset-0 w-full h-full object-cover object-top"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(160deg, #0D2018 0%, #1F4D3A 55%, #2A6A50 100%)' }}
          />
        )}
        {/* Scrim */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(10,20,14,0.90) 0%, rgba(10,20,14,0.35) 45%, transparent 70%)' }}
        />
        {/* Caption */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-[960px] mx-auto px-10 pb-10">
            <h1
              className="font-display font-medium text-white"
              style={{ fontSize: 40, letterSpacing: '-0.025em', lineHeight: 1.1 }}
            >
              {speaker.name}
            </h1>
            <div className="mt-2 text-[18px]" style={{ color: '#E8C57E' }}>
              {roleDisplay}
            </div>
            {/* Social icons */}
            <div className="flex gap-2.5 mt-4">
              {speaker.linkedin_url && (
                <SocialIcon href={speaker.linkedin_url}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5V9h3zM6.5 7.7a1.8 1.8 0 110-3.5 1.8 1.8 0 010 3.5zM19 19h-3v-5.3c0-1.3-.5-2.1-1.6-2.1-.9 0-1.4.6-1.6 1.2V19h-3V9h3v1.3a3 3 0 012.7-1.5c2 0 3.2 1.3 3.2 4V19z" />
                  </svg>
                </SocialIcon>
              )}
              {speaker.twitter_url && (
                <SocialIcon href={speaker.twitter_url}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M17.5 3h3l-7 8 8.2 10h-6.4l-5-6.2L7 21H4l7.5-8.6L3.6 3H10l4.5 5.7z" />
                  </svg>
                </SocialIcon>
              )}
              {speaker.website_url && (
                <SocialIcon href={speaker.website_url}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15 15 0 010 20M12 2a15 15 0 000 20" />
                  </svg>
                </SocialIcon>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <div
        className="grid max-w-[960px] mx-auto px-10 mt-12 mb-24"
        style={{ gridTemplateColumns: '1fr 280px', gap: 56, alignItems: 'start' }}
      >

        {/* ── Content ──────────────────────────────────────────────────────── */}
        <div>
          {/* About */}
          {speaker.bio && (
            <section>
              <h2 className="font-display mb-4" style={{ fontWeight: 400, fontSize: 22, color: '#1F4D3A', letterSpacing: '-0.015em' }}>
                About
              </h2>
              <p className="text-[15px] leading-relaxed" style={{ color: '#3A4A42' }}>
                {speaker.bio}
              </p>
            </section>
          )}

          {/* Sessions */}
          {sessions.length > 0 && (
            <section style={{ marginTop: speaker.bio ? 40 : 0 }}>
              <h2 className="font-display mb-1" style={{ fontWeight: 400, fontSize: 22, color: '#1F4D3A', letterSpacing: '-0.015em' }}>
                Sessions
              </h2>
              <div className="space-y-3 mt-4">
                {sessions.map(s => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const track = (s as unknown as { tracks?: { name: string; color: string } | null }).tracks;
                  const isSaved = savedSessions.has(s.id);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-4 flex-wrap rounded-xl px-5 py-4"
                      style={{ background: 'white', border: '1px solid #E5E0D4' }}
                    >
                      <div>
                        <div className="font-display font-medium text-[15px]" style={{ color: '#1F4D3A' }}>
                          {s.title}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap mt-1">
                          <span className="font-mono text-[13px]" style={{ color: '#6B7A72' }}>
                            {formatSessionTime(s.starts_at, s.ends_at)}
                            {s.room ? ` · ${s.room}` : ''}
                          </span>
                          {track && (
                            <span className="flex items-center gap-1.5 text-[12px]" style={{ color: '#3A4A42' }}>
                              <span
                                className="inline-block rounded-full"
                                style={{ width: 8, height: 8, background: track.color ?? '#1F4D3A' }}
                              />
                              {track.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSave(s.id)}
                        className="shrink-0 h-8 px-3 rounded-lg text-[13px] font-medium transition"
                        style={isSaved
                          ? { border: '1px solid #E8C57E', color: '#C9A45E', background: 'rgba(232,197,126,0.08)' }
                          : { border: '1px solid #1F4D3A', color: '#1F4D3A', background: 'transparent' }
                        }
                      >
                        {isSaved ? '✓ In agenda' : 'Add to agenda'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Back link */}
          <div style={{ marginTop: 40 }}>
            <Link
              href={`/e/${eventSlug}/speakers`}
              className="text-[14px] font-medium"
              style={{ color: '#1F4D3A', textDecoration: 'none' }}
            >
              ← All speakers
            </Link>
          </div>
        </div>

        {/* ── Sidebar ────────────────────────────────────────────────────────── */}
        <aside style={{ position: 'sticky', top: 88 }}>
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)' }}
          >
            {/* Avatar */}
            <div className="mx-auto mb-4 rounded-full overflow-hidden flex items-center justify-center" style={{ width: 64, height: 64, boxShadow: '0 0 0 2px #E8C57E', background: '#E8EFEB' }}>
              {speaker.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={speaker.photo_url} alt={speaker.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display font-semibold text-[18px]" style={{ color: '#1F4D3A' }}>
                  {getInitials(speaker.name)}
                </span>
              )}
            </div>

            <div className="font-display font-medium text-[18px]" style={{ color: '#1F4D3A' }}>
              {speaker.name}
            </div>
            <div className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>
              {roleDisplay}
            </div>

            <button
              className="w-full h-11 rounded-xl font-display font-semibold text-[14px] text-white transition hover:opacity-90"
              style={{ background: '#1F4D3A', marginTop: 16 }}
            >
              Send connection request
            </button>
            <div className="mt-3 text-[13px]" style={{ color: '#6B7A72' }}>
              <button
                onClick={() => navigator.clipboard?.writeText(window.location.href)}
                className="hover:underline"
              >
                Share profile
              </button>
            </div>

            {/* Tags */}
            {(speaker.speaker_type || speaker.company) && (
              <div className="mt-6 pt-5 text-left" style={{ borderTop: '1px solid #E5E0D4' }}>
                <div className="text-[11px] font-mono uppercase tracking-wider mb-3" style={{ color: '#6B7A72' }}>
                  Interests
                </div>
                <div className="flex flex-wrap gap-2">
                  {speaker.speaker_type && (
                    <span
                      className="inline-flex items-center px-3 rounded-full text-[12px] font-medium"
                      style={{ height: 26, background: '#E8EFEB', color: '#1F4D3A' }}
                    >
                      {speaker.speaker_type.charAt(0).toUpperCase() + speaker.speaker_type.slice(1)}
                    </span>
                  )}
                  {speaker.company && (
                    <span
                      className="inline-flex items-center px-3 rounded-full text-[12px] font-medium"
                      style={{ height: 26, background: '#E8EFEB', color: '#1F4D3A' }}
                    >
                      {speaker.company}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}
