import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import type { PricingCardsContent } from '@/lib/cms/types';
import { SectionHeaderBlock } from './SectionHeaderBlock';

export function PricingCardsBlock({ content }: { content: PricingCardsContent }) {
  const { header, plans, trialBanner, trustItems } = content;

  return (
    <section className="relative">
      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        {header && (
          <div className="max-w-[760px] mb-12 lg:mb-16">
            <SectionHeaderBlock content={header} compact />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div key={plan.id}
              className={`relative rounded-3xl p-7 lg:p-8 flex flex-col h-full ${
                plan.highlighted
                  ? 'shadow-xl'
                  : 'border border-[#E5E0D4]'
              }`}
              style={plan.highlighted
                ? { background: '#1F4D3A', color: '#FAF6EE', boxShadow: '0 20px 60px rgba(31,77,58,0.25)' }
                : { background: '#FFFFFF' }
              }>
              {plan.badge && (
                <div className="absolute -top-3 right-7 inline-flex items-center gap-1.5  text-[10px] tracking-[0.16em] uppercase bg-[#E8C57E] text-[#163828] px-2.5 py-1 rounded-full font-semibold">
                  {plan.badge}
                </div>
              )}
              <div className={`font-display text-[14px] font-medium tracking-tight ${plan.highlighted ? 'text-[#E8C57E]' : 'text-[#1F4D3A]'}`}>
                {plan.name}
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className={`font-display font-bold tracking-[-0.03em] text-[44px] leading-none ${plan.highlighted ? 'text-[#FAF6EE]' : 'text-[#0F1F18]'}`}>
                  {plan.price}
                </span>
                {plan.period && (
                  <span className={`text-[14px] ${plan.highlighted ? 'text-[rgba(250,246,238,0.65)]' : 'text-[#6B7A72]'}`}>
                    {plan.period}
                  </span>
                )}
              </div>
              <div className={`mt-1.5 text-[14px] ${plan.highlighted ? 'text-[rgba(250,246,238,0.75)]' : 'text-[#3A4A42]'}`}>
                {plan.blurb}
              </div>

              <ul className="mt-7 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f.text} className={`flex items-start gap-2.5 text-[14px] ${plan.highlighted ? 'text-[rgba(250,246,238,0.9)]' : 'text-[#3A4A42]'} ${!f.included ? 'opacity-40' : ''}`}>
                    <span className={plan.highlighted ? 'text-[#E8C57E]' : 'text-[#1F4D3A]'}>
                      <Check size={15} strokeWidth={2.5} />
                    </span>
                    {f.text}
                  </li>
                ))}
              </ul>

              <Link href={plan.ctaHref}
                className={`mt-8 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full font-medium text-[14px] transition-colors ${
                  plan.highlighted
                    ? 'bg-[#E8C57E] text-[#163828] hover:bg-[#C9A45E]'
                    : 'bg-[#0F1F18] text-[#FAF6EE] hover:bg-[#1F4D3A]'
                }`}>
                {plan.ctaLabel} <ArrowRight size={14} strokeWidth={2} />
              </Link>
            </div>
          ))}
        </div>

        {trialBanner && (
          <div className="mt-8 text-center text-[14px] text-[#6B7A72]">{trialBanner}</div>
        )}
        {trustItems && trustItems.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[#6B7A72]">
            {trustItems.map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check size={13} strokeWidth={2.5} style={{ color: '#1F4D3A' }} /> {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
