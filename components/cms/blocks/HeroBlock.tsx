import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import type { HeroContent } from '@/lib/cms/types';

export function HeroBlock({ content }: { content: HeroContent }) {
  const { eyebrow, headline, headlineAccent, subheadline, buttons, imageUrl, imageAlt, trustBadges, statsStrip, layout = 'split' } = content;

  if (layout === 'centered') {
    return (
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-[920px] px-5 lg:px-10 py-20 lg:py-32 text-center">
          {eyebrow && (
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase mb-5" style={{ color: 'rgba(31,77,58,0.8)' }}>
              {eyebrow}
            </div>
          )}
          <h1 className="font-title font-bold text-[#0F1F18] leading-[0.97] text-[48px] sm:text-[64px] lg:text-[76px]">
            {headlineAccent ? (
              <>
                {headline.replace(headlineAccent, '')}{' '}
                <span style={{ color: '#1F4D3A' }}>{headlineAccent}</span>
              </>
            ) : headline}
          </h1>
          {subheadline && (
            <p className="mt-6 text-[#3A4A42] text-[17px] lg:text-[19px] leading-[1.55] max-w-[560px] mx-auto">
              {subheadline}
            </p>
          )}
          {buttons && buttons.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {buttons.map((b) => (
                <Link key={b.label} href={b.href}
                  className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-medium transition-colors ${
                    b.variant === 'primary' ? 'bg-[#1F4D3A] text-[#FAF6EE] hover:bg-[#163828]' :
                    b.variant === 'outline' ? 'border border-[rgba(15,31,24,0.15)] text-[#0F1F18] hover:border-[#1F4D3A] hover:text-[#1F4D3A]' :
                    'text-[#1F4D3A] underline hover:text-[#163828]'
                  }`}>
                  {b.label} <ArrowRight size={16} strokeWidth={2} />
                </Link>
              ))}
            </div>
          )}
          {trustBadges && (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-[#6B7A72]">
              {trustBadges.map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check size={14} strokeWidth={2.5} style={{ color: '#1F4D3A' }} /> {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // split layout (default)
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="absolute pointer-events-none" style={{ top: '-10%', right: '-5%', width: 700, height: 600, background: 'radial-gradient(ellipse, rgba(31,77,58,0.15) 0%, transparent 70%)', filter: 'blur(100px)' }} />
      <div aria-hidden className="absolute pointer-events-none" style={{ bottom: '-10%', left: '-5%', width: 500, height: 500, background: 'radial-gradient(ellipse, rgba(232,197,126,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />

      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 pt-12 pb-20 lg:pt-20 lg:pb-28 grid lg:grid-cols-[1fr_1.15fr] gap-12 lg:gap-4 items-center">
        <div className="order-2 lg:order-1">
          {eyebrow && (
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase mb-5" style={{ color: 'rgba(31,77,58,0.8)' }}>
              {eyebrow}
            </div>
          )}
          <h1 className="font-title font-bold text-[#0F1F18] leading-[0.97] text-[48px] sm:text-[64px] lg:text-[76px]">
            {headlineAccent ? (
              <>
                {headline.replace(headlineAccent, '')}{' '}
                <span style={{ color: '#1F4D3A' }}>{headlineAccent}</span>
              </>
            ) : headline}
          </h1>
          {subheadline && (
            <p className="mt-6 text-[#3A4A42] text-[17px] lg:text-[19px] leading-[1.55] max-w-[480px]">
              {subheadline}
            </p>
          )}
          {buttons && buttons.length > 0 && (
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {buttons.map((b) => (
                <Link key={b.label} href={b.href}
                  className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-medium transition-colors ${
                    b.variant === 'primary' ? 'bg-[#1F4D3A] text-[#FAF6EE] hover:bg-[#163828]' :
                    b.variant === 'outline' ? 'border text-[#0F1F18] hover:border-[#1F4D3A] hover:text-[#1F4D3A]' :
                    'text-[#1F4D3A] underline hover:text-[#163828]'
                  }`} style={b.variant === 'outline' ? { borderColor: 'rgba(15,31,24,0.15)' } : {}}>
                  {b.label} <ArrowRight size={16} strokeWidth={2} />
                </Link>
              ))}
            </div>
          )}
          {trustBadges && (
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-[#6B7A72]">
              {trustBadges.map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <Check size={14} strokeWidth={2.5} style={{ color: '#1F4D3A' }} /> {t}
                </span>
              ))}
            </div>
          )}
          {statsStrip && statsStrip.length > 0 && (
            <div className="mt-8 grid grid-cols-3 gap-px rounded-2xl overflow-hidden border border-[#E5E0D4] max-w-[440px]" style={{ background: '#E5E0D4' }}>
              {statsStrip.map((s) => (
                <div key={s.label} className="px-4 py-3.5" style={{ background: '#FAF6EE' }}>
                  <div className="font-display font-bold text-[#1F4D3A] text-[22px] tracking-[-0.03em] leading-none">{s.value}</div>
                  <div className="mt-1.5 font-mono text-[9px] tracking-[0.16em] uppercase text-[#6B7A72]">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {imageUrl && (
          <div className="order-1 lg:order-2 relative flex items-center justify-center lg:-mr-16">
            <div aria-hidden className="absolute inset-0 grid place-items-center pointer-events-none">
              <div style={{ width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(31,77,58,0.14), transparent 65%)', filter: 'blur(60px)' }} />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={imageAlt ?? ''}
              className="relative w-full"
              style={{ filter: 'drop-shadow(0 32px 56px rgba(15,31,24,0.22))' }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
