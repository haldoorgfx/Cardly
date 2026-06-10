'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { EventCard, type DiscoveryEvent } from './EventCard';

interface PastEvent {
  id: string;
  title: string;
  starts_at: string;
  cover_image_url: string | null;
  custom_slug: string | null;
  events: { slug: string } | null;
}

interface OrganizerProfileProps {
  userId: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  organization: string | null;
  followerCount: number;
  eventsHosted: number;
  upcomingEvents: DiscoveryEvent[];
  pastEvents: PastEvent[];
  isFollowing: boolean;
  savedIds: string[];
}

export function OrganizerProfile({
  userId,
  name,
  bio,
  avatarUrl,
  organization,
  followerCount: initialFollowerCount,
  eventsHosted,
  upcomingEvents,
  pastEvents,
  isFollowing: initialFollowing,
  savedIds,
}: OrganizerProfileProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [savedSet] = useState(new Set(savedIds));

  const displayName = organization ?? name;
  const initials = displayName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const coverUrl = upcomingEvents[0]?.cover_image_url ?? null;

  async function handleFollow() {
    const willFollow = !following;
    setFollowing(willFollow);
    setFollowerCount(c => c + (willFollow ? 1 : -1));

    try {
      if (willFollow) {
        await fetch('/api/account/follows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ organizer_id: userId }),
        });
      } else {
        await fetch(`/api/account/follows?organizer_id=${userId}`, { method: 'DELETE' });
      }
    } catch {
      // revert optimistic update
      setFollowing(!willFollow);
      setFollowerCount(c => c + (willFollow ? -1 : 1));
    }
  }

  return (
    <div>
      {/* ── Banner ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: 240, background: '#0D2018' }}>
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)', opacity: 0.5 }}
          />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,20,14,0.6) 0%, transparent 60%)' }} />
      </div>

      {/* ── Profile header — overlaps banner by 44px ─────── */}
      <div className="max-w-[1120px] mx-auto px-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-11">
          {/* Logo */}
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center text-white font-display font-bold text-[28px] shrink-0"
            style={{
              background: avatarUrl ? undefined : 'linear-gradient(135deg, #1F4D3A, #2A6A50)',
              border: '3px solid #FFFFFF',
              overflow: 'hidden',
            }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : initials}
          </div>

          {/* Meta */}
          <div className="flex-1 min-w-0 pb-1">
            <h1
              className="font-display font-semibold text-[26px] leading-tight"
              style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}
            >
              {displayName}
            </h1>
            {bio && (
              <p className="text-[14px] mt-1 line-clamp-2" style={{ color: '#6B7A72' }}>{bio}</p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 mt-3">
              <Stat value={followerCount} label="followers" />
              <Stat value={eventsHosted} label="events hosted" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:pb-1 shrink-0">
            <button
              onClick={handleFollow}
              className="h-10 px-5 rounded-xl text-[14px] font-medium transition"
              style={following
                ? {
                    background: '#E8C57E',
                    color: '#0F1F18',
                    border: '1px solid #C9A45E',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
                  }
                : {
                    background: 'transparent',
                    color: '#1F4D3A',
                    border: '1px solid #1F4D3A',
                  }}
            >
              {following ? '✓ Following' : 'Follow'}
            </button>
            <button
              className="h-10 px-4 rounded-xl text-[14px] font-medium flex items-center gap-1.5 transition"
              style={{ background: 'transparent', color: '#1F4D3A', border: '1px solid #1F4D3A' }}
              title="Subscribe to calendar (coming soon)"
            >
              <Calendar size={14} /> Calendar
            </button>
          </div>
        </div>

        {/* ── Upcoming events ──────────────────────────────── */}
        <div className="mt-12">
          <h2 className="font-display font-semibold text-[20px] mb-5" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            Upcoming events
          </h2>
          {upcomingEvents.length === 0 ? (
            <p className="text-[14px]" style={{ color: '#6B7A72' }}>No upcoming events scheduled.</p>
          ) : (
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {upcomingEvents.slice(0, 6).map(ev => (
                <EventCard key={ev.id} page={ev} saved={savedSet.has(ev.id)} />
              ))}
            </div>
          )}
        </div>

        {/* ── Past events ──────────────────────────────────── */}
        {pastEvents.length > 0 && (
          <div className="mt-12 pb-24">
            <h2 className="font-display font-semibold text-[20px] mb-5" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
              Past events
            </h2>
            <div className="flex flex-col gap-2">
              {pastEvents.slice(0, 12).map(ev => (
                <PastEventRow key={ev.id} ev={ev} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className="text-[18px] font-semibold"
        style={{ color: '#0F1F18', fontFamily: '"JetBrains Mono", monospace' }}
      >
        {value.toLocaleString()}
      </span>
      <span className="text-[12px]" style={{ color: '#6B7A72' }}>{label}</span>
    </div>
  );
}

function PastEventRow({ ev }: { ev: PastEvent }) {
  const slug = ev.custom_slug ?? ev.events?.slug ?? ev.id;
  return (
    <Link
      href={`/e/${slug}`}
      className="flex items-center gap-4 rounded-xl px-4 py-3 transition hover:bg-[#F0F5F2]"
      style={{ opacity: 0.8 }}
    >
      <div className="rounded-lg overflow-hidden shrink-0" style={{ width: 56, height: 42 }}>
        {ev.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ev.cover_image_url} alt={ev.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-[14px] truncate" style={{ color: '#0F1F18' }}>{ev.title}</div>
        <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72', fontFamily: '"JetBrains Mono", monospace' }}>
          {new Date(ev.starts_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
    </Link>
  );
}
