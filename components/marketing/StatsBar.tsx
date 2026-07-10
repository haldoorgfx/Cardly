import { createAdminClient } from '@/lib/supabase/server';

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k+`;
  return `${n}+`;
}

export async function StatsBar() {
  let cards = 0;
  let events = 0;

  try {
    const admin = createAdminClient();
    const [cardsRes, eventsRes] = await Promise.all([
      admin.from('generated_cards').select('id', { count: 'exact', head: true }),
      admin.from('events').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    ]);
    cards  = cardsRes.count  ?? 0;
    events = eventsRes.count ?? 0;
  } catch { /* show nothing if DB is unreachable */ }

  // Don't show the bar until there's meaningful data
  if (cards < 10 && events < 3) return null;

  const stats = [
    { value: fmt(cards),  label: 'cards generated' },
    { value: fmt(events), label: 'events powered'  },
    { value: '30 sec',    label: 'avg. time to card' },
  ];

  return (
    <div
      className="border-y border-border"
      style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #163828 100%)' }}
    >
      <div className="mx-auto max-w-[1200px] px-5 lg:px-10 py-5">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {stats.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <span
                className="font-display font-bold text-[22px] tracking-[-0.02em]"
                style={{ color: '#E8C57E' }}
              >
                {s.value}
              </span>
              <span
                className=" text-[11px] tracking-[0.15em] uppercase"
                style={{ color: 'rgba(250,246,238,0.55)' }}
              >
                {s.label}
              </span>
              {i < stats.length - 1 && (
                <span
                  className="hidden sm:block w-px h-5 ml-1"
                  style={{ background: 'rgba(250,246,238,0.15)' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
