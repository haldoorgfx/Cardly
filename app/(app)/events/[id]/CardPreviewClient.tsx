'use client';

import { useRef, useState, useEffect } from 'react';
import type { Zone } from '@/types/database';

interface Props {
  backgroundUrl: string;
  bgW: number;
  bgH: number;
  zones: Zone[];
  eventName: string;
  maxHeight?: number;
}

export default function CardPreviewClient({ backgroundUrl, bgW, bgH, zones, eventName, maxHeight = 460 }: Props) {
  // Measure the outer wrapper to get available width
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [availableW, setAvailableW] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      if (wrapperRef.current) setAvailableW(wrapperRef.current.offsetWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  // Compute exact rendered dimensions — no black bars
  const aspectRatio = bgW / bgH;
  const displayW = availableW
    ? Math.min(availableW, maxHeight * aspectRatio)
    : null;
  const displayH = displayW ? displayW / aspectRatio : null;

  // Scale factor: canvas pixels → rendered pixels
  const scale = displayW ? displayW / bgW : null;

  return (
    // Outer wrapper: full width, just used for measurement
    <div ref={wrapperRef} className="w-full flex justify-center">
      {/* Inner card: exactly the right size — no bars */}
      <div
        className="relative overflow-hidden"
        style={{
          width: displayW ?? '100%',
          height: displayH ?? 'auto',
          aspectRatio: displayW ? undefined : `${bgW}/${bgH}`,
          maxHeight,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={backgroundUrl} alt={eventName} className="w-full h-full object-fill" />

        {scale !== null && zones.map(z => {
          const left   = (z.x / bgW) * 100;
          const top    = (z.y / bgH) * 100;
          const width  = (z.w / bgW) * 100;
          const height = (z.h / bgH) * 100;

          if (z.type === 'photo') {
            const br = z.shape === 'circle' ? '50%' : z.shape === 'rounded' ? '20%' : '4px';
            return (
              <div
                key={z.id}
                className="absolute"
                style={{
                  left: `${left}%`, top: `${top}%`,
                  width: `${width}%`, height: `${height}%`,
                  outline: '1.5px dashed rgba(31,77,58,0.85)',
                  borderRadius: br,
                }}
              />
            );
          }

          if (z.type === 'shape' || z.type === 'image') {
            return (
              <div
                key={z.id}
                className="absolute"
                style={{
                  left: `${left}%`, top: `${top}%`,
                  width: `${width}%`, height: `${height}%`,
                  outline: '1.5px dashed rgba(31,77,58,0.5)',
                }}
              />
            );
          }

          // Text / custom / label — show sample or placeholder text
          const displayVal = z.sample || z.placeholder || z.label || '';
          if (!displayVal) return null;

          const va = z.verticalAlign ?? 'top';
          const jc = va === 'bottom' ? 'flex-end' : va === 'center' ? 'center' : 'flex-start';

          return (
            <div
              key={z.id}
              className="absolute overflow-hidden"
              style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`,
                display: 'flex', flexDirection: 'column', justifyContent: jc }}
            >
              <span style={{
                display: 'block',
                fontFamily: z.font ?? 'DM Sans, sans-serif',
                fontWeight: z.weight ?? 700,
                fontSize: `${(z.size ?? 32) * (scale ?? 1)}px`,
                color: z.color ?? '#FFFFFF',
                lineHeight: z.lineHeight ?? 1.2,
                textAlign: z.align ?? 'center',
                wordBreak: 'break-word',
                letterSpacing: z.letterSpacing ? `${z.letterSpacing * (scale ?? 1)}px` : undefined,
                textTransform: z.textTransform as 'none' | 'uppercase' | 'lowercase' | undefined,
                WebkitTextStroke: (z.strokeColor && (z.strokeWidth ?? 0) > 0)
                  ? `${(z.strokeWidth ?? 0) * (scale ?? 1)}px ${z.strokeColor}` : undefined,
                textShadow: (z.shadowColor && (z.shadowBlur ?? 0) > 0)
                  ? `${(z.shadowX ?? 0) * (scale ?? 1)}px ${(z.shadowY ?? 0) * (scale ?? 1)}px ${(z.shadowBlur ?? 0) * (scale ?? 1)}px ${z.shadowColor}` : undefined,
                // Ghost styling for text/custom zones (not labels — those are always solid)
                opacity: z.type === 'label' ? 1 : 0.7,
              }}>
                {displayVal}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
