'use client';

/**
 * ArrivalScreen — E0
 * First screen the attendee sees. Shows the event card preview + CTA.
 * Mobile: single-column stack. Desktop (lg+): two-column 60/40.
 */

import { useState } from 'react';
import { ShieldCheck, Sparkles, Clock, ArrowRight } from 'lucide-react';
import type { Zone } from '@/types/database';
import EventBrandStrip from './EventBrandStrip';
import EventCardPreview from './EventCardPreview';

function ReportButton({ eventId }: { eventId: string }) {
  const [state, setState] = useState<'idle' | 'sent' | 'error'>('idle');

  const handleReport = async () => {
    if (state !== 'idle') return;
    try {
      await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      setState('sent');
    } catch {
      setState('error');
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 10 }}>
      <button
        onClick={handleReport}
        disabled={state !== 'idle'}
        style={{
          fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#6B7A72',
          background: 'none', border: 'none', padding: 0,
          cursor: state === 'idle' ? 'pointer' : 'default', opacity: 0.7,
        }}
        title="Report this event"
      >
        {state === 'sent' ? 'Reported — thank you' : state === 'error' ? 'Could not report' : 'Report event'}
      </button>
    </div>
  );
}

interface Props {
  eventId: string;
  eventName: string;
  backgroundUrl: string;
  backgroundWidth: number;
  backgroundHeight: number;
  zones: Zone[];
  onStart: () => void;
}

