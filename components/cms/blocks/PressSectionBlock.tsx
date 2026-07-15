import type { PressSectionContent } from '@/lib/cms/types';

interface PressSectionBlockProps {
  content: PressSectionContent;
}

export function PressSectionBlock({ content }: PressSectionBlockProps) {
  return (
    <section
      className="border-y"
      style={{ borderColor: '#E5E0D4', background: 'rgba(250,246,238,0.4)' }}
    >
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-16 lg:py-20">
        {content.label && (
          <p
            className=" text-[11px] tracking-[0.22em] uppercase mb-8 text-center"
            style={{ color: '#1F4D3A' }}
          >
            {content.label}
          </p>
        )}

        <div className="grid md:grid-cols-3 gap-4 lg:gap-5">
          {content.mentions.map((mention, i) => (
            <article
              key={i}
              className="bg-surface border rounded-2xl p-6 lg:p-7"
              style={{ borderColor: '#E5E0D4', background: '#FFFFFF' }}
            >
              <div className="flex items-center justify-between mb-5">
                <div
                  className="font-display font-bold text-[17px] tracking-tight"
                  style={{ color: '#0F1F18' }}
                >
                  {mention.publication}
                </div>
                <div
                  className=" text-[9px] tracking-[0.18em] uppercase"
                  style={{ color: '#65736B' }}
                >
                  {mention.date}
                </div>
              </div>
              <blockquote
                className="text-[14px] lg:text-[15px] leading-[1.6] italic"
                style={{ color: '#3A4A42' }}
              >
                &ldquo;{mention.quote}&rdquo;
              </blockquote>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
