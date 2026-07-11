'use client';

import { useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { Share2, Check, ChevronRight, Download, Clock } from 'lucide-react';
import { CardZoneFill } from './CardZoneFill';
import { PhotoCropModal } from './PhotoCropModal';
import { CalendarPills } from './CalendarPills';
import { uidForSlug } from '@/lib/calendar/ics';

import type { Database, Zone } from '@/types/database';

type RegRow = Database['public']['Tables']['registrations']['Row'];

interface Variant {
  id: string;
  zones: Zone[];
  background_url: string | null;
  background_width: number | null;
  background_height: number | null;
}

interface Props {
  registration: RegRow;
  eventTitle: string;
  eventSlug: string;
  ticketName: string | null;
  variant: Variant | null;
  existingCardImageUrl: string | null;
  isPaidReturn: boolean;
  paymentIntentId: string | null;
  redirectStatus: string | null;
  txRef: string | null;
  isFlutterwaveReturn: boolean;
  // Event timing + location for "Add to calendar" (K01). All optional — the
  // pills hide themselves when there's no start date.
  eventPageId: string | null;
  eventStartsAt: string | null;
  eventEndsAt: string | null;
  eventTimezone: string | null;
  eventLocation: string | null;
  eventUrl: string;
}

// Eventera card confetti — only fires when enabled (i.e., phase === 'done')
function useConfetti(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const colors = ['#E8C57E', '#C9A45E', '#1F4D3A', '#2D7A4F', '#F5E9CC'];
    const container = document.getElementById('confetti-stage');
    if (!container) return;

    const particles = Array.from({ length: 28 }, () => {
      const el = document.createElement('div');
      const isCircle = Math.random() > 0.5;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = isCircle ? 6 + Math.random() * 5 : 3 + Math.random() * 3;
      el.style.cssText = `
        position:absolute; pointer-events:none; z-index:10;
        left:${15 + Math.random() * 70}%;
        top:-20px;
        width:${size}px; height:${size}px;
        background:${color};
        border-radius:${isCircle ? '50%' : '2px'};
        animation: confetti-fall ${2.6 + Math.random() * 1.8}s cubic-bezier(.2,.6,.4,1) ${Math.random() * 0.6}s forwards;
        --tx: ${-120 + Math.random() * 240}px;
      `;
      return el;
    });

    const style = document.createElement('style');
    style.textContent = `
      @keyframes confetti-fall {
        to { transform: translateX(var(--tx)) translateY(70vh) rotate(360deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    particles.forEach(p => container.appendChild(p));
    return () => { particles.forEach(p => p.remove()); style.remove(); };
  }, [enabled]);
}

type Phase = 'verifying' | 'card' | 'done';

export function ConfirmPage({ registration, eventTitle, eventSlug, ticketName, variant, existingCardImageUrl, isPaidReturn, paymentIntentId, txRef, isFlutterwaveReturn, eventPageId, eventStartsAt, eventEndsAt, eventTimezone, eventLocation, eventUrl }: Props) {
  // Determine initial phase:
  // - Paid return: start at 'verifying' (check PI status) → 'card' → 'done'
  // - Free (card already generated or in sessionStorage): 'done'
  // - Free (no card): 'card' → 'done'
  const hasCard = !!registration.eventera_card_url;
  const initialPhase: Phase = isPaidReturn ? 'verifying' : (existingCardImageUrl ? 'done' : (hasCard ? 'done' : (variant ? 'card' : 'done')));

  const [phase, setPhase] = useState<Phase>(initialPhase);

  // Check sessionStorage synchronously before first paint — if the registration flow
  // already generated the card, jump straight to 'done' without showing the form.
  useLayoutEffect(() => {
    if (isPaidReturn || hasCard) return;
    try {
      const stored = sessionStorage.getItem(`card_${registration.qr_code_token}`);
      if (stored) {
        setCardDataUrl(stored);
        setPhase('done');
      }
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(existingCardImageUrl);

  // Card step state (for post-payment personalisation)
  const [zoneValues, setZoneValues] = useState<Record<string, string>>(() => {
    const saved = registration.eventera_card_zone_data as Record<string, string> | null;
    return saved ?? {};
  });
  const [photoFiles, setPhotoFiles] = useState<Record<string, File>>({});
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [cropTarget, setCropTarget] = useState<{ zone: Zone; srcUrl: string; file: File } | null>(null);
  const [cardZoneErrors] = useState<Record<string, string>>({});
  const [generatingCard, setGeneratingCard] = useState(false);
  const [cardError, setCardError] = useState('');

  const handlePhotoSelect = useCallback((zone: Zone, file: File, srcUrl: string) => {
    setCropTarget({ zone, srcUrl, file });
  }, []);

  const handleCropConfirm = useCallback((file: File, previewUrl: string) => {
    if (!cropTarget) return;
    setPhotoFiles(p => ({ ...p, [cropTarget.zone.id]: file }));
    setPhotoUrls(p => ({ ...p, [cropTarget.zone.id]: previewUrl }));
    setCropTarget(null);
  }, [cropTarget]);

  const handlePhotoClear = useCallback((zoneId: string) => {
    setPhotoFiles(p => { const n = { ...p }; delete n[zoneId]; return n; });
    setPhotoUrls(p => { const n = { ...p }; delete n[zoneId]; return n; });
  }, []);

  async function handleGenerateCard() {
    if (!variant) { setPhase('done'); return; }
    setGeneratingCard(true);
    setCardError('');
    try {
      const enriched = { ...zoneValues };
      const firstText = variant.zones.find(z => z.type === 'text' && !z.hidden);
      if (firstText && !enriched[firstText.id]) {
        enriched[firstText.id] = registration.attendee_name;
      }

      const fd = new FormData();
      fd.append('variantId', variant.id);
      fd.append('fields', JSON.stringify(enriched));
      fd.append('idempotencyKey', registration.id); // valid UUID — safe for idempotency_key column
      fd.append('registrationId', registration.id);
      for (const [zoneId, file] of Object.entries(photoFiles)) {
        fd.append(`photo_${zoneId}`, file);
      }

      const res = await fetch('/api/render', { method: 'POST', body: fd });
      if (res.ok) {
        const cardId = res.headers.get('x-card-id');
        const blob = await res.blob();
        const dataUrl = await blobToDataUrl(blob);
        setCardDataUrl(dataUrl);
        try { sessionStorage.setItem(`card_${registration.qr_code_token}`, dataUrl); } catch { /* ignore */ }

        // Only update eventera_card_url via PATCH if we have a cardId.
        // When cardId is null (generated_cards insert failed), the render API
        // already updated registrations.eventera_card_url with the storage URL directly.
        if (cardId) {
          fetch(`/api/events/${registration.event_id}/registrations`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              registrationId: registration.id,
              eventera_card_zone_data: enriched,
              eventera_card_url: `/c/${eventSlug}/card/${cardId}`,
            }),
          }).catch(() => {});
        }
        setPhase('done');
      } else {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail ?? body?.error ?? `Render failed (${res.status})`);
      }
    } catch (err) {
      setCardError(err instanceof Error ? err.message : 'Card generation failed');
    } finally {
      setGeneratingCard(false);
    }
  }

  // sessionStorage check is handled in useLayoutEffect above (before first paint)

  // Verify payment on paid return (Stripe or Flutterwave)
  useEffect(() => {
    if (!isPaidReturn) return;

    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    async function verify() {
      let status = 'failed';

      if (paymentIntentId) {
        // Stripe verification
        const res = await fetch('/api/payments/confirm-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_intent_id: paymentIntentId, qr_code_token: registration.qr_code_token }),
        });
        const data = await res.json();
        status = data.status === 'succeeded' ? 'succeeded' : data.status;
        if (data.status === 'processing') {
          setPaymentStatus('processing');
          retryTimer = setTimeout(verify, 3000);
          return;
        }
      } else if (isFlutterwaveReturn && txRef) {
        // Flutterwave verification — use URL tx_ref
        const res = await fetch('/api/payments/flutterwave-confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tx_ref: txRef }),
        });
        const data = await res.json();
        status = data.status === 'successful' ? 'succeeded' : 'failed';
      }

      setPaymentStatus(status);
      setPhase(status === 'succeeded' ? (variant ? 'card' : 'done') : 'done');
    }

    verify();
    return () => { if (retryTimer) clearTimeout(retryTimer); };
  }, [isPaidReturn, paymentIntentId, isFlutterwaveReturn, txRef, registration.qr_code_token, variant]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDownload() {
    if (!cardDataUrl) return;
    const a = document.createElement('a');
    a.href = cardDataUrl;
    a.download = `eventera-card-${registration.attendee_name.replace(/\s+/g, '-').toLowerCase()}.png`;
    a.click();
  }

  async function handleShare() {
    const url = `${window.location.origin}/e/${eventSlug}`;
    if (navigator.share) {
      await navigator.share({
        title: `I'm attending ${eventTitle}!`,
        text: `Just registered for ${eventTitle}. Get your Eventera Card too!`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
    }
  }

  useConfetti(phase === 'done');

  const shareLinks = [
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`I'm attending ${eventTitle}! 🎟️`)}`,
      color: '#25D366',
      icon: (
        <svg viewBox="0 0 24 24" width="19" height="19" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I'm attending ${eventTitle}! 🎟️`)}&url=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/e/${eventSlug}`)}`,
      color: '#000000',
      icon: (
        <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${typeof window !== 'undefined' ? window.location.origin : ''}/e/${eventSlug}`)}`,
      color: '#0A66C2',
      icon: (
        <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
    },
  ];

  // ── Guard: approval-required registrations are NOT confirmed ──
  // This page can be reached directly by qr_code_token (e.g. an emailed link),
  // so a pending_approval registration must never see the confirmed badge, the
  // live QR, or "show this at the door". Show an honest awaiting-approval state.
  if (registration.status === 'pending_approval') {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 py-12" style={{ background: '#FAF6EE' }}>
        <div className="w-full max-w-[420px] rounded-2xl p-8 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
          <div className="mx-auto mb-4 flex items-center justify-center rounded-full" style={{ width: 44, height: 44, background: '#FEF3C7', color: '#C97A2D' }}>
            <Clock size={22} strokeWidth={2.2} />
          </div>
          <h1 className="font-display font-semibold text-[22px] mb-1.5" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
            Awaiting approval
          </h1>
          <p className="text-[14px] mb-6" style={{ color: '#3A4A42' }}>
            Your registration for {eventTitle} is pending the organizer&apos;s approval. We&apos;ll
            email you as soon as you&apos;re approved — your ticket and QR code will be ready then.
          </p>
          <a
            href={`/e/${eventSlug}`}
            className="inline-flex items-center justify-center h-11 px-5 rounded-xl text-[14px] font-medium transition"
            style={{ border: '1px solid #E5E0D4', color: '#3A4A42' }}
          >
            Back to event
          </a>
        </div>
      </div>
    );
  }

  // ── Phase: verifying payment ──────────────────────────────────
  if (phase === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0F0C' }}>
        <div className="text-center">
          <svg className="animate-spin mx-auto mb-4" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E8C57E" strokeWidth="2.5">
            <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
          </svg>
          <p className="text-[14px]" style={{ color: 'rgba(255,255,255,0.5)' }}>Confirming your payment…</p>
          {paymentStatus === 'processing' && (
            <p className="text-[12px] mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>Your bank is processing the payment. This usually takes a few seconds.</p>
          )}
        </div>
      </div>
    );
  }

  // ── Phase: card personalisation (post-payment) ────────────────
  if (phase === 'card' && variant) {
    return (
      <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
        <div className="max-w-[900px] mx-auto px-5 py-10 pb-36">
          {/* Header */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full" style={{ background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.2)' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#2D7A4F' }} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#2D7A4F' }}>
                {isPaidReturn ? 'Payment confirmed' : 'Registration confirmed'}
              </span>
            </div>
            <h1 className="font-display font-semibold text-[28px] mb-2" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
              Design your Eventera Card
            </h1>
            <p className="text-[15px]" style={{ color: '#6B7A72' }}>
              Personalise your card — it&apos;ll be generated when you confirm.
            </p>
          </div>

          <CardZoneFill
            zones={variant.zones}
            values={zoneValues}
            photoUrls={photoUrls}
            errors={cardZoneErrors}
            onChange={(id, v) => setZoneValues(p => ({ ...p, [id]: v }))}
            onPhotoSelect={handlePhotoSelect}
            onPhotoClear={handlePhotoClear}
            backgroundUrl={variant.background_url}
            backgroundWidth={variant.background_width}
            backgroundHeight={variant.background_height}
          />

          {cardError && (
            <div className="mt-5 px-4 py-3 rounded-xl text-[14px]" style={{ background: 'rgba(184,66,60,0.06)', color: '#B8423C', border: '1px solid rgba(184,66,60,0.15)' }}>
              {cardError}
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div
          className="fixed bottom-0 left-0 right-0 z-30 px-5 py-4"
          style={{ background: 'white', borderTop: '1px solid #E5E0D4', boxShadow: '0 -4px 24px rgba(15,31,24,0.08)' }}
        >
          <div className="max-w-[680px] mx-auto flex items-center justify-between gap-4">
            <button
              onClick={() => setPhase('done')}
              className="text-[13px] font-medium transition hover:opacity-70"
              style={{ color: '#6B7A72' }}
            >
              Skip for now
            </button>
            <button
              onClick={handleGenerateCard}
              disabled={generatingCard}
              className="flex items-center gap-2 h-12 px-7 rounded-xl text-white font-semibold text-[15px] transition hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 100%)', boxShadow: '0 4px 12px rgba(31,77,58,0.25)' }}
            >
              {generatingCard ? (
                <>
                  <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
                  </svg>
                  Generating your card…
                </>
              ) : (
                <>Get my card <ChevronRight size={16} strokeWidth={2.5} /></>
              )}
            </button>
          </div>
        </div>

        {cropTarget && (
          <PhotoCropModal
            target={cropTarget}
            onConfirm={handleCropConfirm}
            onCancel={() => setCropTarget(null)}
          />
        )}
      </div>
    );
  }

  // ── Shared header block ──────────────────────────────────────
  const PageHeader = () => (
    <div className="mb-10 lg:mb-12">
      <div className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full" style={{ background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.2)' }}>
        <Check size={12} strokeWidth={2.5} style={{ color: '#2D7A4F' }} />
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: '#2D7A4F' }}>Registration confirmed</span>
      </div>
      <h1 className="font-display font-semibold text-[30px] lg:text-[36px] mb-1.5" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
        {registration.attendee_name}
      </h1>
      <p className="text-[15px]" style={{ color: '#6B7A72' }}>
        {ticketName ?? 'General Admission'} &middot; {eventTitle}
      </p>
    </div>
  );

  // ── Shared QR ticket panel ────────────────────────────────────
  const TicketPanel = () => (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(15,31,24,0.06)' }}>
      {/* Green top strip */}
      <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #1F4D3A 0%, #2D7A4F 100%)' }} />

      <div className="p-6">
        {/* QR code */}
        <div className="flex flex-col items-center mb-5">
          <div className="rounded-xl overflow-hidden mb-2.5" style={{ padding: 12, background: '#F9F9F9', border: '1px solid #EFEFEF' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/qr/${registration.qr_code_token}`}
              alt="Check-in QR code"
              style={{ width: 160, height: 160, display: 'block' }}
            />
          </div>
          <p className="text-[12px] font-medium" style={{ color: '#6B7A72' }}>Show this QR at the door</p>
        </div>

        {/* Divider */}
        <div className="border-t border-dashed mb-5" style={{ borderColor: '#E5E0D4' }} />

        {/* Save ticket */}
        <a
          href={`/api/qr/${registration.qr_code_token}`}
          download={`ticket-${registration.attendee_name.replace(/\s+/g, '-').toLowerCase()}.png`}
          className="flex items-center justify-center gap-2 h-10 rounded-lg font-medium text-[13px] w-full mb-4 transition"
          style={{ background: '#F5F9F6', border: '1px solid rgba(31,77,58,0.18)', color: '#1F4D3A' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#EAF2EC'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#F5F9F6'; }}
        >
          <Download size={13} strokeWidth={2.2} />
          Save ticket
        </a>

        {/* Add to calendar — Google / Apple / Outlook / .ics */}
        {eventStartsAt && (
          <div className="mb-4">
            <CalendarPills
              title={eventTitle}
              description={ticketName ? `Ticket: ${ticketName}` : null}
              location={eventLocation}
              startsAt={eventStartsAt}
              endsAt={eventEndsAt}
              timezone={eventTimezone}
              eventUrl={eventUrl}
              uid={uidForSlug(eventSlug)}
              icsHref={`/api/calendar/${eventPageId ?? registration.event_id}`}
            />
          </div>
        )}

        {/* Share row */}
        <p className="text-[11px] font-medium text-center mb-2.5" style={{ color: '#6B7A72' }}>Share</p>
        <div className="flex gap-2 justify-center mb-5">
          {shareLinks.map(s => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 w-9 rounded-full flex items-center justify-center transition"
              style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: s.color }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1F4D3A'; e.currentTarget.style.background = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E0D4'; e.currentTarget.style.background = '#FAF6EE'; }}
              title={`Share on ${s.label}`}
            >
              {s.icon}
            </a>
          ))}
          <button
            onClick={handleShare}
            className="h-9 w-9 rounded-full flex items-center justify-center transition"
            style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#6B7A72' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1F4D3A'; e.currentTarget.style.background = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E0D4'; e.currentTarget.style.background = '#FAF6EE'; }}
          >
            <Share2 size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Back link */}
        <div className="text-center">
          <a
            href={`/e/${eventSlug}`}
            className="text-[12px] font-medium transition"
            style={{ color: '#6B7A72' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1F4D3A')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6B7A72')}
          >
            Back to event &rarr;
          </a>
        </div>
      </div>
    </div>
  );

  // ── Phase: done — card generated → two-column layout ──────────
  if (cardDataUrl && variant) {
    return (
      <div className="min-h-screen" style={{ background: '#FAF6EE' }}>
        <div id="confetti-stage" className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 50 }} />

        <div className="max-w-[1080px] mx-auto px-5 py-10 lg:py-14">
          <PageHeader />

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
            {/* LEFT — Ticket + QR */}
            <div className="w-full lg:w-[300px] shrink-0 lg:sticky lg:top-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: '#6B7A72' }}>
                Your ticket
              </p>
              <TicketPanel />
            </div>

            {/* RIGHT — Eventera Card */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: '#6B7A72' }}>
                Your Eventera Card
              </p>
              <div
                className="rounded-2xl overflow-hidden w-full"
                style={{ boxShadow: '0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.12)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cardDataUrl}
                  alt="Your Eventera Card"
                  className="w-full block"
                />
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleDownload}
                  className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-[14px] text-white transition hover:opacity-90"
                  style={{ background: '#1F4D3A', boxShadow: '0 4px 12px rgba(31,77,58,0.22)' }}
                >
                  <Download size={16} strokeWidth={2.2} />
                  Download card
                </button>
                <button
                  onClick={() => setPhase('card')}
                  className="flex items-center justify-center gap-1.5 h-12 px-6 rounded-xl font-medium text-[14px] transition"
                  style={{ background: 'white', border: '1px solid #E5E0D4', color: '#3A4A42' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#1F4D3A'; e.currentTarget.style.color = '#1F4D3A'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E0D4'; e.currentTarget.style.color = '#3A4A42'; }}
                >
                  Edit
                </button>
              </div>
              <p className="text-[12px] mt-3" style={{ color: '#6B7A72' }}>
                Share your card on social media &mdash; let everyone know you&apos;re attending!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Phase: done — no card (QR ticket only) ───────────────────
  return (
    <div className="min-h-screen flex flex-col items-center px-5 py-10 lg:py-16" style={{ background: '#FAF6EE' }}>
      <div id="confetti-stage" className="fixed inset-0 pointer-events-none overflow-hidden" />
      <div className="w-full max-w-[400px]">
        <PageHeader />
        <TicketPanel />
      </div>
    </div>
  );
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
