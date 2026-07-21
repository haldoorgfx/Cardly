'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { PageShell, PageHeader } from '@/components/dash';

// ── Types ───────────────────────────────────────────────────────────────────

interface Notification {
  id: string;
  icon: string | null;
  title: string;
  body: string | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

type NotifPrefs = Record<string, boolean>;

interface Props {
  initialNotifs: Notification[];
  initialPrefs: NotifPrefs;
}

// ── List icon set (ported from the canonical list) ───────────────────────────

const ICONS: Record<string, React.ReactNode> = {
  users:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  card:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  dollar:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  briefcase: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
  star:      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  clock:     <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ── Preference rows ──────────────────────────────────────────────────────────
//
// Every row here must correspond to something that ACTUALLY sends, otherwise the
// toggle is decoration: the user opts out of a message they were never going to
// receive, or leaves it on and wonders why nothing arrives. Each key below is
// read by a real sender —
//
//   tickets            lib/notifications.ts (registration / ticket_confirmed / ticket_sale)
//   reminders          lib/notifications.ts (event_reminder) + app/api/cron/reminders
//   agenda_changes     app/api/events/[id]/event-page/route.ts
//   organizer_follows  app/api/events/[id]/route.ts
//   waitlist           app/api/events/[id]/waitlist/route.ts
//
// A sixth row, `recommendations` ("Weekly digest for your city"), was removed:
// nothing reads that key, there is no digest sender, and vercel.json schedules
// exactly one cron (/api/cron/reminders). It advertised a product that does not
// exist. Re-add it in the same commit as the digest itself, not before.
const NOTIF_ROWS: { key: string; label: string; sub: string }[] = [
  { key: 'tickets',          label: 'Tickets & receipts',      sub: 'Confirmation, QR code, Eventera Card' },
  { key: 'reminders',        label: 'Event reminders',         sub: '24 hours and 2 hours before doors' },
  { key: 'agenda_changes',   label: 'Agenda changes',          sub: 'Session moved, cancelled or rescheduled' },
  { key: 'organizer_follows',label: 'Organizers you follow',   sub: 'New event published' },
  { key: 'waitlist',         label: 'Waitlist updates',        sub: 'A spot opened for you' },
];

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className="relative shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D3A]/40 focus-visible:ring-offset-2"
      style={{
        width: 40, height: 23,
        borderRadius: 100,
        background: on ? '#1F4D3A' : '#C9C3B1',
        border: 'none',
      }}
    >
      <span
        className="absolute top-[2.5px] transition-transform"
        style={{
          left: 3,
          width: 18, height: 18,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
          transform: on ? 'translateX(16px)' : 'translateX(0)',
        }}
      />
    </button>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function NotificationsCenter({ initialNotifs, initialPrefs }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<'inbox' | 'prefs'>('inbox');

  // Inbox state
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifs);
  const [markingAll, setMarkingAll] = useState(false);

  // Prefs state
  const [prefs, setPrefs] = useState<NotifPrefs>(initialPrefs);
  const [prefsDirty, setPrefsDirty] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savedPrefs, setSavedPrefs] = useState(false);
  const [prefsError, setPrefsError] = useState(false);

