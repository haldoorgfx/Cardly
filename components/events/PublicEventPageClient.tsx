'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Globe, Calendar, Clock, Users, Share2, Heart, ExternalLink } from 'lucide-react';
import type { Database } from '@/types/database';
import { AddToCalendarButton } from './AddToCalendarButton';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

function VenueMap({ lat, lng, venueName }: { lat: number; lng: number; venueName: string }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  });
  if (!isLoaded) return <div className="w-full h-48 rounded-xl animate-pulse" style={{ background: '#E8EFEB' }} />;
  return (
    <div className="mt-4 rounded-xl overflow-hidden" style={{ height: 220, border: '1px solid #E5E0D4' }}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={{ lat, lng }}
        zoom={15}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          styles: [
            { featureType: 'water', stylers: [{ color: '#d4e8f0' }] },
            { featureType: 'landscape', stylers: [{ color: '#f5f2ec' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
            { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d8ead3' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#3A4A42' }] },
          ],
        }}
      >
        <Marker
          position={{ lat, lng }}
          title={venueName}
          icon={{
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: '#1F4D3A',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 1.6,
            anchor: new window.google.maps.Point(12, 22),
          }}
        />
      </GoogleMap>
    </div>
  );
}

function fmtTicketPrice(price: number, currency?: string | null): string {
  if (price === 0) return 'Free';
  const cur = currency || 'USD';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
  } catch {
    return `${cur} ${price.toLocaleString()}`;
  }
}

type EventPageRow = Database['public']['Tables']['event_pages']['Row'];
type TicketTypeRow = Database['public']['Tables']['ticket_types']['Row'];

interface Props {
  page: EventPageRow;
  tickets: TicketTypeRow[];
  dateStr: string;
  timeStr: string;
  endTimeStr: string;
  minPrice: string;
  registrationSlug: string;
  organizerUserId?: string | null;
  seriesSlug?: string | null;
  seriesName?: string | null;
}

