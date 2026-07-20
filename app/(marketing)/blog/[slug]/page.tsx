import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { getPost, POSTS } from '../posts';
import { NewsletterForm } from '../NewsletterForm';

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getPost(params.slug);
  if (!post) {
    return { title: 'Article not found — Eventera' };
  }
  return {
    title: `${post.title} — Eventera Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/blog/${post.slug}`,
      type: 'article',
    },
  };
}

export default function BlogArticlePage({ params }: { params: { slug: string } }) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const related = POSTS.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen" style={{ background: '#FAF6EE' }}>
      {/* Hero */}
      <section className="relative overflow-hidden border-b" style={{ borderColor: '#E5E0D4' }}>
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
          }}
        />
        <div className="relative mx-auto max-w-[760px] px-5 lg:px-10 pt-10 lg:pt-14 pb-8 lg:pb-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-[13px] text-ink-soft hover:text-primary transition-colors mb-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to blog
          </Link>

          <div className="flex items-center gap-3 mb-5">
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] tracking-[0.20em] uppercase"
              style={{ background: 'rgba(31,77,58,0.08)', color: '#1F4D3A' }}
            >
              {post.category}
            </span>
            <span className="text-[11px] tracking-[0.10em] uppercase text-ink-soft">{post.date}</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="text-[11px] tracking-[0.10em] uppercase text-ink-soft">{post.readTime}</span>
          </div>

          <h1 className="font-title font-bold text-ink text-[32px] sm:text-[44px] lg:text-[52px] leading-[1.02]">
            {post.title}
          </h1>
          <p className="mt-5 text-ink-soft text-[17px] lg:text-[19px] leading-[1.55]">
            {post.excerpt}
          </p>
        </div>
      </section>

      {/* Body */}
      <article className="mx-auto max-w-[680px] px-5 lg:px-10 py-12 lg:py-16">
        {post.body.map((block, i) =>
          block.startsWith('## ') ? (
            <h2
              key={i}
              className="font-title font-bold text-ink text-[22px] sm:text-[26px] leading-[1.2] mt-10 mb-4 first:mt-0"
            >
              {block.replace(/^##\s+/, '')}
            </h2>
          ) : (
            <p key={i} className="text-ink text-[16px] lg:text-[17px] leading-[1.75] mb-5">
              {block}
            </p>
          ),
        )}

        {/* Inline CTA */}
        <div
          className="mt-12 rounded-2xl p-7 lg:p-8"
          style={{ background: '#1F4D3A' }}
        >
          <h3 className="font-display font-bold text-[20px] lg:text-[22px] tracking-tight mb-2" style={{ color: '#FAF6EE' }}>
            Give every attendee a card worth sharing.
          </h3>
          <p className="text-[14px] leading-[1.6] mb-5" style={{ color: 'rgba(250,246,238,0.75)' }}>
            Registration, tickets, check-in, and a personalized Eventera Card for every registrant. Free for your first event.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-medium text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              style={{ background: '#E8C57E', color: '#163828' }}
            >
              Start free <ArrowRight size={14} strokeWidth={2} />
            </Link>
            <Link
              href="/features/eventera-card"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full font-medium text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              style={{ color: '#FAF6EE', border: '1px solid rgba(250,246,238,0.25)' }}
            >
              See the Eventera Card
            </Link>
          </div>
        </div>
      </article>

      {/* Related posts */}
      <section className="mx-auto max-w-[1200px] px-5 lg:px-10 pb-16 lg:pb-20" style={{ borderTop: '1px solid #E5E0D4' }}>
        <div className="pt-12 lg:pt-16">
          <div className="text-[11px] tracking-[0.22em] text-primary uppercase mb-8">Keep reading</div>
          <div className="grid sm:grid-cols-3 gap-5">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/blog/${r.slug}`}
                className="group flex flex-col bg-surface rounded-2xl p-6 transition-shadow hover:shadow-md h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                style={{ border: '1px solid #E5E0D4' }}
              >
                <span className="text-[9px] tracking-[0.18em] uppercase text-ink-soft mb-3">{r.category}</span>
                <h3 className="font-display font-bold text-ink text-[16px] leading-[1.2] tracking-tight mb-3 group-hover:text-primary transition-colors">
                  {r.title}
                </h3>
                <span className="mt-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-primary">
                  Read <ArrowRight size={13} strokeWidth={2} className="group-hover:translate-x-0.5 transition" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section style={{ borderTop: '1px solid #E5E0D4' }}>
        <div className="mx-auto max-w-[680px] px-5 py-16 text-center">
          <div className="text-[11px] tracking-[0.22em] text-primary uppercase mb-4">Stay in the loop</div>
          <h2 className="font-title font-bold text-ink text-[28px] sm:text-[34px] leading-[1.05] mb-4">
            New posts, straight to you.
          </h2>
          <p className="text-ink-soft text-[15px] leading-[1.6] mb-7 max-w-[440px] mx-auto">
            No spam. One email when we publish something worth reading. Unsubscribe any time.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
