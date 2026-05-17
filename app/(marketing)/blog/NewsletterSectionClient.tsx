'use client';

import { ArrowRight } from 'lucide-react';

export function NewsletterSectionClient() {
  return (
    <section style={{ borderTop: '1px solid #E5E0D4' }}>
      <div className="mx-auto max-w-[680px] px-5 py-16 lg:py-20 text-center">
        <div className="font-mono text-[11px] tracking-[0.22em] text-primary uppercase mb-4">
          Stay in the loop
        </div>
        <h2 className="font-display font-bold text-ink text-[30px] sm:text-[38px] lg:text-[44px] leading-[1.02] tracking-[-0.03em] mb-4">
          New posts, straight to you.
        </h2>
        <p className="text-ink-soft text-[15px] leading-[1.6] mb-7 max-w-[440px] mx-auto">
          No spam. One email when we publish something worth reading. Unsubscribe any time.
        </p>
        <form
          onSubmit={e => e.preventDefault()}
          className="flex flex-col sm:flex-row gap-3 max-w-[420px] mx-auto"
        >
          <input
            type="email"
            required
            placeholder="your@email.com"
            className="flex-1 px-4 py-3 rounded-full text-[14px] text-ink placeholder:text-muted outline-none"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E0D4',
              boxShadow: '0 1px 2px rgba(15,31,24,0.04)',
            }}
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-[14px] transition-colors bg-primary text-cream hover:bg-primary-dark shrink-0"
          >
            Subscribe <ArrowRight size={14} strokeWidth={2} />
          </button>
        </form>
      </div>
    </section>
  );
}
