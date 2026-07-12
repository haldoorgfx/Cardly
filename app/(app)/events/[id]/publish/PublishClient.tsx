'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';

/* ── Design tokens ─────────────────────────────────────────────── */
const PT = {
  primary: '#1F4D3A', primaryDark: '#163828', primarySoft: '#E8EFEB',
  accent: '#E8C57E', accentDark: '#C9A45E',
  ink: '#0F1F18', inkSoft: '#3A4A42', muted: '#6B7A72',
  cream: '#FAF6EE', surface: '#FFFFFF',
  border: '#E5E0D4', borderStrong: '#C9C3B1',
  success: '#2D7A4F',
};

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
  qr: (p?: { size?: number }) => (
    <Ico size={p?.size ?? 16}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><line x1="14" y1="14" x2="14" y2="17" /><line x1="14" y1="20" x2="17" y2="20" /><line x1="20" y1="14" x2="20" y2="17" /><line x1="17" y1="17" x2="20" y2="17" /><line x1="17" y1="20" x2="21" y2="20" /></Ico>
  ),
  refresh: (p?: { size?: number }) => (
    <Ico size={p?.size ?? 16}><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></Ico>
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

/** Draw the Eventera mark (forest tile + gold E on a white plate) into the
 *  centre of a QR PNG data URL and return the composited PNG. */
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
      const plate = size * 0.115;   // half-size of the white plate
      const mark = size * 0.16;     // forest tile side
      ctx.fillStyle = '#FFFFFF';
      roundRect(ctx, cx - plate, cy - plate, plate * 2, plate * 2, plate * 0.42); ctx.fill();
      ctx.fillStyle = '#1F4D3A';
      roundRect(ctx, cx - mark / 2, cy - mark / 2, mark, mark, mark * 0.24); ctx.fill();
      ctx.fillStyle = '#E8C57E';
      ctx.font = `700 ${mark * 0.62}px "DM Sans", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('E', cx, cy + mark * 0.04);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}

/** Inject the same Eventera mark into the centre of a QR SVG string so the SVG
 *  download carries the logo too. */
function injectMarkIntoSvg(svg: string): string {
  const m = svg.match(/viewBox="0 0 ([\d.]+) /);
  const vb = m ? parseFloat(m[1]) : 0;
  if (!vb) return svg;
  const c = vb / 2;
  const plate = vb * 0.115;
  const mark = vb * 0.16;
  const overlay =
    `<rect x="${c - plate}" y="${c - plate}" width="${plate * 2}" height="${plate * 2}" rx="${plate * 0.42}" fill="#FFFFFF"/>` +
    `<rect x="${c - mark / 2}" y="${c - mark / 2}" width="${mark}" height="${mark}" rx="${mark * 0.24}" fill="#1F4D3A"/>` +
    `<text x="${c}" y="${c}" font-family="DM Sans, system-ui, sans-serif" font-weight="700" font-size="${mark * 0.64}" fill="#E8C57E" text-anchor="middle" dominant-baseline="central">E</text>`;
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
      background: PT.cream,
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
          fontSize: 7.5, fontWeight: 700, color: PT.accent,
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4,
        }}>EVENT</div>
        <div style={{
          fontSize: 9, fontWeight: 700, color: PT.cream,
          lineHeight: 1.2, letterSpacing: '-0.01em',
        }}>{eventName.length > 28 ? eventName.slice(0, 28) + '…' : eventName}</div>
        {dateLabel && (
          <div style={{ fontSize: 7, color: 'rgba(250,246,238,0.7)', marginTop: 4 }}>{dateLabel}</div>
        )}
      </div>
      {/* Body */}
      <div style={{ flex: 1, padding: '10px 10px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {venueLabel && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 7, color: PT.inkSoft }}>
            <div style={{ color: PT.primary, flexShrink: 0 }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <span>{venueLabel.length > 24 ? venueLabel.slice(0, 24) + '…' : venueLabel}</span>
          </div>
        )}
        <div style={{ fontSize: 7, color: PT.muted, marginTop: 4, marginBottom: 2 }}>Registration details</div>
        {['Full name', 'Email address'].map(label => (
          <div key={label} style={{
            height: 20, borderRadius: 4,
            border: `1px solid ${PT.border}`,
            background: PT.surface,
            padding: '0 6px',
            display: 'flex', alignItems: 'center',
            fontSize: 7, color: PT.muted,
          }}>{label}</div>
        ))}
        <div style={{
          height: 20, borderRadius: 4,
          background: PT.primary,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 7.5, fontWeight: 700, color: PT.cream,
          marginTop: 4,
        }}>Register →</div>
      </div>
      <div style={{
        padding: '6px 10px',
        fontSize: 6, color: PT.muted,
        textAlign: 'center', letterSpacing: '0.04em',
      }}>powered by eventera</div>
    </div>
  );
}

/* ── Panel shell ───────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10,
      color: PT.muted, letterSpacing: '0.1em', textTransform: 'uppercase',
    }}>{children}</div>
  );
}

function Panel({ label, action, children }: {
  label: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      background: PT.surface, border: `1px solid ${PT.border}`,
      borderRadius: 10, padding: 18,
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <SectionLabel>{label}</SectionLabel>
        {action}
      </div>
      {children}
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
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [captionCopied, setCaptionCopied] = useState(false);
  const [captionIndex, setCaptionIndex] = useState(0);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrSvgString, setQrSvgString] = useState('');
  const [activeSize, setActiveSize] = useState<'mobile' | 'tablet' | 'custom'>('mobile');

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

  // Generate dynamic hashtags from event name
  const hashtagBase = eventName
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/).filter(w => w.length > 2)
    .map(w => `#${w.charAt(0).toUpperCase()}${w.slice(1).toLowerCase()}`)
    .slice(0, 3)
    .join(' ');
  const locationTag = venueName ? `#${venueName.split(/[\s,]+/)[0].replace(/[^a-zA-Z]/g, '')}` : '';
  const hashtags = [hashtagBase, locationTag, '#Eventera'].filter(Boolean).join(' ');

  // Captions – pick the best based on available data
  const captions = [
    dateRange && venueLabel
      ? `📅 ${dateRange}${venueLabel && !isOnline ? ` · ${venueLabel}` : ' · Online'}\n\nWe're hosting ${eventName} and we'd love to see you there. Reserve your spot now — limited seats available.\n\n👇 Register here:\n${shareUrl}\n\n${hashtags}`
      : `We're hosting ${eventName} and we'd love to see you there. Reserve your spot now — limited seats available.\n\n👇 Register here:\n${shareUrl}\n\n${hashtags}`,
    `🎉 ${eventName}${dateRange ? ` is happening on ${dateRange}` : ' is coming up'}${venueLabel && !isOnline ? ` at ${venueLabel}` : isOnline ? ' — join us online' : ''}.\n\nSecure your free spot before it fills up.\n\n🔗 ${shareUrl}\n\n${hashtags}`,
    `Save the date! ${eventName}${dateRange ? ` · ${dateRange}` : ''}${venueLabel && !isOnline ? ` · ${venueLabel}` : ''}.\n\nClick the link to register:\n${shareUrl}\n\n${hashtags}`,
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
      router.refresh();
    } catch {
      setPublishError('Failed to publish. Please try again.');
      setPublishing(false);
    }
  }, [eventId, router]);

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
    <div style={{ background: PT.cream, fontFamily: 'Inter, sans-serif', color: PT.ink }}>

      {/* ── Draft banner ────────────────────────────────────────────── */}
      {!isPublished && (
        <div style={{
          background: PT.surface, borderBottom: `1px solid ${PT.border}`,
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 15, color: PT.ink }}>
              This event is not yet published.
            </div>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: PT.muted, marginTop: 2 }}>
              Publish it to make the link live and start accepting registrations.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {publishError && (
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#B8423C' }}>{publishError}</span>
            )}
            <button
              onClick={handlePublish}
              disabled={publishing}
              style={{
                height: 40, padding: '0 20px',
                background: PT.primary, color: PT.cream,
                border: 'none', borderRadius: 8,
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13.5,
                cursor: publishing ? 'not-allowed' : 'pointer',
                opacity: publishing ? 0.7 : 1,
                display: 'inline-flex', alignItems: 'center', gap: 6,
                transition: 'opacity 0.15s',
              }}
            >
              {publishing ? 'Publishing…' : 'Publish now'}
            </button>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-8" style={{
        maxWidth: 1100, width: '100%', margin: '0 auto',
        paddingTop: 8, paddingBottom: 48,
        display: 'flex', flexDirection: 'column', gap: 20,
      }}>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div style={{
          padding: '40px 32px 24px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
          textAlign: 'center',
        }}>
          <div style={{ position: 'relative', width: 60, height: 60, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: `2px solid ${PT.accent}`, opacity: 0.55 }} />
            <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: `1px solid ${PT.accent}`, opacity: 0.25 }} />
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: PT.primary, color: PT.accent,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(31,77,58,0.35)',
            }}>
              {I.check({ size: 28, sw: 2.6 })}
            </div>
          </div>

          <div>
            <div style={{
              fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11,
              color: PT.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8,
            }}>{isPublished ? 'Your event is live' : 'Ready when you are'}</div>
            <h1 style={{
              fontFamily: 'DM Sans, sans-serif', fontWeight: 700,
              fontSize: 32, lineHeight: 1.1, letterSpacing: '-0.025em',
              margin: 0, color: PT.ink, maxWidth: 720,
            }}>{eventName} {isPublished ? 'is live.' : 'isn’t published yet.'}</h1>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', rowGap: 6,
              marginTop: 10, fontFamily: 'Inter, sans-serif', fontSize: 14, color: PT.inkSoft,
            }}>
              {ticketCount > 0 && (
                <>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: PT.primary, display: 'block' }} />
                    <span>{ticketCount} ticket type{ticketCount !== 1 ? 's' : ''}</span>
                  </span>
                  <span style={{ color: PT.borderStrong }}>·</span>
                </>
              )}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: isPublished ? PT.success : PT.muted, display: 'block' }} />
                <span>{isPublished ? 'Open for registration' : 'Not open for registration yet'}</span>
              </span>
              {dateRange && (
                <>
                  <span style={{ color: PT.borderStrong }}>·</span>
                  <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12, color: PT.muted }}>{dateRange}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats strip ──────────────────────────────────────────── */}
        <div style={{
          background: PT.surface, border: `1px solid ${PT.border}`,
          borderRadius: 10, padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', rowGap: 12,
        }}>
          <StatItem label="Page views" value={String(viewCount)} sub="all-time" />
          <div className="hidden sm:block" style={{ width: 1, height: 32, background: PT.border, flexShrink: 0 }} />
          <StatItem label="Registrations" value={String(registrationCount)} sub="confirmed" />
          <div className="hidden sm:block" style={{ width: 1, height: 32, background: PT.border, flexShrink: 0 }} />
          <StatItem label="Ticket types" value={String(ticketCount)} sub="active" />
          <div style={{ flex: 1 }} />
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
            background: PT.cream, border: `1px solid ${PT.border}`, borderRadius: 999,
            fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10, color: PT.muted, letterSpacing: '0.04em',
          }}>
            {I.refresh({ size: 11 })}
            <span>as of page load</span>
          </div>
        </div>

        {/* ── Share + QR row ───────────────────────────────────────── */}
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>

          {/* Share link panel */}
          <Panel label="Share link" action={
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10, color: PT.muted, letterSpacing: '0.04em',
            }}>
              {I.link({ size: 11 })}
              <span>public · no login required</span>
            </span>
          }>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{
                flex: 1, minWidth: 0,
                display: 'flex', alignItems: 'stretch',
                border: `1px solid ${PT.border}`, borderRadius: 6, overflow: 'hidden',
              }}>
                <div style={{
                  flex: 1, minWidth: 0, padding: '0 12px',
                  display: 'flex', alignItems: 'center',
                  background: PT.cream, borderRight: `1px solid ${PT.border}`,
                }}>
                  <span style={{
                    fontFamily: 'Inter, system-ui, sans-serif', fontSize: 12.5,
                    color: PT.ink, fontWeight: 500,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
                  }}>{shareUrl}</span>
                </div>
                <button
                  onClick={handleCopy}
                  style={{
                    padding: '0 16px', height: 44,
                    background: copied ? PT.primarySoft : PT.surface,
                    color: copied ? PT.primary : PT.ink,
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    flexShrink: 0, transition: 'background 0.15s',
                  }}
                >
                  {copied ? I.check({ size: 14 }) : I.copy({ size: 14 })}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <a
                href={shareUrl} target="_blank" rel="noopener noreferrer"
                style={{
                  height: 44, padding: '0 16px',
                  background: PT.primary, color: PT.cream,
                  border: 'none', borderRadius: 6,
                  fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  flexShrink: 0, textDecoration: 'none', transition: 'background 0.15s',
                }}
              >
                {I.external({ size: 14 })}
                <span>Visit</span>
              </a>
            </div>

            <div>
              <div style={{
                fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10,
                color: PT.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
              }}>Share to</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                <ShareButton
                  icon={Brand.whatsapp(18)} label="WhatsApp" sub="Group chat"
                  href={`https://wa.me/?text=${encodeURIComponent(caption)}`}
                />
                <ShareButton
                  icon={Brand.x(18)} label="X" sub="Compose"
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${caption} ${shareUrl}`)}`}
                />
                <ShareButton
                  icon={Brand.linkedin(18)} label="LinkedIn" sub="Post"
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                />
                <ShareButton
                  icon={Brand.email(18)} label="Email" sub="Compose"
                  href={`mailto:?subject=${encodeURIComponent(`You're invited: ${eventName}`)}&body=${encodeURIComponent(`${caption}\n\nRegister here: ${shareUrl}`)}`}
                />
              </div>
            </div>

            <div style={{
              background: PT.cream, border: `1px solid ${PT.border}`,
              borderRadius: 8, padding: '12px 14px',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10,
                    color: PT.muted, letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>Caption</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {captions.map((_, i) => (
                      <button key={i} onClick={() => setCaptionIndex(i)} style={{
                        width: 22, height: 22, borderRadius: 4,
                        background: captionIndex === i ? PT.primary : PT.surface,
                        color: captionIndex === i ? PT.cream : PT.muted,
                        border: `1px solid ${captionIndex === i ? PT.primary : PT.border}`,
                        cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      }}>{i + 1}</button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleCaptionCopy}
                  style={{
                    background: 'transparent', border: 'none', cursor: 'pointer', color: PT.primary,
                    fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
                    display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0,
                  }}
                >
                  {captionCopied ? I.check({ size: 12 }) : I.copy({ size: 12 })}
                  <span>{captionCopied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, lineHeight: 1.6, color: PT.ink, whiteSpace: 'pre-line' }}>
                {caption}
              </div>
            </div>
          </Panel>

          {/* QR code panel */}
          <Panel label="QR code" action={
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10, color: PT.muted, letterSpacing: '0.04em',
            }}>
              {I.qr({ size: 11 })}
              <span>1024 × 1024</span>
            </span>
          }>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 10px' }}>
              <div style={{
                padding: 14, background: PT.surface,
                border: `1px solid ${PT.border}`, borderRadius: 12,
                position: 'relative', display: 'inline-flex',
              }}>
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="QR code" width={192} height={192} style={{ display: 'block', borderRadius: 4 }} />
                ) : (
                  <div style={{
                    width: 192, height: 192, borderRadius: 4,
                    background: '#F0EDE8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11, color: PT.muted }}>generating…</span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleDownloadQR}
                disabled={!qrDataUrl}
                style={{
                  flex: 1, height: 40, padding: '0 14px',
                  background: PT.primary, color: PT.cream,
                  border: 'none', borderRadius: 6,
                  fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  cursor: qrDataUrl ? 'pointer' : 'not-allowed', opacity: qrDataUrl ? 1 : 0.5,
                }}
              >
                {I.download({ size: 14 })}
                <span>Download PNG</span>
              </button>
              <button
                onClick={handleDownloadSVG}
                disabled={!qrSvgString}
                style={{
                  height: 40, padding: '0 14px',
                  background: PT.surface, color: PT.ink,
                  border: `1px solid ${PT.border}`, borderRadius: 6,
                  fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  cursor: qrSvgString ? 'pointer' : 'not-allowed', opacity: qrSvgString ? 1 : 0.5,
                }}
              >
                <span>SVG</span>
              </button>
            </div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 12, lineHeight: 1.5,
              color: PT.muted, textAlign: 'center',
            }}>Print on posters, flyers, or badges. Scanning opens the registration page.</div>
          </Panel>
        </div>

        {/* ── Embed block ───────────────────────────────────────────── */}
        <Panel label="Embed in your site" action={
          <button
            onClick={handleEmbedCopy}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer', color: PT.primary,
              fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0,
            }}
          >
            {embedCopied ? I.check({ size: 12 }) : I.copy({ size: 12 })}
            <span>{embedCopied ? 'Copied!' : 'Copy snippet'}</span>
          </button>
        }>
          <div style={{ background: PT.ink, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
              borderBottom: '1px solid rgba(250,246,238,0.08)',
            }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF5F57', display: 'block' }} />
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#FEBC2E', display: 'block' }} />
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#28C840', display: 'block' }} />
              <span style={{
                marginLeft: 8, fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10,
                color: 'rgba(250,246,238,0.55)', letterSpacing: '0.04em',
              }}>embed.html · html</span>
            </div>
            <pre style={{
              margin: 0, padding: '14px 16px',
              fontFamily: 'JetBrains Mono, Menlo, monospace', fontSize: 12, lineHeight: 1.65,
              color: PT.cream, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
            }}>
              <span style={{ color: '#9EC6B2' }}>{'<iframe'}</span>{' '}
              <span style={{ color: '#E8C57E' }}>src</span><span style={{ color: 'rgba(250,246,238,0.45)' }}>=</span><span style={{ color: '#F0E0BB' }}>&quot;{shareUrl}&quot;</span>{'\n        '}
              <span style={{ color: '#E8C57E' }}>width</span><span style={{ color: 'rgba(250,246,238,0.45)' }}>=</span><span style={{ color: '#F0E0BB' }}>&quot;{sz.w}&quot;</span>{' '}
              <span style={{ color: '#E8C57E' }}>height</span><span style={{ color: 'rgba(250,246,238,0.45)' }}>=</span><span style={{ color: '#F0E0BB' }}>&quot;{sz.h}&quot;</span>{'\n        '}
              <span style={{ color: '#E8C57E' }}>frameborder</span><span style={{ color: 'rgba(250,246,238,0.45)' }}>=</span><span style={{ color: '#F0E0BB' }}>&quot;0&quot;</span>
              <span style={{ color: '#9EC6B2' }}>{'></iframe>'}</span>
            </pre>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {([
              { id: 'mobile' as const, label: 'Mobile', size: '375 × 812' },
              { id: 'tablet' as const, label: 'Tablet', size: '768 × 1024' },
              { id: 'custom' as const, label: 'Custom', size: 'responsive' },
            ]).map(chip => (
              <button
                key={chip.id}
                onClick={() => setActiveSize(chip.id)}
                style={{
                  padding: '8px 10px',
                  background: activeSize === chip.id ? PT.primarySoft : PT.surface,
                  border: `1px solid ${activeSize === chip.id ? 'rgba(31,77,58,0.2)' : PT.border}`,
                  borderRadius: 6, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
                }}
              >
                <div style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
                  color: activeSize === chip.id ? PT.primary : PT.ink,
                }}>{chip.label}</div>
                <div style={{
                  fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10,
                  color: PT.muted, letterSpacing: '0.04em',
                }}>{chip.size}</div>
              </button>
            ))}
          </div>
        </Panel>

        {/* ── Preview + Next steps row ──────────────────────────────── */}
        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>

          {/* Attendee preview panel */}
          <Panel label="What attendees see" action={
            <a
              href={shareUrl} target="_blank" rel="noopener noreferrer"
              style={{
                color: PT.primary, fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
                display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none',
              }}
            >
              {I.external({ size: 12 })}
              <span>Open page</span>
            </a>
          }>
            <div style={{
              background: PT.cream, border: `1px solid ${PT.border}`,
              borderRadius: 10, padding: '20px 16px',
              display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
            }}>
              <div style={{
                width: 158,
                background: '#0F1218',
                borderRadius: 24, padding: '0 5px',
                boxShadow: '0 16px 48px rgba(15,31,24,0.28), inset 0 0 0 1px rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column',
              }}>
                <div style={{
                  height: 28, display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', padding: '0 14px',
                }}>
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

                <div style={{
                  width: '100%', height: 260,
                  borderRadius: 6, overflow: 'hidden',
                  position: 'relative', background: PT.cream,
                }}>
                  <RegistrationPreview
                    eventName={eventName}
                    dateLabel={dateRange}
                    venueLabel={venueLabel}
                  />
                </div>

                <div style={{ height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 44, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.25)' }} />
                </div>
              </div>
            </div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 12, color: PT.muted,
              textAlign: 'center', lineHeight: 1.5,
            }}>Attendees open the link, fill in their details, and register in seconds.</div>
          </Panel>

          {/* Next steps panel */}
          <Panel label="What happens next">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { n: 1, t: 'Share the link', d: 'Send via WhatsApp, post to your channels, print the QR on flyers — attendees open it on any device.' },
                { n: 2, t: 'Attendees register', d: 'They fill in their name, email, and any custom fields you set up. No account needed.' },
                { n: 3, t: 'You see it live', d: 'Every registration appears in your dashboard instantly. Check in attendees at the door with the QR scanner.' },
              ].map(s => (
                <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: PT.primary, color: PT.cream,
                    fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 13,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>{s.n}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14, color: PT.ink, lineHeight: 1.3 }}>{s.t}</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, lineHeight: 1.5, color: PT.inkSoft, marginTop: 2 }}>{s.d}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, paddingTop: 14, borderTop: `1px solid ${PT.border}` }}>
              <Link
                href={`/events/${slug}`}
                style={{
                  display: 'flex', width: '100%', height: 44,
                  background: PT.cream, color: PT.primary,
                  border: `1px solid rgba(31,77,58,0.25)`, borderRadius: 6,
                  fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 13.5,
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                  cursor: 'pointer', textDecoration: 'none',
                }}
              >
                {I.chart({ size: 15, sw: 2 })}
                <span>View event dashboard</span>
                {I.arrowRight({ size: 14 })}
              </Link>
            </div>
          </Panel>
        </div>

        {/* ── Footer microcopy ─────────────────────────────────────── */}
        <div style={{
          marginTop: 8, padding: '14px 0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10, color: PT.muted, letterSpacing: '0.04em',
        }}>
          <span>powered by <span style={{ color: PT.ink, fontWeight: 500 }}>eventera</span></span>
          <span>event id · {slug}</span>
        </div>

      </div>
    </div>
  );
}

/* ── Share button ──────────────────────────────────────────────── */
function ShareButton({ icon, label, sub, href }: { icon: React.ReactNode; label: string; sub: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      padding: '10px 8px', background: PT.surface, border: `1px solid ${PT.border}`,
      borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      cursor: 'pointer', textDecoration: 'none',
    }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: PT.cream, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 12, color: PT.ink }}>{label}</div>
      <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 9.5, color: PT.muted, letterSpacing: '0.04em' }}>{sub}</div>
    </a>
  );
}

/* ── Stat item ─────────────────────────────────────────────────── */
function StatItem({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div style={{
        fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10, color: PT.muted,
        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4,
      }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontWeight: 700, fontSize: 22, color: PT.ink, letterSpacing: '-0.02em' }}>{value}</span>
        <span style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10, color: PT.muted, letterSpacing: '0.04em' }}>{sub}</span>
      </div>
    </div>
  );
}
