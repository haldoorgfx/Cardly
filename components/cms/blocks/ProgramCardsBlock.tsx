import { Check } from 'lucide-react';
import type { ProgramCardsContent } from '@/lib/cms/types';
import { SectionHeaderBlock } from './SectionHeaderBlock';

export function ProgramCardsBlock({ content }: { content: ProgramCardsContent }) {
  const { header, programs } = content;

  return (
    <section className="relative">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        {header && (
          <div className="mb-12 lg:mb-16">
            <SectionHeaderBlock content={header} compact />
          </div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {programs.map((p, i) => (
            <div key={i} className="bg-white border border-[#E5E0D4] rounded-2xl p-6 lg:p-7 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                {p.icon && (
                  <span className="w-10 h-10 rounded-xl bg-[#E8EFEB] text-[#1F4D3A] grid place-items-center  text-[15px]">
                    {p.icon}
                  </span>
                )}
                {p.tag && (
                  <span className=" text-[10px] tracking-[0.16em] uppercase text-[#C9A45E] bg-[rgba(232,197,126,0.15)] px-2 py-0.5 rounded-full">
                    {p.tag}
                  </span>
                )}
              </div>
              <h3 className="font-display font-semibold text-[#0F1F18] text-[18px] lg:text-[20px] tracking-tight leading-tight mb-2">
                {p.title}
              </h3>
              <p className="text-[14px] text-[#3A4A42] leading-[1.6] mb-5">{p.description}</p>
              <ul className="mt-auto space-y-2">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-[13px] text-[#3A4A42]">
                    <Check size={13} strokeWidth={2.5} className="shrink-0 mt-0.5" style={{ color: '#1F4D3A' }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
