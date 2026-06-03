'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Globe, Users } from 'lucide-react';
import type { Database } from '@/types/database';

type EventPageRow = Database['public']['Tables']['event_pages']['Row'];
type TicketTypeRow = Database['public']['Tables']['ticket_types']['Row'];

interface PublicSpeaker {
  id: string;
  name: string;
  role: string | null;
  photoUrl: string | null;
}

interface PublicSession {
  id: string;
  title: string;
  startsAt: string;
  room: string | null;
  speakerName: string | null;
}

interface Props {
  page: EventPageRow;
  tickets: TicketTypeRow[];
  dateStr: string;
  timeStr: string;
  endTimeStr: string;
  minPrice: string;
  registrationSlug: string;
  speakers?: PublicSpeaker[];
  sessions?: PublicSession[];
  registrationCount?: number;
}

function formatSessionTime(startsAt: string, timezone: string) {
  try {
    return new Date(startsAt).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: timezone,
    });
  } catch {
    return new Date(startsAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
}

export function PublicEventPageClient({
  page, tickets, dateStr, timeStr, endTimeStr, minPrice, registrationSlug,
  speakers = [], sessions = [], registrationCount = 0,
}: Props) {
  const [selectedTicket, setSelectedTicket] = useState<string>(tickets[0]?.id ?? '');

  const selectedTicketObj = tickets.find(t => t.id === selectedTicket);
  const registerHref = selectedTicket
    ? `/e/${registrationSlug}/register?ticket=${selectedTicket}`
    : `/e/${registrationSlug}/register`;

  const locationLine = page.is_online
    ? 'Online event'
    : [page.venue_name, page.venue_address].filter(Boolean).join(' · ') || 'Venue TBA';

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden w-full" style={{ height: 420 }}>
        {page.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={page.cover_image_url}
            alt={page.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(160deg, #0D2018 0%, #1F4D3A 50%, #2A6A50 100%)' }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(10,20,14,0.88) 0%, rgba(10,20,14,0.40) 45%, transparent 75%)' }}
        />

        {/* Bottom caption */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="max-w-[1000px] mx-auto px-10 pb-10 flex items-end justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-0">
              {page.organizer_name && (
                <div className="font-display text-[16px] font-medium mb-2" style={{ color: '#E8C57E' }}>
                  {page.organizer_name}
                </div>
              )}
              <h1
                className="font-display font-medium leading-tight"
                style={{ fontSize: 'clamp(24px, 3.5vw, 36px)', letterSpacing: '-0.025em', color: 'white' }}
              >
                {page.title}
              </h1>
            </div>
            <div
              className="text-right shrink-0 hidden sm:block"
              style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7 }}
            >
              <div>{dateStr}</div>
              <div>{locationLine}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main layout ───────────────────────────────────────────── */}
      <div
        className="grid gap-14 max-w-[1000px] mx-auto px-10 mt-12 mb-24"
        style={{ gridTemplateColumns: 'minmax(0,1fr) 320px', alignItems: 'start' }}
      >

        {/* ── Content column ──────────────────────────────────────── */}
        <div>

          {/* Meta strip */}
          <div
            className="flex flex-wrap gap-x-4 gap-y-1 pb-7 text-[14px]"
            style={{ borderBottom: '1px solid #E5E0D4', fontFamily: 'JetBrains Mono, monospace', color: '#3A4A42' }}
          >
            <span>{dateStr} · {timeStr}</span>
            <span style={{ color: '#E5E0D4' }}>·</span>
            <span className="flex items-center gap-1.5">
              {page.is_online
                ? <Globe size={13} strokeWidth={2} style={{ color: '#6B7A72' }} />
                : <MapPin size={13} strokeWidth={2} style={{ color: '#6B7A72' }} />}
              {locationLine}
            </span>
            {page.max_capacity && (
              <>
                <span style={{ color: '#E5E0D4' }}>·</span>
                <span className="flex items-center gap-1.5">
                  <Users size={13} strokeWidth={2} style={{ color: '#6B7A72' }} />
                  {page.max_capacity} capacity
                </span>
              </>
            )}
            {registrationCount > 0 && (
              <>
                <span style={{ color: '#E5E0D4' }}>·</span>
                <span>{registrationCount} registered</span>
              </>
            )}
          </div>

          {/* About */}
          {page.description && (
            <div className="mt-10">
              <h2 className="font-display mb-4" style={{ fontWeight: 400, fontSize: 22, color: '#1F4D3A', letterSpacing: '-0.015em' }}>
                About this event
              </h2>
              <div className="text-[15px] leading-relaxed whitespace-pre-line" style={{ color: '#3A4A42' }}>
                {page.description}
              </div>
            </div>
          )}

          {/* Speakers */}
          {speakers.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display mb-5" style={{ fontWeight: 400, fontSize: 22, color: '#1F4D3A', letterSpacing: '-0.015em' }}>
                Speaking at {page.title}
              </h2>
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${Math.min(speakers.length, 3)}, 1fr)` }}
              >
                {speakers.map(speaker => (
                  <div key={speaker.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
                    {/* Photo */}
                    <div className="relative" style={{ aspectRatio: '1', background: '#E8EFEB' }}>
                      {speaker.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={speaker.photoUrl}
                          alt={speaker.name}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="absolute inset-0 flex items-end justify-center pb-3"
                          style={{ background: 'linear-gradient(160deg, #1F4D3A 0%, #2A6A50 100%)' }}
                        />
                      )}
                      {/* Name overlay */}
                      <div
                        className="absolute inset-0"
                        style={{ background: 'linear-gradient(to top, rgba(10,20,14,0.75) 0%, transparent 50%)' }}
                      />
                      <div
                        className="absolute left-3 bottom-2.5 font-display font-medium text-[15px] text-white"
                        style={{ letterSpacing: '-0.01em' }}
                      >
                        {speaker.name}
                      </div>
                    </div>
                    {/* Role */}
                    {speaker.role && (
                      <div className="px-3 py-2 text-[13px]" style={{ color: '#6B7A72' }}>
                        {speaker.role}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mini agenda */}
          {sessions.length > 0 && (
            <div className="mt-10">
              <h2 className="font-display mb-5" style={{ fontWeight: 400, fontSize: 22, color: '#1F4D3A', letterSpacing: '-0.015em' }}>
                Agenda
              </h2>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
                {sessions.map((s, i) => (
                  <div
                    key={s.id}
                    className="grid"
                    style={{
                      gridTemplateColumns: '80px 1fr',
                      borderBottom: i < sessions.length - 1 ? '1px solid #E5E0D4' : undefined,
                    }}
                  >
                    <div
                      className="px-4 py-4 text-[13px]"
                      style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        color: '#6B7A72',
                        borderRight: '1px solid #E5E0D4',
                      }}
                    >
                      {formatSessionTime(s.startsAt, page.timezone)}
                    </div>
                    <div className="px-4 py-3">
                      <div
                        className="text-[14px] font-medium pl-3"
                        style={{ color: '#0F1F18', borderLeft: '3px solid #E8C57E' }}
                      >
                        {s.title}
                      </div>
                      {(s.speakerName || s.room) && (
                        <div className="text-[12px] mt-1 pl-3" style={{ color: '#6B7A72' }}>
                          {[s.speakerName, s.room].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href={`/e/${registrationSlug}/schedule`}
                className="inline-block mt-4 text-[14px] font-semibold"
                style={{ color: '#C9A45E', textDecoration: 'none' }}
              >
                See full agenda →
              </Link>
            </div>
          )}

        </div>

        {/* ── Sticky registration sidebar ─────────────────────────── */}
        <aside style={{ position: 'sticky', top: 88 }}>
          <TicketCard
            tickets={tickets}
            selectedTicket={selectedTicket}
            setSelectedTicket={setSelectedTicket}
            registerHref={registerHref}
            selectedTicketObj={selectedTicketObj}
            minPrice={minPrice}
            page={page}
            registrationCount={registrationCount}
          />
        </aside>

      </div>

      {/* ── Mobile bottom bar ──────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 lg:hidden flex items-center gap-3 px-4 py-3 z-50"
        style={{ background: 'white', borderTop: '1px solid #E5E0D4', boxShadow: '0 -4px 16px rgba(15,31,24,0.08)' }}
      >
        <div className="flex-1 min-w-0">
          <div className="text-[17px] font-medium" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#1F4D3A' }}>
            {selectedTicketObj
              ? selectedTicketObj.price === 0 ? 'Free' : `$${selectedTicketObj.price}`
              : minPrice}
          </div>
          <div className="text-[12px] truncate" style={{ color: '#6B7A72' }}>
            {selectedTicketObj?.name ?? 'Select a ticket'}
          </div>
        </div>
        <Link
          href={registerHref}
          className="inline-flex items-center h-11 px-6 rounded-xl text-white font-display font-semibold text-[15px] shrink-0"
          style={{ background: '#1F4D3A' }}
        >
          Register now
        </Link>
      </div>
      <div className="h-20 lg:hidden" />
    </div>
  );
}

/* ── Registration card sidebar ─────────────────────────────────────────── */
function TicketCard({
  tickets, selectedTicket, setSelectedTicket, registerHref, selectedTicketObj, minPrice, page, registrationCount,
}: {
  tickets: TicketTypeRow[];
  selectedTicket: string;
  setSelectedTicket: (id: string) => void;
  registerHref: string;
  selectedTicketObj: TicketTypeRow | undefined;
  minPrice: string;
  page: EventPageRow;
  registrationCount: number;
}) {
  const isSoldOut = (t: TicketTypeRow) => t.quantity !== null && t.quantity_sold >= t.quantity;
  const hasTickets = tickets.length > 0;

  const priceDisplay = selectedTicketObj
    ? selectedTicketObj.price === 0 ? 'Free' : `$${selectedTicketObj.price}`
    : hasTickets
      ? (tickets.every(t => t.price === 0) ? 'Free' : `$${Math.min(...tickets.filter(t => t.price > 0).map(t => t.price))}`)
      : 'Free';

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'white',
        border: '1px solid #E5E0D4',
        boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)',
      }}
    >
      <div className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: '#6B7A72' }}>From</div>
      <div
        className="text-[28px] font-medium mb-5"
        style={{ fontFamily: 'JetBrains Mono, monospace', color: '#1F4D3A' }}
      >
        {priceDisplay}
      </div>

      {/* Ticket options */}
      {tickets.map((ticket, i) => {
        const soldOut = isSoldOut(ticket);
        const selected = selectedTicket === ticket.id;
        return (
          <button
            key={ticket.id}
            disabled={soldOut}
            onClick={() => !soldOut && setSelectedTicket(ticket.id)}
            className="w-full flex items-center justify-between py-3.5"
            style={{
              borderTop: i === 0 ? '1px solid #E5E0D4' : 'none',
              borderBottom: '1px solid #E5E0D4',
              opacity: soldOut ? 0.5 : 1,
              cursor: soldOut ? 'not-allowed' : 'pointer',
              background: 'transparent',
            }}
          >
            <div className="flex items-center gap-3">
              {/* Radio */}
              <div
                className="shrink-0 rounded-full"
                style={{
                  width: 18, height: 18,
                  border: selected ? '1.5px solid #1F4D3A' : '1.5px solid #C9C3B1',
                  boxShadow: selected ? 'inset 0 0 0 4px #1F4D3A' : 'none',
                  background: 'white',
                }}
              />
              <span className="text-[14px] font-medium text-left" style={{ color: '#0F1F18' }}>
                {ticket.name}
              </span>
            </div>
            <span
              className="text-[15px] shrink-0"
              style={{ fontFamily: 'JetBrains Mono, monospace', color: ticket.price === 0 ? '#C9A45E' : '#1F4D3A' }}
            >
              {soldOut ? 'Sold out' : ticket.price === 0 ? 'Free' : `$${ticket.price}`}
            </span>
          </button>
        );
      })}

      {/* CTA */}
      <Link
        href={registerHref}
        className="flex items-center justify-center h-12 rounded-xl text-white font-display font-semibold text-[15px] transition hover:opacity-90"
        style={{ background: '#1F4D3A', marginTop: 18 }}
      >
        Register now
      </Link>

      {/* Count */}
      {registrationCount > 0 && (
        <div className="mt-3 text-center text-[13px]" style={{ color: '#6B7A72' }}>
          <span className="font-mono" style={{ color: '#0F1F18' }}>{registrationCount}</span> people registered
        </div>
      )}

      {page.registration_deadline && (
        <div className="mt-2 text-center text-[12px]" style={{ color: '#6B7A72' }}>
          Registration closes {new Date(page.registration_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      )}
    </div>
  );
}
