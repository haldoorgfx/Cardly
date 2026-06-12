import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Article',
  description: 'Read the full article on the Karta blog.',
};

export default function BlogArticlePage() {
  return (
    <div className="min-h-screen" style={{ background: '#FAF6EE' }}>
      {/* Hero */}
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
        <div className="relative mx-auto max-w-[760px] px-5 lg:px-10 pt-12 lg:pt-16 pb-10 lg:pb-14">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-primary transition-colors mb-8"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to blog
          </Link>

          <div
            className="inline-flex items-center px-3 py-1 rounded-full font-mono text-[9px] tracking-[0.20em] uppercase mb-5"
            style={{ background: 'rgba(31,77,58,0.08)', color: '#1F4D3A' }}
          >
            Coming soon
          </div>

          <h1 className="font-title font-bold text-ink text-[36px] sm:text-[48px] lg:text-[56px] leading-[1.0] mb-6">
            This article is on its way.
          </h1>
          <p className="text-ink-soft text-[17px] lg:text-[18px] leading-[1.55] max-w-[560px]">
            We&apos;re still writing this one. Subscribe below to be notified when it&apos;s live, or read one of our published pieces.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-medium text-[14px] transition-colors bg-primary text-cream hover:bg-primary-dark"
            >
              Browse all posts <ArrowRight size={14} strokeWidth={2} />
            </Link>
            <a
              href="mailto:hello@cre8so.com"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-medium text-[14px] transition-colors text-ink"
              style={{ border: '1px solid rgba(15,31,24,0.15)' }}
            >
              Email us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
