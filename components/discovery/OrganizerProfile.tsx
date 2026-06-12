'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Calendar, Check, Plus, CalendarClock, ArrowRight } from 'lucide-react';
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
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [savedSet] = useState(new Set(savedIds));

  const displayName = organization ?? name;
  const initials = displayName.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const coverUrl = upcomingEvents[0]?.cover_image_url ?? null;

  async function handleFollow() {
    const willFollow = !following;
    setFollowing(willFollow);
    setFollowerCount(c => c + (willFollow ? 1 : -1));
    try {
      const res = willFollow
        ? await fetch('/api/account/follows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ organizer_id: userId }),
          })
        : await fetch(`/api/account/follows?organizer_id=${userId}`, { method: 'DELETE' });
      if (res.status === 401) {
        // Not signed in — send them to login and come back here
        router.push(`/account/login?next=/o/${userId}`);
        setFollowing(!willFollow);
        setFollowerCount(c => c + (willFollow ? -1 : 1));
        return;
      }
      if (!res.ok) throw new Error('follow failed');
    } catch {
      setFollowing(!willFollow);
      setFollowerCount(c => c + (willFollow ? -1 : 1));
    }
  }

  return (
    <div>
      {/* Banner */}
      <div className="relative overflow-hidden h-[150px] sm:h-[200px]" style={{ background: '#143024' }}>
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.45 }} />
        ) : (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 50%, #2A6A50 85%, #C9A45E 130%)' }} />
        )}
        <div aria-hidden className="absolute inset-0" style={{
          background: 'radial-gradient(45% 80% at 85% 30%, rgba(232,197,126,0.22), transparent 60%)',
        }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,20,14,0.55) 0%, transparent 55%)' }} />
      </div>

      {/* Profile header — relative z-10 so the avatar sits ABOVE the banner
          (the banner is position:relative and would otherwise paint over it) */}
      <div className="relative z-10 max-w-[1120px] mx-auto px-5">
        {/* Avatar — overlaps banner */}
        <div
          className="w-24 h-24 rounded-[20px] flex items-center justify-center text-white font-display font-bold text-[30px] overflow-hidden -mt-12 sm:-mt-14"
          style={{
            background: avatarUrl ? '#FFFFFF' : 'linear-gradient(135deg, #1F4D3A, #2A6A50)',
            border: '4px solid #FAF6EE',
            boxShadow: '0 8px 24px rgba(15,31,24,0.18)',
          }}
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
          ) : initials}
        </div>

        {/* Name + stats (left) and actions (right) — all on the cream */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-title font-bold text-[26px] sm:text-[32px] leading-tight" style={{ color: '#0F1F18', letterSpacing: '-0.025em' }}>
              {displayName}
            </h1>
            <div className="flex items-center gap-5 mt-2">
              <Stat value={followerCount} label="followers" />
              <Stat value={eventsHosted} label="events hosted" />
            </div>
            {bio && (
              <p className="text-[14px] mt-3 max-w-2xl leading-relaxed" style={{ color: '#3A4A42' }}>{bio}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 sm:mt-1">
            <button
              onClick={handleFollow}
              className="h-10 px-5 rounded-xl text-[14px] font-semibold transition flex items-center gap-1.5 hover:opacity-90"
              style={following
                ? { background: '#E8EFEB', color: '#1F4D3A', border: '1px solid #1F4D3A' }
                : { background: '#1F4D3A', color: '#FFFFFF', border: '1px solid #1F4D3A' }}
            >
              {following ? <Check size={14} /> : <Plus size={14} />}
              {following ? 'Following' : 'Follow'}
            </button>
            <Link
              href={`/o/${userId}/calendar`}
              className="h-10 px-4 rounded-xl text-[14px] font-medium flex items-center gap-1.5 transition hover:bg-[#E8EFEB]"
              style={{ background: '#FFFFFF', color: '#1F4D3A', border: '1px solid #1F4D3A', textDecoration: 'none' }}
            >
              <Calendar size={14} /> Calendar
            </Link>
          </div>
        </div>

        {/* Upcoming events */}
        <div className="mt-10">
          <h2 className="font-title font-bold text-[22px] mb-5" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
            Upcoming events
          </h2>
          {upcomingEvents.length === 0 ? (
            <div className="rounded-2xl py-12 px-6 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
              <CalendarClock size={26} style={{ color: '#C9C3B1' }} className="mx-auto mb-3" />
              <p className="font-display font-semibold text-[15px]" style={{ color: '#0F1F18' }}>No upcoming events</p>
              <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>Follow to get notified when {displayName} announces something new.</p>
            </div>
          ) : (
            <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(280px, 100%), 1fr))' }}>
              {upcomingEvents.slice(0, 6).map(ev => (
                <EventCard key={ev.id} page={ev} saved={savedSet.has(ev.id)} />
              ))}
            </div>
          )}
        </div>

        {/* Past events */}
        {pastEvents.length > 0 && (
          <div className="mt-12 pb-24">
            <h2 className="font-title font-bold text-[22px] mb-5" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
              Past events
            </h2>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
              {pastEvents.slice(0, 12).map((ev, i) => (
                <PastEventRow key={ev.id} ev={ev} first={i === 0} />
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
      <span className="text-[17px] font-bold" style={{ color: '#0F1F18', fontFamily: '"JetBrains Mono", monospace' }}>
        {value.toLocaleString()}
      </span>
      <span className="text-[13px]" style={{ color: '#6B7A72' }}>{label}</span>
    </div>
  );
}

function PastEventRow({ ev, first }: { ev: PastEvent; first: boolean }) {
  const slug = ev.custom_slug ?? ev.events?.slug ?? ev.id;
  return (
    <Link
      href={`/e/${slug}`}
      className="group flex items-center gap-4 px-4 py-3 transition hover:bg-[#F7F4ED]"
      style={{ borderTop: first ? 'none' : '1px solid #F0EDE4', textDecoration: 'none' }}
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
        <div className="font-display font-medium text-[14px] truncate group-hover:text-[#1F4D3A] transition-colors" style={{ color: '#0F1F18' }}>{ev.title}</div>
        <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72', fontFamily: '"JetBrains Mono", monospace' }}>
          {new Date(ev.starts_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
      <ArrowRight size={16} style={{ color: '#C9C3B1' }} className="shrink-0 group-hover:text-[#1F4D3A] transition-colors" />
    </Link>
  );
}
