import type { StatsStripContent } from '@/lib/cms/types';

interface StatsStripBlockProps {
  content: StatsStripContent;
}

// Literal class names only — Tailwind can't see interpolated strings.
const LG_COLS: Record<number, string> = {
  1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6',
};

export function StatsStripBlock({ content }: StatsStripBlockProps) {
  const variant = content.variant ?? 'light';
  // Defensive: free-form block JSON may omit `stats` — render empty, never throw.
  const stats = content.stats ?? [];

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap gap-8 lg:gap-12 justify-center">
        {stats.map((stat, i) => (
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
        {/* Mobile-first: 2-up on phones, one column per stat from lg. The old
            inline `repeat(N, ...)` forced all N columns at 375px. */}
        <div
          className={`grid grid-cols-2 gap-px rounded-2xl overflow-hidden border ${
            LG_COLS[stats.length] ?? 'lg:grid-cols-4'
          }`}
          style={{
            background: isDark ? 'rgba(255,255,255,0.10)' : '#E5E0D4',
            borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E5E0D4',
          }}
        >
          {stats.map((stat, i) => (
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
