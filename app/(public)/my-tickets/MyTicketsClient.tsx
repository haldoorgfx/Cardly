'use client';

import { useState } from 'react';
import Link from 'next/link';

interface EventPage {
  cover_image_url: string | null;
  venue_name: string | null;
  venue_address: string | null;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  is_online: boolean;
}

interface Registration {
  id: string;
  status: string;
  created_at: string;
  amount_paid: number | null;
  currency: string | null;
  karta_card_url: string | null;
  ticket_types: { name: string; price: number } | null;
  events: {
    id: string;
    name: string;
    slug: string;
    event_pages: EventPage[] | EventPage | null;
  } | null;
}

interface Props {
  upcoming: Registration[];
  past: Registration[];
  cardReg: Registration | null;
  totalCards: number;
}

function getEventPage(reg: Registration): EventPage | null {
  const ep = reg.events?.event_pages;
  if (!ep) return null;
  return Array.isArray(ep) ? ep[0] ?? null : ep;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return 'Past';
  const h = Math.floor(diff / 3_600_000);
  if (h < 24) return `In ${h}h`;
  const d = Math.floor(h / 24);
  return `In ${d} day${d !== 1 ? 's' : ''}`;
}

function TicketCard({ reg }: { reg: Registration }) {
  const ep = getEventPage(reg);
  const location = ep?.is_online ? 'Online' : [ep?.venue_name, ep?.venue_address].filter(Boolean).join(', ') || 'Venue TBA';
  const orderNum = reg.id.slice(-4).toUpperCase();

  return (
    <div
      className="rounded-2xl overflow-hidden mb-5"
      style={{ background: 'white', border: '1px solid #E5E0D4', display: 'grid', gridTemplateColumns: '200px 1fr' }}
    >
      {/* Cover */}
      <div className="relative" style={{ background: 'linear-gradient(160deg, #0D2018, #1F4D3A)' }}>
        {ep?.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ep.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, transparent 60%, rgba(255,255,255,0.08))' }} />
        {ep?.starts_at && (
          <span
            className="absolute left-3 top-3 px-2.5 py-1 rounded-lg text-[11px] font-medium"
            style={{ background: 'rgba(8,18,12,0.55)', backdropFilter: 'blur(6px)', color: 'white', fontFamily: 'JetBrains Mono, monospace' }}
          >
            {timeUntil(ep.starts_at)}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="relative p-6">
        {/* Notch */}
        <div
          className="absolute rounded-full"
          style={{ left: -7, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, background: '#FAF6EE', border: '1px solid #E5E0D4' }}
        />

        <div className="font-display font-medium text-[20px]" style={{ color: '#0F1F18' }}>
          {reg.events?.name ?? 'Event'}
        </div>
        <div className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>{location}</div>

        <div className="flex gap-7 mt-4 flex-wrap">
          {ep?.starts_at && (
            <div>
              <div className="text-[11px] uppercase tracking-wide" style={{ color: '#6B7A72' }}>Date</div>
              <div className="font-mono font-medium text-[15px] mt-0.5" style={{ color: '#1F4D3A' }}>
                {fmtDate(ep.starts_at)} · {fmtTime(ep.starts_at)}
              </div>
            </div>
          )}
          {reg.ticket_types?.name && (
            <div>
              <div className="text-[11px] uppercase tracking-wide" style={{ color: '#6B7A72' }}>Ticket</div>
              <div className="font-mono font-medium text-[15px] mt-0.5" style={{ color: '#1F4D3A' }}>{reg.ticket_types.name}</div>
            </div>
          )}
          <div>
            <div className="text-[11px] uppercase tracking-wide" style={{ color: '#6B7A72' }}>Order</div>
            <div className="font-mono font-medium text-[15px] mt-0.5" style={{ color: '#1F4D3A' }}>#{orderNum}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5 flex-wrap">
          {/* QR placeholder */}
          <div
            className="rounded-lg flex items-center justify-center text-[10px] font-mono shrink-0"
            style={{ width: 52, height: 52, border: '1px solid #E5E0D4', background: '#F5F2EB', color: '#6B7A72' }}
          >
            QR
          </div>
          <Link
            href={`/e/${reg.events?.slug ?? ''}/check-in?reg=${reg.id}`}
            className="inline-flex items-center h-10 px-4 rounded-xl font-display font-semibold text-[13px] text-white"
            style={{ background: '#1F4D3A' }}
          >
            Show check-in QR
          </Link>
          <Link
            href={`/e/${reg.events?.slug ?? ''}/schedule`}
            className="inline-flex items-center h-10 px-4 rounded-xl font-display font-semibold text-[13px]"
            style={{ border: '1px solid #1F4D3A', color: '#1F4D3A' }}
          >
            View agenda
          </Link>
        </div>
      </div>
    </div>
  );
}

function PastRow({ reg }: { reg: Registration }) {
  const ep = getEventPage(reg);
  return (
    <div className="flex items-center gap-4 py-4" style={{ borderBottom: '1px solid #E5E0D4' }}>
      <div
        className="rounded-xl shrink-0"
        style={{ width: 52, height: 52, background: 'linear-gradient(160deg, #1F4D3A, #2A6A50)', overflow: 'hidden' }}
      >
        {ep?.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ep.cover_image_url} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display font-medium text-[15px]" style={{ color: '#0F1F18' }}>{reg.events?.name}</div>
        <div className="font-mono text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>
          {ep?.starts_at ? fmtDate(ep.starts_at) : ''} · {reg.ticket_types?.name ?? 'General'}
        </div>
      </div>
      {reg.karta_card_url && (
        <a
          href={reg.karta_card_url}
          className="shrink-0 text-[13px] font-semibold"
          style={{ color: '#C9A45E', textDecoration: 'none' }}
        >
          View card →
        </a>
      )}
    </div>
  );
}

export default function MyTicketsClient({ upcoming, past, cardReg, totalCards }: Props) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const cardEp = cardReg ? getEventPage(cardReg) : null;

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <div className="max-w-[960px] mx-auto px-5">

        {/* Header */}
        <div className="pt-10 pb-0">
          <h1 className="font-display font-medium text-[32px]" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>
            My tickets
          </h1>
          <div className="text-[14px] mt-1 font-mono" style={{ color: '#6B7A72' }}>
            <span style={{ color: '#0F1F18', fontWeight: 500 }}>{upcoming.length}</span> upcoming ·{' '}
            <span style={{ color: '#0F1F18', fontWeight: 500 }}>{past.length}</span> past ·{' '}
            <span style={{ color: '#0F1F18', fontWeight: 500 }}>{totalCards}</span> Karta Cards
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 mt-6" style={{ borderBottom: '1px solid #E5E0D4' }}>
          {(['upcoming', 'past'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-[18px] py-3 font-display font-medium text-[15px] capitalize transition-colors"
              style={{
                color: tab === t ? '#1F4D3A' : '#6B7A72',
                borderBottom: tab === t ? '2px solid #E8C57E' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Layout */}
        <div
          className="mt-8 mb-16"
          style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 40, alignItems: 'start' }}
        >
          {/* Tickets */}
          <div>
            {tab === 'upcoming' ? (
              upcoming.length > 0
                ? upcoming.map(r => <TicketCard key={r.id} reg={r} />)
                : <p className="py-12 text-center text-[14px]" style={{ color: '#6B7A72' }}>No upcoming events.</p>
            ) : (
              past.length > 0
                ? past.map(r => <PastRow key={r.id} reg={r} />)
                : <p className="py-12 text-center text-[14px]" style={{ color: '#6B7A72' }}>No past events.</p>
            )}
          </div>

          {/* Karta Card sidebar */}
          <aside style={{ position: 'sticky', top: 88 }}>
            {cardReg ? (
              <div
                className="rounded-2xl p-5 text-center"
                style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)' }}
              >
                <div className="text-[11px] font-medium uppercase tracking-wider mb-4" style={{ color: '#C9A45E' }}>
                  Your card · {cardReg.events?.name?.split(' ')[0]}
                </div>

                {/* Mini card */}
                <div
                  className="rounded-xl mx-auto relative overflow-hidden"
                  style={{
                    width: '100%', maxWidth: 220, aspectRatio: '5/7',
                    background: 'linear-gradient(160deg, #0D1F17, #1F4D3A 70%, #163828)',
                    boxShadow: '0 0 26px rgba(232,197,126,0.2), 0 12px 30px rgba(13,31,23,0.25)',
                  }}
                >
                  {cardEp?.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cardEp.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                  )}
                  <div className="absolute inset-0 p-5 flex flex-col">
                    <div className="font-display font-semibold text-[11px]" style={{ color: '#E8C57E', letterSpacing: '0.04em' }}>
                      {cardReg.events?.name}
                    </div>
                    <div className="mt-auto mb-3 mx-auto rounded-full flex items-center justify-center font-display font-semibold text-[20px] text-white"
                      style={{ width: 64, height: 64, border: '2px solid #E8C57E', background: 'rgba(255,255,255,0.08)' }}>
                      {(cardReg.ticket_types?.name ?? 'VIP').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="font-mono text-[10px] text-center" style={{ color: '#E8C57E' }}>
                      {cardReg.ticket_types?.name ?? 'General'} · #{cardReg.id.slice(-4).toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Download */}
                {cardReg.karta_card_url && (
                  <a
                    href={cardReg.karta_card_url}
                    download
                    className="flex items-center justify-center w-full h-10 rounded-xl font-display font-semibold text-[13px] text-white mt-4"
                    style={{ background: '#1F4D3A' }}
                  >
                    ↓ Download card
                  </a>
                )}

                {/* Share icons */}
                <div className="flex gap-2 justify-center mt-3">
                  {[
                    { title: 'WhatsApp', color: '#25D366', path: 'M12 2a10 10 0 00-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1012 2z' },
                    { title: 'Instagram', color: '#C13584', path: '' },
                    { title: 'LinkedIn', color: '#0A66C2', path: '' },
                  ].map(s => (
                    <button
                      key={s.title}
                      title={s.title}
                      className="rounded-full flex items-center justify-center transition hover:opacity-80"
                      style={{ width: 36, height: 36, border: '1px solid #E5E0D4' }}
                    >
                      <span className="text-[11px] font-mono font-medium" style={{ color: s.color }}>
                        {s.title.slice(0, 2)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className="rounded-2xl p-5 text-center"
                style={{ background: 'white', border: '1px solid #E5E0D4' }}
              >
                <div className="text-[14px] mb-2" style={{ color: '#0F1F18', fontWeight: 500 }}>No card yet</div>
                <div className="text-[13px]" style={{ color: '#6B7A72' }}>
                  Register for an event and generate your personalized Karta Card.
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