export default function ArrivalScreen({
  eventId, eventName, backgroundUrl, backgroundWidth, backgroundHeight, zones, onStart,
}: Props) {
  // Pre-fill the arrival preview with zone placeholder values so the card looks
  // filled and real rather than showing raw zone outlines.
  const demoValues = Object.fromEntries(
    zones
      .filter(z => (z.type === 'text' || z.type === 'custom') && !z.hidden)
      .map(z => [z.id, z.placeholder ?? z.label ?? '']),
  );

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: '#FAF6EE', fontFamily: 'Inter, sans-serif', color: '#0F1F18' }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute" style={{
        width: 320, height: 320, top: 40, right: -80,
        borderRadius: '50%', background: '#E8EFEB',
        filter: 'blur(48px)', opacity: 0.9,
      }}/>
      <div className="pointer-events-none absolute" style={{
        width: 260, height: 260, bottom: -60, left: -60,
        borderRadius: '50%', background: 'rgba(232,197,126,0.32)',
        filter: 'blur(48px)',
      }}/>

      {/* ── Mobile / tablet: single column ───────────────────────────────── */}
      <div className="relative z-10 flex flex-col lg:hidden">
        {/* Top bar */}
        <div className="px-5 pt-5">
          <EventBrandStrip eventName={eventName} compact />
        </div>

        {/* Card hero */}
        <div className="mt-5 px-5 flex justify-center">
          <div
            className="w-full max-w-[320px]"
            style={{ animation: 'cardFloat 4s ease-in-out infinite' }}
          >
            <EventCardPreview
              backgroundUrl={backgroundUrl}
              backgroundWidth={backgroundWidth}
              backgroundHeight={backgroundHeight}
              zones={zones}
              values={demoValues}
              photoUrls={{}}
              style={{
                borderRadius: 18,
                boxShadow: '0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.12)',
              }}
            />
          </div>
        </div>

        {/* Copy */}
        <div className="mt-6 px-5">
          <h1 style={{
            fontFamily: 'DM Sans, sans-serif',
            fontWeight: 700, fontSize: 28, lineHeight: 1.15,
            letterSpacing: '-0.02em', margin: 0, color: '#0F1F18',
          }}>
            Get your personalized card
          </h1>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 15, lineHeight: 1.55,
            color: '#3A4A42', margin: '8px 0 0',
          }}>
            Add your name and photo. Download in seconds. Share anywhere.
          </p>
        </div>

        {/* Spacer */}
        <div className="flex-1" style={{ minHeight: 24 }}/>

        {/* CTA region */}
        <div className="px-5 pb-8 pt-4 flex flex-col gap-3 mt-auto">
          <button
            onClick={onStart}
            className="w-full flex items-center justify-center gap-2.5 transition-transform active:scale-[0.98]"
            style={{
              height: 56, padding: '0 24px',
              background: '#1F4D3A', color: '#FAF6EE',
              border: 'none', borderRadius: 14,
              fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 16,
              boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(31,77,58,0.18)',
              cursor: 'pointer',
            }}
          >
            <span>Create my card</span>
            <ArrowRight size={18} strokeWidth={2}/>
          </button>

          {/* Trust line */}
          <div className="flex items-center justify-center gap-3.5" style={{
            fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#6B7A72',
          }}>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={13} strokeWidth={2}/> Free
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={13} strokeWidth={2}/> No signup
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={13} strokeWidth={2}/> ~30 seconds
            </span>
          </div>

          <div style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 11, color: '#6B7A72',
            letterSpacing: '0.04em', textAlign: 'center',
          }}>
            powered by <span style={{ color: '#0F1F18', fontWeight: 500 }}>karta</span>
          </div>
        </div>
      </div>

      {/* ── Desktop: two-column ───────────────────────────────────────────── */}
      <div className="relative z-10 hidden lg:flex flex-col" style={{ minHeight: '100vh' }}>
        {/* Top bar */}
        <div className="px-10 pt-6 flex items-center justify-between gap-6">
          <div style={{ flex: '0 1 460px', minWidth: 0 }}>
            <EventBrandStrip eventName={eventName} compact />
          </div>
          <div style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: 11, color: '#6B7A72', letterSpacing: '0.04em',
          }}>
            powered by <span style={{ color: '#0F1F18', fontWeight: 500 }}>karta</span>
          </div>
        </div>

        {/* Main two-column grid */}
        <div
          className="flex-1 mx-auto w-full grid items-center"
          style={{
            maxWidth: 1200,
            padding: '0 40px',
            gridTemplateColumns: '60% 40%',
            gap: 56,
          }}
        >
          {/* Left: card hero */}
          <div className="flex items-center justify-center">
            <div
              style={{
                maxWidth: 480, width: '100%',
                animation: 'cardFloat 4s ease-in-out infinite',
              }}
            >
              <EventCardPreview
                backgroundUrl={backgroundUrl}
                backgroundWidth={backgroundWidth}
                backgroundHeight={backgroundHeight}
                zones={zones}
                values={{}}
                photoUrls={{}}
                style={{
                  borderRadius: 20,
                  boxShadow: '0 4px 12px rgba(15,31,24,0.08), 0 24px 60px rgba(31,77,58,0.12)',
                }}
              />
            </div>
          </div>

          {/* Right: copy + CTA */}
          <div className="flex flex-col gap-7" style={{ maxWidth: 420 }}>
            {/* Eyebrow badge */}
            <div className="inline-flex self-start items-center gap-2 px-3 py-1.5" style={{
              background: '#E8EFEB', color: '#1F4D3A', borderRadius: 999,
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1F4D3A' }}/>
              You&apos;re invited
            </div>

            <h1 style={{
              fontFamily: 'DM Sans, sans-serif',
              fontWeight: 700, fontSize: 52, lineHeight: 1.05,
              letterSpacing: '-0.03em', margin: 0, color: '#0F1F18',
            }}>
              Get your personalized card.
            </h1>

            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 19, lineHeight: 1.55,
              color: '#3A4A42', margin: 0, maxWidth: 380,
            }}>
              Add your name and photo. Download in seconds. Share anywhere your audience hangs out.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={onStart}
                className="inline-flex items-center gap-2.5 transition-transform active:scale-[0.98]"
                style={{
                  height: 56, padding: '0 24px',
                  background: '#1F4D3A', color: '#FAF6EE',
                  border: 'none', borderRadius: 14,
                  fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: 16,
                  boxShadow: '0 1px 2px rgba(15,31,24,0.04), 0 8px 24px rgba(31,77,58,0.18)',
                  cursor: 'pointer',
                }}
              >
                <span>Create my card</span>
                <ArrowRight size={18} strokeWidth={2}/>
              </button>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#6B7A72',
              }}>
                Free · No signup · ~30 seconds
              </div>
            </div>

            {/* Trust cards */}
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[
                { icon: <ShieldCheck size={16} strokeWidth={2}/>, title: 'Private', sub: 'Photo never leaves your browser' },
                { icon: <Sparkles size={16} strokeWidth={2}/>, title: 'Branded', sub: 'Matches the event design' },
                { icon: <Clock size={16} strokeWidth={2}/>, title: 'Fast', sub: 'Done in under a minute' },
              ].map((card) => (
                <div key={card.title} style={{
                  padding: '12px 12px 14px',
                  background: '#FFFFFF',
                  border: '1px solid #E5E0D4',
                  borderRadius: 12,
                }}>
                  <div style={{ color: '#1F4D3A', marginBottom: 6 }}>{card.icon}</div>
                  <div style={{
                    fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 13,
                    color: '#0F1F18', marginBottom: 2,
                  }}>{card.title}</div>
                  <div style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 12, lineHeight: 1.4, color: '#6B7A72',
                  }}>{card.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Abuse report — bottom-right, unobtrusive */}
      <ReportButton eventId={eventId} />

      <style>{`
        @keyframes cardFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
