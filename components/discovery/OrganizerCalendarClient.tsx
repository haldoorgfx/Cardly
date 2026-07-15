'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Globe, MapPin, X, Copy, Check } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventPage = any;

interface Props {
  userId: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  followerCount: number;
  events: EventPage[];
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return {
    day: d.getDate().toString().padStart(2, '0'),
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
    dow: d.toLocaleString('en', { weekday: 'short' }).toUpperCase(),
  };
}

function fmtMonth(iso: string) {
  return new Date(iso).toLocaleString('en', { month: 'long', year: 'numeric' });
}

function fmtPrice(price: number | null) {
  if (!price || price === 0) return 'Free';
  return `From $${price}`;
}

function CopyICS({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition hover:opacity-80"
      style={{ borderColor: '#E5E0D4', color: '#3A4A42' }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy ICS'}
    </button>
  );
}

export function OrganizerCalendarClient({ userId, name, avatarUrl, bio, followerCount, events }: Props) {
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subscribeTypes, setSubscribeTypes] = useState({ ics: true, email: true, whatsapp: false });

  const icsUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/calendars/${userId}.ics`;

  // Group events by month
  const byMonth: Record<string, EventPage[]> = {};
  for (const ep of events) {
    if (!ep.starts_at) continue;
    const key = fmtMonth(ep.starts_at);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(ep);
  }

  function getEventHref(ep: EventPage) {
    return `/e/${ep.custom_slug ?? ep.events?.slug ?? ep.id}`;
  }

  return (
    <>
      <div className="max-w-[740px] mx-auto px-5 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-bold text-[24px] shrink-0"
              style={{ background: avatarUrl ? 'transparent' : '#1F4D3A', color: '#FAF6EE' }}>
              {avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={avatarUrl} alt={name} className="w-16 h-16 rounded-2xl object-cover" />
                : name.slice(0, 1).toUpperCase()
              }
            </div>
            <div>
              <h1 className="font-display font-semibold text-[22px]" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
                {name}
              </h1>
              <p className="text-[13px]" style={{ color: '#6B7A72' }}>
                {followerCount.toLocaleString()} subscribers · {events.length} upcoming event{events.length !== 1 ? 's' : ''}
              </p>
              {bio && <p className="text-[13px] mt-1 max-w-sm" style={{ color: '#6B7A72' }}>{bio}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <button
              onClick={() => setShowSubscribeModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition hover:opacity-90"
              style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
              <CalendarDays size={14} /> Subscribe
            </button>
            <Link href={`/o/${userId}`} className="text-[12px] text-center transition hover:opacity-70" style={{ color: '#6B7A72' }}>
              View profile
            </Link>
          </div>
        </div>

        {/* Events by month */}
        {events.length === 0 ? (
          <div className="rounded-2xl py-20 text-center" style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}>
            <CalendarDays size={32} style={{ color: '#C9C3B1' }} className="mx-auto mb-3" />
            <p className="text-[15px] font-medium" style={{ color: '#0F1F18' }}>No upcoming events</p>
          </div>
        ) : (
          Object.entries(byMonth).map(([month, monthEvents]) => (
            <div key={month} className="mb-8">
              <div className="text-[11px] font-bold tracking-[0.14em] uppercase mb-3" style={{ color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {month}
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}>
                {monthEvents.map((ep: EventPage, i: number) => {
                  const dt = ep.starts_at ? fmtDate(ep.starts_at) : null;
                  return (
                    <Link key={ep.id} href={getEventHref(ep)} className="flex items-center gap-4 px-5 py-4 transition hover:bg-[#F5F2EC]" style={{ borderBottom: i < monthEvents.length - 1 ? '1px solid #F0EDE6' : undefined, display: 'flex', textDecoration: 'none' }}>
                      {/* Date column */}
                      {dt ? (
                        <div className="w-16 shrink-0 text-center">
                          <div className="font-display font-bold text-[22px] leading-none" style={{ color: '#0F1F18', fontFamily: 'Inter, system-ui, sans-serif' }}>{dt.day}</div>
                          <div className="text-[10px] font-semibold tracking-[0.1em] mt-0.5" style={{ color: '#6B7A72' }}>{dt.month} · {dt.dow}</div>
                        </div>
                      ) : (
                        <div className="w-16 shrink-0" />
                      )}
                      {/* Cover image */}
                      {ep.cover_image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ep.cover_image_url} alt="" className="w-16 h-12 object-cover rounded-xl shrink-0" />
                      )}
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[14px] truncate" style={{ color: '#0F1F18' }}>{ep.title}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[12px]" style={{ color: '#6B7A72' }}>
                          {ep.is_online ? <Globe size={11} /> : <MapPin size={11} />}
                          <span className="truncate">{ep.is_online ? 'Online' : [ep.venue_name, ep.city].filter(Boolean).join(', ') || 'TBA'}</span>
                        </div>
                      </div>
                      {/* Price */}
                      <div className="text-[13px] font-semibold shrink-0" style={{ color: '#0F1F18' }}>
                        {fmtPrice(ep.price_from)}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Subscribe modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,31,24,0.45)' }} onClick={() => setShowSubscribeModal(false)}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#FFFFFF' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-[18px]" style={{ color: '#0F1F18' }}>Subscribe to {name}</h3>
              <button onClick={() => setShowSubscribeModal(false)} style={{ color: '#6B7A72' }}><X size={18} /></button>
            </div>
            <p className="text-[13px] mb-5" style={{ color: '#6B7A72' }}>Choose how you want to stay updated when new events are added.</p>
            {[
              { key: 'ics', label: 'Calendar feed', sub: 'ICS / Google Calendar / Apple Calendar' },
              { key: 'email', label: 'Email digest', sub: 'Weekly summary of upcoming events' },
              { key: 'whatsapp', label: 'WhatsApp', sub: 'Instant notification on new events' },
            ].map(opt => (
              <label key={opt.key} className="flex items-start gap-3 mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={subscribeTypes[opt.key as keyof typeof subscribeTypes]}
                  onChange={e => setSubscribeTypes(s => ({ ...s, [opt.key]: e.target.checked }))}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-[14px] font-medium" style={{ color: '#0F1F18' }}>{opt.label}</div>
                  <div className="text-[12px]" style={{ color: '#6B7A72' }}>{opt.sub}</div>
                </div>
              </label>
            ))}
            {subscribeTypes.ics && (
              <div className="mt-3 mb-5">
                <div className="text-[11px] font-medium mb-1.5" style={{ color: '#6B7A72' }}>ICS URL</div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] break-all" style={{ background: '#F0EDE6', fontFamily: 'Inter, system-ui, sans-serif', color: '#3A4A42' }}>
                  <span className="flex-1 truncate">{icsUrl}</span>
                  <CopyICS url={icsUrl} />
                </div>
              </div>
            )}
            <button
              onClick={() => setShowSubscribeModal(false)}
              className="w-full py-3 rounded-2xl text-[14px] font-semibold transition hover:opacity-90"
              style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
              Subscribe
            </button>
          </div>
        </div>
      )}
    </>
  );
}
