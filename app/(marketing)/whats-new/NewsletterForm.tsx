'use client';

import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'loading' || status === 'done') return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'whats-new' }),
      });
      setStatus(res.ok ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div
        className="mt-7 flex items-center justify-center gap-2 max-w-[400px] mx-auto px-4 py-3 rounded-full text-[14px] font-medium"
        style={{ background: '#E8EFEB', color: '#1F4D3A' }}
      >
        <Check size={15} strokeWidth={2.4} />
        Thanks — you&apos;re subscribed
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-7 flex flex-col sm:flex-row gap-3 max-w-[400px] mx-auto"
    >
      <input
        type="email"
        required
        value={email}
        onChange={e => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }}
        placeholder="your@email.com"
        className="flex-1 px-4 py-3 rounded-xl text-[14px] text-ink placeholder:text-muted outline-none"
        style={{ background: '#FFFFFF', border: '1px solid transparent' }}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-[14px] transition-colors bg-accent text-primary-dark hover:bg-accent-dark shrink-0 disabled:opacity-60"
      >
        {status === 'loading' ? 'Subscribing…' : <>Subscribe <ArrowRight size={14} strokeWidth={2} /></>}
      </button>
      {status === 'error' && (
        <p className="w-full text-center sm:text-left text-[12px] text-danger">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
