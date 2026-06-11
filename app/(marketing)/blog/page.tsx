import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Reveal from '@/components/marketing/Reveal';
import { NewsletterSectionClient } from './NewsletterSectionClient';

export const metadata = {
  title: 'Blog',
  description:
    'Thoughts on campaigns, design, and building for Africa. Published by the Karta team.',
};

const FEATURED = {
  category: 'Product',
  date: 'May 14, 2026',
  title: 'Why attendee share cards are the most underused campaign tool in Africa',
  excerpt:
    'Every major conference spends thousands on keynote speakers and venue branding. Then every attendee posts a personal photo with no context. We fixed that.',
  readTime: '6 min read',
  slug: '/blog/attendee-share-cards-africa',
};

const POSTS = [
  {
    category: 'Design',
    date: 'May 8, 2026',
    title: 'The zone system: how Karta cards stay on-brand at any scale',
    excerpt: "Behind every personalized card is a coordinate system. Here's how we built zones to give designers control without blocking attendees.",
    readTime: '5 min read',
    slug: '/blog/zone-system-on-brand',
  },
  {
    category: 'Campaigns',
    date: 'Apr 30, 2026',
    title: 'Lessons from 247,000 cards: what makes a campaign go wide',
    excerpt: 'We analysed share patterns across every campaign on Karta. Two things consistently predict whether a card gets shared or sits in a download folder.',
    readTime: '8 min read',
    slug: '/blog/247k-cards-campaign-lessons',
  },
  {
    category: 'Product',
    date: 'Apr 22, 2026',
    title: 'Introducing card variants: run multiple designs from one event link',
    excerpt: 'VIP tiers. Sponsor packages. Language editions. Variants let you serve every audience segment from the same campaign without duplicating your setup.',
    readTime: '4 min read',
    slug: '/blog/card-variants',
  },
  {
    category: 'Africa',
    date: 'Apr 12, 2026',
    title: 'Building for WhatsApp first: lessons from East African campaigns',
    excerpt: 'The social graph in East Africa routes through WhatsApp. We rebuilt our share flow to treat WhatsApp as a first-class surface instead of an afterthought.',
    readTime: '7 min read',
    slug: '/blog/whatsapp-first-east-africa',
  },
  {
    category: 'Design',
    date: 'Mar 28, 2026',
    title: 'Design systems for events: why organizers should think like brand managers',
    excerpt: "A conference is a brand activation. Most organizers manage it like a logistics operation. Here's the mindset shift that changes everything.",
    readTime: '6 min read',
    slug: '/blog/design-systems-for-events',
  },
  {
    category: 'Product',
    date: 'Mar 14, 2026',
    title: 'Karta is now available in 8 countries',
    excerpt: "We quietly expanded storage regions and currency support. Here's what changed and which markets are now fully supported.",
    readTime: '3 min read',
    slug: '/blog/8-countries',
  },
];

const CATEGORIES = ['All', 'Product', 'Design', 'Campaigns', 'Africa'];

