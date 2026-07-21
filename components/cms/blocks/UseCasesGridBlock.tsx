import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { UseCasesGridContent } from '@/lib/cms/types';
import { SectionHeaderBlock } from './SectionHeaderBlock';
import { safeBlockHref, safeBlockSrc } from '@/lib/cms/href';

export function UseCasesGridBlock({ content }: { content: UseCasesGridContent }) {
  // Defensive: free-form block JSON may omit `cases` — render empty, never throw.
  const { header, columns = 2 } = content;
  const cases = content.cases ?? [];

  const gridCols = columns === 6
    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
    : columns === 3
    ? 'sm:grid-cols-2 lg:grid-cols-3'
    : 'sm:grid-cols-2';

  return (
    <section className="relative">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-28">
        {header && (
          <div className="max-w-[760px] mb-12 lg:mb-16">
            <SectionHeaderBlock content={header} compact />
          </div>
        )}

        <div className={`grid ${gridCols} gap-4 lg:gap-5`}>
          {cases.map((c, ci) => {
            // Authored URLs: `javascript:` in either would execute for every
            // visitor, so both are scheme-checked before they reach the DOM.
            const href = safeBlockHref(c.href);
            const thumbnailUrl = safeBlockSrc(c.thumbnail_url);
            return (
            <article key={c.id ?? ci}
              className="relative bg-white border border-[#E5E0D4] rounded-2xl p-6 lg:p-7 flex gap-5 lg:gap-6 hover:border-[rgba(31,77,58,0.3)] hover:shadow-[0_4px_12px_rgba(15,31,24,0.08),0_24px_60px_rgba(31,77,58,0.12)] transition-all group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-4">
                  {c.icon && (
                    <span className="w-9 h-9 rounded-full bg-[#E8EFEB] text-[#1F4D3A] grid place-items-center shrink-0  text-[13px]">
                      {c.icon}
                    </span>
                  )}
                  <span className=" text-[10px] tracking-[0.2em] text-[#1F4D3A] uppercase">{c.label}</span>
                </div>
                <h3 className="font-display font-semibold text-[#0F1F18] text-[19px] lg:text-[22px] leading-[1.15] tracking-[-0.02em]">
                  {c.title}
                </h3>
                <p className="text-[#3A4A42] text-[14px] lg:text-[15px] mt-2.5 leading-[1.55]">{c.body}</p>
                {href && (
                  <Link href={href}
                    className="mt-5 inline-flex items-center gap-1.5 text-[#1F4D3A] font-medium text-[13px] hover:gap-2.5 transition-all">
                    See example <ArrowRight size={14} strokeWidth={2} />
                  </Link>
                )}
              </div>
              {thumbnailUrl && (
                <div className="shrink-0 self-center hidden sm:block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbnailUrl}
                    alt={c.title}
                    className="rounded-xl object-cover shadow-[0_1px_2px_rgba(15,31,24,0.04),0_8px_24px_rgba(15,31,24,0.06)]"
                    style={{ width: 120, height: 152 }}
                  />
                </div>
              )}
            </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
