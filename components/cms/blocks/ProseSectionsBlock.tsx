import type { ProseSectionsContent } from '@/lib/cms/types';

export function ProseSectionsBlock({ content }: { content: ProseSectionsContent }) {
  const { eyebrow, headline, updatedAt, sections, warningBanner } = content;

  return (
    <section className="max-w-[820px] mx-auto px-5 lg:px-10 pt-20 pb-28">
      {eyebrow && (
        <div className="text-[11px] tracking-[0.18em] font-mono text-[#1F4D3A] mb-4 uppercase">
          {eyebrow}
        </div>
      )}
      <h1 className="font-display font-bold text-[40px] sm:text-[48px] leading-[1.05] mb-3 text-[#0F1F18]">
        {headline}
      </h1>
      {updatedAt && (
        <p className="text-[13px] font-mono text-[#6B7A72]/60 mb-10">
          Last updated: {updatedAt}
        </p>
      )}

      {warningBanner && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-10 text-[14px] text-amber-800 leading-relaxed">
          {warningBanner}
        </div>
      )}

      <div className="space-y-10 text-[16px] text-[#3A4A42]/90 leading-[1.8]">
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="font-display font-bold text-[22px] text-[#0F1F18] mb-3">
              {s.h2}
            </h2>
            {s.paragraphs.map((p, pi) => (
              <p key={pi} className="mb-3 last:mb-0">{p}</p>
            ))}
          </section>
        ))}
      </div>
    </section>
  );
}
