'use client';

import { useState } from 'react';
import Link from 'next/link';

type Registration = {
  id: string;
  attendee_name: string;
  status: string;
  karta_card_url: string | null;
  qr_code_token: string;
  created_at: string;
  ticket_types: { name: string; price: number } | null;
  events: {
    id: string;
    name: string;
    slug: string;
    event_pages: Array<{
      title: string;
      cover_image_url: string | null;
      starts_at: string | null;
      venue_name: string | null;
      city: string | null;
      is_online: boolean;
    }>;
  } | null;
};

interface Props {
  upcoming: Registration[];
  past: Registration[];
}

function formatEventDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  const day = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return { day, time };
}

function timeUntil(iso: string | null | undefined) {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return null;
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `In ${d} day${d !== 1 ? 's' : ''}`;
  if (h > 0) return `In ${h} hour${h !== 1 ? 's' : ''}`;
  return 'Starting soon';
}

function TicketCard({ reg }: { reg: Registration }) {
  const [showQR, setShowQR] = useState(false);
  const ep = reg.events?.event_pages?.[0];
  const dateInfo = formatEventDate(ep?.starts_at);
  const countdown = timeUntil(ep?.starts_at);
  const venue = ep?.is_online ? 'Online' : [ep?.venue_name, ep?.city].filter(Boolean).join(', ');

  return (
    <div className="bg-white rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid #E5E0D4', boxShadow: '0 1px 4px rgba(15,31,24,0.06)' }}>
      <div className="grid md:grid-cols-[200px_1fr_240px]">
        {/* Cover image */}
        <div className="relative h-40 md:h-auto">
          {ep?.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ep.cover_image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: 'linear-gradient(160deg, #0D2018 0%, #1F4D3A 60%, #2A6A50 100%)' }} />
          )}
          {countdown && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white"
              style={{ background: 'rgba(10,20,14,0.75)', backdropFilter: 'blur(8px)' }}>
              {countdown}
            </span>
          )}
        </div>

        {/* Ticket details */}
        <div className="p-5">
          <Link href={`/e/${reg.events?.slug ?? ''}`}
            className="font-display font-semibold text-[18px] leading-snug hover:text-[#1F4D3A] transition-colors"
            style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            {reg.events?.name ?? ep?.title}
          </Link>
          {venue && <p className="text-[13px] mt-1" style={{ color: '#6B7A72' }}>{venue}</p>}

          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
            {dateInfo && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#9BA8A1' }}>Date</div>
                <div className="text-[13px] font-medium" style={{ color: '#0F1F18' }}>{dateInfo.day}</div>
                <div className="text-[12px]" style={{ color: '#6B7A72' }}>{dateInfo.time}</div>
              </div>
            )}
            {reg.ticket_types && (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#9BA8A1' }}>Ticket</div>
                <div className="text-[13px] font-medium" style={{ color: '#0F1F18' }}>{reg.ticket_types.name}</div>
              </div>
            )}
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#9BA8A1' }}>Order</div>
              <div className="text-[13px] font-medium font-mono" style={{ color: '#0F1F18' }}>#{reg.id.slice(0, 8).toUpperCase()}</div>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#9BA8A1' }}>Status</div>
              <div className="text-[13px] font-medium" style={{ color: reg.status === 'checked_in' ? '#2D7A4F' : '#1F4D3A' }}>
                {reg.status === 'checked_in' ? '✓ Checked in' : 'Confirmed'}
              </div>
            </div>
          </div>

          {/* QR toggle button */}
          <button
            onClick={() => setShowQR(v => !v)}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg text-white text-[13px] font-medium transition hover:opacity-90"
            style={{ background: '#1F4D3A' }}>
            {showQR ? 'Hide QR code' : 'Show check-in QR'}
          </button>

          {showQR && (
            <div className="mt-3 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/qr/${reg.qr_code_token}`} alt="Check-in QR" width={80} height={80}
                className="rounded-lg" style={{ background: 'white', padding: 6 }} />
              <p className="text-[12px]" style={{ color: '#6B7A72' }}>Show this at the door for check-in</p>
            </div>
          )}
        </div>

        {/* Karta Card panel */}
        {reg.karta_card_url && (
          <div className="p-5 border-t md:border-t-0 md:border-l" style={{ borderColor: '#E5E0D4' }}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-3 flex items-center gap-1.5"
              style={{ color: '#C9A45E' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#E8C57E' }} />
              Your card · {reg.events?.name?.split(' ')[0] ?? 'Event'}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={reg.karta_card_url} alt="Your Karta Card"
              className="w-full rounded-xl" style={{ maxWidth: 180 }} />
            <a href={reg.karta_card_url} download className="mt-3 text-[12px] font-medium block transition hover:text-[#1F4D3A]"
              style={{ color: '#6B7A72' }}>
              Download →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyTicketsClient({ upcoming, past }: Props) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-6 border-b mb-6" style={{ borderColor: '#E5E0D4' }}>
        {(['upcoming', 'past'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="pb-3 text-[14px] font-medium transition-colors capitalize border-b-2 -mb-px"
            style={{
              color: tab === t ? '#1F4D3A' : '#6B7A72',
              borderColor: tab === t ? '#E8C57E' : 'transparent',
            }}>
            {t}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[14px]" style={{ color: '#6B7A72' }}>
            {tab === 'upcoming' ? 'No upcoming events. ' : 'No past events yet. '}
            <Link href="/events" className="text-[#1F4D3A] font-medium hover:underline">Browse events →</Link>
          </p>
        </div>
      ) : (
        <div>
          {list.map(reg => <TicketCard key={reg.id} reg={reg} />)}
        </div>
      )}
    </div>
  );
}
