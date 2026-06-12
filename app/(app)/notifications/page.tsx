'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  icon: string;
  title: string;
  body: string | null;
  action_url: string | null;
  read_at: string | null;
  created_at: string;
}

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

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/notifications?limit=50')
      .then(r => r.json())
      .then(d => setNotifications(d.notifications ?? []))
      .finally(() => setLoading(false));
  }, []);

  function handleClick(notif: Notification) {
    if (!notif.read_at) {
      fetch(`/api/notifications/${notif.id}`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read_at: new Date().toISOString() } : n));
    }
    if (notif.action_url) router.push(notif.action_url);
  }

  function handleMarkAll() {
    fetch('/api/notifications', { method: 'PATCH' });
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
  }

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[22px] font-semibold" style={{ color: '#0F1F18' }}>Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-[13px] mt-0.5" style={{ color: '#6B7A72' }}>{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll}
            className="text-[12px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-lg border transition hover:bg-[#F5F3EE]"
            style={{ color: '#6B7A72', borderColor: '#E5E0D4' }}>
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: '#F5F3EE' }} />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell size={32} strokeWidth={1.3} className="mx-auto mb-3" style={{ color: '#C9C3B1' }} />
          <p className="font-medium text-[15px]" style={{ color: '#3A4A42' }}>You&apos;re all caught up</p>
          <p className="text-[13px] mt-1" style={{ color: '#9BA8A1' }}>Notifications appear here when your attendees take action.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: '#E5E0D4' }}>
          {notifications.map((n, i) => (
            <button key={n.id} onClick={() => handleClick(n)}
              className={`w-full text-left flex items-start gap-4 px-5 py-4 transition hover:bg-[#FAF6EE] ${!n.action_url ? 'cursor-default' : 'cursor-pointer'}`}
              style={{ borderBottom: i < notifications.length - 1 ? '1px solid #F0EDE7' : 'none', background: n.read_at ? 'white' : '#FDFBF7' }}>
              <div className="h-9 w-9 rounded-xl grid place-items-center shrink-0 mt-0.5"
                style={{ background: '#F0EDE8', color: '#1F4D3A' }}>
                {ICONS[n.icon] ?? ICONS.clock}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] font-medium leading-snug" style={{ color: '#0F1F18' }}>{n.title}</p>
                {n.body && <p className="text-[12.5px] mt-0.5" style={{ color: '#6B7A72' }}>{n.body}</p>}
                <p className="text-[11px] mt-1 font-mono" style={{ color: '#9BA8A1' }}>{fmtTime(n.created_at)}</p>
              </div>
              {!n.read_at && (
                <span className="h-2 w-2 rounded-full shrink-0 mt-2" style={{ background: '#E8C57E' }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
