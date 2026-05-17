import Reveal from '@/components/marketing/Reveal';
import { NewsCTAClient } from './NewsCTAClient';

export const metadata = {
  title: "What's New — Cardly",
  description:
    "A running changelog of everything shipped at Cardly. New features, improvements, and fixes.",
};

type TagType = 'New' | 'Improved' | 'Fix' | 'Breaking';

const TAG_STYLES: Record<TagType, { bg: string; color: string }> = {
  'New':      { bg: 'rgba(31,77,58,0.10)',   color: '#1F4D3A' },
  'Improved': { bg: 'rgba(58,107,140,0.10)', color: '#3A6B8C' },
  'Fix':      { bg: 'rgba(201,122,45,0.10)', color: '#C97A2D' },
  'Breaking': { bg: 'rgba(184,66,60,0.10)',  color: '#B8423C' },
};

interface ChangeEntry {
  version: string;
  date: string;
  headline: string;
  summary: string;
  changes: { tag: TagType; text: string }[];
}

const CHANGELOG: ChangeEntry[] = [
  {
    version: 'v1.4.0',
    date: 'May 14, 2026',
    headline: 'Card variants — run multiple designs from one event',
    summary: 'You can now create multiple card variants under a single event. Each variant gets its own design, zone layout, and slug. Useful for VIP tiers, sponsor packages, and language editions.',
    changes: [
      { tag: 'New',      text: 'Variants tab in the editor — add, rename, and reorder variants' },
      { tag: 'New',      text: 'Variant picker on the attendee page (when more than one variant is active)' },
      { tag: 'New',      text: 'Per-variant analytics: views, downloads, completion rate' },
      { tag: 'Improved', text: 'Event detail page redesigned to show all variants at a glance' },
      { tag: 'Improved', text: 'Publish flow updated — publish individual variants or all at once' },
    ],
  },
  {
    version: 'v1.3.2',
    date: 'May 3, 2026',
    headline: 'Performance improvements and mobile fixes',
    summary: 'A focused release on attendee page performance. Card generation is 35% faster on average, and the mobile photo crop modal is completely rebuilt.',
    changes: [
      { tag: 'Improved', text: 'PNG rendering is 35% faster — moved to a warmed-up render pool' },
      { tag: 'Improved', text: 'Photo crop modal rebuilt — smoother on iOS Safari and Android Chrome' },
      { tag: 'Fix',      text: 'Fixed a rare case where circle crop produced a square output on some Android devices' },
      { tag: 'Fix',      text: 'Fixed font loading delay on attendee pages served in high-latency regions' },
    ],
  },
  {
    version: 'v1.3.0',
    date: 'Apr 22, 2026',
    headline: 'Analytics dashboard',
    summary: 'Designers can now see view counts, download counts, and completion rates per event — live, without needing to refresh.',
    changes: [
      { tag: 'New',      text: 'Analytics tab on every event detail page' },
      { tag: 'New',      text: 'Geo distribution map (country-level, anonymous)' },
      { tag: 'New',      text: 'Completion rate metric: how many viewers started vs. finished a card' },
      { tag: 'Improved', text: 'View and download counts now update in real-time on the dashboard' },
    ],
  },
  {
    version: 'v1.2.1',
    date: 'Apr 10, 2026',
    headline: 'Bug fixes',
    summary: 'Small fixes following the v1.2.0 launch.',
    changes: [
      { tag: 'Fix', text: 'Corrected zone coordinate serialization — zones shifted after save on some canvas sizes' },
      { tag: 'Fix', text: 'Watermark no longer appears on Studio plan downloads' },
      { tag: 'Fix', text: 'Publish page QR code now uses the correct campaign URL' },
    ],
  },
  {
    version: 'v1.2.0',
    date: 'Apr 2, 2026',
    headline: 'Brand kit and custom colors',
    summary: 'Studio plan users can now define a brand kit — primary color, secondary color, and default fonts — that pre-fills the editor for new events.',
    changes: [
      { tag: 'New',      text: 'Brand kit settings page (Studio)' },
      { tag: 'New',      text: 'Color picker in the zone editor for text zones' },
      { tag: 'New',      text: 'Font selector now supports Google Fonts (30 most popular)' },
      { tag: 'Improved', text: 'Onboarding flow simplified — skips zones step if you load a template' },
    ],
  },
  {
    version: 'v1.1.0',
    date: 'Mar 19, 2026',
    headline: 'Undo / redo and keyboard shortcuts',
    summary: 'The canvas editor now has full undo/redo support with 50 history steps. Plus a set of keyboard shortcuts to speed up the editing flow.',
    changes: [
      { tag: 'New',      text: 'Undo/redo — Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z, up to 50 steps' },
      { tag: 'New',      text: 'Keyboard shortcuts: Delete to remove selected zone, Escape to deselect' },
      { tag: 'New',      text: 'Arrow keys nudge selected zone by 1px (hold Shift for 10px)' },
      { tag: 'Improved', text: 'Zone handles are now easier to grab on small zones' },
    ],
  },
  {
    version: 'v1.0.0',
    date: 'Mar 1, 2026',
    headline: 'Initial launch',
    summary: 'Cardly is live. Designers can upload a background, define text and photo zones, publish a campaign link, and let attendees generate their own personalized cards.',
    changes: [
      { tag: 'New', text: 'Upload design background (PNG/JPG, up to 20MB)' },
      { tag: 'New', text: 'Text zones and photo zones with drag/resize editor' },
      { tag: 'New', text: 'Publish campaign — get a link and a QR code' },
      { tag: 'New', text: 'Attendee page — mobile-first, no account required' },
      { tag: 'New', text: 'PNG card generation with sharp on the server side' },
      { tag: 'New', text: 'Free plan watermark, Pro plan watermark-free' },
    ],
  },
];

