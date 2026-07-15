import { createClient } from '@/lib/supabase/server';
import Reveal from '@/components/marketing/Reveal';
import { NewsCTAClient } from './NewsCTAClient';

export const metadata = {
  title: "What's New",
  description:
    "A running changelog of everything shipped at Eventera. New features, improvements, and fixes.",
};

export const dynamic = 'force-dynamic';

type EntryType = 'added' | 'fixed' | 'improved' | 'removed' | 'security';

const TYPE_STYLES: Record<EntryType, { bg: string; color: string; label: string }> = {
  added:    { bg: 'rgba(31,77,58,0.10)',    color: '#1F4D3A', label: 'New'      },
  improved: { bg: 'rgba(58,107,140,0.10)',  color: '#3A6B8C', label: 'Improved' },
  fixed:    { bg: 'rgba(201,122,45,0.10)',  color: '#C97A2D', label: 'Fix'      },
  removed:  { bg: 'rgba(107,122,114,0.10)', color: '#65736B', label: 'Removed'  },
  security: { bg: 'rgba(184,66,60,0.10)',   color: '#B8423C', label: 'Security' },
};

interface DBEntry {
  id: string;
  version: string | null;
  title: string;
  description: string;
  type: EntryType;
  published_at: string | null;
  created_at: string;
}

function formatDate(iso: string | null) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

/* ── Hero ─────────────────────────────────────────────────────────────── */
function ChangelogHero({ latest }: { latest?: DBEntry }) {
  return (
    <section
      className="relative overflow-hidden border-b"
      style={{ borderColor: '#E5E0D4' }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(15,31,24,0.045) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 pt-14 lg:pt-20 pb-12 lg:pb-16">
        <div className=" text-[11px] tracking-[0.22em] text-primary uppercase mb-5">
          Changelog
        </div>
        <h1 className="font-title font-bold text-ink text-[44px] sm:text-[60px] lg:text-[68px] leading-[0.95] max-w-[760px]">
          What&rsquo;s new in Eventera
        </h1>
        <p className="mt-5 text-ink-soft text-[17px] lg:text-[18px] leading-[1.55] max-w-[520px]">
          Every feature, fix, and improvement — documented as it ships.
          Subscribe below to get notified about major releases.
        </p>

        {latest && (
          <Reveal>
            <div className="mt-8 inline-flex items-center gap-3 px-5 py-3 rounded-full" style={{ background: 'rgba(31,77,58,0.07)', border: '1px solid rgba(31,77,58,0.15)' }}>
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <span className="text-[13px] text-ink-soft">
                Latest: <span className="text-ink font-medium">{latest.title}</span>
              </span>
              <span className=" text-[10px] tracking-[0.14em] uppercase text-muted">
                {formatDate(latest.published_at ?? latest.created_at)}
              </span>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

/* ── Entry list ───────────────────────────────────────────────────────── */
function ChangelogEntries({ entries }: { entries: DBEntry[] }) {
  if (entries.length === 0) {
    return (
      <section className="mx-auto max-w-[1200px] px-5 lg:px-10 py-20 text-center text-[15px] text-muted">
        No releases published yet. Check back soon.
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1200px] px-5 lg:px-10 py-14 lg:py-20 grid lg:grid-cols-[160px_1fr] gap-10 lg:gap-16 items-start">

      {/* Timeline nav */}
      <aside className="hidden lg:block sticky top-24">
        <div className=" text-[10px] tracking-[0.22em] uppercase text-muted mb-4">Releases</div>
        <nav className="space-y-2">
          {entries.map((entry) => {
            const anchor = entry.version ?? entry.id.slice(0, 8);
            return (
              <a
                key={entry.id}
                href={`#${anchor}`}
                className="block py-1 border-l-2 pl-3 transition-colors hover:text-primary"
                style={{ borderColor: 'rgba(229,224,212,0.7)', color: '#65736B', fontSize: '13px' }}
              >
                <span className=" font-medium">{entry.version ?? '—'}</span>
                <div className=" text-[10px] tracking-[0.10em] mt-0.5" style={{ color: 'rgba(107,122,114,0.6)' }}>
                  {formatDate(entry.published_at ?? entry.created_at)}
                </div>
              </a>
            );
          })}
        </nav>
      </aside>

      {/* Entries */}
      <div className="space-y-12 lg:space-y-14">
        {entries.map((entry, i) => {
          const anchor = entry.version ?? entry.id.slice(0, 8);
          const style = TYPE_STYLES[entry.type] ?? TYPE_STYLES.added;
          return (
            <Reveal key={entry.id} delay={i * 50} distance={16}>
              <article id={anchor} className="scroll-mt-28">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  {entry.version && (
                    <span
                      className=" font-bold text-[13px] tracking-[-0.01em] px-3 py-1 rounded-lg"
                      style={{ background: '#1F4D3A', color: '#FAF6EE' }}
                    >
                      {entry.version}
                    </span>
                  )}
                  <span className=" text-[11px] tracking-[0.14em] uppercase text-muted">
                    {formatDate(entry.published_at ?? entry.created_at)}
                  </span>
                </div>

                <h2 className="font-display font-bold text-ink text-[22px] sm:text-[26px] lg:text-[28px] tracking-[-0.025em] leading-[1.1] mb-3">
                  {entry.title}
                </h2>
                <p className="text-ink-soft text-[15px] lg:text-[16px] leading-[1.7] mb-6">
                  {entry.description}
                </p>

                {/* Type tag */}
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
                  <div
                    className="flex items-center gap-3 px-5 py-3.5 bg-surface"
                  >
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full  text-[9px] tracking-[0.16em] uppercase shrink-0"
                      style={style}
                    >
                      {style.label}
                    </span>
                    <span className="text-ink-soft text-[13px] lg:text-[14px] leading-[1.55]">
                      {entry.title}
                    </span>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */
export default async function WhatsNewPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from('changelog_entries')
    .select('id, version, title, description, type, published_at, created_at')
    .eq('published', true)
    .order('published_at', { ascending: false, nullsFirst: false });

  const entries = (data ?? []) as DBEntry[];

  return (
    <>
      <ChangelogHero latest={entries[0]} />
      <ChangelogEntries entries={entries} />
      <NewsCTAClient />
    </>
  );
}
