import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { CtaContent } from '@/lib/cms/types';
import { linkableButtons } from '@/lib/cms/href';

export function CtaBlock({ content }: { content: CtaContent }) {
  const { headline, subtext, background = 'default' } = content;
  // Drops buttons with a missing href (next/link throws → 500s the page) or an
  // unsafe scheme (`javascript:` in an href is a stored-XSS sink).
  const buttons = linkableButtons(content.buttons);

  const bgClass = background === 'dark'
    ? 'bg-[#1F4D3A] text-[#FAF6EE]'
    : background === 'gradient'
    ? 'text-[#FAF6EE]'
    : '';

  const bgStyle = background === 'gradient'
    ? { background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }
    : {};

  return (
    <section className={`relative overflow-hidden ${bgClass}`} style={bgStyle}>
      <div className="relative mx-auto max-w-[920px] px-5 lg:px-10 py-24 lg:py-32 text-center">
        <h2 className={`font-title font-bold text-[44px] sm:text-[58px] lg:text-[72px] leading-[0.98] ${background === 'default' ? 'text-[#0F1F18]' : ''}`}>
          {headline}
        </h2>
        {subtext && (
          <p className={`mt-6 text-[18px] lg:text-[19px] leading-[1.55] max-w-[640px] mx-auto ${background === 'default' ? 'text-[#3A4A42]' : 'opacity-85'}`}>
            {subtext}
          </p>
        )}
        {buttons.length > 0 && (
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            {buttons.map((b, i) => (
              <Link key={i} href={b.safeHref}
                className={`inline-flex items-center gap-2 rounded-full font-medium transition-colors ${
                  b.variant === 'primary'
                    ? background === 'default'
                      ? 'px-7 py-4 bg-[#1F4D3A] text-[#FAF6EE] text-[16px] hover:bg-[#163828]'
                      : 'px-7 py-4 bg-[#E8C57E] text-[#163828] text-[16px] hover:bg-[#C9A45E]'
                    : b.variant === 'link'
                    ? `text-[15px] underline underline-offset-4 ${background === 'default' ? 'text-[#0F1F18] decoration-[#0F1F18]/30 hover:text-[#1F4D3A]' : 'opacity-80 hover:opacity-100'}`
                    : `px-6 py-3.5 border rounded-full text-[15px] ${background === 'default' ? 'border-[rgba(15,31,24,0.15)] text-[#0F1F18] hover:border-[#1F4D3A]' : 'border-[rgba(250,246,238,0.3)] hover:border-[rgba(250,246,238,0.6)]'}`
                }`}>
                {b.label} <ArrowRight size={16} strokeWidth={2} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
