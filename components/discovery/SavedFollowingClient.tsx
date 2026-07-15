'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Bell, BellOff, Calendar, MapPin, Globe, Users } from 'lucide-react';
import { PublicNav } from '@/components/events/PublicNav';
import { PageShell, PageHeader } from '@/components/dash';

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
  // Real data only — the demo fallbacks masked the real empty states.
  const [saved, setSaved] = useState<EventPage[]>(dbSaved);
  const [following, setFollowing] = useState<Follow[]>(dbFollowing);
  const [tab, setTab] = useState<'saved' | 'following'>('saved');
  // Keyed by the follow row's id. Seed from each row's persisted notify_new_events.
  const [notifications, setNotifications] = useState<Set<string>>(
    () => new Set(dbFollowing.filter((f: Follow) => f.notify_new_events).map((f: Follow) => f.id)),
  );
  const [busy, setBusy] = useState<Set<string>>(new Set());

  // Persist the "notify me of new events" preference (was a dead local-only toggle).
  async function toggleNotif(f: Follow) {
    if (busy.has(f.id)) return;
    const next = !notifications.has(f.id);
    setBusy(b => new Set(b).add(f.id));
    setNotifications(prev => {
      const s = new Set(prev);
      if (next) s.add(f.id); else s.delete(f.id);
      return s;
    });
    try {
      const res = await fetch(`/api/account/follows/${f.id}/notify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notify_new_events: next }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // rollback on failure
      setNotifications(prev => {
        const s = new Set(prev);
        if (next) s.delete(f.id); else s.add(f.id);
        return s;
      });
    } finally {
      setBusy(b => { const n = new Set(b); n.delete(f.id); return n; });
    }
  }

  // Unsave — optimistic remove + rollback on failure (was a dead no-op).
  async function unsave(ep: EventPage) {
    const prev = saved;
    setSaved(s => s.filter(x => x.id !== ep.id));
    try {
      const res = await fetch(`/api/account/saved?event_page_id=${ep.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch { setSaved(prev); }
  }

  // Unfollow — confirm (destructive) + optimistic (was a dead button).
  async function unfollow(f: Follow) {
    const label = f.profiles?.organization ?? f.profiles?.full_name ?? 'this organizer';
    if (!confirm(`Unfollow ${label}?`)) return;
    if (busy.has(f.organizer_id)) return;
    setBusy(b => new Set(b).add(f.organizer_id));
    const prev = following;
    setFollowing(list => list.filter(x => x.organizer_id !== f.organizer_id));
    try {
      const res = await fetch(`/api/account/follows?organizer_id=${f.organizer_id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setFollowing(prev);
    } finally {
      setBusy(b => { const n = new Set(b); n.delete(f.organizer_id); return n; });
    }
  }

  return (
    <div style={embedded ? undefined : { background: '#FAF6EE', minHeight: '100vh' }}>
      {!embedded && <PublicNav />}
      <PageShell width="wide">
        <PageHeader title="Saved & Following" />

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
                color: tab === t.key ? '#0F1F18' : '#65736B',
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
                <div className="h-32 relative flex items-center justify-center font-display font-semibold text-[22px]" style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                  {!ep.cover_image_url && (ep.title?.[0]?.toUpperCase() ?? '')}
                  {ep.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ep.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <button
                    aria-label="Remove from saved"
                    onClick={e => { e.preventDefault(); unsave(ep); }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition hover:scale-110 focus-visible:ring-2 focus-visible:ring-white"
                    style={{ background: 'rgba(0,0,0,0.35)' }}>
                    <Heart size={14} fill="#FAF6EE" style={{ color: '#FAF6EE' }} />
                  </button>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-[14px] mb-1 line-clamp-2" style={{ color: '#0F1F18' }}>{ep.title}</h3>
                  <div className="flex items-center gap-1.5 text-[12px] mb-1" style={{ color: '#65736B' }}>
                    {ep.starts_at && <><Calendar size={11} /> {fmtDate(ep.starts_at)}</>}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[12px]" style={{ color: '#65736B' }}>
                      {ep.is_online ? <Globe size={11} /> : <MapPin size={11} />}
                      <span>{ep.is_online ? 'Online' : ep.city ?? 'TBA'}</span>
                    </div>
                    <span className="font-semibold text-[12px]" style={{ color: '#0F1F18' }}>{fmtPrice(ep.price_from)}</span>
                  </div>
                </div>
              </Link>
            ))}
            {saved.length === 0 && (
              <div className="col-span-2 py-20 text-center rounded-2xl" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
                <Heart size={28} style={{ color: '#C9C3B1' }} className="mx-auto mb-3" />
                <p className="font-medium text-[15px]" style={{ color: '#0F1F18' }}>No saved events yet</p>
                <p className="text-[13px] mt-1" style={{ color: '#65736B' }}>Heart an event to save it here</p>
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
              const notifOn = notifications.has(f.id);
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
                    <div className="flex items-center gap-3 text-[12px] mt-0.5" style={{ color: '#65736B' }}>
                      <span className="flex items-center gap-1">
                        <Users size={11} /> {(f.follower_count ?? 0).toLocaleString()} followers
                      </span>
                      {f.next_event_title && (
                        <span className="truncate">Next: {f.next_event_title}</span>
                      )}
                    </div>
                  </div>
                  {/* Notifications bell */}
                  <button onClick={() => toggleNotif(f)}
                    disabled={busy.has(f.id)}
                    aria-label={notifOn ? 'Turn off new-event alerts' : 'Notify me of new events'}
                    title={notifOn ? 'Alerts on — new events' : 'Notify me of new events'}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:opacity-80 shrink-0 disabled:opacity-60"
                    style={{ background: notifOn ? '#E8EFEB' : '#F5F2EC' }}>
                    {notifOn
                      ? <Bell size={15} style={{ color: '#1F4D3A' }} fill="#1F4D3A" />
                      : <BellOff size={15} style={{ color: '#65736B' }} />
                    }
                  </button>
                  <button
                    onClick={() => unfollow(f)}
                    disabled={busy.has(f.organizer_id)}
                    className="group/unfollow px-3 py-1.5 rounded-xl text-[12px] font-semibold border transition shrink-0 focus-visible:ring-2 focus-visible:ring-[#B8423C]/40 hover:border-[#B8423C] hover:text-[#B8423C]"
                    style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}>
                    <span className="group-hover/unfollow:hidden">Following</span>
                    <span className="hidden group-hover/unfollow:inline">Unfollow</span>
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
      </PageShell>
    </div>
  );
}
