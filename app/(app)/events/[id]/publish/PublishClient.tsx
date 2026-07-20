'use client';

import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import { PageShell, PageHeader, Card, StatRow, PrimaryButton, SecondaryButton, dash } from '@/components/dash';

/* ── Inline SVG icon helper ────────────────────────────────────── */
function Ico({ size = 16, sw = 1.6, children }: {
  size?: number; sw?: number; children: React.ReactNode;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const I = {
  check: (p?: { size?: number; sw?: number }) => (
    <Ico size={p?.size ?? 16} sw={p?.sw ?? 1.6}><polyline points="20 6 9 17 4 12" /></Ico>
  ),
  copy: (p?: { size?: number }) => (
    <Ico size={p?.size ?? 16}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></Ico>
  ),
  download: (p?: { size?: number }) => (
    <Ico size={p?.size ?? 16}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Ico>
  ),
  external: (p?: { size?: number }) => (
    <Ico size={p?.size ?? 16}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></Ico>
  ),
  chart: (p?: { size?: number; sw?: number }) => (
    <Ico size={p?.size ?? 16} sw={p?.sw ?? 1.6}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></Ico>
  ),
  arrowRight: (p?: { size?: number }) => (
    <Ico size={p?.size ?? 16}><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></Ico>
  ),
  link: (p?: { size?: number }) => (
    <Ico size={p?.size ?? 16}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></Ico>
  ),
};

/* ── Brand platform icons ──────────────────────────────────────── */
// Brand marks — official Simple Icons glyphs on a rounded tile in each
// platform's brand colour, so they read as the real logos, not generic art.
const Brand = {
  whatsapp: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#25D366" />
      <path fill="#fff" transform="translate(4 4) scale(0.667)" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  x: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#000" />
      <path fill="#fff" transform="translate(4.5 4.5) scale(0.625)" d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  ),
  linkedin: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#0A66C2" />
      <path fill="#fff" transform="translate(4 4) scale(0.667)" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  email: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#1F4D3A" />
      <path d="M6 8.5h12a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1z" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M5.4 9.2 12 13l6.6-3.8" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

/** Rounded-rect path on a 2D context. */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// The real Eventera icon mark (public/eventera-logo.png, left icon cropped
// out — gold bar over two dark-green bars), trimmed to a tight transparent
// PNG. Embedded inline so the SVG download is self-contained. Native size
// 66×70 — regenerate with `sharp('public/eventera-logo.png').extract({left:0,
// top:0, width:66, height:70}).trim()` if the source wordmark ever changes.
const MARK_ASPECT = 66 / 70;
const MARK_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAEIAAABGCAYAAAB4xUL+AAAACXBIWXMAABYlAAAWJQFJUiTwAAABLklEQVR4nO2asQ3CMBRE/whUrjOFaxorazAKIzADkzCF13mIDpEySHeSr3gNaZ5O9v+HkprPcZ/PwWJcgfqmEgQJgpyIkasxMyNGhuXM1hhZnzM9YqRQzZPNcvs8WIzLIYjfH1gUuQAmyAUwQS6ACXIBTJALYIJcABPkApggF8AEuQAmyAUwQS6ACXIBTJALYIJcABOq7f3W9v4S8XAK4t72joiXOoAEQYKonAhyNSozggzLytYg67PSI0jFrr80S3W1xQS5ACbIBTBBLoAJcgFMkAtgglwAE+QCmCAXwAS5ACbIBTBBLoAJcgFMkAtgglwAozddW9v7dTEubq/8EHH8KD1BkCDIiei5Gi0zomdYtmyNnvXZ0iN6ClU70yzVf3YwQS6ACXIBTJALYMIbLxpjawb0N64AAAAASUVORK5CYII=';

/**
 * Centre-mark geometry, shared by the PNG and SVG paths so the download can
 * never drift from what's on screen.
 *
 * The mark used to sit on a plate barely larger than itself (plate 0.23 of the
 * QR, mark 0.15 — a 65% fill), which read as a hole punched in the pattern
 * with something small inside rather than a deliberate badge, and the thin
 * three-bar glyph disappeared into the surrounding modules.
 *
 * Bigger plate, more padding inside it, and a hairline ring to separate badge
 * from pattern. The QR is generated at error-correction H (30% recoverable);
 * the plate covers 0.30² = 9% of the area, so this stays comfortably scannable.
 */
const MARK_PLATE_HALF = 0.150;  // half the plate, as a fraction of QR size
const MARK_HEIGHT     = 0.170;  // mark height, as a fraction of QR size
const MARK_RING       = 0.006;  // hairline ring around the plate
const MARK_RADIUS     = 0.36;   // corner radius, as a fraction of the plate

/** Draw the real Eventera icon mark (not a redrawn approximation) on a white
 *  plate into the centre of a QR PNG data URL and return the composited PNG. */
function compositeQrMark(rawDataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const size = 1024;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(rawDataUrl); return; }
      ctx.drawImage(img, 0, 0, size, size);
      const cx = size / 2, cy = size / 2;
      const plate = size * MARK_PLATE_HALF;
      const radius = plate * MARK_RADIUS * 2;

      roundRect(ctx, cx - plate, cy - plate, plate * 2, plate * 2, radius);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();
      // Hairline ring — without it the white plate blends into the quiet space
      // between modules and the badge loses its edge.
      ctx.strokeStyle = '#E5E0D4';
      ctx.lineWidth = size * MARK_RING;
      ctx.stroke();

      const markImg = new window.Image();
      markImg.onload = () => {
        const markH = size * MARK_HEIGHT;
        const markW = markH * MARK_ASPECT;
        ctx.drawImage(markImg, cx - markW / 2, cy - markH / 2, markW, markH);
        resolve(canvas.toDataURL('image/png'));
      };
      markImg.onerror = () => resolve(canvas.toDataURL('image/png'));
      markImg.src = `data:image/png;base64,${MARK_PNG_BASE64}`;
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}

/** Inject the same real Eventera mark into the centre of a QR SVG string so
 *  the SVG download carries the logo too. */
function injectMarkIntoSvg(svg: string): string {
  const m = svg.match(/viewBox="0 0 ([\d.]+) /);
  const vb = m ? parseFloat(m[1]) : 0;
  if (!vb) return svg;
  const c = vb / 2;
  const plate = vb * MARK_PLATE_HALF;
  const markH = vb * MARK_HEIGHT;
  const markW = markH * MARK_ASPECT;
  const overlay =
    `<rect x="${c - plate}" y="${c - plate}" width="${plate * 2}" height="${plate * 2}"` +
    ` rx="${plate * MARK_RADIUS * 2}" fill="#FFFFFF"` +
    ` stroke="#E5E0D4" stroke-width="${vb * MARK_RING}"/>` +
    `<image x="${c - markW / 2}" y="${c - markH / 2}" width="${markW}" height="${markH}" href="data:image/png;base64,${MARK_PNG_BASE64}"/>`;
  return svg.replace('</svg>', `${overlay}</svg>`);
}

/* ── Event registration phone preview ─────────────────────────── */
function RegistrationPreview({ eventName, dateLabel, venueLabel }: {
  eventName: string;
  dateLabel: string;
  venueLabel: string;
}) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: dash.cream,
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Cover band */}
      <div style={{
        background: 'linear-gradient(160deg, #1F4D3A 0%, #2A6A50 70%, #163828 100%)',
        padding: '12px 10px 14px',
        flexShrink: 0,
      }}>
        <div style={{
          fontSize: 7.5, fontWeight: 700, color: dash.gold,
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4,
        }}>EVENT</div>
        <div style={{
          fontSize: 9, fontWeight: 700, color: dash.cream,
          lineHeight: 1.2, letterSpacing: '-0.01em',
        }}>{eventName.length > 28 ? eventName.slice(0, 28) + '…' : eventName}</div>
        {dateLabel && (
          <div style={{ fontSize: 7, color: 'rgba(250,246,238,0.7)', marginTop: 4 }}>{dateLabel}</div>
        )}
      </div>
      {/* Body */}
      <div style={{ flex: 1, padding: '10px 10px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {venueLabel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 7, color: dash.inkSoft }}>
            <div style={{ color: dash.inkSoft, flexShrink: 0 }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <span>{venueLabel.length > 24 ? venueLabel.slice(0, 24) + '…' : venueLabel}</span>
          </div>
        )}
        <div style={{ fontSize: 7, color: dash.muted, marginTop: 4, marginBottom: 2 }}>Registration details</div>
        {['Full name', 'Email address'].map(label => (
          <div key={label} style={{
            height: 20, borderRadius: 4,
            border: `1px solid ${dash.border}`,
            background: '#FFFFFF',
            padding: '0 6px',
            display: 'flex', alignItems: 'center',
            fontSize: 7, color: dash.muted,
          }}>{label}</div>
        ))}
        <div style={{
          height: 20, borderRadius: 4,
          background: dash.forest,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 7.5, fontWeight: 700, color: dash.cream,
          marginTop: 4,
        }}>Register →</div>
      </div>
      <div style={{
        padding: '6px 10px',
        fontSize: 6, color: dash.muted,
        textAlign: 'center', letterSpacing: '0.04em',
      }}>powered by eventera</div>
    </div>
  );
}

