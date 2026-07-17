'use client';

import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { describeError } from '@/components/ui/status-state';
import { useToast } from '@/hooks/use-toast';

export function NewsCTAClient() {
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
        body: JSON.stringify({ email, source: 'whats-new' }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'That email could not be subscribed.');
      }
      setStatus('done');
      toast({
        title: 'Subscribed',
        description: "You're on the list — we'll email you release notes.",
        variant: 'success',
      });
    } catch (err) {
      setErrorMsg(describeError(err, 'your subscription'));
      setStatus('error');
    }
  }

  return (
    <section className="bg-primary text-cream relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(232,197,126,0.10) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="relative mx-auto max-w-[760px] px-5 lg:px-10 py-16 lg:py-20 text-center">
        <h2 className="font-title font-bold text-cream text-[30px] sm:text-[40px] lg:text-[48px] leading-[1.02]">
          Get release notes by email.
        </h2>
        <p
          className="mt-4 text-[15px] lg:text-[16px] leading-[1.55] max-w-[460px] mx-auto"
          style={{ color: 'rgba(250,246,238,0.75)' }}
        >
          One email per major release. Never more. Unsubscribe in one click.
        </p>
        {status === 'done' ? (
          <div
            className="mt-7 flex items-center justify-center gap-2 max-w-[400px] mx-auto px-4 py-3 rounded-full text-[14px] font-medium"
            style={{ background: '#E8C57E', color: '#163828' }}
          >
            <Check size={15} strokeWidth={2.4} />
            Thanks — you&apos;re subscribed
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-7 flex flex-col sm:flex-row gap-3 max-w-[400px] mx-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={e => { setEmail(e.target.value); if (status === 'error') { setStatus('idle'); setErrorMsg(''); } }}
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
              <p role="alert" className="w-full text-center text-[12px]" style={{ color: '#E8C57E' }}>
                {errorMsg}
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
