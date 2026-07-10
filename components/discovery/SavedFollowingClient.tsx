'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Bell, BellOff, Calendar, MapPin, Globe, Users } from 'lucide-react';
import { PublicNav } from '@/components/events/PublicNav';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventPage = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Follow = any;

interface Props {
  saved: EventPage[];
  following: Follow[];
  userId: string;
  /** When true (dashboard), the PublicNav header and full-page background are
   *  suppressed — the AppShell provides the chrome. */
  embedded?: boolean;
}

const DEMO_SAVED: EventPage[] = [
  { id: '1', title: 'Africa Climate Action 2027', cover_image_url: null, starts_at: '2027-01-15T09:00:00Z', city: 'Nairobi', is_online: false, price_from: 0, custom_slug: null, events: { slug: 'africa-climate-action-2027' } },
  { id: '2', title: 'Sahel Fintech Forum 2026', cover_image_url: null, starts_at: '2026-09-20T08:00:00Z', city: 'Dakar', is_online: false, price_from: 50, custom_slug: null, events: { slug: 'sahel-fintech-2026' } },
  { id: '3', title: 'Lagos Design Week', cover_image_url: null, starts_at: '2026-11-05T10:00:00Z', city: 'Lagos', is_online: false, price_from: 0, custom_slug: null, events: { slug: 'lagos-design-week' } },
  { id: '4', title: 'Virtual AI Summit Africa', cover_image_url: null, starts_at: '2026-08-12T14:00:00Z', city: null, is_online: true, price_from: 0, custom_slug: null, events: { slug: 'ai-summit-africa' } },
];

