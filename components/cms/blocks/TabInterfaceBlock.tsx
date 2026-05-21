'use client';

import { useState } from 'react';
import type { TabInterfaceContent } from '@/lib/cms/types';

export function TabInterfaceBlock({ content }: { content: TabInterfaceContent }) {
  const { tabs } = content;
  const [active, setActive] = useState(0);

  if (tabs.length === 0) return null;

  const tab = tabs[active];

  return (
    <section className="relative">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        {/* Tab buttons */}
        <div className="flex flex-wrap gap-2 mb-10">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              onClick={() => setActive(i)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium transition-colors ${
                i === active
                  ? 'bg-[#1F4D3A] text-[#FAF6EE]'
                  : 'border border-[#E5E0D4] text-[#3A4A42] hover:border-[#1F4D3A] hover:text-[#1F4D3A] bg-white'
              }`}
            >
              {t.icon && <span className="font-mono text-[12px]">{t.icon}</span>}
              {t.label}
            </button>
          ))}
        </div>

        {/* Active tab content */}
        <div className="grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-16 items-start">
          <div>
            <h3 className="font-display font-bold text-[#0F1F18] text-[28px] sm:text-[36px] lg:text-[44px] leading-[1.05] tracking-tight">
              {tab.headline}
            </h3>
            <p className="mt-4 text-[#3A4A42] text-[16px] lg:text-[17px] leading-[1.65]">
              {tab.blurb}
            </p>
          </div>

          <div className="space-y-4">
            {tab.problems && tab.problems.length > 0 && (
              <div className="rounded-2xl border border-[#E5E0D4] overflow-hidden bg-white p-5">
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#6B7A72] mb-4">Problems solved</div>
                <ul className="space-y-2">
                  {tab.problems.map((p, pi) => (
                    <li key={pi} className="flex items-start gap-2.5 text-[14px] text-[#3A4A42]">
                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#1F4D3A] shrink-0" />
                      {p.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {tab.examples && tab.examples.length > 0 && (
              <div className="rounded-2xl border border-[#E5E0D4] overflow-hidden bg-white p-5">
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[#6B7A72] mb-4">Examples</div>
                <ul className="space-y-2">
                  {tab.examples.map((ex, ei) => (
                    <li key={ei} className="flex items-center justify-between">
                      <span className="text-[14px] font-medium text-[#0F1F18]">{ex.title}</span>
                      {ex.role && (
                        <span className="text-[11px] font-mono text-[#6B7A72] bg-[#FAF6EE] px-2 py-0.5 rounded-full">{ex.role}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
