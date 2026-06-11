'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────────────────

interface SavedEvent {
  id: string;
  event_page_id: string;
  event_pages: {
    id: string;
    title: string;
    cover_image_url: string | null;
    starts_at: string | null;
    city: string | null;
    venue_name: string | null;
    events: { id: string; name: string; slug: string; user_id: string }[];
  } | null;
}

interface OrgFollow {
  id: string;
  organizer_id: string;
  notify_new_events: boolean;
  follower_count: number;
  next_event: { title: string; starts_at: string } | null;
  profiles: { id: string; full_name: string | null; avatar_url: string | null; email: string } | null;
}

interface Props {
  initialSaves: SavedEvent[];
  initialFollows: OrgFollow[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

// ── Unfollow modal ────────────────────────────────────────────────────────────

function UnfollowModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      style={{ background: 'rgba(15,31,24,0.4)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-[400px] p-7 rounded-2xl"
        style={{ background: '#FAF6EE', boxShadow: '0 24px 60px rgba(31,77,58,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-medium text-[19px]" style={{ fontFamily: '"DM Sans", sans-serif', color: '#0F1F18' }}>
          Unfollow {name}?
        </h3>
        <p className="mt-2.5 text-[13px] leading-relaxed" style={{ color: '#6B7A72' }}>
          You&apos;ll stop getting notified when they publish new events. Their events still appear in search and city pages.
        </p>
        <div className="flex gap-2.5 justify-end mt-6">
          <button
            onClick={onCancel}
            className="h-9 px-4 rounded-lg font-medium text-[13px] transition hover:bg-[#E8EFEB]"
            style={{ border: '1px solid #1F4D3A', color: '#1F4D3A' }}
          >
            Keep following
          </button>
          <button
            onClick={onConfirm}
            className="h-9 px-4 rounded-lg font-medium text-[13px] transition"
            style={{ border: '1px solid #B8423C', color: '#B8423C' }}
          >
            Unfollow
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SavedAndFollowing({ initialSaves, initialFollows }: Props) {
  const [tab, setTab] = useState<0 | 1>(0);
  const [saves, setSaves] = useState(initialSaves);
  const [follows, setFollows] = useState(initialFollows);
  const [unfollowTarget, setUnfollowTarget] = useState<OrgFollow | null>(null);

  async function unsave(save: SavedEvent) {
    setSaves(prev => prev.filter(s => s.id !== save.id));
    await fetch(`/api/account/saved?event_page_id=${save.event_page_id}`, { method: 'DELETE' });
  }

  async function unfollow(follow: OrgFollow) {
    setFollows(prev => prev.filter(f => f.id !== follow.id));
    setUnfollowTarget(null);
    await fetch(`/api/account/follows?organizer_id=${follow.organizer_id}`, { method: 'DELETE' });
  }

  async function toggleBell(follow: OrgFollow) {
    const updated = !follow.notify_new_events;
    setFollows(prev => prev.map(f => f.id === follow.id ? { ...f, notify_new_events: updated } : f));
    await fetch(`/api/account/follows/${follow.id}/notify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notify_new_events: updated }),
    });
  }

  const tabs = [
    { label: 'Saved events', count: saves.length },
    { label: 'Organizers',   count: follows.length },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-7 mt-6" style={{ borderBottom: '1px solid #E5E0D4' }}>
        {tabs.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i as 0 | 1)}
            className="pb-3 flex items-center gap-2 font-medium text-[15px] border-b-2 -mb-px transition-colors"
            style={{
              fontFamily: '"DM Sans", sans-serif',
              color: tab === i ? '#1F4D3A' : '#6B7A72',
              borderColor: tab === i ? '#1F4D3A' : 'transparent',
            }}
          >
            {t.label}
            <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── Saved events pane ── */}
      {tab === 0 && (
        <div className="pt-7">
          {saves.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[14px]" style={{ color: '#6B7A72' }}>
                No saved events yet.{' '}
                <Link href="/events" className="font-medium hover:underline" style={{ color: '#1F4D3A' }}>
                  Browse events →
                </Link>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {saves.map(save => {
                const ep = save.event_pages;
                const slug = ep?.events?.[0]?.slug;
                return (
                  <div
                    key={save.id}
                    className="rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
                  >
                    <div className="relative" style={{ aspectRatio: '4/3' }}>
                      {ep?.cover_image_url ? (
                        <Image src={ep.cover_image_url} alt="" fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }} />
                      )}
                      {/* Heart button */}
                      <button
                        className="absolute top-3 right-3 flex items-center justify-center rounded-full z-10 transition hover:scale-110"
                        style={{ width: 32, height: 32, background: 'rgba(8,18,12,0.35)', backdropFilter: 'blur(6px)' }}
                        onClick={() => unsave(save)}
                        title="Remove from saved"
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="#E8C57E" stroke="#E8C57E" strokeWidth="1.8">
                          <path d="M12 21s-8-5.3-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.7-8 11-8 11z" />
                        </svg>
                      </button>
                    </div>

                    <Link href={slug ? `/e/${slug}` : '/events'}>
                      <div className="p-3.5">
                        <div className="font-medium text-[15px] leading-snug" style={{ fontFamily: '"DM Sans", sans-serif', color: '#0F1F18' }}>
                          {ep?.title ?? 'Event'}
                        </div>
                        {ep?.events?.[0] && (
                          <div className="text-[13px] mt-0.5" style={{ color: '#6B7A72' }}>
                            {ep.events[0].name !== ep.title ? ep.events[0].name : (ep.city ?? ep.venue_name)}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#6B7A72' }}>
                            {fmtDate(ep?.starts_at)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Organizers pane ── */}
      {tab === 1 && (
        <div className="pt-7">
          {follows.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[14px]" style={{ color: '#6B7A72' }}>
                Not following any organizers yet.{' '}
                <Link href="/events" className="font-medium hover:underline" style={{ color: '#1F4D3A' }}>
                  Discover events →
                </Link>
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {follows.map(follow => {
                const org = follow.profiles;
                const name = org?.full_name ?? org?.email?.split('@')[0] ?? 'Organizer';
                return (
                  <div
                    key={follow.id}
                    className="flex items-center gap-4 p-4 sm:p-5 rounded-xl"
                    style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
                  >
                    {/* Avatar */}
                    <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0" style={{ border: '1px solid #E5E0D4' }}>
                      {org?.avatar_url ? (
                        <Image src={org.avatar_url} alt="" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-semibold text-[16px]"
                          style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }}>
                          {name[0].toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[15px]" style={{ fontFamily: '"DM Sans", sans-serif', color: '#0F1F18' }}>
                        {name}
                      </div>
                      <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>
                        <span style={{ fontFamily: '"JetBrains Mono", monospace', color: '#3A4A42', fontWeight: 500 }}>
                          {follow.follower_count.toLocaleString()}
                        </span>{' '}
                        followers
                      </div>
                      {follow.next_event && (
                        <div className="text-[12px] mt-0.5 font-medium" style={{ color: '#1F4D3A' }}>
                          Next: {follow.next_event.title} · {fmtDate(follow.next_event.starts_at)}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {/* Bell toggle */}
                      <button
                        onClick={() => toggleBell(follow)}
                        className="flex items-center justify-center rounded-lg transition"
                        style={{
                          width: 38, height: 38,
                          border: `1px solid ${follow.notify_new_events ? '#1F4D3A' : '#E5E0D4'}`,
                          background: follow.notify_new_events ? '#E8EFEB' : '#FFFFFF',
                        }}
                        title={follow.notify_new_events ? 'Turn off notifications' : 'Turn on notifications'}
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
                          stroke={follow.notify_new_events ? '#1F4D3A' : '#6B7A72'} strokeWidth="1.8">
                          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />
                        </svg>
                      </button>

                      {/* Following button */}
                      <button
                        onClick={() => setUnfollowTarget(follow)}
                        className="h-9 px-3 rounded-lg font-medium text-[13px] transition hover:bg-[#F5F3EE]"
                        style={{ border: '1px solid #1F4D3A', color: '#1F4D3A', fontFamily: '"DM Sans", sans-serif' }}
                      >
                        Following
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Unfollow modal */}
      {unfollowTarget && (
        <UnfollowModal
          name={unfollowTarget.profiles?.full_name ?? 'this organizer'}
          onConfirm={() => unfollow(unfollowTarget)}
          onCancel={() => setUnfollowTarget(null)}
        />
      )}
    </div>
  );
}
