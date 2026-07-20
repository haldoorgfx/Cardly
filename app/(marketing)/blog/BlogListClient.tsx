'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Reveal from '@/components/marketing/Reveal';
import { POSTS, CATEGORIES, type BlogPost } from './posts';

/* ── Featured post ───────────────────────────────────────── */
function FeaturedPost({ post }: { post: BlogPost }) {
  return (
    <Reveal>
      <Link
        href={`/blog/${post.slug}`}
        className="group grid lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-center rounded-3xl p-8 lg:p-10 transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        style={{ border: '1px solid #E5E0D4', background: '#FFFFFF' }}
      >
        <div>
          <div className="flex items-center gap-3 mb-5">
            <span
              className="text-[9px] tracking-[0.22em] uppercase px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(31,77,58,0.08)', color: '#1F4D3A' }}
            >
              Featured
            </span>
            <span
              className="text-[9px] tracking-[0.22em] uppercase px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(232,197,126,0.15)', color: '#C9A45E' }}
            >
              {post.category}
            </span>
          </div>
          <h2 className="font-title font-bold text-ink text-[26px] sm:text-[32px] lg:text-[36px] leading-[1.05] mb-4 group-hover:text-primary transition-colors">
            {post.title}
          </h2>
          <p className="text-ink-soft text-[15px] lg:text-[16px] leading-[1.65] mb-6">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] tracking-[0.14em] uppercase text-ink-soft">{post.date}</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="text-[10px] tracking-[0.14em] uppercase text-ink-soft">{post.readTime}</span>
          </div>
        </div>

        <div
          className="rounded-2xl aspect-[4/3] relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #163828 0%, #1F4D3A 55%, #2A6A50 100%)' }}
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
            }}
          />
          <div className="absolute inset-0 flex items-end p-6">
            <span
              className="inline-flex items-center gap-2 font-medium text-[13px] transition-colors px-4 py-2.5 rounded-full group-hover:gap-3"
              style={{ background: 'rgba(250,246,238,0.12)', color: '#FAF6EE', border: '1px solid rgba(250,246,238,0.20)' }}
            >
              Read article <ArrowRight size={14} strokeWidth={2} />
            </span>
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

/* ── Post card ───────────────────────────────────────────── */
function PostCard({ post, delay }: { post: BlogPost; delay: number }) {
  return (
    <Reveal delay={delay}>
      <Link
        href={`/blog/${post.slug}`}
        className="group flex flex-col bg-surface rounded-2xl overflow-hidden transition-shadow hover:shadow-md h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        style={{ border: '1px solid #E5E0D4' }}
      >
        <div
          className="h-[140px] relative"
          style={{ background: '#1F4D3A' }}
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
            }}
          />
          <div className="absolute top-4 left-4">
            <span
              className="text-[9px] tracking-[0.18em] uppercase px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(250,246,238,0.15)', color: '#FAF6EE', border: '1px solid rgba(250,246,238,0.20)' }}
            >
              {post.category}
            </span>
          </div>
        </div>

        <div className="p-6 flex flex-col flex-1">
          <h3 className="font-display font-bold text-ink text-[17px] lg:text-[18px] leading-[1.15] tracking-tight mb-3 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
          <p className="text-ink-soft text-[13px] leading-[1.6] mb-5 flex-1">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between mt-auto pt-4" style={{ borderTop: '1px solid #E5E0D4' }}>
            <div className="flex items-center gap-3">
              <span className="text-[9px] tracking-[0.14em] uppercase text-ink-soft">{post.date}</span>
              <span className="h-1 w-1 rounded-full" style={{ background: '#E5E0D4' }} />
              <span className="text-[9px] tracking-[0.14em] uppercase text-ink-soft">{post.readTime}</span>
            </div>
            <ArrowRight size={14} strokeWidth={2} className="text-ink-soft group-hover:text-primary group-hover:translate-x-0.5 transition" />
          </div>
        </div>
      </Link>
    </Reveal>
  );
}

/* ── Main list with working category filter ──────────────── */
export function BlogListClient() {
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>('All');

  const visible = useMemo(
    () => (active === 'All' ? POSTS : POSTS.filter((p) => p.category === active)),
    [active],
  );

  const featured = visible.find((p) => p.featured);
  const rest = visible.filter((p) => !p.featured);

  return (
    <>
      {/* Category filter */}
      <section className="mx-auto max-w-[1200px] px-5 lg:px-10 pt-10 lg:pt-12">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter posts by category">
          {CATEGORIES.map((cat) => {
            const isActive = active === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                aria-pressed={isActive}
                className="px-4 py-2 rounded-full text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                style={
                  isActive
                    ? { background: '#1F4D3A', color: '#FAF6EE' }
                    : { border: '1px solid #E5E0D4', color: '#3A4A42', background: '#FFFFFF' }
                }
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured (only when present in the active filter) */}
      {featured && (
        <section className="mx-auto max-w-[1200px] px-5 lg:px-10 pt-10 lg:pt-12">
          <FeaturedPost post={featured} />
        </section>
      )}

      {/* Grid */}
      <section className="mx-auto max-w-[1200px] px-5 lg:px-10 py-12 lg:py-16">
        <div className="text-[11px] tracking-[0.22em] text-primary uppercase mb-8">
          {active === 'All' ? 'All posts' : `${active} posts`}
        </div>

        {rest.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rest.map((post, i) => (
              <PostCard key={post.slug} post={post} delay={i * 70} />
            ))}
          </div>
        ) : (
          !featured && (
            <div
              className="rounded-2xl px-8 py-14 text-center"
              style={{ border: '1px solid #E5E0D4', background: 'rgba(250,246,238,0.5)' }}
            >
              <div className="font-display font-semibold text-ink text-[18px] tracking-tight mb-2">
                No posts in {active} yet
              </div>
              <p className="text-ink-soft text-[14px] mb-6">
                We&apos;re still writing for this topic. Try another category.
              </p>
              <button
                type="button"
                onClick={() => setActive('All')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-[13px] transition-colors bg-primary text-cream hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                Show all posts <ArrowRight size={13} strokeWidth={2} />
              </button>
            </div>
          )
        )}
      </section>
    </>
  );
}
