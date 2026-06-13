import type { FeaturesGridContent } from '@/lib/cms/types';
import { SectionHeaderBlock } from './SectionHeaderBlock';

export function FeaturesGridBlock({ content }: { content: FeaturesGridContent }) {
  const { header, cards, background = 'light', columns = 3 } = content;
  const dark = background === 'dark';

  return (
    <section className={`relative overflow-hidden ${dark ? 'bg-[#1F4D3A] text-[#FAF6EE]' : ''}`}>
      {dark && (
        <div aria-hidden className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #E8C57E 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      )}
      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        {header && (
          <div className="max-w-[760px] mb-12 lg:mb-16">
            <SectionHeaderBlock content={{ ...header, align: 'left' }} compact />
          </div>
        )}
        <div className={`grid gap-px rounded-2xl overflow-hidden border ${
          dark
            ? 'border-[rgba(250,246,238,0.15)]'
            : 'border-[#E5E0D4]'
        } ${columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}
          style={{ background: dark ? 'rgba(250,246,238,0.1)' : '#E5E0D4' }}>
          {cards.map((card, i) => (
            <div key={i} className={`p-6 lg:p-7 flex flex-col h-full transition-colors ${
              dark ? 'bg-[#1F4D3A] hover:bg-[#163828]' : 'bg-white hover:bg-[#FAF6EE]'
            }`}>
              {(card.icon || card.label) && (
                <div className="flex items-center gap-3 mb-5">
                  {card.icon && (
                    <span className={`w-10 h-10 rounded-lg grid place-items-center border  text-[13px] shrink-0 ${
                      dark
                        ? 'border-[rgba(250,246,238,0.15)] text-[#E8C57E]'
                        : 'border-[#E5E0D4] text-[#1F4D3A] bg-[#E8EFEB]'
                    }`} style={dark ? { background: 'rgba(250,246,238,0.10)' } : {}}>
                      {card.icon}
                    </span>
                  )}
                  {card.label && (
                    <span className={` text-[10px] tracking-[0.22em] uppercase ${dark ? 'text-[#E8C57E]' : 'text-[#1F4D3A]'}`}>
                      {card.label}
                    </span>
                  )}
                </div>
              )}
              <h3 className={`font-display font-semibold text-[20px] lg:text-[22px] tracking-[-0.02em] leading-[1.15] ${dark ? 'text-[#FAF6EE]' : 'text-[#0F1F18]'}`}>
                {card.title}
              </h3>
              <p className={`mt-2.5 text-[14px] lg:text-[15px] leading-[1.55] ${dark ? 'opacity-70' : 'text-[#3A4A42]'}`}>
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
