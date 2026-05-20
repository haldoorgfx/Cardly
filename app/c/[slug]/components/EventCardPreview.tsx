'use client';

/**
 * EventCardPreview — renders the real event background + zone overlays.
 * Used on every screen to show a live preview of the attendee's personalised card.
 *
 * All zone positions are stored in absolute pixels (relative to the background image).
 * We convert them to percentages so the preview scales to any container width.
 */

import { useRef, useEffect, useLayoutEffect, useState, type CSSProperties } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import type { Zone } from '@/types/database';

interface Props {
  /** Full URL of the event background image */
  backgroundUrl: string;
  backgroundWidth: number;
  backgroundHeight: number;
  zones: Zone[];
  /** Current text values keyed by zoneId */
  values: Record<string, string>;
  /** Cropped photo object-URLs keyed by zoneId */
  photoUrls: Record<string, string>;
  /** className applied to the outer wrapper div */
  className?: string;
  style?: CSSProperties;
}

const SYSTEM_FONTS = new Set([
  'georgia', 'times new roman', 'times', 'arial', 'helvetica',
  'verdana', 'trebuchet ms', 'courier new', 'courier',
  'sans-serif', 'serif', 'monospace',
]);

/** Shape radius/clip helpers */
function shapeStyles(zone: Zone, shortDim: number): { borderRadius: string; clipPath?: string } {
  if (zone.shape === 'circle')  return { borderRadius: '50%' };
  if (zone.shape === 'rounded') {
    const r = ((zone.cornerRadius ?? 18) / 100) * shortDim;
    return { borderRadius: `${r}px` };
  }
  if (zone.shape === 'hexagon') {
    return {
      borderRadius: '0',
      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
    };
  }
  return { borderRadius: '6px' };
}

