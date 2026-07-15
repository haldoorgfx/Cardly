'use client';
import { PoweredByInline } from '@/components/white-label/attendee-brand';

import { useEffect, useRef } from 'react';
import { Download } from 'lucide-react';

interface Props {
  eventName: string;
  attendeeName?: string;
  outputUrl: string;
  createdAt: string;
}

function useConfetti(stageRef: { current: HTMLDivElement | null }) {
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const colors = ['#E8C57E', '#C9A45E', '#1F4D3A', '#2D7A4F', '#F5E9CC'];
    const pieces: HTMLDivElement[] = [];
    for (let i = 0; i < 28; i++) {
      const c = document.createElement('div');
      c.style.cssText = `
        position:absolute;width:8px;height:8px;top:-20px;opacity:0;z-index:0;pointer-events:none;
        left:${15 + Math.random() * 70}%;
        background:${colors[i % colors.length]};
        border-radius:${Math.random() > 0.5 ? '50%' : '1px'};
      `;
      const dur = 2600 + Math.random() * 1800;
      const delay = Math.random() * 600;
      const x = (Math.random() * 2 - 1) * 120;
      const h = stage.offsetHeight * 0.7;
      c.animate(
        [
          { transform: 'translate(0,0) rotate(0)', opacity: 1 },
          { transform: `translate(${x}px,${h}px) rotate(${Math.random() * 540}deg)`, opacity: 0 },
        ],
        { duration: dur, delay, easing: 'cubic-bezier(.2,.6,.4,1)', fill: 'forwards' },
      );
      stage.appendChild(c);
      pieces.push(c);
    }
    return () => { pieces.forEach(p => p.remove()); };
  }, [stageRef]);
}

export default function CardRedownload({ eventName, attendeeName, outputUrl, createdAt }: Props) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  useConfetti(stageRef);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href     = outputUrl;
    a.download = `${eventName.toLowerCase().replace(/\s+/g, '-')}-card.png`;
    a.click();
  };

  const date = new Date(createdAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const keyframes = `
    @keyframes breathe  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.02)} }
    @keyframes cardIn   { from{opacity:0;transform:translateY(14px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
    @keyframes dotPulse { 0%,100%{box-shadow:0 0 0 3px rgba(232,197,126,0.25)} 50%{box-shadow:0 0 0 6px rgba(232,197,126,0.15)} }
  `;

  return (
    <div
      ref={stageRef}
      style={{
        position: 'relative', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px', overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif', color: '#0F1F18', background: '#FAF6EE',
      }}
    >
      <style>{keyframes}</style>

      {/* Gold atmosphere */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 55% 45% at 50% 42%, rgba(232,197,126,0.30) 0%, transparent 60%),
          radial-gradient(ellipse 70% 60% at 50% 60%, rgba(31,77,58,0.16) 0%, transparent 65%)
        `,
      }}/>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

        {/* Kicker */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontWeight: 500, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: '#C9A45E', marginBottom: 32,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#E8C57E',
            boxShadow: '0 0 0 4px rgba(232,197,126,0.25)',
            animation: 'dotPulse 2s ease-in-out infinite',
            display: 'inline-block',
          }}/>
          {attendeeName ? `${attendeeName}'s card` : 'Your card · Saved'}
        </div>

        {/* Card with breathe + glow */}
        <div style={{ animation: 'breathe 3.4s ease-in-out infinite', animationDelay: '0.4s' }}>
          <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', animation: 'cardIn 500ms ease-out both' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={outputUrl}
              alt={`${attendeeName ?? 'Your'} personalized card for ${eventName}`}
              style={{
                display: 'block',
                width: 'min(300px, calc(100vw - 80px))',
                objectFit: 'cover',
                borderRadius: 16,
                boxShadow: '0 18px 50px rgba(13,31,23,0.35)',
              }}
            />
            {/* Guilloche */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none', opacity: 0.5,
              backgroundImage: 'repeating-linear-gradient(115deg, rgba(232,197,126,0.05) 0 2px, transparent 2px 9px)',
            }}/>
          </div>
        </div>

        {/* Event + date */}
        <p style={{
          margin: '24px 0 0', fontSize: 12, color: '#6B7A72', textAlign: 'center', lineHeight: 1.5,
        }}>
          {eventName} · {date}
        </p>

        {/* Download */}
        <button
          onClick={handleDownload}
          style={{
            marginTop: 32, width: '100%', height: 52,
            background: '#1F4D3A', color: '#FAF6EE',
            border: 'none', borderRadius: 12,
            fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 16,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 12px 32px rgba(31,77,58,0.22)',
            transition: 'background .15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#163828'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1F4D3A'; }}
        >
          <Download size={18} strokeWidth={2.2}/> Download card
        </button>

        <p style={{
          marginTop: 24, fontSize: 11, color: '#6B7A72', textAlign: 'center',
          letterSpacing: '0.04em',
        }}>
          <PoweredByInline />
        </p>
      </div>
    </div>
  );
}
