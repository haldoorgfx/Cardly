'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Notif {
  id: string;
  type: string;
  title: string;
  body: string | null;
  action_url: string | null;
  icon: string | null;
  read_at: string | null;
  created_at: string;
}

interface Props {
  initialNotifs: Notif[];
}

// ── Icon badges by type ────────────────────────────────────────────────────────

const ICON_CONFIG: Record<string, { bg: string; stroke: string; icon: React.ReactNode }> = {
  waitlist_spot: {
    bg: '#FFF8E6',
    stroke: '#C9A45E',
    icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="inherit" strokeWidth="1.8"><path d="M12 8v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  },
  new_event_from_follow: {
    bg: '#E8EFEB',
    stroke: '#1F4D3A',
    icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="inherit" strokeWidth="1.8"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg>,
  },
  reminder: {
    bg: '#F5F3EE',
    stroke: '#3A4A42',
    icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="inherit" strokeWidth="1.8"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/></svg>,
  },
  agenda_change: {
    bg: '#F5F3EE',
    stroke: '#3A4A42',
    icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="inherit" strokeWidth="1.8"><path d="M4 20h9M4 4h16M4 12h10M19 15v6M16 18h6"/></svg>,
  },
  card_ready: {
    bg: '#163828',
    stroke: '#E8C57E',
    icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="inherit" strokeWidth="1.8"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
  },
  receipt: {
    bg: '#F5F3EE',
    stroke: '#3A4A42',
    icon: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="inherit" strokeWidth="1.8"><path d="M22 6l-10 7L2 6M2 6h20v12H2z"/></svg>,
  },
};

function getIconConfig(type: string) {
  return ICON_CONFIG[type] ?? ICON_CONFIG.reminder;
}

// ── Day grouping ──────────────────────────────────────────────────────────────

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const notifDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (notifDay.getTime() === today.getTime()) return 'Today';
  if (notifDay.getTime() === yesterday.getTime()) return 'Yesterday';
  return 'Earlier';
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// ── Countdown for waitlist_spot ────────────────────────────────────────────────

function parseCountdownFromTitle(title: string): string | null {
  const m = title.match(/(\d+:\d+:\d+)/);
  return m ? m[1] : null;
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function NotificationsInbox({ initialNotifs }: Props) {
  const [notifs, setNotifs] = useState(initialNotifs);

  function markAllRead() {
    setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    fetch('/api/notifications', { method: 'PATCH' });
  }

  function markRead(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    fetch(`/api/notifications/${id}`, { method: 'PATCH' });
  }

  const unreadCount = notifs.filter(n => !n.read_at).length;

  // Group by day
  const grouped: { label: string; items: Notif[] }[] = [];
  const seen = new Set<string>();
  for (const n of notifs) {
    const label = dayLabel(n.created_at);
    if (!seen.has(label)) { seen.add(label); grouped.push({ label, items: [] }); }
    grouped[grouped.length - 1].items.push(n);
  }

  if (notifs.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-full mx-auto mb-4" style={{ background: '#F5F3EE' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9BA8A1" strokeWidth="1.5">
            <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0"/>
          </svg>
        </div>
        <p className="font-medium text-[15px]" style={{ color: '#3A4A42' }}>Nothing yet</p>
        <p className="text-[13px] mt-1" style={{ color: '#9BA8A1' }}>
          Notifications appear here after you register for an event.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-0">
        <h1 className="font-normal text-[32px]" style={{ fontFamily: '"DM Sans", sans-serif', letterSpacing: '-0.025em', color: '#1F4D3A' }}>
          Notifications
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="font-medium text-[13px] hover:underline"
            style={{ color: '#1F4D3A' }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Groups */}
      {grouped.map(group => (
        <div key={group.label}>
          <div
            className="text-[11px] font-medium uppercase tracking-[0.08em] mt-8 mb-3"
            style={{ color: '#6B7A72' }}
          >
            {group.label}
          </div>

          <div className="grid gap-2.5">
            {group.items.map(n => {
              const cfg = getIconConfig(n.type);
              const isUnread = !n.read_at;
              const countdown = n.type === 'waitlist_spot' ? parseCountdownFromTitle(n.body ?? '') : null;

              return (
                <div
                  key={n.id}
                  className="flex gap-3.5 p-4 sm:p-5 rounded-xl relative"
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E0D4',
                    borderLeft: isUnread ? '2px solid #1F4D3A' : '1px solid #E5E0D4',
                  }}
                  onClick={() => { if (isUnread) markRead(n.id); }}
                >
                  {/* Icon */}
                  <div
                    className="flex items-center justify-center rounded-xl shrink-0 mt-0.5"
                    style={{ width: 40, height: 40, background: cfg.bg, stroke: cfg.stroke } as React.CSSProperties}
                  >
                    <span style={{ stroke: cfg.stroke, display: 'contents' }}>
                      {cfg.icon}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] leading-snug" style={{ color: '#0F1F18' }}
                      dangerouslySetInnerHTML={{ __html: n.title.replace(/<b>(.*?)<\/b>/g, '<strong style="font-weight:600">$1</strong>') }}
                    />
                    {n.body && (
                      <p className="text-[13px] mt-1 leading-snug" style={{ color: '#3A4A42' }}>
                        {n.body}
                        {countdown && (
                          <span className="ml-1 font-medium" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#C9A45E' }}>
                            {countdown}
                          </span>
                        )}
                      </p>
                    )}
                    <span className="block mt-1.5 text-[11px]" style={{ fontFamily: '"JetBrains Mono", monospace', color: '#9BA8A1' }}>
                      {fmtTime(n.created_at)}
                    </span>

                    {/* Action buttons */}
                    {n.type === 'waitlist_spot' && n.action_url && (
                      <div className="flex gap-2 mt-3">
                        <Link
                          href={n.action_url}
                          className="h-8 px-4 rounded-lg font-medium text-[13px] inline-flex items-center transition hover:opacity-90"
                          style={{ background: '#E8C57E', color: '#0F1F18' }}
                        >
                          Claim spot
                        </Link>
                        <button
                          className="h-8 px-4 rounded-lg font-medium text-[13px] transition hover:bg-[#E8EFEB]"
                          style={{ border: '1px solid #1F4D3A', color: '#1F4D3A' }}
                          onClick={e => { e.stopPropagation(); markRead(n.id); }}
                        >
                          Pass
                        </button>
                      </div>
                    )}
                    {n.type === 'new_event_from_follow' && n.action_url && (
                      <div className="mt-3">
                        <Link
                          href={n.action_url}
                          className="h-8 px-4 rounded-lg font-medium text-[13px] inline-flex items-center text-white transition hover:opacity-90"
                          style={{ background: '#1F4D3A' }}
                        >
                          View event
                        </Link>
                      </div>
                    )}
                    {n.type === 'card_ready' && n.action_url && (
                      <div className="mt-3">
                        <Link
                          href={n.action_url}
                          className="h-8 px-4 rounded-lg font-medium text-[13px] inline-flex items-center transition hover:bg-[#E8EFEB]"
                          style={{ border: '1px solid #1F4D3A', color: '#1F4D3A' }}
                        >
                          View my card
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Unread dot */}
                  {isUnread && (
                    <div
                      className="absolute top-4 right-4 w-2 h-2 rounded-full shrink-0"
                      style={{ background: '#1F4D3A' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Bottom link to prefs */}
      <div
        className="flex items-center justify-between gap-3 mt-10 p-4 rounded-xl"
        style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
      >
        <span className="text-[13px]" style={{ color: '#6B7A72' }}>
          Too much? Tune which updates reach you, per channel.
        </span>
        <Link
          href="/account/profile"
          className="h-8 px-4 rounded-lg font-medium text-[13px] inline-flex items-center transition hover:bg-[#E8EFEB] shrink-0"
          style={{ border: '1px solid #1F4D3A', color: '#1F4D3A' }}
        >
          Notification settings
        </Link>
      </div>
    </div>
  );
}
