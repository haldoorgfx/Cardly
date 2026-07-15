import type { StatsStripContent } from '@/lib/cms/types';

interface StatsStripBlockProps {
  content: StatsStripContent;
}

export function StatsStripBlock({ content }: StatsStripBlockProps) {
  const variant = content.variant ?? 'light';

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap gap-8 lg:gap-12 justify-center">
        {content.stats.map((stat, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span
              className="font-display font-bold text-[32px] leading-none tracking-tight"
              style={{ color: '#0F1F18' }}
            >
              {stat.value}
            </span>
            <span
              className=" text-[11px] uppercase tracking-[0.18em]"
              style={{ color: '#65736B' }}
            >
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const isDark = variant === 'dark';

  return (
    <section
      style={{
        background: isDark ? '#1F4D3A' : '#FAF6EE',
      }}
    >
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-14 lg:py-16">
        <div
          className="grid gap-px rounded-2xl overflow-hidden border"
          style={{
            gridTemplateColumns: `repeat(${content.stats.length}, minmax(0, 1fr))`,
            background: isDark ? 'rgba(255,255,255,0.10)' : '#E5E0D4',
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E5E0D4',
          }}
        >
          {content.stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center py-8 px-4 text-center"
              style={{
                background: isDark ? '#1F4D3A' : '#FAF6EE',
              }}
            >
              <span
                className="font-display font-bold text-[32px] leading-none tracking-tight"
                style={{ color: isDark ? '#FAF6EE' : '#0F1F18' }}
              >
                {stat.value}
              </span>
              <span
                className="mt-2  text-[11px] uppercase tracking-[0.18em]"
                style={{ color: isDark ? 'rgba(250,246,238,0.55)' : '#65736B' }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