export default function EventCardPreview({
  backgroundUrl, backgroundWidth, backgroundHeight,
  zones, values, photoUrls,
  className = '', style,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(300);

  // Track container width for font scaling
  useEffect(() => {
    const update = () => {
      if (containerRef.current) setContainerW(containerRef.current.offsetWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Load Google Fonts for any non-system font used in zones
  useEffect(() => {
    const families = new Map<string, Set<number>>();
    for (const z of zones) {
      if (!z.font || SYSTEM_FONTS.has(z.font.toLowerCase())) continue;
      if (!families.has(z.font)) families.set(z.font, new Set());
      families.get(z.font)!.add(z.weight ?? 400);
    }
    if (!families.size) return;
    const id = 'karta-preview-gfonts';
    if (document.getElementById(id)) return;
    const params = Array.from(families.entries())
      .map(([f, ws]) => `family=${f.replace(/\s+/g, '+')}:wght@${Array.from(ws).sort().join(';')}`)
      .join('&');
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${params}&display=swap`;
    document.head.appendChild(link);
  }, [zones]);

  const scale = containerW / backgroundWidth;

  // Hidden measurement spans for text overflow calculation
  const measureRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const [measuredHeights, setMeasuredHeights] = useState<Record<string, number>>({});

  useLayoutEffect(() => {
    const h: Record<string, number> = {};
    let changed = false;
    for (const [id, el] of Object.entries(measureRefs.current)) {
      if (el) {
        const v = el.offsetHeight;
        h[id] = v;
        if (v !== (measuredHeights[id] ?? 0)) changed = true;
      }
    }
    if (changed) setMeasuredHeights(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, containerW]);

  /** Vertical offset accumulated by text zones above this one that have expanded */
  function getAccumulatedOffset(z: Zone): number {
    let off = 0;
    for (const tz of zones) {
      if (tz.type !== 'text' && tz.type !== 'custom') continue;
      if (tz.id === z.id) continue;
      if (tz.y + tz.h <= z.y) {
        const mh = measuredHeights[tz.id];
        if (mh) off += Math.max(0, mh / scale - tz.h);
      }
    }
    return off;
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden w-full ${className}`}
      style={{ aspectRatio: `${backgroundWidth}/${backgroundHeight}`, ...style }}
    >
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={backgroundUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Zone overlays */}
      {zones.map(zone => {
        if (zone.hidden) return null;

        const accOff = getAccumulatedOffset(zone);
        const left   = (zone.x / backgroundWidth) * 100;
        const top    = ((zone.y + accOff) / backgroundHeight) * 100;
        const width  = (zone.w / backgroundWidth) * 100;
        const height = (zone.h / backgroundHeight) * 100;

        /* ── Photo zone ─────────────────────────────────────────────────── */
        if (zone.type === 'photo') {
          const shortDim = Math.min(zone.w, zone.h) * scale;
          const { borderRadius, clipPath } = shapeStyles(zone, shortDim);
          const url = photoUrls[zone.id];
          const iconSize = Math.max(16, shortDim * 0.28);

          return (
            <div
              key={zone.id}
              className="absolute pointer-events-none overflow-hidden"
              style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, borderRadius, clipPath }}
            >
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ background: '#EDE9E0' }}>
                  <ImageIcon size={iconSize} strokeWidth={1.3} color="rgba(107,122,114,0.55)" />
                </div>
              )}
            </div>
          );
        }

        /* ── Shape / image / label zones → static, no attendee input ───── */
        if (zone.type === 'shape' || zone.type === 'image') return null;

        if (zone.type === 'label') {
          const txt = zone.sample || zone.placeholder || '';
          if (!txt) return null;
          const jc = zone.verticalAlign === 'bottom' ? 'flex-end'
            : zone.verticalAlign === 'center' ? 'center' : 'flex-start';
          return (
            <div
              key={zone.id}
              className="absolute overflow-hidden pointer-events-none"
              style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, display: 'flex', flexDirection: 'column', justifyContent: jc }}
            >
              <span style={{
                display: 'block',
                fontFamily: zone.font, fontWeight: zone.weight,
                fontSize: `${(zone.size ?? 32) * scale}px`,
                color: zone.color, lineHeight: zone.lineHeight ?? 1.2,
                textAlign: zone.align, wordBreak: 'break-word',
                letterSpacing: zone.letterSpacing ? `${zone.letterSpacing * scale}px` : undefined,
                textTransform: zone.textTransform as CSSProperties['textTransform'],
              }}>{txt}</span>
            </div>
          );
        }

        /* ── Text / custom zone ─────────────────────────────────────────── */
        const typed  = values[zone.id] ?? '';
        const ghost  = zone.sample || zone.placeholder || zone.label || '';
        const jc     = zone.verticalAlign === 'bottom' ? 'flex-end'
          : zone.verticalAlign === 'center' ? 'center' : 'flex-start';

        const textStyle: CSSProperties = {
          display: 'block',
          fontFamily: zone.font,
          fontWeight: zone.weight,
          fontSize: `${(zone.size ?? 32) * scale}px`,
          color: zone.color ?? '#FFFFFF',
          lineHeight: zone.lineHeight ?? 1.2,
          textAlign: zone.align,
          letterSpacing: zone.letterSpacing ? `${zone.letterSpacing * scale}px` : undefined,
          textTransform: zone.textTransform as CSSProperties['textTransform'],
          WebkitTextStroke: (zone.strokeColor && (zone.strokeWidth ?? 0) > 0)
            ? `${(zone.strokeWidth ?? 0) * scale}px ${zone.strokeColor}` : undefined,
          textShadow: (zone.shadowColor && (zone.shadowBlur ?? 0) > 0)
            ? `${(zone.shadowX ?? 0) * scale}px ${(zone.shadowY ?? 0) * scale}px ${(zone.shadowBlur ?? 0) * scale}px ${zone.shadowColor}` : undefined,
          opacity: typed ? 1 : 0.38,
          wordBreak: 'break-word',
        };

        return (
          <div
            key={zone.id}
            className="absolute pointer-events-none"
            style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, minHeight: `${height}%`, display: 'flex', flexDirection: 'column', justifyContent: jc }}
          >
            <span style={textStyle}>{typed || ghost}</span>
          </div>
        );
      })}

      {/* Hidden measurement spans — used to detect text overflow */}
      <div style={{ position: 'fixed', top: -9999, left: -9999, visibility: 'hidden', pointerEvents: 'none' }}>
        {zones.filter(z => z.type === 'text' || z.type === 'custom').map(z => {
          const sw = Math.round((z.w / backgroundWidth) * containerW);
          const val = values[z.id] || z.sample || z.placeholder || '';
          return (
            <span
              key={z.id}
              ref={el => { measureRefs.current[z.id] = el; }}
              style={{
                display: 'block', width: `${sw}px`,
                fontFamily: z.font, fontWeight: z.weight ?? 700,
                fontSize: `${(z.size ?? 32) * scale}px`,
                lineHeight: z.lineHeight ?? 1.2,
                letterSpacing: z.letterSpacing ? `${z.letterSpacing * scale}px` : undefined,
                textTransform: z.textTransform as CSSProperties['textTransform'],
                wordBreak: 'break-word', whiteSpace: 'pre-wrap',
              }}
            >{val}</span>
          );
        })}
      </div>
    </div>
  );
}
