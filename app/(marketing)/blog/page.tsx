import { NewsletterSectionClient } from './NewsletterSectionClient';
import { BlogListClient } from './BlogListClient';

export const metadata = {
  title: 'Blog',
  description:
    'Thoughts on campaigns, design, and building for Africa. Published by the Eventera team.',
};

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
        }}
      />
      <div className="relative mx-auto max-w-[1200px] px-5 lg:px-10 pt-14 lg:pt-20 pb-12 lg:pb-16">
        <div className="text-[11px] tracking-[0.22em] text-primary uppercase mb-5">
          Blog
        </div>
        <h1 className="font-title font-bold text-ink text-[44px] sm:text-[60px] lg:text-[72px] leading-[0.95] max-w-[820px]">
          Thoughts on campaigns,{' '}
          <span className="text-primary">design, and Africa.</span>
        </h1>
        <p className="mt-5 text-ink-soft text-[17px] lg:text-[18px] leading-[1.55] max-w-[520px]">
          Published by the Eventera team. No growth-hacking fluff — just what we&apos;re learning building the product.
        </p>
      </div>
    </section>
  );
}

export default function BlogPage() {
  return (
    <>
      <BlogHero />
      <BlogListClient />
      <NewsletterSectionClient />
    </>
  );
}
