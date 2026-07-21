import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { TeamGridContent } from '@/lib/cms/types';
import { SectionHeaderBlock } from './SectionHeaderBlock';
import { safeBlockHref, safeBlockSrc } from '@/lib/cms/href';

export function TeamGridBlock({ content }: { content: TeamGridContent }) {
  // Defensive: free-form block JSON may omit `members` — render empty, never throw.
  const { header, ctaButton } = content;
  const members = content.members ?? [];
  const ctaHref = safeBlockHref(ctaButton?.href);

  return (
    <section className="relative">
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 lg:py-24">
        {header && (
          <div className="flex flex-wrap items-end justify-between gap-6 mb-10 lg:mb-12">
            <div className="max-w-[600px]">
              <SectionHeaderBlock content={header} compact />
            </div>
            {ctaButton && ctaHref && (
              <Link href={ctaHref}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#1F4D3A] text-[#FAF6EE] font-medium text-[14px] hover:bg-[#163828] transition-colors">
                {ctaButton.label} <ArrowRight size={14} />
              </Link>
            )}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {members.map((m, i) => {
            // `name` is authored JSON and can be absent — the old
            // `m.name.charAt(0)` threw and took the whole page with it.
            const name = typeof m.name === 'string' ? m.name : '';
            const avatarUrl = safeBlockSrc(m.avatar_url);
            const applyHref = safeBlockHref(m.apply_href);
            return (
            <div key={i} className="bg-white border border-[#E5E0D4] rounded-2xl p-6 flex flex-col">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={name} className="w-14 h-14 rounded-full object-cover" />
              ) : m.is_open_role ? (
                <div className="w-14 h-14 rounded-full grid place-items-center font-display font-semibold text-[22px] text-[#1F4D3A] border-2 border-dashed border-[#1F4D3A]/30">
                  +
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full grid place-items-center font-display font-semibold text-[18px]"
                  style={{
                    background: 'radial-gradient(120% 120% at 30% 25%, #f3e4c1 0%, #c9a45e 55%, #8a6f3a 100%)',
                    color: '#163828',
                    boxShadow: '0 0 0 3px rgba(232, 197, 126, 0.25)',
                  }}>
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="mt-4 font-display font-semibold text-[#0F1F18] text-[16px] tracking-tight">{name}</div>
              <div className=" text-[10px] tracking-[0.14em] uppercase text-[#1F4D3A] mt-1.5">{m.role}</div>
              {m.location && (
                <div className="mt-1 text-[12px] text-[#65736B]">{m.location}</div>
              )}
              {m.is_open_role && applyHref && (
                <a href={applyHref} className="mt-4 inline-flex items-center gap-1.5 text-[12px] font-medium text-[#1F4D3A]">
                  Apply <ArrowRight size={12} />
                </a>
              )}
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
