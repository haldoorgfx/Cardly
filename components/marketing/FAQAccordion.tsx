'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FAQItem {
  q: string;
  a: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  defaultOpen?: number;
}

export function FAQAccordion({ items, defaultOpen = 0 }: FAQAccordionProps) {
  const [open, setOpen] = useState<number>(defaultOpen);

  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className="bg-surface border rounded-xl overflow-hidden transition-colors"
            style={{ borderColor: isOpen ? 'rgba(31,77,58,0.4)' : '#E5E0D4' }}
          >
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              className="w-full flex items-center justify-between gap-4 text-left px-5 lg:px-6 py-4 lg:py-5"
              aria-expanded={isOpen}
            >
              <span className="font-display font-semibold text-ink text-[16px] lg:text-[18px] tracking-tight">
                {item.q}
              </span>
              <span
                className="text-primary transition-transform duration-200 shrink-0"
                style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <ChevronDown size={18} strokeWidth={2} />
              </span>
            </button>
            {isOpen && (
              <div className="px-5 lg:px-6 pb-5 lg:pb-6 -mt-1 text-ink-soft text-[15px] leading-[1.6] max-w-[720px]">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
