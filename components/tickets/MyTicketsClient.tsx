'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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
      id: string;
      title: string;
      cover_image_url: string | null;
      starts_at: string | null;
      ends_at: string | null;
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

// ── QR overlay ────────────────────────────────────────────────────────────────

interface QROverlayProps {
  token: string;
  name: string;
  label: string;
  onClose: () => void;
}

function QROverlay({ token, name, label, onClose }: QROverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-0"
      style={{ background: '#163828' }}
      onClick={onClose}
    >
      <button
        className="absolute top-6 right-7 flex items-center justify-center rounded-full"
        style={{ width: 44, height: 44, border: '1px solid rgba(255,255,255,0.25)', color: '#fff', fontSize: 18 }}
        onClick={onClose}
      >
        ✕
      </button>

      {/* Large QR */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ padding: 12, background: '#fff', boxShadow: '0 24px 80px rgba(0,0,0,0.4)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/qr/${token}`}
          alt="Check-in QR"
          width={280}
          height={280}
          style={{ display: 'block', borderRadius: 6 }}
        />
      </div>

      <div className="mt-8 font-medium text-[22px] text-white text-center px-6"
        style={{ fontFamily: '"DM Sans", sans-serif' }}>
        {name}
      </div>
      <div className="mt-1.5 text-center px-6"
        style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 13, color: '#E8C57E' }}>
        {label}
      </div>
      <div className="mt-5 text-[13px] text-center px-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
        Brightness raised automatically · works offline
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  const weekday = d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase();
  const day = d.getDate();
  const month = d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${weekday} ${day} ${month} · ${time}`;
}

function timeUntil(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return null;
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `IN ${d} DAY${d !== 1 ? 'S' : ''}`;
  if (h > 0) return `IN ${h} HOUR${h !== 1 ? 'S' : ''}`;
  return 'STARTING SOON';
}

function fmtPastDate(iso: string | null | undefined) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Ticket card (D04) ─────────────────────────────────────────────────────────

function TicketCard({ reg, onShowQR }: { reg: Registration; onShowQR: () => void }) {
  const ep = reg.events?.event_pages?.[0];
  const dateStr = fmtDate(ep?.starts_at);
  const until = timeUntil(ep?.starts_at);
  const venue = ep?.is_online ? 'Online' : (ep?.city ?? ep?.venue_name ?? null);
  const ticketName = reg.ticket_types?.name ?? 'General';
  const cardNum = reg.id.slice(-4).toUpperCase();

  // Transfer modal state
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferName, setTransferName] = useState('');
  const [transferEmail, setTransferEmail] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [transferDone, setTransferDone] = useState(false);
  const [transferError, setTransferError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  async function handleTransfer() {
    if (!transferName.trim() || !transferEmail.trim()) {
      setTransferError('Name and email are required.');
      return;
    }
    setTransferring(true);
    setTransferError('');
    try {
      const res = await fetch(`/api/registrations/${reg.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_name: transferName.trim(), to_email: transferEmail.trim() }),
      });
      if (res.ok) {
        setTransferDone(true);
      } else {
        const d = await res.json();
        setTransferError(d.error ?? 'Transfer failed. Please try again.');
      }
    } catch {
      setTransferError('Transfer failed. Please try again.');
    } finally {
      setTransferring(false);
    }
  }

  void dialogRef; // used by ref

  return (
    <div
      className="overflow-hidden mb-5"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E0D4',
        borderRadius: 12,
        boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)',
      }}
    >
      {/* 3-col on desktop, 1-col on mobile */}
      <div className="grid sm:grid-cols-[220px_1fr_auto]">
          {/* Cover image */}
          <div className="relative sm:min-h-[170px] min-h-[130px]">
            {ep?.cover_image_url ? (
              <Image src={ep.cover_image_url} alt="" fill className="object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #0D2018 0%, #1F4D3A 60%, #2A6A50 100%)' }} />
            )}
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 flex flex-col">
            {dateStr && (
              <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: '#C9A45E', fontWeight: 500 }}>
                {dateStr}{until && <span className="ml-3" style={{ color: '#6B7A72' }}>— {until}</span>}
              </div>
            )}
            <Link
              href={`/e/${reg.events?.slug ?? ''}`}
              className="mt-1.5 font-medium text-[20px] leading-snug hover:text-[#1F4D3A] transition-colors"
              style={{ fontFamily: '"DM Sans", sans-serif', color: '#0F1F18', letterSpacing: '-0.015em' }}
            >
              {reg.events?.name ?? ep?.title}
            </Link>
            {venue && (
              <p className="mt-1 text-[13px]" style={{ color: '#6B7A72' }}>{venue}</p>
            )}

            <div className="mt-auto pt-4 flex items-center gap-2.5 flex-wrap">
              <span
                className="h-7 px-3 rounded-full text-[12px] font-medium"
                style={{ background: '#E8EFEB', color: '#1F4D3A', fontFamily: '"DM Sans", sans-serif' }}
              >
                {ticketName}
              </span>
              {ep?.id && ep?.starts_at && (
                <a
                  href={`/api/calendar/${ep.id}`}
                  download
                  className="h-7 px-3 rounded-full text-[12px] font-medium transition hover:opacity-75"
                  style={{ background: '#FAF6EE', color: '#1F4D3A', border: '1px solid #E5E0D4' }}
                  onClick={e => e.stopPropagation()}
                >
                  + Calendar
                </a>
              )}
              {reg.status === 'confirmed' && (
                <button
                  onClick={e => { e.stopPropagation(); setShowTransfer(true); }}
                  className="h-7 px-3 rounded-full text-[12px] font-medium transition hover:opacity-75"
                  style={{ background: '#FAF6EE', color: '#6B7A72', border: '1px solid #E5E0D4' }}
                >
                  Transfer
                </button>
              )}
              {reg.karta_card_url && (
                <>
                  <div
                    className="w-14 h-9 rounded overflow-hidden relative shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }}
                  >
                    <div className="absolute bottom-1 left-1.5" style={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 600, fontSize: 6, color: '#E8C57E' }}>
                      KARTA №{cardNum}
                    </div>
                  </div>
                  <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#6B7A72' }}>
                    Card №{cardNum}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* QR stub */}
          <div
            className="sm:flex hidden flex-col items-center justify-center gap-2.5 px-6 py-5"
            style={{ borderLeft: '1px dashed #E5E0D4', minWidth: 130, cursor: 'pointer' }}
            onClick={onShowQR}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && onShowQR()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/qr/${reg.qr_code_token}`}
              alt="QR"
              width={92}
              height={92}
              style={{ borderRadius: 6, border: '1px solid #E5E0D4' }}
            />
            <span className="text-[11px] text-center" style={{ color: '#6B7A72' }}>Tap for door QR</span>
          </div>
        </div>

      {/* Mobile QR row */}
      <div
        className="sm:hidden flex items-center gap-4 px-5 py-4"
        style={{ borderTop: '1px dashed #E5E0D4', cursor: 'pointer' }}
        onClick={onShowQR}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/qr/${reg.qr_code_token}`}
          alt="QR"
          width={60}
          height={60}
          style={{ borderRadius: 6, border: '1px solid #E5E0D4', flexShrink: 0 }}
        />
        <div>
          <p className="font-medium text-[13px]" style={{ color: '#0F1F18' }}>Tap to show door QR</p>
          <p className="text-[12px] mt-0.5" style={{ color: '#6B7A72' }}>Full screen for scanning</p>
        </div>
      </div>

      {/* Transfer modal */}
      {showTransfer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,31,24,0.4)' }}
          onClick={() => !transferring && setShowTransfer(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: 'white', border: '1px solid #E5E0D4' }}
            onClick={e => e.stopPropagation()}
          >
            {transferDone ? (
              <div className="text-center py-4">
                <div className="text-2xl mb-3">✓</div>
                <h3 className="font-semibold text-[17px] mb-1" style={{ color: '#1F4D3A' }}>Ticket transferred</h3>
                <p className="text-[14px] mb-4" style={{ color: '#6B7A72' }}>{transferName} will receive a confirmation email.</p>
                <button
                  onClick={() => { setShowTransfer(false); setTransferDone(false); setTransferName(''); setTransferEmail(''); }}
                  className="h-10 px-5 rounded-lg text-[14px] font-medium"
                  style={{ background: '#1F4D3A', color: 'white' }}
                >Done</button>
              </div>
            ) : (
              <>
                <h3 className="font-semibold text-[17px] mb-1" style={{ color: '#0F1F18' }}>Transfer ticket</h3>
                <p className="text-[13px] mb-4" style={{ color: '#6B7A72' }}>Enter the name and email of the person receiving your ticket. They&apos;ll get a confirmation email.</p>
                <div className="space-y-3 mb-4">
                  <input
                    type="text" value={transferName} onChange={e => setTransferName(e.target.value)}
                    placeholder="Full name" autoFocus
                    className="w-full h-10 px-3 rounded-lg text-[14px] outline-none"
                    style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                    onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                    onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                  />
                  <input
                    type="email" value={transferEmail} onChange={e => setTransferEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full h-10 px-3 rounded-lg text-[14px] outline-none"
                    style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                    onFocus={e => (e.target.style.borderColor = '#E8C57E')}
                    onBlur={e => (e.target.style.borderColor = '#E5E0D4')}
                  />
                </div>
                {transferError && <p className="text-[12px] mb-3" style={{ color: '#B8423C' }}>{transferError}</p>}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTransfer(false)}
                    className="flex-1 h-10 rounded-lg text-[14px] font-medium"
                    style={{ background: '#FAF6EE', color: '#6B7A72', border: '1px solid #E5E0D4' }}
                  >Cancel</button>
                  <button
                    onClick={handleTransfer}
                    disabled={transferring}
                    className="flex-1 h-10 rounded-lg text-[14px] font-medium transition"
                    style={{ background: '#1F4D3A', color: 'white', opacity: transferring ? 0.6 : 1 }}
                  >{transferring ? 'Transferring…' : 'Transfer ticket'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Past event compact card ───────────────────────────────────────────────────

function PastCard({ reg }: { reg: Registration }) {
  const ep = reg.events?.event_pages?.[0];
  return (
    <div
      className="flex gap-3 items-center p-3 rounded-xl cursor-pointer hover:bg-[#F5F3EE] transition-colors"
      style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', opacity: 0.85 }}
    >
      <div className="relative w-16 h-12 rounded overflow-hidden shrink-0">
        {ep?.cover_image_url ? (
          <Image src={ep.cover_image_url} alt="" fill className="object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }} />
        )}
      </div>
      <div className="min-w-0">
        <div className="font-medium text-[14px] truncate" style={{ fontFamily: '"DM Sans", sans-serif', color: '#0F1F18' }}>
          {reg.events?.name ?? ep?.title}
        </div>
        <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#6B7A72', marginTop: 2 }}>
          {fmtPastDate(ep?.starts_at)} · attended
        </div>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function MyTicketsClient({ upcoming, past }: Props) {
  const [qr, setQR] = useState<{ token: string; name: string; label: string } | null>(null);

  function openQR(reg: Registration) {
    setQR({
      token: reg.qr_code_token,
      name: reg.attendee_name,
      label: [reg.events?.name, reg.ticket_types?.name, `№${reg.id.slice(-4).toUpperCase()}`].filter(Boolean).join(' · '),
    });
    // Attempt to increase brightness for scanning
    if (typeof document !== 'undefined') {
      try { (screen as Screen & { brightness?: number }).brightness = 1; } catch { /* ignore */ }
    }
  }

  return (
    <div>
      {/* Upcoming */}
      {upcoming.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[14px]" style={{ color: '#6B7A72' }}>
            No upcoming tickets.{' '}
            <Link href="/events" className="font-medium hover:underline" style={{ color: '#1F4D3A' }}>
              Browse events →
            </Link>
          </p>
        </div>
      ) : (
        upcoming.map(reg => (
          <TicketCard key={reg.id} reg={reg} onShowQR={() => openQR(reg)} />
        ))
      )}

      {/* Past events */}
      {past.length > 0 && (
        <>
          <h2 className="font-medium text-[18px] mt-12 mb-4" style={{ fontFamily: '"DM Sans", sans-serif', color: '#0F1F18' }}>
            Past events
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {past.map(reg => <PastCard key={reg.id} reg={reg} />)}
          </div>
        </>
      )}

      {/* QR overlay */}
      {qr && (
        <QROverlay
          token={qr.token}
          name={qr.name}
          label={qr.label}
          onClose={() => setQR(null)}
        />
      )}
    </div>
  );
}
