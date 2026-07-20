'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FaqAccordionContent } from '@/lib/cms/types';
import { SectionHeaderBlock } from './SectionHeaderBlock';

export function FaqAccordionBlock({ content }: { content: FaqAccordionContent }) {
  // Defensive: free-form block JSON may omit `items` — render empty, never throw.
  const { header, defaultOpen } = content;
  const items = content.items ?? [];
  const [open, setOpen] = useState<number | null>(defaultOpen ?? null);

  return (
    <section className="relative">
      <div className="relative mx-auto max-w-[920px] px-5 lg:px-10 py-20 lg:py-28">
        {header && (
          <div className="mb-10 lg:mb-14 text-center">
            <SectionHeaderBlock content={{ ...header, align: 'center' }} compact />
          </div>
        )}
        <div className="space-y-2">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="border border-[#E5E0D4] rounded-2xl overflow-hidden bg-white">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-[#FAF6EE] transition-colors"
                >
                  <span className="font-display font-semibold text-[#0F1F18] text-[16px] lg:text-[17px] leading-snug pr-4">
                    {item.question}
                  </span>
                  <ChevronDown
                    size={18}
                    strokeWidth={2}
                    className={`shrink-0 text-[#65736B] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-[15px] text-[#3A4A42] leading-[1.7]">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