/* ── Date helper ───────────────────────────────────────────────── */
function formatEventDate(iso: string | null, tz: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      timeZone: tz,
    });
  } catch {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

/* ── Props ─────────────────────────────────────────────────────── */
interface Props {
  eventId: string;
  eventName: string;
  shareUrl: string;
  slug: string;
  isPublished: boolean;
  viewCount: number;
  registrationCount: number;
  ticketCount: number;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string;
  venueName: string | null;
  isOnline: boolean;
}

/* ── Main component ────────────────────────────────────────────── */
export default function PublishClient({
  eventId, eventName, shareUrl, slug,
  isPublished,
  viewCount, registrationCount, ticketCount,
  startsAt, endsAt, timezone, venueName, isOnline,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [captionCopied, setCaptionCopied] = useState(false);
  const [captionIndex, setCaptionIndex] = useState(0);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrSvgString, setQrSvgString] = useState('');
  const [activeSize, setActiveSize] = useState<'mobile' | 'tablet' | 'custom'>('mobile');
  const [published, setPublished] = useState(isPublished);

  const EMBED_SIZES = { mobile: { w: 375, h: 812 }, tablet: { w: 768, h: 1024 }, custom: { w: '100%', h: '100%' } };
  const activeSz = EMBED_SIZES[activeSize];
  const embedCode = `<iframe src="${shareUrl}"\n        width="${activeSz.w}" height="${activeSz.h}"\n        frameborder="0"></iframe>`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Error-correction 'H' (30% recovery) so the centre Eventera mark never
      // breaks scanning. The mark is baked INTO the image so downloads carry it.
      const opts = { width: 1024, margin: 2, errorCorrectionLevel: 'H' as const, color: { dark: '#0F1F18', light: '#ffffff' } };
      const [rawDataUrl, svgStr] = await Promise.all([
        QRCode.toDataURL(shareUrl, opts),
        QRCode.toString(shareUrl, { ...opts, type: 'svg' } as Parameters<typeof QRCode.toString>[1]),
      ]);
      const composited = await compositeQrMark(rawDataUrl);
      if (!cancelled) {
        setQrDataUrl(composited);
        setQrSvgString(injectMarkIntoSvg(svgStr));
      }
    })();
    return () => { cancelled = true; };
  }, [shareUrl]);

  const dateLabel = startsAt ? formatEventDate(startsAt, timezone) : '';
  const endLabel = endsAt ? formatEventDate(endsAt, timezone) : '';
  const dateRange = dateLabel && endLabel && dateLabel !== endLabel
    ? `${dateLabel} – ${endLabel}`
    : dateLabel;
  const venueLabel = isOnline ? 'Online event' : (venueName ?? '');

  // Three caption variants an organizer might actually want to post — short,
  // specific, no auto-generated hashtag stuffing (every word of the event
  // title capitalized into a #tag reads as filler, not something a person
  // would post).
  const captions = [
    `${eventName}\n${[dateRange, venueLabel].filter(Boolean).join(' · ')}\n\nWe're hosting this and would love to have you there. Reserve your spot — seats are limited.\n\nRegister: ${shareUrl}`,
    `${dateRange ? `Happening ${dateRange}` : 'Coming up'}${venueLabel && !isOnline ? ` at ${venueLabel}` : isOnline ? ' — online' : ''}: ${eventName}.\n\nSpots are filling up — register free.\n\n${shareUrl}`,
    `Save the date: ${eventName}${[dateRange, venueLabel].filter(Boolean).length ? ` · ${[dateRange, venueLabel].filter(Boolean).join(' · ')}` : ''}.\n\n${shareUrl}`,
  ];
  const caption = captions[captionIndex];
  const handlePublish = useCallback(async () => {
    setPublishing(true);
    setPublishError('');
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });
      if (!res.ok) throw new Error('Failed to publish');
      setPublished(true);
    } catch {
      setPublishError('Failed to publish. Please try again.');
    } finally {
      setPublishing(false);
    }
  }, [eventId]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for restricted contexts
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  const handleCaptionCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = caption;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2000);
    }
  }, [caption]);

  const handleEmbedCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = embedCode;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    }
  }, [embedCode]);

  const handleDownloadQR = useCallback(() => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `eventera-qr-${slug}.png`;
    a.click();
  }, [qrDataUrl, slug]);

  const handleDownloadSVG = useCallback(() => {
    if (!qrSvgString) return;
    const blob = new Blob([qrSvgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eventera-qr-${slug}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [qrSvgString, slug]);

  const sz = activeSz;

  return (
    <PageShell width="wide">
      {/* ── Draft banner ────────────────────────────────────────────── */}
      {!published && (
        <div
          className="mb-6 rounded-2xl border px-5 py-4 flex items-center justify-between gap-3 flex-wrap"
          style={{ background: '#FFFFFF', borderColor: dash.border }}
        >
          <div>
            <div className="font-display font-semibold text-[15px]" style={{ color: dash.ink }}>
              This event isn&apos;t published yet.
            </div>
            <div className="text-[13px] mt-0.5" style={{ color: dash.muted }}>
              Publish it to make the link live and start accepting registrations.
            </div>
          </div>
          <div className="flex items-center gap-3">
            {publishError && (
              <span className="text-[13px]" style={{ color: '#B8423C' }}>{publishError}</span>
            )}
            <PrimaryButton onClick={handlePublish} disabled={publishing}>
              {publishing ? 'Publishing…' : 'Publish now'}
            </PrimaryButton>
          </div>
        </div>
      )}

      <PageHeader
        eyebrow="Publish & share"
        title={eventName}
        subtitle={
          <span className="inline-flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: published ? '#2D7A4F' : dash.muted }} />
              {published ? 'Open for registration' : 'Not open for registration yet'}
            </span>
            {dateRange && <span style={{ color: '#C9C3B1' }}>· {dateRange}</span>}
          </span>
        }
        actions={
          <SecondaryButton href={shareUrl}>
            {I.external({ size: 14 })}
            View public page
          </SecondaryButton>
        }
      />

      <StatRow
        stats={[
          { label: 'Page views', value: viewCount, hint: 'all-time' },
          { label: 'Registrations', value: registrationCount, hint: 'confirmed' },
          { label: 'Ticket types', value: ticketCount, hint: 'active' },
        ]}
      />

      {/* ── Share + QR row ───────────────────────────────────────── */}
      <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>

        {/* Share link card */}
        <Card>
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: dash.muted }}>Share link</div>
            <span className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: dash.muted }}>
              {I.link({ size: 11 })}
              public · no login required
            </span>
          </div>

          <div className="flex gap-2 mb-4">
            <div className="flex-1 min-w-0 flex items-stretch rounded-lg overflow-hidden border" style={{ borderColor: dash.border }}>
              <div className="flex-1 min-w-0 px-3 flex items-center" style={{ background: dash.cream, borderRight: `1px solid ${dash.border}` }}>
                <span className="text-[12.5px] font-medium whitespace-nowrap overflow-hidden text-ellipsis flex-1" style={{ color: dash.ink }}>{shareUrl}</span>
              </div>
              <button
                onClick={handleCopy}
                className="px-4 h-11 inline-flex items-center gap-1.5 text-[13px] font-semibold shrink-0 transition"
                style={{ background: copied ? dash.soft : '#FFFFFF', color: copied ? dash.forest : dash.ink }}
              >
                {copied ? I.check({ size: 14 }) : I.copy({ size: 14 })}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <PrimaryButton href={shareUrl}>
              {I.external({ size: 14 })}
              Visit
            </PrimaryButton>
          </div>

          <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-2" style={{ color: dash.muted }}>Share to</div>
          <div className="grid grid-cols-4 gap-2 mb-4">
            <ShareButton icon={Brand.whatsapp(34)} label="WhatsApp" sub="Group chat" href={`https://wa.me/?text=${encodeURIComponent(caption)}`} />
            <ShareButton icon={Brand.x(34)} label="X" sub="Compose" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${caption} ${shareUrl}`)}`} />
            <ShareButton icon={Brand.linkedin(34)} label="LinkedIn" sub="Post" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} />
            <ShareButton icon={Brand.email(34)} label="Email" sub="Compose" href={`mailto:?subject=${encodeURIComponent(`You're invited: ${eventName}`)}&body=${encodeURIComponent(`${caption}\n\nRegister here: ${shareUrl}`)}`} />
          </div>

          <div className="rounded-xl p-3.5" style={{ background: dash.cream, border: `1px solid ${dash.border}` }}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: dash.muted }}>Caption</div>
                <div className="flex gap-1">
                  {captions.map((_, i) => (
                    <button key={i} onClick={() => setCaptionIndex(i)}
                      className="w-[22px] h-[22px] rounded text-[11px] font-semibold inline-flex items-center justify-center border transition"
                      style={{
                        background: captionIndex === i ? dash.forest : '#FFFFFF',
                        color: captionIndex === i ? dash.cream : dash.muted,
                        borderColor: captionIndex === i ? dash.forest : dash.border,
                      }}>{i + 1}</button>
                  ))}
                </div>
              </div>
              <button onClick={handleCaptionCopy} className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: dash.forest }}>
                {captionCopied ? I.check({ size: 12 }) : I.copy({ size: 12 })}
                {captionCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="text-[13px] leading-[1.6] whitespace-pre-line" style={{ color: dash.ink }}>{caption}</div>
          </div>
        </Card>

        {/* QR code card */}
        <Card>
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: dash.muted }}>QR code</div>
            <span className="text-[11px]" style={{ color: dash.muted }}>1024 × 1024</span>
          </div>
          <div className="flex justify-center py-1.5 pb-2.5">
            <div className="p-3.5 rounded-2xl border inline-flex" style={{ background: '#FFFFFF', borderColor: dash.border }}>
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="QR code" width={192} height={192} className="block rounded" />
              ) : (
                <div className="w-[192px] h-[192px] rounded flex items-center justify-center" style={{ background: '#F0EDE8' }}>
                  <span className="text-[11px]" style={{ color: dash.muted }}>generating…</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 mb-3.5">
            <PrimaryButton onClick={handleDownloadQR} disabled={!qrDataUrl}>
              {I.download({ size: 14 })}
              Download PNG
            </PrimaryButton>
            <SecondaryButton onClick={handleDownloadSVG} disabled={!qrSvgString}>
              SVG
            </SecondaryButton>
          </div>
          <div className="text-[12px] leading-[1.5] text-center" style={{ color: dash.muted }}>
            Print on posters, flyers, or badges. Scanning opens the registration page.
          </div>
        </Card>
      </div>

      {/* ── Embed block ───────────────────────────────────────────── */}
      <Card className="mb-5">
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: dash.muted }}>Embed in your site</div>
          <button onClick={handleEmbedCopy} className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: dash.forest }}>
            {embedCopied ? I.check({ size: 12 }) : I.copy({ size: 12 })}
            {embedCopied ? 'Copied!' : 'Copy snippet'}
          </button>
        </div>
        <div className="rounded-lg overflow-hidden mb-3" style={{ background: dash.ink }}>
          <div className="flex items-center gap-1.5 px-3 py-2" style={{ borderBottom: '1px solid rgba(250,246,238,0.08)' }}>
            <span className="w-[9px] h-[9px] rounded-full" style={{ background: '#FF5F57' }} />
            <span className="w-[9px] h-[9px] rounded-full" style={{ background: '#FEBC2E' }} />
            <span className="w-[9px] h-[9px] rounded-full" style={{ background: '#28C840' }} />
            <span className="ml-2 text-[10px] tracking-[0.04em]" style={{ color: 'rgba(250,246,238,0.55)' }}>embed.html · html</span>
          </div>
          <pre className="m-0 px-4 py-3.5 text-[12px] leading-[1.65] whitespace-pre-wrap" style={{ color: dash.cream, wordBreak: 'break-all' }}>
            <span style={{ color: '#9EC6B2' }}>{'<iframe'}</span>{' '}
            <span style={{ color: '#E8C57E' }}>src</span><span style={{ color: 'rgba(250,246,238,0.45)' }}>=</span><span style={{ color: '#F0E0BB' }}>&quot;{shareUrl}&quot;</span>{'\n        '}
            <span style={{ color: '#E8C57E' }}>width</span><span style={{ color: 'rgba(250,246,238,0.45)' }}>=</span><span style={{ color: '#F0E0BB' }}>&quot;{sz.w}&quot;</span>{' '}
            <span style={{ color: '#E8C57E' }}>height</span><span style={{ color: 'rgba(250,246,238,0.45)' }}>=</span><span style={{ color: '#F0E0BB' }}>&quot;{sz.h}&quot;</span>{'\n        '}
            <span style={{ color: '#E8C57E' }}>frameborder</span><span style={{ color: 'rgba(250,246,238,0.45)' }}>=</span><span style={{ color: '#F0E0BB' }}>&quot;0&quot;</span>
            <span style={{ color: '#9EC6B2' }}>{'></iframe>'}</span>
          </pre>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {([
            { id: 'mobile' as const, label: 'Mobile', size: '375 × 812' },
            { id: 'tablet' as const, label: 'Tablet', size: '768 × 1024' },
            { id: 'custom' as const, label: 'Custom', size: 'responsive' },
          ]).map(chip => (
            <button
              key={chip.id}
              onClick={() => setActiveSize(chip.id)}
              className="px-2.5 py-2 rounded-lg border text-left transition"
              style={{
                background: activeSize === chip.id ? dash.soft : '#FFFFFF',
                borderColor: activeSize === chip.id ? 'rgba(31,77,58,0.2)' : dash.border,
              }}
            >
              <div className="text-[12px] font-semibold" style={{ color: activeSize === chip.id ? dash.forest : dash.ink }}>{chip.label}</div>
              <div className="text-[10px] tracking-[0.04em]" style={{ color: dash.muted }}>{chip.size}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* ── Preview + Next steps row ──────────────────────────────── */}
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>

        {/* Attendee preview card */}
        <Card>
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: dash.muted }}>What attendees see</div>
            <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: dash.forest, textDecoration: 'none' }}>
              {I.external({ size: 12 })}
              Open page
            </a>
          </div>
          <div className="rounded-xl border py-5 px-4 flex justify-center items-start mb-3" style={{ background: dash.cream, borderColor: dash.border }}>
            <div style={{
              width: 158,
              background: '#0F1218',
              borderRadius: 24, padding: '0 5px',
              boxShadow: '0 16px 48px rgba(15,31,24,0.28), inset 0 0 0 1px rgba(255,255,255,0.06)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>9:41</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[3, 4, 5, 6].map((h, i) => (
                    <div key={i} style={{ width: 2.5, height: h, borderRadius: 1, background: i < 3 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)' }} />
                  ))}
                  <svg width="12" height="9" viewBox="0 0 12 9" fill="none" style={{ marginLeft: 2 }}>
                    <path d="M6 7.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" fill="rgba(255,255,255,0.85)" />
                    <path d="M2.5 5C3.8 3.8 5 3.2 6 3.2c1 0 2.2.6 3.5 1.8" stroke="rgba(255,255,255,0.75)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                    <path d="M.5 2.8C2.2 1.1 4 .2 6 .2s3.8.9 5.5 2.6" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                  </svg>
                  <div style={{ display: 'flex', alignItems: 'center', marginLeft: 2 }}>
                    <div style={{ width: 18, height: 9, borderRadius: 2.5, border: '1.5px solid rgba(255,255,255,0.6)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', left: 1.5, top: 1.5, bottom: 1.5, width: '80%', background: 'rgba(255,255,255,0.85)', borderRadius: 1 }} />
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ width: '100%', height: 260, borderRadius: 6, overflow: 'hidden', position: 'relative', background: dash.cream }}>
                <RegistrationPreview eventName={eventName} dateLabel={dateRange} venueLabel={venueLabel} />
              </div>
              <div style={{ height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 44, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)' }} />
              </div>
            </div>
          </div>
          <div className="text-[12px] text-center leading-[1.5]" style={{ color: dash.muted }}>
            Attendees open the link, fill in their details, and register in seconds.
          </div>
        </Card>

        {/* Next steps card */}
        <Card>
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] mb-3.5" style={{ color: dash.muted }}>What happens next</div>
          <div className="flex flex-col gap-3.5">
            {[
              { n: 1, t: 'Share the link', d: 'Send via WhatsApp, post to your channels, print the QR on flyers — attendees open it on any device.' },
              { n: 2, t: 'Attendees register', d: 'They fill in their name, email, and any custom fields you set up. No account needed.' },
              { n: 3, t: 'You see it live', d: 'Every registration appears in your dashboard instantly. Check in attendees at the door with the QR scanner.' },
            ].map(s => (
              <div key={s.n} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full font-display font-bold text-[13px] inline-flex items-center justify-center shrink-0" style={{ background: dash.ink, color: dash.cream }}>{s.n}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold text-[14px] leading-tight" style={{ color: dash.ink }}>{s.t}</div>
                  <div className="text-[13px] leading-[1.5] mt-0.5" style={{ color: dash.inkSoft }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3.5 pt-3.5 border-t" style={{ borderColor: dash.border }}>
            <SecondaryButton href={`/events/${slug}`}>
              {I.chart({ size: 15, sw: 2 })}
              View event dashboard
              {I.arrowRight({ size: 14 })}
            </SecondaryButton>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}

/* ── Share button ──────────────────────────────────────────────── */
function ShareButton({ icon, label, sub, href }: { icon: React.ReactNode; label: string; sub: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="py-3.5 px-2 rounded-xl border flex flex-col items-center gap-2 transition hover:bg-[#FAF6EE]"
      style={{ background: '#FFFFFF', borderColor: dash.border, textDecoration: 'none' }}
    >
      <span className="inline-flex items-center justify-center">{icon}</span>
      <div className="font-semibold text-[12.5px]" style={{ color: dash.ink }}>{label}</div>
      <div className="text-[10px] tracking-[0.04em]" style={{ color: dash.muted }}>{sub}</div>
    </a>
  );
}
