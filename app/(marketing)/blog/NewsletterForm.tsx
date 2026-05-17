'use client';

import { ArrowRight } from 'lucide-react';

export function NewsletterForm() {
  return (
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
  );
}