const DEMO_FOLLOWING: Follow[] = [
  { organizer_id: 'o1', profiles: { id: 'o1', full_name: 'Eventera Studio', organization: 'Eventera Studio', avatar_url: null }, next_event_title: 'Lagos Design Week', follower_count: 2840 },
  { organizer_id: 'o2', profiles: { id: 'o2', full_name: 'Amara Events', organization: 'Amara Events', avatar_url: null }, next_event_title: 'Africa Climate Action', follower_count: 1203 },
  { organizer_id: 'o3', profiles: { id: 'o3', full_name: 'Fintech Hub', organization: null, avatar_url: null }, next_event_title: null, follower_count: 456 },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtPrice(p: number | null) {
  return !p || p === 0 ? 'Free' : `From $${p}`;
}

function getSlug(ep: EventPage) {
  return ep.custom_slug ?? ep.events?.slug ?? ep.id;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export function SavedFollowingClient({ saved: dbSaved, following: dbFollowing, embedded = false }: Props) {
  const saved = dbSaved.length > 0 ? dbSaved : DEMO_SAVED;
  const following = dbFollowing.length > 0 ? dbFollowing : DEMO_FOLLOWING;
  const [tab, setTab] = useState<'saved' | 'following'>('saved');
  const [notifications, setNotifications] = useState<Set<string>>(new Set());

  function toggleNotif(id: string) {
    setNotifications(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div style={embedded ? undefined : { background: '#FAF6EE', minHeight: '100vh' }}>
      {!embedded && <PublicNav />}
      <div className="max-w-[760px] mx-auto px-5 py-8">
        <h1 className="font-display font-semibold text-[26px] sm:text-[30px] mb-6" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
          Saved &amp; Following
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: '#EDE9E0' }}>
          {[
            { key: 'saved', label: `Saved events (${saved.length})` },
            { key: 'following', label: `Following (${following.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as 'saved' | 'following')}
              className="px-5 py-2 rounded-lg text-[13px] font-semibold transition"
              style={{
                background: tab === t.key ? '#FFFFFF' : 'transparent',
                color: tab === t.key ? '#0F1F18' : '#6B7A72',
                boxShadow: tab === t.key ? '0 1px 3px rgba(15,31,24,0.08)' : 'none',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Saved events grid */}
        {tab === 'saved' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {saved.map((ep: EventPage) => (
              <Link key={ep.id} href={`/e/${getSlug(ep)}`} className="block rounded-2xl overflow-hidden transition hover:shadow-md"
                style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', textDecoration: 'none' }}>
                {/* Cover */}
                <div className="h-32 relative" style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }}>
                  {ep.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ep.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <button
                    onClick={e => { e.preventDefault(); /* unsave */ }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition hover:scale-110"
                    style={{ background: 'rgba(0,0,0,0.35)' }}>
                    <Heart size={14} fill="#FAF6EE" style={{ color: '#FAF6EE' }} />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-[14px] mb-1 line-clamp-2" style={{ color: '#0F1F18' }}>{ep.title}</h3>
                  <div className="flex items-center gap-1.5 text-[12px] mb-1" style={{ color: '#6B7A72' }}>
                    {ep.starts_at && <><Calendar size={11} /> {fmtDate(ep.starts_at)}</>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[12px]" style={{ color: '#6B7A72' }}>
                      {ep.is_online ? <Globe size={11} /> : <MapPin size={11} />}
                      <span>{ep.is_online ? 'Online' : ep.city ?? 'TBA'}</span>
                    </div>
                    <span className="font-semibold text-[12px]" style={{ color: '#1F4D3A' }}>{fmtPrice(ep.price_from)}</span>
                  </div>
                </div>
              </Link>
            ))}
            {saved.length === 0 && (
              <div className="col-span-2 py-20 text-center rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
                <Heart size={28} style={{ color: '#C9C3B1' }} className="mx-auto mb-3" />
                <p className="font-medium text-[15px]" style={{ color: '#0F1F18' }}>No saved events yet</p>
                <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>Heart an event to save it here</p>
              </div>
            )}
          </div>
        )}

        {/* Following list */}
        {tab === 'following' && (
          <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            {following.map((f: Follow, i: number) => {
              const profile = f.profiles;
              const name = profile?.organization ?? profile?.full_name ?? 'Organizer';
              const notifOn = notifications.has(f.organizer_id);
              return (
                <div key={f.organizer_id} className="flex items-center gap-4 px-5 py-4 transition hover:bg-[#FAFAF8]"
                  style={{ borderBottom: i < following.length - 1 ? '1px solid #F0EDE6' : 'none' }}>
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center font-display font-bold text-[16px] shrink-0"
                    style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                    {profile?.avatar_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={profile.avatar_url} alt={name} className="w-11 h-11 rounded-xl object-cover" />
                      : initials(name)
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/o/${profile?.id}`} className="font-semibold text-[14px] hover:underline block"
                      style={{ color: '#0F1F18' }}>
                      {name}
                    </Link>
                    <div className="flex items-center gap-3 text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>
                      <span className="flex items-center gap-1">
                        <Users size={11} /> {(f.follower_count ?? 0).toLocaleString()} followers
                      </span>
                      {f.next_event_title && (
                        <span className="truncate">Next: {f.next_event_title}</span>
                      )}
                    </div>
                  </div>
                  {/* Notifications bell */}
                  <button onClick={() => toggleNotif(f.organizer_id)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:opacity-80 shrink-0"
                    style={{ background: notifOn ? '#E8EFEB' : '#F5F2EC' }}>
                    {notifOn
                      ? <Bell size={15} style={{ color: '#1F4D3A' }} fill="#1F4D3A" />
                      : <BellOff size={15} style={{ color: '#6B7A72' }} />
                    }
                  </button>
                  <button className="px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition hover:opacity-80 shrink-0"
                    style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>
                    Following
                  </button>
                </div>
              );
            })}
            {following.length === 0 && (
              <div className="py-20 text-center">
                <Users size={28} style={{ color: '#C9C3B1' }} className="mx-auto mb-3" />
                <p className="font-medium text-[15px]" style={{ color: '#0F1F18' }}>Not following anyone yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