/* ── Hero ────────────────────────────────────────────────── */
function BlogHero() {
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
          Blog
        </div>
        <h1 className="font-display font-bold text-ink text-[44px] sm:text-[60px] lg:text-[72px] leading-[0.95] tracking-[-0.035em] max-w-[820px]">
          Thoughts on campaigns,{' '}
          <span className="text-primary">design, and Africa.</span>
        </h1>
        <p className="mt-5 text-ink-soft text-[17px] lg:text-[18px] leading-[1.55] max-w-[520px]">
          Published by the Karta team. No growth-hacking fluff — just what we&apos;re learning building the product.
        </p>

        {/* Category filter (decorative for now) */}
        <Reveal>
          <div className="mt-8 flex flex-wrap gap-2">
            {CATEGORIES.map((cat, i) => (
              <span
                key={cat}
                className="px-4 py-1.5 rounded-full text-[12px] font-medium cursor-pointer transition-colors"
                style={
                  i === 0
                    ? { background: '#1F4D3A', color: '#FAF6EE' }
                    : { border: '1px solid #E5E0D4', color: '#3A4A42' }
                }
              >
                {cat}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── Featured post ───────────────────────────────────────── */
function FeaturedPost() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 lg:px-10 pt-12 lg:pt-16">
      <Reveal>
        <Link
          href={FEATURED.slug}
          className="group grid lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-center rounded-3xl p-8 lg:p-10 transition-shadow hover:shadow-md"
          style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}
        >
          {/* Text */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span
                className="font-mono text-[9px] tracking-[0.22em] uppercase px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(31,77,58,0.08)', color: '#1F4D3A' }}
              >
                Featured
              </span>
              <span
                className="font-mono text-[9px] tracking-[0.22em] uppercase px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(232,197,126,0.15)', color: '#C9A45E' }}
              >
                {FEATURED.category}
              </span>
            </div>
            <h2 className="font-display font-bold text-ink text-[26px] sm:text-[32px] lg:text-[36px] leading-[1.05] tracking-[-0.03em] mb-4 group-hover:text-primary transition-colors">
              {FEATURED.title}
            </h2>
            <p className="text-ink-soft text-[15px] lg:text-[16px] leading-[1.65] mb-6">
              {FEATURED.excerpt}
            </p>
            <div className="flex items-center gap-4">
              <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">{FEATURED.date}</span>
              <span className="h-1 w-1 rounded-full bg-border" />
              <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">{FEATURED.readTime}</span>
            </div>
          </div>

          {/* Illustration placeholder */}
          <div
            className="rounded-2xl aspect-[4/3] relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)' }}
          >
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(232,197,126,0.12) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="absolute inset-0 flex items-end p-6">
              <span
                className="inline-flex items-center gap-2 font-medium text-[13px] transition-colors px-4 py-2.5 rounded-full"
                style={{ background: 'rgba(250,246,238,0.12)', color: '#FAF6EE', border: '1px solid rgba(250,246,238,0.20)' }}
              >
                Read article <ArrowRight size={14} strokeWidth={2} />
              </span>
            </div>
          </div>
        </Link>
      </Reveal>
    </section>
  );
}

/* ── Post grid ───────────────────────────────────────────── */
function PostGrid() {
  return (
    <section className="mx-auto max-w-[1200px] px-5 lg:px-10 py-12 lg:py-16">
      <Reveal>
        <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-8">
          All posts
        </div>
      </Reveal>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {POSTS.map((post, i) => (
          <Reveal key={post.title} delay={i * 70}>
            <Link
              href={post.slug}
              className="group flex flex-col bg-surface rounded-2xl overflow-hidden transition-shadow hover:shadow-md h-full"
              style={{ border: '1px solid #E5E0D4' }}
            >
              {/* Card image strip */}
              <div
                className="h-[140px] relative"
                style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 100%)' }}
              >
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(232,197,126,0.10) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />
                <div className="absolute top-4 left-4">
                  <span
                    className="font-mono text-[9px] tracking-[0.18em] uppercase px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(250,246,238,0.15)', color: '#FAF6EE', border: '1px solid rgba(250,246,238,0.20)' }}
                  >
                    {post.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-display font-bold text-ink text-[17px] lg:text-[18px] leading-[1.15] tracking-tight mb-3 group-hover:text-primary transition-colors">
                  {post.title}
                </h3>
                <p className="text-ink-soft text-[13px] leading-[1.6] mb-5 flex-1">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between mt-auto pt-4" style={{ borderTop: '1px solid #E5E0D4' }}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted">{post.date}</span>
                    <span className="h-1 w-1 rounded-full" style={{ background: '#E5E0D4' }} />
                    <span className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted">{post.readTime}</span>
                  </div>
                  <ArrowRight size={14} strokeWidth={2} className="text-muted group-hover:text-primary group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export default function BlogPage() {
  return (
    <>
      <BlogHero />
      <FeaturedPost />
      <PostGrid />
      <NewsletterSectionClient />
    </>
  );
}