/* ── Hero ────────────────────────────────────────────────── */
function ChangelogHero() {
  return (
    <section
      className="relative overflow-hidden border-b"
      style={{ borderColor: '#E5E0D4' }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            'radial-gradient(65% 55% at 10% 0%, rgba(31,77,58,0.09), transparent 65%)',
            'radial-gradient(50% 45% at 90% 100%, rgba(232,197,126,0.11), transparent 65%)',
          ].join(', '),
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(rgba(15,31,24,0.045) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 pt-14 lg:pt-20 pb-12 lg:pb-16">
        <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-5">
          Changelog
        </div>
        <h1 className="font-display font-bold text-ink text-[44px] sm:text-[60px] lg:text-[68px] leading-[0.95] tracking-[-0.035em] max-w-[760px]">
          What&rsquo;s new in Cardly
        </h1>
        <p className="mt-5 text-ink-soft text-[17px] lg:text-[18px] leading-[1.55] max-w-[520px]">
          Every feature, fix, and improvement — documented as it ships.
          Subscribe below to get notified about major releases.
        </p>

        {/* Subscribe pill */}
        <Reveal>
          <div className="mt-8 inline-flex items-center gap-3 px-5 py-3 rounded-full" style={{ background: 'rgba(31,77,58,0.07)', border: '1px solid rgba(31,77,58,0.15)' }}>
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <span className="text-[13px] text-ink-soft">
              Latest: <span className="text-ink font-medium">{CHANGELOG[0].headline}</span>
            </span>
            <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">{CHANGELOG[0].date}</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Changelog entries ───────────────────────────────────── */
function ChangelogEntries() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 lg:px-10 py-14 lg:py-20 grid lg:grid-cols-[160px_1fr] gap-10 lg:gap-16 items-start">

      {/* Timeline nav */}
      <aside className="hidden lg:block sticky top-24">
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-4">Releases</div>
        <nav className="space-y-2">
          {CHANGELOG.map((entry) => (
            <a
              key={entry.version}
              href={`#${entry.version}`}
              className="block py-1 border-l-2 pl-3 transition-colors hover:text-primary"
              style={{ borderColor: 'rgba(229,224,212,0.7)', color: '#6B7A72', fontSize: '13px' }}
            >
              <span className="font-mono font-medium">{entry.version}</span>
              <div className="font-mono text-[10px] tracking-[0.10em] mt-0.5" style={{ color: 'rgba(107,122,114,0.6)' }}>
                {entry.date}
              </div>
            </a>
          ))}
        </nav>
      </aside>

      {/* Entries */}
      <div className="space-y-12 lg:space-y-14">
        {CHANGELOG.map((entry, i) => (
          <Reveal key={entry.version} delay={i * 50} distance={16}>
            <article id={entry.version} className="scroll-mt-28">
              {/* Version header */}
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span
                  className="font-mono font-bold text-[13px] tracking-[-0.01em] px-3 py-1 rounded-lg"
                  style={{ background: '#1F4D3A', color: '#FAF6EE' }}
                >
                  {entry.version}
                </span>
                <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
                  {entry.date}
                </span>
              </div>

              <h2 className="font-display font-bold text-ink text-[22px] sm:text-[26px] lg:text-[28px] tracking-[-0.025em] leading-[1.1] mb-3">
                {entry.headline}
              </h2>
              <p className="text-ink-soft text-[15px] lg:text-[16px] leading-[1.7] mb-6">
                {entry.summary}
              </p>

              {/* Change list */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid #E5E0D4' }}
              >
                {entry.changes.map((change, j) => (
                  <div
                    key={j}
                    className="flex items-start gap-3 px-5 py-3.5 bg-surface"
                    style={j < entry.changes.length - 1 ? { borderBottom: '1px solid #E5E0D4' } : {}}
                  >
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[9px] tracking-[0.16em] uppercase shrink-0 mt-0.5"
                      style={{ ...TAG_STYLES[change.tag] }}
                    >
                      {change.tag}
                    </span>
                    <span className="text-ink-soft text-[13px] lg:text-[14px] leading-[1.55]">
                      {change.text}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export default function WhatsNewPage() {
  return (
    <>
      <ChangelogHero />
      <ChangelogEntries />
      <NewsCTAClient />
    </>
  );
}
