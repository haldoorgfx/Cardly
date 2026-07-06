'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft, MoreHorizontal, MapPin, Lock, Clock, CalendarPlus,
  ArrowLeftRight, Receipt, Share2, MessageSquare, X, ChevronRight, Check,
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

type EventPage = {
  id: string;
  title: string;
  cover_image_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  venue_name: string | null;
  venue_address: string | null;
  city: string | null;
  country: string | null;
  is_online: boolean;
};

type Registration = {
  id: string;
  attendee_name: string;
  attendee_email: string;
  status: string;
  payment_status: string;
  amount_paid: number | string | null;
  currency: string | null;
  qr_code_token: string;
  checked_in_at: string | null;
  checked_in_by: string | null;
  eventera_card_url: string | null;
  created_at: string;
  ticket_types: { name: string; price: number; currency: string | null } | null;
  events: {
    id: string;
    name: string;
    slug: string;
    event_pages: EventPage[];
  } | null;
};

interface Props {
  reg: Registration;
  scannedByName: string | null;
}

// ── Brand ────────────────────────────────────────────────────────────────────

const FOREST = '#1F4D3A';
const FOREST_DARK = '#163828';
const CREAM = '#FAF6EE';
const GOLD = '#E8C57E';
const GOLD_SOFT = '#F6ECD4';
const INK = '#0F1F18';
const INK_SOFT = '#3A4A42';
const MUTED = '#6B7A72';
const BORDER = '#E5E0D4';
const DANGER = '#B8423C';
const WARNING = '#C97A2D';
const SUCCESS = '#2D7A4F';
const FOREST_SOFT = '#E8EFEB';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtWhen(iso: string | null | undefined): string {
  if (!iso) return 'Date TBA';
  const d = new Date(iso);
  const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
  const day = d.getDate();
  const month = d.toLocaleDateString(undefined, { month: 'short' });
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${weekday} ${day} ${month} · ${time}`;
}

function fmtStamp(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const month = d.toLocaleDateString(undefined, { month: 'short' });
  const day = d.getDate();
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${month} ${day}, ${time}`;
}

function money(amount: number, currency: string | null): string {
  const cur = currency ?? 'USD';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(amount);
  } catch {
    return `${cur} ${amount.toFixed(2)}`;
  }
}

// Turn the qr_code_token into a stable, human-readable ticket code (TKT-XXXX-XXXX).
function ticketCode(token: string): string {
  const clean = (token || '').replace(/[^a-z0-9]/gi, '').toUpperCase();
  const a = clean.slice(0, 4).padEnd(4, '0');
  const b = clean.slice(4, 8).padEnd(4, '0');
  return `TKT-${a}-${b}`;
}

// ── QR fullscreen overlay ──────────────────────────────────────────────────────

