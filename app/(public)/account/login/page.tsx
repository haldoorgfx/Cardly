import { Suspense } from 'react';
import type { Metadata } from 'next';
import AttendeeAuth from '@/components/account/AttendeeAuth';

export const metadata: Metadata = { title: 'Sign in' };

export default function AttendeeLoginPage() {
  return (
    <div className="grid min-h-screen" style={{ gridTemplateColumns: '1fr 1fr' }}>
      {/* ── Brand panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#163828' }}
      >
        {/* Mesh overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 30% 60%, rgba(232,197,126,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Wordmark */}
        <div className="relative z-10 font-semibold text-[22px]" style={{ fontFamily: '"DM Sans", sans-serif', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
          Kart<span style={{ color: '#E8C57E' }}>a</span>
        </div>

        {/* Pitch */}
        <div className="relative z-10">
          <h2 className="font-normal text-[34px] text-white max-w-[400px]" style={{ fontFamily: '"DM Sans", sans-serif', letterSpacing: '-0.025em', textWrap: 'balance' } as React.CSSProperties}>
            Every event in your city, one account.
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed max-w-[380px]" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Discover what&apos;s on, register in seconds, and carry your tickets — and your Eventera Card — in WhatsApp.
          </p>

          {/* Eventera Card mockup */}
          <div
            className="mt-9 w-[250px] h-[158px] rounded-xl relative overflow-hidden"
            style={{
              transform: 'rotate(-3deg)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
              background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)',
            }}
          >
            <div className="absolute inset-0 p-4 flex flex-col justify-between">
              <div className="text-[11px] font-semibold" style={{ fontFamily: '"DM Sans", sans-serif', color: '#E8C57E' }}>
                AFRITECH SUMMIT 2026
              </div>
              <div>
                <div className="font-semibold text-[16px] text-white" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                  Amina Osman
                </div>
                <div style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10, color: '#E8C57E', marginTop: 2 }}>
                  VIP · №0198
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer stat */}
        <div className="relative z-10" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
          2M+ REGISTRATIONS · EAST AFRICA&apos;S EVENT MARKETPLACE
        </div>
      </div>

      {/* ── Form panel ── */}
      <div
        className="flex items-center justify-center px-8 py-12 lg:col-span-1 col-span-2"
        style={{
          background: '#FAF6EE',
          backgroundImage: 'radial-gradient(circle, rgba(15,31,24,0.045) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <div className="w-full max-w-[380px]">
          <Suspense>
            <AttendeeAuth />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
