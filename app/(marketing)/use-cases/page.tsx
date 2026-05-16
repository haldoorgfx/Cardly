import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { UseCasesContent } from '@/components/marketing/UseCasesContent';

export const metadata = {
  title: 'Use Cases — Cardly',
  description:
    'Cardly works for conferences, NGOs, political campaigns, religious events, brand activations, and education. Real templates for every kind of campaign.',
};

/* ── Hero ────────────────────────────────────────────────── */
function UseCasesHero() {
  return (
    <section
      className="relative overflow-hidden border-b"
      style={{ borderColor: '#E5E0D4' }}
    >
      {/* Mesh blobs */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            'radial-gradient(70% 60% at 10% 0%, rgba(31,77,58,0.10), transparent 65%)',
            'radial-gradient(50% 50% at 90% 100%, rgba(232,197,126,0.13), transparent 65%)',
          ].join(', '),
        }}
      />
      {/* Dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(15,31,24,0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 pt-16 lg:pt-24 pb-14 lg:pb-20">
        <div className="max-w-[820px]">
          <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">
            Use cases
          </div>
          <h1 className="font-display font-bold text-ink text-[44px] sm:text-[60px] lg:text-[78px] leading-[0.95] tracking-[-0.035em]">
            Cardly works for every kind of campaign{' '}
            <span className="text-primary">that needs people to share.</span>
          </h1>
          <p className="mt-6 text-ink-soft text-[18px] lg:text-[20px] leading-[1.55] max-w-[680px]">
            Six categories. Real templates. Real card variants. Pick the campaign
            closest to yours and steal the setup.
          </p>
        </div>

        {/* Metric strip */}
        <div
          className="mt-10 lg:mt-14 grid grid-cols-2 sm:grid-cols-4 rounded-2xl overflow-hidden"
          style={{ border: '1px solid #E5E0D4', gap: '1px', background: '#E5E0D4' }}
        >
          {(
            [
              ['12', 'Campaign types shipped'],
              ['8', 'Countries served'],
              ['247K', 'Cards generated'],
              ['< 30s', 'Per attendee'],
            ] as [string, string][]
          ).map(([n, l]) => (
            <div key={l} className="bg-cream p-5 lg:p-6">
              <div className="font-display font-bold text-primary text-[28px] lg:text-[36px] tracking-[-0.03em] leading-none">
                {n}
              </div>
              <div className="mt-2 font-mono text-[10px] tracking-[0.16em] uppercase text-muted">
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Bottom CTA ──────────────────────────────────────────── */
function NotFoundCTA() {
  return (
    <section className="bg-primary text-cream relative overflow-hidden">
      {/* Gold dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(232,197,126,0.12) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="relative mx-auto max-w-[920px] px-5 lg:px-10 py-20 lg:py-24 text-center">
        <h2 className="font-display font-bold text-cream text-[36px] sm:text-[48px] lg:text-[58px] leading-[1.0] tracking-[-0.035em]">
          Don&rsquo;t see your use case?
        </h2>
        <p className="mt-5 text-[17px] lg:text-[18px] leading-[1.55] max-w-[620px] mx-auto" style={{ color: 'rgba(250,246,238,0.75)' }}>
          We&rsquo;ve shipped cards for weddings, baby announcements, awards, retirement
          parties and one volcano expedition. Tell us yours.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="mailto:hello@cardly.app"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-medium transition-colors bg-accent text-primary-dark hover:bg-accent-dark"
          >
            Email us <ArrowRight size={16} strokeWidth={2} />
          </a>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-medium transition-colors"
            style={{ border: '1px solid rgba(250,246,238,0.25)', color: '#FAF6EE' }}
          >
            Start free <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function UseCasesPage() {
  return (
    <>
      <UseCasesHero />
      <UseCasesContent />
      <NotFoundCTA />
    </>
  );
}