export function PublicEventPageClient({
  page, tickets, dateStr, timeStr, endTimeStr, minPrice, registrationSlug, organizerUserId,
  seriesSlug, seriesName,
}: Props) {
  const [savedHeart, setSavedHeart] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string>(tickets[0]?.id ?? '');

  const selectedTicketObj = tickets.find(t => t.id === selectedTicket);
  const registerHref = selectedTicket
    ? `/e/${registrationSlug}/register?ticket=${selectedTicket}`
    : `/e/${registrationSlug}/register`;
  const registrationClosed = !!(page.registration_deadline && new Date(page.registration_deadline) < new Date());
  const allSoldOut = tickets.length > 0 && tickets.every(t => t.quantity !== null && t.quantity_sold >= t.quantity);

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: page.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  }

  const locationLine = page.is_online
    ? 'Online event'
    : [page.venue_name, page.venue_address].filter(Boolean).join(' · ') || 'Venue TBA';

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>

      {/* -- Hero ----------------------------------------------------- */}
      <div
        className="relative overflow-hidden w-full"
        style={{ height: 440 }}
      >
        {/* Cover image or gradient fallback */}
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

        {/* Dark scrim — bottom to top */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(10,20,14,0.90) 0%, rgba(10,20,14,0.45) 40%, transparent 75%)' }}
        />

        {/* Share + Heart icons — top right */}
        <div className="absolute top-5 right-5 flex gap-2.5 z-10">
          <button
            onClick={handleShare}
            className="h-10 w-10 rounded-full flex items-center justify-center transition"
            style={{ background: 'rgba(10,20,14,0.55)', backdropFilter: 'blur(10px)' }}
            aria-label="Share"
          >
            <Share2 size={16} strokeWidth={2} color="white" />
          </button>
          <button
            onClick={() => setSavedHeart(v => !v)}
            className="h-10 w-10 rounded-full flex items-center justify-center transition"
            style={{ background: 'rgba(10,20,14,0.55)', backdropFilter: 'blur(10px)' }}
            aria-label="Save"
          >
            <Heart
              size={16}
              strokeWidth={2}
              fill={savedHeart ? '#E8C57E' : 'none'}
              color={savedHeart ? '#E8C57E' : 'white'}
            />
          </button>
        </div>

        {/* Hero caption — bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="max-w-[1000px] mx-auto px-5 pb-8 flex items-end justify-between gap-6">
            <div className="flex-1 min-w-0">
              {seriesSlug && seriesName && (
                <Link
                  href={`/events/series/${seriesSlug}`}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium mb-2 hover:opacity-80 transition-opacity"
                  style={{ color: '#E8C57E', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.05em' }}
                >
                  ↗ Series: {seriesName}
                </Link>
              )}
              {page.organizer_name && (
                organizerUserId ? (
                  <Link
                    href={`/o/${organizerUserId}`}
                    className="text-[16px] font-medium mb-2 font-display hover:opacity-80 transition-opacity"
                    style={{ color: '#E8C57E', display: 'block' }}
                  >
                    {page.organizer_name} →
                  </Link>
                ) : (
                  <div
                    className="text-[16px] font-medium mb-2 font-display"
                    style={{ color: '#E8C57E' }}
                  >
                    {page.organizer_name}
                  </div>
                )
              )}
              <h1
                className="font-display font-semibold leading-tight"
                style={{
                  fontSize: 'clamp(24px, 4vw, 40px)',
                  letterSpacing: '-0.025em',
                  color: 'white',
                  maxWidth: 600,
                }}
              >
                {page.title}
              </h1>
            </div>
            <div
              className="text-right shrink-0 hidden sm:block"
              style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              <div>{dateStr}</div>
              <div className="mt-1">{timeStr} – {endTimeStr}</div>
            </div>
          </div>
        </div>
      </div>

      {/* -- Main layout --------------------------------------------- */}
      <div className="max-w-[1000px] mx-auto px-5">

        {/* Meta strip */}
        <div
          className="flex flex-wrap gap-x-8 gap-y-2 py-5 text-[14px]"
          style={{ borderBottom: '1px solid #E5E0D4', fontFamily: 'Inter, system-ui, sans-serif', color: '#3A4A42' }}
        >
          <span className="flex items-center gap-2">
            <Calendar size={14} strokeWidth={2} style={{ color: '#1F4D3A' }} />
            {dateStr}
          </span>
          <span className="flex items-center gap-2">
            <Clock size={14} strokeWidth={2} style={{ color: '#1F4D3A' }} />
            {timeStr} – {endTimeStr}
          </span>
          <span className="flex items-center gap-2">
            {page.is_online
              ? <Globe size={14} strokeWidth={2} style={{ color: '#1F4D3A' }} />
              : <MapPin size={14} strokeWidth={2} style={{ color: '#1F4D3A' }} />
            }
            {locationLine}
          </span>
          <span className="flex items-center gap-2">
            <Users size={14} strokeWidth={2} style={{ color: '#1F4D3A' }} />
            {minPrice}
          </span>
          <AddToCalendarButton
            pageId={page.id}
            title={page.title}
            description={page.description ?? null}
            startsAt={page.starts_at ?? ''}
            endsAt={page.ends_at ?? null}
            timezone={page.timezone ?? null}
            location={locationLine}
            eventUrl={`https://karta.cre8so.com/e/${registrationSlug}`}
          />
        </div>

        {/* Two-column layout */}
        <div
          className="grid gap-8 py-10 lg:grid-cols-[1fr_340px]"
          style={{ alignItems: 'start' }}
        >
          {/* -- Content column ------------------------------------ */}
          <div className="min-w-0">

            {/* About */}
            {page.description && (
              <section className="mb-10">
                <h2
                  className="font-display font-medium mb-4"
                  style={{ fontSize: 22, color: '#0F1F18', letterSpacing: '-0.015em' }}
                >
                  About this event
                </h2>
                <div
                  className="text-[15px] leading-relaxed whitespace-pre-line"
                  style={{ color: '#3A4A42' }}
                >
                  {page.description}
                </div>
              </section>
            )}

            {/* Venue / online info */}
            {(page.venue_name || page.is_online) && (
              <section className="mb-10">
                <h2
                  className="font-display font-medium mb-4"
                  style={{ fontSize: 22, color: '#0F1F18', letterSpacing: '-0.015em' }}
                >
                  {page.is_online ? 'Online event' : 'Venue'}
                </h2>
                {page.is_online ? (
                  <div className="text-[15px]" style={{ color: '#3A4A42' }}>
                    {page.online_url
                      ? <span>Join link will be shared with registered attendees.</span>
                      : <span>Details will be sent after registration.</span>
                    }
                  </div>
                ) : (
                  <div>
                    {page.venue_name && (
                      <div className="font-medium text-[15px] mb-0.5" style={{ color: '#0F1F18' }}>
                        {page.venue_name}
                      </div>
                    )}
                    {page.venue_address && (
                      <div className="text-[14px]" style={{ color: '#6B7A72' }}>
                        {page.venue_address}
                      </div>
                    )}
                    {/* Real map if coordinates available */}
                    {page.venue_lat && page.venue_lng ? (
                      <>
                        <VenueMap
                          lat={page.venue_lat}
                          lng={page.venue_lng}
                          venueName={page.venue_name ?? ''}
                        />
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(page.venue_address || page.venue_name || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium hover:opacity-75 transition-opacity"
                          style={{ color: '#1F4D3A' }}
                        >
                          <ExternalLink size={12} strokeWidth={2} />
                          Open in Google Maps
                        </a>
                      </>
                    ) : page.venue_address ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(page.venue_address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium hover:opacity-75 transition-opacity"
                        style={{ color: '#1F4D3A' }}
                      >
                        <ExternalLink size={12} strokeWidth={2} />
                        Open in Google Maps
                      </a>
                    ) : null}
                  </div>
                )}
              </section>
            )}

            {/* Mobile: show tickets inline before sidebar on small screens */}
            <div className="lg:hidden">
              <TicketList
                tickets={tickets}
                selectedTicket={selectedTicket}
                setSelectedTicket={setSelectedTicket}
                registerHref={registerHref}
                selectedTicketObj={selectedTicketObj}
                page={page}
                minPrice={minPrice}
                registrationSlug={registrationSlug}
              />
            </div>

          </div>

          {/* -- Sidebar: registration card ------------------------ */}
          <aside className="hidden lg:block" style={{ position: 'sticky', top: 88 }}>
            <TicketList
              tickets={tickets}
              selectedTicket={selectedTicket}
              setSelectedTicket={setSelectedTicket}
              registerHref={registerHref}
              selectedTicketObj={selectedTicketObj}
              page={page}
              minPrice={minPrice}
              registrationSlug={registrationSlug}
            />
          </aside>
        </div>
      </div>

      {/* -- Mobile bottom bar ---------------------------------------- */}
      <div
        className="fixed bottom-0 left-0 right-0 lg:hidden flex items-center gap-3 px-4 py-3 z-50"
        style={{ background: 'white', borderTop: '1px solid #E5E0D4', boxShadow: '0 -4px 16px rgba(15,31,24,0.08)' }}
      >
        <div className="flex-1 min-w-0">
          <div
            className="text-[17px] font-medium"
            style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#1F4D3A' }}
          >
            {selectedTicketObj
              ? fmtTicketPrice(selectedTicketObj.price, selectedTicketObj.currency)
              : minPrice}
          </div>
          <div className="text-[12px] truncate" style={{ color: '#6B7A72' }}>
            {selectedTicketObj?.name ?? 'Select a ticket'}
          </div>
        </div>
        {registrationClosed ? (
          <div
            className="inline-flex items-center h-11 px-6 rounded-xl font-display font-semibold text-[15px] shrink-0"
            style={{ background: '#F5F0E8', color: '#6B7A72', border: '1px solid #E5E0D4' }}
          >
            Closed
          </div>
        ) : allSoldOut ? (
          <Link
            href={`/e/${registrationSlug}/waitlist`}
            className="inline-flex items-center h-11 px-6 rounded-xl font-display font-semibold text-[15px] transition hover:opacity-90 shrink-0"
            style={{ background: '#E8C57E', color: '#0F1F18' }}
          >
            Join waitlist
          </Link>
        ) : (
          <Link
            href={registerHref}
            className="inline-flex items-center h-11 px-6 rounded-xl text-white font-display font-semibold text-[15px] transition hover:opacity-90 shrink-0"
            style={{ background: '#1F4D3A' }}
          >
            Register now
          </Link>
        )}
      </div>
      {/* Spacer so content isn't hidden behind mobile bar */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}

/* -- Ticket list (shared between sidebar and mobile inline) -- */
function TicketList({
  tickets, selectedTicket, setSelectedTicket, registerHref, selectedTicketObj, page, minPrice, registrationSlug,
}: {
  tickets: TicketTypeRow[];
  selectedTicket: string;
  setSelectedTicket: (id: string) => void;
  registerHref: string;
  selectedTicketObj: TicketTypeRow | undefined;
  page: EventPageRow;
  minPrice: string;
  registrationSlug: string;
}) {
  const isSoldOut = (t: TicketTypeRow) =>
    t.quantity !== null && t.quantity_sold >= t.quantity;
  const hasTickets = tickets.length > 0;
  const allSoldOut = hasTickets && tickets.every(isSoldOut);
  const registrationClosed = !!(page.registration_deadline && new Date(page.registration_deadline) < new Date());

  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)' }}
    >
      {/* Price headline */}
      <div
        className="text-[28px] font-medium mb-1"
        style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#1F4D3A' }}
      >
        {selectedTicketObj
          ? fmtTicketPrice(selectedTicketObj.price, selectedTicketObj.currency)
          : minPrice
        }
      </div>
      <div className="text-[13px] mb-5" style={{ color: '#6B7A72' }}>
        {selectedTicketObj?.name ?? (hasTickets ? 'Select a ticket below' : 'Registration')}
      </div>

      {/* Ticket options */}
      {tickets.map(ticket => {
        const soldOut = isSoldOut(ticket);
        const selected = selectedTicket === ticket.id;
        return (
          <button
            key={ticket.id}
            disabled={soldOut}
            onClick={() => !soldOut && setSelectedTicket(ticket.id)}
            className="w-full text-left flex items-start gap-3 p-4 rounded-xl mb-2 transition"
            style={{
              border: selected ? '2px solid #1F4D3A' : '1px solid #E5E0D4',
              background: selected ? 'rgba(31,77,58,0.04)' : 'white',
              opacity: soldOut ? 0.5 : 1,
              cursor: soldOut ? 'not-allowed' : 'pointer',
            }}
          >
            {/* Radio indicator */}
            <div
              className="mt-0.5 shrink-0 rounded-full flex items-center justify-center"
              style={{
                width: 18, height: 18,
                border: selected ? '1.5px solid #1F4D3A' : '1.5px solid #C9C3B1',
                background: selected ? '#1F4D3A' : 'transparent',
              }}
            >
              {selected && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[14px] font-medium leading-snug"
                  style={{ color: soldOut ? '#6B7A72' : '#0F1F18' }}
                >
                  {ticket.name}
                </span>
                <span
                  className="text-[14px] shrink-0"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif', color: ticket.price === 0 ? '#2D7A4F' : '#1F4D3A', fontWeight: 500 }}
                >
                  {soldOut ? 'Sold out' : fmtTicketPrice(ticket.price, ticket.currency)}
                </span>
              </div>
              {ticket.description && (
                <div className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>
                  {ticket.description}
                </div>
              )}
              {ticket.quantity !== null && !soldOut && ticket.quantity - ticket.quantity_sold <= 20 && (
                <div className="text-[11px] mt-1" style={{ color: '#C97A2D' }}>
                  {ticket.quantity - ticket.quantity_sold} left
                </div>
              )}
            </div>
          </button>
        );
      })}

      {/* CTA */}
      {registrationClosed ? (
        <div
          className="mt-4 flex items-center justify-center h-12 rounded-xl text-[15px] font-display font-semibold"
          style={{ background: '#F5F0E8', color: '#6B7A72', border: '1px solid #E5E0D4' }}
        >
          Registration closed
        </div>
      ) : allSoldOut ? (
        <Link
          href={`/e/${registrationSlug}/waitlist`}
          className="mt-4 flex items-center justify-center h-12 rounded-xl font-display font-semibold text-[15px] transition hover:opacity-90"
          style={{ background: '#E8C57E', color: '#0F1F18' }}
        >
          Join waitlist
        </Link>
      ) : (
        <Link
          href={registerHref}
          className="mt-4 flex items-center justify-center h-12 rounded-xl text-white font-display font-semibold text-[15px] transition hover:opacity-90"
          style={{ background: '#1F4D3A' }}
        >
          Register now
        </Link>
      )}

      {/* Registration deadline note */}
      {page.registration_deadline && !registrationClosed && (
        <div
          className="mt-3 text-center text-[12px]"
          style={{ color: '#6B7A72' }}
        >
          Registration closes {new Date(page.registration_deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
      )}

      {/* Capacity note */}
      {page.max_capacity && (
        <div
          className="mt-2 text-center text-[12px] flex items-center justify-center gap-1"
          style={{ color: '#6B7A72' }}
        >
          <Users size={11} strokeWidth={2} />
          Limited to {page.max_capacity} attendees
        </div>
      )}
    </div>
  );
}
