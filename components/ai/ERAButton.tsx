'use client';

import { useState } from 'react';
import { Sparkles, Lock, X, Check } from 'lucide-react';

interface Props {
  label?: string;
  plan: 'free' | 'pro' | 'studio';
  onFetch: () => Promise<string>;
  onApply: (result: string) => void;
  requiresStudio?: boolean;
}

export function ERAButton({ label = 'ERA', plan, onFetch, onApply, requiresStudio = false }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'result' | 'error'>('idle');
  const [result, setResult] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isLocked = requiresStudio ? plan !== 'studio' : (plan !== 'pro' && plan !== 'studio');

  if (isLocked) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <button
          disabled
          className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-medium"
          style={{ background: '#F5F5F0', border: '1px solid #E5E0D4', color: '#9AA89F', cursor: 'not-allowed', opacity: 0.7 }}
        >
          <Lock size={11} strokeWidth={2} />
          {'✶'} {label} {requiresStudio ? '— Studio feature' : '— Pro feature'}
        </button>
        <a href="/settings/billing" className="text-[11px] font-medium transition" style={{ color: '#C9A45E' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1F4D3A')}
          onMouseLeave={e => (e.currentTarget.style.color = '#C9A45E')}>
          Upgrade &rarr;
        </a>
      </div>
    );
  }

  async function handleClick() {
    setState('loading');
    setErrorMsg('');
    try {
      const text = await onFetch();
      setResult(text);
      setState('result');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setErrorMsg(msg === 'ERA_UPGRADE_REQUIRED' || msg === 'ERA_STUDIO_REQUIRED'
        ? 'Your plan does not include this ERA feature.'
        : 'ERA is unavailable right now. Try again in a moment.');
      setState('error');
    }
  }

  if (state === 'idle') {
    return (
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] font-medium transition mt-2"
        style={{ background: 'transparent', border: '1px solid #1F4D3A', color: '#1F4D3A' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#E8EFEB'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <Sparkles size={11} strokeWidth={2} />
        {'✶'} {label}
      </button>
    );
  }

  if (state === 'loading') {
    return (
      <div className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-[12px] mt-2" style={{ color: '#6B7A72' }}>
        <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
        </svg>
        ERA is thinking&hellip;
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[12px]" style={{ color: '#6B7A72' }}>{errorMsg}</span>
        <button onClick={() => setState('idle')} className="text-[11px] underline" style={{ color: '#1F4D3A' }}>Try again</button>
      </div>
    );
  }

  // state === 'result'
  return (
    <div className="mt-3 rounded-xl p-4" style={{ background: '#F5F9F6', border: '1px solid rgba(31,77,58,0.15)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: '#1F4D3A' }}>{'✶'} ERA suggestion</span>
        <button onClick={() => setState('idle')} style={{ color: '#6B7A72' }}>
          <X size={14} strokeWidth={2} />
        </button>
      </div>
      <p className="text-[13px] mb-3 whitespace-pre-wrap" style={{ color: '#0F1F18', lineHeight: 1.6 }}>{result}</p>
      <div className="flex gap-2">
        <button
          onClick={() => { onApply(result); setState('idle'); setResult(''); }}
          className="inline-flex items-center gap-1.5 h-8 px-4 rounded-lg text-[12px] font-semibold text-white transition"
          style={{ background: '#1F4D3A' }}
        >
          <Check size={11} strokeWidth={2.5} />
          Apply
        </button>
        <button
          onClick={() => { setState('idle'); setResult(''); }}
          className="inline-flex items-center h-8 px-4 rounded-lg text-[12px] font-medium transition"
          style={{ background: 'white', border: '1px solid #E5E0D4', color: '#3A4A42' }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
