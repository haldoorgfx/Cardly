'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, ChevronRight, Lock } from 'lucide-react';

type Registration = {
  id: string;
  attendee_name: string;
  attendee_email?: string;
  status: string;
  payment_status?: string;
  amount_paid?: number | string | null;
  eventera_card_url: string | null;
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

// ── Brand ─────────────────────────────────────────────────────────────────────

const FOREST = '#1F4D3A';
const FOREST_DARK = '#163828';
const CREAM_SOFT = '#F5F1E8';
const CANVAS = '#FAF6EE';      // page background — used for perforation notch "bites"
const SURFACE = '#FFFFFF';
const GOLD = '#E8C57E';
const INK = '#0F1F18';
const MUTED = '#6B7A72';
const BORDER = '#E5E0D4';
const BORDER_STRONG = '#C9C3B1'; // crisper dashed perforation line
const WARNING = '#C97A2D';
const SUCCESS = '#2D7A4F';

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
      style={{ background: FOREST_DARK }}
      onClick={onClose}
    >
      <button
        className="absolute top-6 right-7 flex items-center justify-center rounded-full"
        style={{ width: 44, height: 44, border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}
        onClick={onClose}
        aria-label="Close"
      >
        <X size={18} strokeWidth={2} />
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
        style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 13, color: GOLD }}>
        {label}
      </div>
      <div className="mt-5 text-[13px] text-center px-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
        Brightness raised automatically · works offline
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtWhen(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  const month = d.toLocaleDateString(undefined, { month: 'short' });
  const day = d.getDate();
  const year = d.getFullYear();
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${month} ${day}, ${year} · ${time}`;
}

// A paid ticket that hasn't been paid → QR must stay locked.
function isPendingPayment(reg: Registration): boolean {
  const amt = Number(reg.amount_paid ?? 0);
  return reg.status !== 'checked_in'
    && (reg.payment_status === 'pending' || reg.payment_status === 'failed')
    && amt > 0;
}

type StatusTag = { label: string; color: string; accent: string };

function statusTag(reg: Registration, isPast: boolean): StatusTag {
  if (reg.status === 'checked_in') return { label: 'Checked in', color: FOREST, accent: FOREST };
  if (isPendingPayment(reg) || reg.payment_status === 'pending' || reg.status === 'pending' || reg.status === 'pending_approval') {
    return { label: 'Payment pending', color: WARNING, accent: WARNING };
  }
  if (isPast) return { label: 'Expired', color: MUTED, accent: '#C7C0AF' };
  return { label: 'Confirmed', color: SUCCESS, accent: SUCCESS };
}

// ── Ticket stub ─────────────────────────────────────────────────────────────

function TicketStub({ reg, isPast, onShowQR }: { reg: Registration; isPast: boolean; onShowQR: () => void }) {
  const ep = reg.events?.event_pages?.[0];
  const whenStr = fmtWhen(ep?.starts_at);
  const ticketName = reg.ticket_types?.name ?? 'General Admission';
  const tag = statusTag(reg, isPast);
  const locked = isPendingPayment(reg);
  const title = reg.events?.name ?? ep?.title ?? 'Event';
  const detailHref = `/my-tickets/${reg.id}`;

  const COVER = 104; // left cover-stub width
  const NOTCH = 20;  // perforation "bite" diameter

  const action = locked ? (
    <Link href={detailHref} className="inline-flex items-center gap-1 text-[12.5px] font-semibold" style={{ color: WARNING }}>
      <Lock size={13} strokeWidth={2.2} /> Pay to unlock
    </Link>
  ) : reg.status === 'checked_in' || isPast ? (
    <Link href={detailHref} className="inline-flex items-center gap-0.5 text-[12.5px] font-semibold" style={{ color: MUTED }}>
      Receipt <ChevronRight size={15} strokeWidth={2.2} />
    </Link>
  ) : (
    <button onClick={onShowQR} className="inline-flex items-center gap-0.5 text-[12.5px] font-semibold" style={{ color: FOREST }}>
      Show QR <ChevronRight size={15} strokeWidth={2.2} />
    </button>
  );

  return (
    <div className="relative">
      {/* Ticket card — a real tear-off stub laid horizontally */}
      <div
        className="relative flex overflow-hidden transition-shadow hover:shadow-lg"
        style={{
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 16,
          boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.05)',
          opacity: isPast ? 0.82 : 1,
        }}
      >
        {/* Cover stub (left) */}
        <Link href={detailHref} aria-label={title} className="relative shrink-0 self-stretch" style={{ width: COVER, minHeight: 108 }}>
          {ep?.cover_image_url ? (
            <Image src={ep.cover_image_url} alt="" fill sizes="104px" className="object-cover" />
          ) : (
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }} />
          )}
          {/* status accent strip on the far edge */}
          <span className="absolute left-0 top-0 bottom-0" style={{ width: 5, background: tag.accent }} />
        </Link>

        {/* Body (right) */}
        <div className="flex-1 min-w-0 flex flex-col justify-center" style={{ padding: '13px 15px 13px 20px' }}>
          <Link href={detailHref} className="block min-w-0">
            <div
              className="font-display font-semibold leading-snug"
              style={{ fontFamily: '"DM Sans", sans-serif', color: INK, fontSize: 15.5, letterSpacing: '-0.01em', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
            >
              {title}
            </div>
            <div className="mt-1 text-[11.5px]" style={{ color: MUTED, fontFamily: '"JetBrains Mono", monospace' }}>
              {whenStr ?? ticketName}
            </div>
          </Link>
          <div className="flex items-center gap-2 mt-2.5">
            <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full" style={{ background: tag.accent + '1F' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: tag.accent }} />
              <span className="text-[11.5px] font-semibold" style={{ color: tag.color }}>{tag.label}</span>
            </span>
            <span className="ml-auto">{action}</span>
          </div>
        </div>
      </div>

      {/* Perforation between stub and body: dashed line + top/bottom notch "bites" */}
      <div className="absolute pointer-events-none" style={{ left: COVER - 1, top: 13, bottom: 13, width: 2, borderLeft: `2px dashed ${BORDER_STRONG}` }} />
      <span className="absolute rounded-full pointer-events-none" style={{ width: NOTCH, height: NOTCH, left: COVER - NOTCH / 2, top: -NOTCH / 2, background: CANVAS, border: `1px solid ${BORDER}` }} />
      <span className="absolute rounded-full pointer-events-none" style={{ width: NOTCH, height: NOTCH, left: COVER - NOTCH / 2, bottom: -NOTCH / 2, background: CANVAS, border: `1px solid ${BORDER}` }} />
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function MyTicketsClient({ upcoming, past }: Props) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [qr, setQR] = useState<{ token: string; name: string; label: string } | null>(null);

  function openQR(reg: Registration) {
    setQR({
      token: reg.qr_code_token,
      name: reg.attendee_name,
      label: [reg.events?.name, reg.ticket_types?.name].filter(Boolean).join(' · '),
    });
    if (typeof document !== 'undefined') {
      try { (screen as Screen & { brightness?: number }).brightness = 1; } catch { /* ignore */ }
    }
  }

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <div>
      {/* Segmented control */}
      <div className="inline-flex p-0.5 rounded-full mb-5" style={{ background: CREAM_SOFT, border: `1px solid ${BORDER}` }}>
        {(['upcoming', 'past'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="h-8 px-4 rounded-full text-[13px] font-semibold capitalize transition"
            style={tab === t
              ? { background: '#fff', color: FOREST, boxShadow: '0 1px 2px rgba(15,31,24,0.08)' }
              : { background: 'transparent', color: MUTED }}
          >
            {t}
            {t === 'upcoming' && upcoming.length > 0 && <span className="ml-1.5 opacity-60">{upcoming.length}</span>}
            {t === 'past' && past.length > 0 && <span className="ml-1.5 opacity-60">{past.length}</span>}
          </button>
        ))}
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[14px]" style={{ color: MUTED }}>
            {tab === 'upcoming' ? (
              <>No upcoming tickets.{' '}
                <Link href="/events" className="font-medium hover:underline" style={{ color: FOREST }}>Browse events →</Link>
              </>
            ) : (
              'No past events yet.'
            )}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {list.map(reg => (
            <TicketStub key={reg.id} reg={reg} isPast={tab === 'past'} onShowQR={() => openQR(reg)} />
          ))}
        </div>
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
