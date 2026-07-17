'use client';

import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { describeError } from '@/components/ui/status-state';
import { useToast } from '@/hooks/use-toast';

export function NewsletterForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'loading' || status === 'done') return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'blog' }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'That email could not be subscribed.');
      }
      setStatus('done');
      toast({
        title: 'Subscribed',
        description: "You're on the list — we'll email you when we publish something new.",
        variant: 'success',
      });
    } catch (err) {
      setErrorMsg(describeError(err, 'your subscription'));
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div
        className="flex items-center justify-center gap-2 max-w-[420px] mx-auto px-4 py-3 rounded-full text-[14px] font-medium"
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
      className="flex flex-col sm:flex-row gap-3 max-w-[420px] mx-auto"
    >
      <input
        type="email"
        required
        value={email}
        onChange={e => { setEmail(e.target.value); if (status === 'error') { setStatus('idle'); setErrorMsg(''); } }}
        placeholder="your@email.com"
        className="flex-1 px-4 py-3 rounded-xl text-[14px] text-ink placeholder:text-muted outline-none"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E0D4',
          boxShadow: '0 1px 2px rgba(15,31,24,0.04)',
        }}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium text-[14px] transition-colors bg-primary text-cream hover:bg-primary-dark shrink-0 disabled:opacity-60"
      >
        {status === 'loading' ? 'Subscribing…' : <>Subscribe <ArrowRight size={14} strokeWidth={2} /></>}
      </button>
      {status === 'error' && (
        <p role="alert" className="w-full text-center sm:text-left text-[12px] text-danger">
          {errorMsg}
        </p>
      )}
    </form>
  );
}