  async function handleClick(notif: Notification) {
    if (!notif.read_at) {
      // Optimistic mark-as-read; revert if the request fails.
      const now = new Date().toISOString();
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read_at: now } : n));
      try {
        const res = await fetch(`/api/notifications/${notif.id}`, { method: 'PATCH' });
        if (!res.ok) throw new Error();
      } catch {
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read_at: null } : n));
      }
    }
    if (notif.action_url) router.push(notif.action_url);
  }

  async function handleMarkAll() {
    if (markingAll) return;
    setMarkingAll(true);
    const snapshot = notifications;
    const now = new Date().toISOString();
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? now })));
    try {
      const res = await fetch('/api/notifications', { method: 'PATCH' });
      if (!res.ok) throw new Error();
    } catch {
      setNotifications(snapshot); // roll back on failure
    } finally {
      setMarkingAll(false);
    }
  }

  function togglePref(key: string, value: boolean) {
    setPrefs(prev => ({ ...prev, [key]: value }));
    setPrefsDirty(true);
    setSavedPrefs(false);
    setPrefsError(false);
  }

  async function savePrefs() {
    setSavingPrefs(true);
    setSavedPrefs(false);
    setPrefsError(false);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_prefs: prefs }),
      });
      if (!res.ok) throw new Error();
      setPrefsDirty(false);
      setSavedPrefs(true);
    } catch {
      setPrefsError(true);
    } finally {
      setSavingPrefs(false);
    }
  }

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <PageShell width="default">
      {/* Header */}
      <PageHeader
        title="Notifications"
        subtitle={tab === 'inbox' && unreadCount > 0 ? `${unreadCount} unread` : undefined}
        actions={tab === 'inbox' && unreadCount > 0 ? (
          <button onClick={handleMarkAll} disabled={markingAll}
            className="min-h-[40px] text-[12px] uppercase tracking-widest px-3 py-1.5 rounded-lg border transition hover:bg-[#F5F3EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D3A]/40 disabled:opacity-50"
            style={{ color: '#3A4A42', borderColor: '#E5E0D4' }}>
            {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        ) : undefined}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: '#F0EDE7' }}>
        {([['inbox', 'Inbox'], ['prefs', 'Preferences']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            aria-pressed={tab === id}
            className="min-h-[40px] text-[13px] font-medium px-4 py-1.5 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D3A]/40"
            style={{
              background: tab === id ? '#FFFFFF' : 'transparent',
              color: tab === id ? '#1F4D3A' : '#3A4A42',
              boxShadow: tab === id ? '0 1px 2px rgba(15,31,24,0.06)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Inbox tab */}
      {tab === 'inbox' && (
        notifications.length === 0 ? (
          <div className="text-center py-20">
            <Bell size={32} strokeWidth={1.3} className="mx-auto mb-3" style={{ color: '#C9C3B1' }} />
            <p className="font-medium text-[15px]" style={{ color: '#0F1F18' }}>You&apos;re all caught up</p>
            <p className="text-[13px] mt-1" style={{ color: '#3A4A42' }}>Notifications appear here as things happen across your events.</p>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden border" style={{ borderColor: '#E5E0D4' }}>
            {notifications.map((n, i) => (
              <button key={n.id} onClick={() => handleClick(n)}
                className={`w-full text-left flex items-start gap-4 px-5 py-4 transition hover:bg-[#FAF6EE] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1F4D3A]/40 ${!n.action_url ? 'cursor-default' : 'cursor-pointer'}`}
                style={{ borderBottom: i < notifications.length - 1 ? '1px solid #F0EDE7' : 'none', background: n.read_at ? 'white' : '#FDFBF7' }}>
                <div className="h-9 w-9 rounded-xl grid place-items-center shrink-0 mt-0.5"
                  style={{ background: '#F0EDE8', color: '#1F4D3A' }}>
                  {ICONS[n.icon ?? 'clock'] ?? ICONS.clock}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-medium leading-snug" style={{ color: '#0F1F18' }}>{n.title}</p>
                  {n.body && <p className="text-[12.5px] mt-0.5" style={{ color: '#3A4A42' }}>{n.body}</p>}
                  <p className="text-[12.5px] mt-1 " style={{ color: '#65736B' }}>{fmtTime(n.created_at)}</p>
                </div>
                {!n.read_at && (
                  <span className="h-2 w-2 rounded-full shrink-0 mt-2" style={{ background: '#E8C57E' }} />
                )}
              </button>
            ))}
          </div>
        )
      )}

      {/* Preferences tab */}
      {tab === 'prefs' && (
        <div>
          <p className="text-[13px] mb-4" style={{ color: '#3A4A42' }}>
            Choose which updates reach you. Changes apply across email and in-app.
          </p>
          <div className="rounded-2xl overflow-hidden border" style={{ borderColor: '#E5E0D4' }}>
            {NOTIF_ROWS.map((row, i) => (
              <div
                key={row.key}
                className="flex items-center justify-between gap-4 px-5 py-4"
                style={{
                  borderBottom: i < NOTIF_ROWS.length - 1 ? '1px solid #F0EDE7' : 'none',
                  background: '#FFFFFF',
                }}
              >
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium" style={{ color: '#0F1F18' }}>{row.label}</p>
                  <p className="text-[12.5px] mt-0.5" style={{ color: '#3A4A42' }}>{row.sub}</p>
                </div>
                <Toggle on={prefs[row.key] ?? true} onChange={v => togglePref(row.key, v)} label={row.label} />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={savePrefs}
              disabled={savingPrefs || !prefsDirty}
              className="min-h-[40px] h-10 px-5 rounded-lg font-medium text-[13px] text-white transition hover:opacity-90 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D3A]/40 focus-visible:ring-offset-2"
              style={{ background: '#1F4D3A' }}
            >
              {savingPrefs ? 'Saving…' : 'Save preferences'}
            </button>
            {savedPrefs && !prefsDirty && (
              <span className="text-[13px]" style={{ color: '#2D7A4F' }} role="status">Saved</span>
            )}
            {prefsError && (
              <span className="text-[13px]" style={{ color: '#B8423C' }} role="alert">Couldn&apos;t save. Try again.</span>
            )}
          </div>
        </div>
      )}
    </PageShell>
  );
}
