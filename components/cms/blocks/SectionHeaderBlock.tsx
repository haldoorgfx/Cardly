import type { SectionHeaderContent } from '@/lib/cms/types';

interface SectionHeaderBlockProps {
  content: SectionHeaderContent;
  /** When true, renders without the outer section padding (for embedding inside other blocks) */
  compact?: boolean;
}

export function SectionHeaderBlock({ content, compact = false }: SectionHeaderBlockProps) {
  const align = content.align ?? 'center';
  const isCenter = align === 'center';
  const alignClass = isCenter ? 'text-center mx-auto' : 'text-left';
  const maxWidthClass = isCenter ? 'max-w-[760px]' : 'max-w-[860px]';

  const inner = (
    <div className={`${alignClass} ${maxWidthClass}`}>
      {content.eyebrow && (
        <div className=" text-[11px] tracking-[0.22em] uppercase mb-5" style={{ color: '#1F4D3A' }}>
          {content.eyebrow}
        </div>
      )}
      <h2 className="font-title font-bold text-[32px] sm:text-[42px] lg:text-[52px] leading-[1.01]" style={{ color: '#0F1F18' }}>
        {content.headline}
      </h2>
      {content.subtext && (
        <p className="mt-5 text-[17px] lg:text-[18px] leading-[1.55]" style={{ color: '#3A4A42' }}>
          {content.subtext}
        </p>
      )}
    </div>
  );

  if (compact) return inner;

  return (
    <section className="py-16 lg:py-20 max-w-[1200px] mx-auto px-5 lg:px-10">
      {inner}
    </section>
  );
}
