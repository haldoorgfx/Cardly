import type { StepsGridContent } from '@/lib/cms/types';
import { SectionHeaderBlock } from './SectionHeaderBlock';
import { Check } from 'lucide-react';

export function StepsGridBlock({ content }: { content: StepsGridContent }) {
  const { header, steps, layout = 'horizontal' } = content;

  if (layout === 'alternating') {
    // Detailed step layout (as used on /how-it-works)
    return (
      <section className="relative">
        <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
          {header && (
            <div className="mb-14 lg:mb-16">
              <SectionHeaderBlock content={header} compact />
            </div>
          )}
          <div className="space-y-16 lg:space-y-24">
            {steps.map((step, i) => (
              <div key={step.step} className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${i % 2 === 1 ? 'lg:[direction:rtl]' : ''}`}>
                <div style={{ direction: 'ltr' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="h-8 w-8 rounded-full border border-[#E5E0D4] grid place-items-center  text-[12px] text-[#65736B]"
                      style={{ background: '#FAF6EE' }}>
                      {String(step.step).padStart(2, '0')}
                    </span>
                    {step.duration && (
                      <span className=" text-[10px] tracking-[0.16em] uppercase text-[#65736B]">
                        {step.duration}
                      </span>
                    )}
                  </div>
                  <h3 className="font-title font-bold text-[#0F1F18] text-[26px] sm:text-[32px] lg:text-[36px] leading-[1.05]">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-[#3A4A42] text-[16px] lg:text-[17px] leading-[1.65]">
                    {step.body}
                  </p>
                  {step.bullets && step.bullets.length > 0 && (
                    <ul className="mt-5 space-y-2">
                      {step.bullets.map((b) => (
                        <li key={b} className="flex items-start gap-2.5 text-[14px] text-[#3A4A42]">
                          <Check size={14} strokeWidth={2.5} className="shrink-0 mt-0.5" style={{ color: '#1F4D3A' }} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {/* Step number badge on right */}
                <div style={{ direction: 'ltr' }} className="hidden lg:flex items-center justify-center">
                  <div className="w-40 h-40 rounded-full grid place-items-center border-2 border-[#E5E0D4]"
                    style={{ background: 'linear-gradient(135deg, #FAF6EE 0%, #E8EFEB 100%)' }}>
                    <span className="font-display font-bold text-[#0F1F18] text-[56px] tracking-tight leading-none">
                      {String(step.step).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // horizontal layout — cards in a row (as used on landing)
  return (
    <section className="relative">
      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        {header && (
          <div className="mb-14 lg:mb-16">
            <SectionHeaderBlock content={header} compact />
          </div>
        )}
        <div className="grid lg:grid-cols-3 gap-5">
          {steps.map((step) => (
            <div key={step.step}
              className="bg-white border border-[#E5E0D4] rounded-3xl overflow-hidden flex flex-col shadow-[0_1px_2px_rgba(15,31,24,0.04),0_8px_24px_rgba(15,31,24,0.06)] hover:shadow-[0_4px_12px_rgba(15,31,24,0.08),0_24px_60px_rgba(31,77,58,0.12)] transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <span className="h-8 w-8 rounded-full border border-[#E5E0D4] grid place-items-center  text-[12px] text-[#65736B]"
                    style={{ background: '#FAF6EE' }}>
                    {String(step.step).padStart(2, '0')}
                  </span>
                  {step.icon && (
                    <span className="text-[#0F1F18]/25  text-[13px]">{step.icon}</span>
                  )}
                </div>
                <h3 className="font-display font-bold text-[#0F1F18] text-[22px] lg:text-[24px] leading-tight tracking-[-0.02em]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[#3A4A42] text-[14px] leading-[1.6]">{step.body}</p>
                {step.duration && (
                  <div className="mt-4 flex items-center gap-2  text-[10px] tracking-[0.16em] uppercase text-[#65736B]">
                    <span className="w-5 h-px bg-[#65736B]/40" />
                    {step.duration}
                  </div>
                )}
                {step.bullets && step.bullets.length > 0 && (
                  <ul className="mt-4 space-y-1.5">
                    {step.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-[13px] text-[#3A4A42]">
                        <Check size={12} strokeWidth={2.5} className="shrink-0 mt-0.5" style={{ color: '#1F4D3A' }} />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