function QRFullscreen({ token, name, label, code, onClose }: {
  token: string; name: string; label: string; code: string; onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-8"
      style={{
        background: `radial-gradient(ellipse 70% 55% at 15% 8%, rgba(31,77,58,0.85) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 90% 25%, rgba(232,197,126,0.18) 0%, transparent 55%), ${FOREST_DARK}`,
      }}
      onClick={onClose}
    >
      <button
        className="absolute top-6 right-6 flex items-center justify-center rounded-full"
        style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.12)', color: '#fff' }}
        onClick={onClose}
        aria-label="Close"
      >
        <X size={18} strokeWidth={2} />
      </button>

      <div className="text-center mb-6">
        <div className="font-display font-bold text-[20px] text-white" style={{ fontFamily: '"DM Sans", sans-serif' }}>{name}</div>
        <div className="text-[13px] mt-1" style={{ color: 'rgba(250,246,238,0.7)' }}>{label}</div>
      </div>

      <div
        className="rounded-[22px]"
        style={{ background: '#fff', padding: 22, boxShadow: '0 24px 60px -20px rgba(0,0,0,0.6)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/qr/${token}`} alt="Check-in QR" width={230} height={230} style={{ display: 'block', borderRadius: 6 }} />
      </div>

      <div className="mt-6 text-[14px]" style={{ letterSpacing: '0.2em', color: '#fff', fontFamily: '"JetBrains Mono", monospace' }}>{code}</div>
      <div className="mt-2.5 flex items-center gap-1.5 text-[12px]" style={{ color: 'rgba(250,246,238,0.6)' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
        Screen brightened for scanning
      </div>
    </div>
  );
}

// ── Actions bottom sheet ────────────────────────────────────────────────────────

function ActionRow({ icon, label, danger, href, onClick }: {
  icon: React.ReactNode; label: string; danger?: boolean; href?: string; onClick?: () => void;
}) {
  const inner = (
    <div className="flex items-center gap-3.5 py-3.5">
      <span style={{ color: danger ? DANGER : FOREST }}>{icon}</span>
      <span className="flex-1 font-display font-medium text-[15px]" style={{ fontFamily: '"DM Sans", sans-serif', color: danger ? DANGER : INK }}>{label}</span>
      {!danger && <ChevronRight size={18} style={{ color: MUTED }} />}
    </div>
  );
  if (href) {
    const external = href.startsWith('/api/');
    if (external) return <a href={href} download onClick={onClick}>{inner}</a>;
    return <Link href={href} onClick={onClick}>{inner}</Link>;
  }
  return <button className="w-full text-left" onClick={onClick}>{inner}</button>;
}

// ── Receipt modal ───────────────────────────────────────────────────────────────

function ReceiptModal({ reg, onClose }: { reg: Registration; onClose: () => void }) {
  const amount = Number(reg.amount_paid ?? 0);
  const currency = reg.currency ?? reg.ticket_types?.currency ?? 'USD';
  const isPaid = reg.payment_status === 'paid';
  const isFree = reg.payment_status === 'free' || amount === 0;
  const ticketName = reg.ticket_types?.name ?? 'General Admission';
  const orderNo = `ORD-${reg.id.slice(0, 8).toUpperCase()}`;
  const dateStr = new Date(reg.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(15,31,24,0.4)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden"
        style={{ background: '#fff', border: `1px solid ${BORDER}` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-5 h-14" style={{ borderBottom: `1px solid ${BORDER}` }}>
          <span className="font-display font-semibold text-[16px]" style={{ fontFamily: '"DM Sans", sans-serif', color: INK }}>Receipt</span>
          <button className="ml-auto flex items-center justify-center w-9 h-9 rounded-full" style={{ color: MUTED }} onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-6">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: FOREST_SOFT }}>
              <Check size={24} strokeWidth={2.4} style={{ color: FOREST }} />
            </div>
            <div className="font-display font-semibold text-[17px]" style={{ fontFamily: '"DM Sans", sans-serif', color: INK }}>
              {isFree ? 'Registration confirmed' : isPaid ? 'Payment successful' : 'Order pending'}
            </div>
            <div className="text-[11.5px] mt-1.5" style={{ color: MUTED, fontFamily: '"JetBrains Mono", monospace' }}>Order #{orderNo}</div>
          </div>

          <div className="rounded-xl p-4 mb-4" style={{ background: '#FBFAF6', border: `1px solid ${BORDER}` }}>
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] mb-3" style={{ color: MUTED }}>
              {reg.events?.name ?? 'Event'}
            </div>
            <div className="flex justify-between text-[13px] mb-3">
              <span style={{ color: INK_SOFT }}>1 × {ticketName}</span>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', color: INK }}>{isFree ? 'Free' : money(amount, currency)}</span>
            </div>
            <div className="flex justify-between items-center pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
              <span className="font-display font-semibold text-[15px]" style={{ fontFamily: '"DM Sans", sans-serif', color: INK }}>Total {isPaid ? 'paid' : ''}</span>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 19, color: FOREST }}>{isFree ? 'Free' : money(amount, currency)}</span>
            </div>
          </div>

          <div className="flex items-center py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
            <div className="flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Date</div>
              <div className="font-display font-semibold text-[14px] mt-1" style={{ fontFamily: '"DM Sans", sans-serif', color: INK }}>{dateStr}</div>
            </div>
          </div>
          <div className="flex items-center py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
            <div className="flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Billed to</div>
              <div className="font-display font-semibold text-[14px] mt-1" style={{ fontFamily: '"DM Sans", sans-serif', color: INK }}>{reg.attendee_email}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function TicketDetailClient({ reg, scannedByName }: Props) {
  const [showQR, setShowQR] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  const ep = reg.events?.event_pages?.[0];
  const slug = reg.events?.slug ?? '';
  const eventName = reg.events?.name ?? ep?.title ?? 'Event';
  const ticketName = reg.ticket_types?.name ?? 'General Admission';
  const code = ticketCode(reg.qr_code_token);
  const amount = Number(reg.amount_paid ?? 0);
  const currency = reg.currency ?? reg.ticket_types?.currency ?? 'USD';

  const venue = ep?.is_online
    ? 'Online event'
    : [ep?.venue_name, ep?.city ?? ep?.country].filter(Boolean).join(' · ') || null;
  const gate = ep?.is_online ? 'Online' : (ep?.venue_name ?? 'Main entrance');

  // ── State machine ──
  const isCheckedIn = reg.status === 'checked_in';
  const isPendingPayment =
    !isCheckedIn && (reg.payment_status === 'pending' || reg.payment_status === 'failed') && amount > 0;
  const isLive = !isCheckedIn && !isPendingPayment; // confirmed / paid / free → live QR

  // Ribbon
  let ribbonLabel = 'Confirmed';
  let ribbonColor = SUCCESS;
  if (isCheckedIn) { ribbonLabel = 'Checked in'; ribbonColor = FOREST; }
  else if (isPendingPayment) { ribbonLabel = 'Payment pending'; ribbonColor = WARNING; }

  const qrLabel = [eventName, ticketName].filter(Boolean).join(' · ');

  return (
    <div style={{ background: CREAM, minHeight: '100dvh' }}>
      {/* App bar */}
      <div className="sticky top-0 z-30 flex items-center h-14 px-3" style={{ background: CREAM, borderBottom: `1px solid ${BORDER}` }}>
        <Link href="/my-tickets" className="flex items-center justify-center w-10 h-10 rounded-full" style={{ color: INK }} aria-label="Back">
          <ChevronLeft size={22} />
        </Link>
        <span className="font-display font-semibold text-[16px]" style={{ fontFamily: '"DM Sans", sans-serif', color: INK }}>Ticket</span>
        <button
          className="ml-auto flex items-center justify-center w-10 h-10 rounded-full"
          style={{ color: INK }}
          onClick={() => setShowActions(true)}
          aria-label="Ticket options"
        >
          <MoreHorizontal size={22} />
        </button>
      </div>

      <div className="max-w-md mx-auto px-4 pt-4 pb-10">
        {/* ── THE TICKET ── */}
        <div className="overflow-hidden" style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 18, boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 12px 32px rgba(15,31,24,0.07)' }}>
          {/* Cover */}
          <div className="relative" style={{ height: 150 }}>
            {ep?.cover_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ep.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }} />
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,31,24,0.82) 0%, rgba(15,31,24,0.15) 55%, transparent 100%)' }} />

            {/* Ribbon */}
            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 h-7 px-3 rounded-full" style={{ background: 'rgba(255,255,255,0.92)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: ribbonColor }} />
              <span className="text-[12px] font-semibold" style={{ color: ribbonColor, fontFamily: 'Inter, system-ui, sans-serif' }}>{ribbonLabel}</span>
            </div>

            {/* Meta */}
            <div className="absolute bottom-3.5 left-4 right-4">
              <div className="font-display font-bold text-[19px] leading-tight text-white" style={{ fontFamily: '"DM Sans", sans-serif', letterSpacing: '-0.015em' }}>{eventName}</div>
              {venue && (
                <div className="flex items-center gap-1.5 mt-1 text-[12.5px]" style={{ color: 'rgba(250,246,238,0.92)' }}>
                  <MapPin size={13} style={{ color: GOLD }} />
                  {venue}
                </div>
              )}
            </div>
          </div>

          {/* Perforated tear */}
          <div className="relative" style={{ height: 24 }}>
            <div className="absolute rounded-full" style={{ width: 24, height: 24, background: CREAM, border: `1px solid ${BORDER}`, left: -13, top: 0 }} />
            <div className="absolute rounded-full" style={{ width: 24, height: 24, background: CREAM, border: `1px solid ${BORDER}`, right: -13, top: 0 }} />
            <div className="absolute left-4 right-4 top-1/2" style={{ borderTop: `2px dashed ${BORDER}` }} />
          </div>

          {/* Stub: framed QR + ticket code */}
          <div className="flex flex-col items-center px-5 pt-2 pb-5">
            <div className="relative">
              {isLive ? (
                <button
                  className="rounded-2xl p-3"
                  style={{ background: '#fff', border: `1px solid ${BORDER}`, boxShadow: '0 2px 10px rgba(15,31,24,0.06)' }}
                  onClick={() => setShowQR(true)}
                  aria-label="Show QR fullscreen"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/api/qr/${reg.qr_code_token}`} alt="Check-in QR" width={172} height={172} style={{ display: 'block', borderRadius: 6 }} />
                </button>
              ) : isPendingPayment ? (
                <div className="rounded-2xl p-3" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
                  {/* Locked / blurred QR — never scannable until paid */}
                  <div className="relative" style={{ width: 172, height: 172 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/qr/${reg.qr_code_token}`} alt="" width={172} height={172} style={{ display: 'block', borderRadius: 6, filter: 'blur(6px)', opacity: 0.4 }} aria-hidden />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: GOLD_SOFT }}>
                        <Lock size={20} strokeWidth={2} style={{ color: WARNING }} />
                      </div>
                      <div className="text-[12px] font-semibold text-center px-4" style={{ color: INK_SOFT }}>QR unlocks after payment</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl p-3" style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
                  {/* Checked in — dimmed QR + ADMITTED stamp */}
                  <div className="relative" style={{ width: 172, height: 172 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/qr/${reg.qr_code_token}`} alt="" width={172} height={172} style={{ display: 'block', borderRadius: 6, opacity: 0.4 }} aria-hidden />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="font-display font-bold"
                        style={{ fontFamily: '"DM Sans", sans-serif', fontSize: 20, letterSpacing: '0.06em', color: FOREST, border: `3px solid ${FOREST}`, borderRadius: 10, padding: '8px 18px', transform: 'rotate(-11deg)', background: 'rgba(255,255,255,0.7)' }}
                      >
                        ADMITTED
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-[11px] font-semibold uppercase tracking-[0.12em] mt-4" style={{ color: MUTED }}>
              {isCheckedIn ? 'Checked in at' : 'Ticket code'}
            </div>
            <div className="text-[15px] mt-1" style={{ fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.06em', color: INK }}>
              {isCheckedIn ? fmtStamp(reg.checked_in_at) : code}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-4 px-5 pb-6 pt-1" style={{ borderTop: `1px solid ${BORDER}` }}>
            <div className="pt-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Attendee</div>
              <div className="font-display font-medium text-[14px] mt-1" style={{ fontFamily: '"DM Sans", sans-serif', color: INK }}>{reg.attendee_name}</div>
            </div>
            <div className="pt-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Type</div>
              <div className="font-display font-medium text-[14px] mt-1" style={{ fontFamily: '"DM Sans", sans-serif', color: INK }}>{ticketName}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>When</div>
              <div className="font-display font-medium text-[14px] mt-1" style={{ fontFamily: '"DM Sans", sans-serif', color: INK }}>{fmtWhen(ep?.starts_at)}</div>
            </div>
            {isPendingPayment ? (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Amount due</div>
                <div className="font-display font-medium text-[14px] mt-1" style={{ fontFamily: '"DM Sans", sans-serif', color: WARNING }}>{money(amount, currency)}</div>
              </div>
            ) : isCheckedIn ? (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Scanned by</div>
                <div className="font-display font-medium text-[14px] mt-1" style={{ fontFamily: '"DM Sans", sans-serif', color: INK }}>{scannedByName ?? 'Gate staff'}</div>
              </div>
            ) : (
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTED }}>Gate</div>
                <div className="font-display font-medium text-[14px] mt-1" style={{ fontFamily: '"DM Sans", sans-serif', color: INK }}>{gate}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Per-state footer actions ── */}
        {isPendingPayment && (
          <>
            <div className="flex items-center justify-center gap-2 mt-4 text-[11.5px]" style={{ color: MUTED }}>
              <Clock size={14} style={{ color: WARNING }} />
              Reserved for a limited time · pay to confirm your seat
            </div>
            <Link
              href={`/e/${slug}/register`}
              className="mt-3.5 flex items-center justify-center h-12 rounded-2xl text-[15px] font-semibold transition hover:opacity-90"
              style={{ background: FOREST, color: CREAM }}
            >
              Pay {money(amount, currency)} now
            </Link>
          </>
        )}

        {isCheckedIn && (
          <Link
            href={`/e/${slug}/feedback`}
            className="mt-4 flex items-center justify-center gap-2 h-12 rounded-2xl text-[15px] font-semibold transition hover:opacity-90"
            style={{ background: '#fff', color: FOREST, border: `1px solid ${BORDER}` }}
          >
            <MessageSquare size={17} />
            Leave feedback
          </Link>
        )}

        {isLive && (
          <div className="flex gap-2.5 mt-4">
            {ep?.id && ep?.starts_at && (
              <a
                href={`/api/calendar/${ep.id}`}
                download
                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl text-[14px] font-semibold transition hover:opacity-90"
                style={{ background: '#fff', color: FOREST, border: `1px solid ${BORDER}` }}
              >
                <CalendarPlus size={16} />
                Calendar
              </a>
            )}
            <Link
              href={`/my-tickets/${reg.id}/transfer`}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-2xl text-[14px] font-semibold transition hover:opacity-90"
              style={{ background: '#fff', color: FOREST, border: `1px solid ${BORDER}` }}
            >
              <ArrowLeftRight size={16} />
              Transfer
            </Link>
          </div>
        )}
      </div>

      {/* ── QR fullscreen ── */}
      {showQR && isLive && (
        <QRFullscreen token={reg.qr_code_token} name={reg.attendee_name} label={qrLabel} code={code} onClose={() => setShowQR(false)} />
      )}

      {/* ── Receipt ── */}
      {showReceipt && <ReceiptModal reg={reg} onClose={() => setShowReceipt(false)} />}

      {/* ── Actions sheet ── */}
      {showActions && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(15,31,24,0.4)' }} onClick={() => setShowActions(false)}>
          <div
            className="w-full max-w-md rounded-t-[22px] px-5 pt-3 pb-8"
            style={{ background: '#fff' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-9 h-1 rounded-full mx-auto mb-4" style={{ background: BORDER }} />
            <div className="font-display font-semibold text-[16px] mb-1" style={{ fontFamily: '"DM Sans", sans-serif', color: INK }}>Ticket options</div>

            <div className="divide-y" style={{ borderColor: BORDER }}>
              {isLive && (
                <ActionRow
                  icon={<ArrowLeftRight size={20} />}
                  label="Transfer ticket"
                  href={`/my-tickets/${reg.id}/transfer`}
                  onClick={() => setShowActions(false)}
                />
              )}
              {ep?.id && ep?.starts_at && (
                <ActionRow
                  icon={<CalendarPlus size={20} />}
                  label="Add to calendar"
                  href={`/api/calendar/${ep.id}`}
                  onClick={() => setShowActions(false)}
                />
              )}
              <ActionRow
                icon={<Receipt size={20} />}
                label="View receipt"
                onClick={() => { setShowActions(false); setShowReceipt(true); }}
              />
              <ActionRow
                icon={<Share2 size={20} />}
                label="Share ticket"
                onClick={async () => {
                  setShowActions(false);
                  const url = `${window.location.origin}/e/${slug}`;
                  if (navigator.share) {
                    try { await navigator.share({ title: eventName, url }); } catch { /* dismissed */ }
                  } else {
                    try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
                  }
                }}
              />
            </div>
            {/* No cancel/refund route exists on the platform yet — omitted rather than faked. */}
          </div>
        </div>
      )}
    </div>
  );
}
