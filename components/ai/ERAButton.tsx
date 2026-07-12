'use client';

import { useState } from 'react';
import { Sparkles, Lock, X, Check, ChevronRight } from 'lucide-react';

interface Props {
  label?: string;
  plan: 'free' | 'pro' | 'studio';
  onFetch: () => Promise<string>;
  onApply: (result: string) => void;
  requiresStudio?: boolean;
  /** Override the default top-margin wrapper class (default: 'mt-2'). Pass '' to remove. */
  wrapperClassName?: string;
}

/* Shared ERA badge — small pill with gradient bg */
function ERABadge({ locked = false }: { locked?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-[3px] shrink-0"
      style={{
        background: locked
          ? 'linear-gradient(135deg, #9AA89F 0%, #B8B2A2 100%)'
          : 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 100%)',
        color: 'white',
        borderRadius: '5px',
        fontSize: '10px',
        fontWeight: 700,
        padding: '2px 6px',
        letterSpacing: '0.07em',
        lineHeight: 1,
        boxShadow: locked ? 'none' : '0 1px 4px rgba(31,77,58,0.35)',
      }}
    >
      {locked
        ? <Lock size={8} strokeWidth={2.5} />
        : <Sparkles size={8} strokeWidth={2.5} />
      }
      ERA
    </span>
  );
}

export function ERAButton({ label = 'ERA', plan, onFetch, onApply, requiresStudio = false, wrapperClassName }: Props) {
  const mt = wrapperClassName !== undefined ? wrapperClassName : 'mt-2';
  const mtResult = wrapperClassName !== undefined ? wrapperClassName : 'mt-3';

  const [state, setState] = useState<'idle' | 'loading' | 'result' | 'error'>('idle');
  const [result, setResult] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const isLocked = requiresStudio ? plan !== 'studio' : (plan !== 'pro' && plan !== 'studio');

  /* ── Locked ──────────────────────────────────────────────────────────────── */
  if (isLocked) {
    return (
      <div
        className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 rounded-xl ${mt}`}
        style={{ background: 'rgba(232,197,126,0.07)', border: '1px solid rgba(232,197,126,0.28)' }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ERABadge locked />
          <span className="text-[12px] font-medium truncate" style={{ color: '#6B7A72' }}>
            {label} — {requiresStudio ? 'Studio' : 'Pro'} feature
          </span>
        </div>
        <a
          href="/settings/billing"
          className="inline-flex items-center gap-0.5 text-[12px] font-semibold shrink-0 px-3 rounded-lg transition-all"
          style={{ background: '#E8C57E', color: '#0F1F18', height: '28px', lineHeight: 1 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#C9A45E'; e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#E8C57E'; e.currentTarget.style.color = '#0F1F18'; }}
        >
          Upgrade
          <ChevronRight size={11} strokeWidth={2.5} />
        </a>
      </div>
    );
  }

  /* ── Fetch ───────────────────────────────────────────────────────────────── */
  async function handleClick() {
    setState('loading');
    setErrorMsg('');
    try {
      const text = await onFetch();
      setResult(text);
      setState('result');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setErrorMsg(
        msg === 'ERA_UPGRADE_REQUIRED' || msg === 'ERA_STUDIO_REQUIRED'
          ? 'Your plan does not include this ERA feature.'
          : 'ERA is unavailable right now. Try again in a moment.'
      );
      setState('error');
    }
  }

  /* ── Idle ────────────────────────────────────────────────────────────────── */
  if (state === 'idle') {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 rounded-xl text-[13px] font-semibold transition-all ${mt}`}
        style={{
          height: '36px',
          padding: '0 14px',
          background: 'linear-gradient(135deg, rgba(31,77,58,0.05) 0%, rgba(232,197,126,0.07) 100%)',
          border: '1px solid rgba(31,77,58,0.2)',
          color: '#1F4D3A',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(31,77,58,0.1) 0%, rgba(232,197,126,0.12) 100%)';
          e.currentTarget.style.borderColor = 'rgba(31,77,58,0.35)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(31,77,58,0.05) 0%, rgba(232,197,126,0.07) 100%)';
          e.currentTarget.style.borderColor = 'rgba(31,77,58,0.2)';
        }}
      >
        <ERABadge />
        {label}
      </button>
    );
  }

  /* ── Loading ─────────────────────────────────────────────────────────────── */
  if (state === 'loading') {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-xl ${mt}`}
        style={{ height: '36px', padding: '0 14px', border: '1px solid rgba(31,77,58,0.15)', background: 'rgba(31,77,58,0.03)' }}
      >
        <ERABadge />
        <span className="text-[13px]" style={{ color: '#6B7A72' }}>Thinking&hellip;</span>
        <svg className="animate-spin shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1F4D3A" strokeWidth="2.5">
          <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────────────────────────────── */
  if (state === 'error') {
    return (
      <div className={`flex items-start gap-3 px-4 py-3 rounded-xl ${mt}`} style={{ background: 'rgba(184,66,60,0.05)', border: '1px solid rgba(184,66,60,0.18)' }}>
        <ERABadge />
        <div className="flex-1 min-w-0">
          <p className="text-[12px]" style={{ color: '#6B7A72' }}>{errorMsg}</p>
        </div>
        <button onClick={() => setState('idle')} className="text-[12px] font-semibold shrink-0 transition" style={{ color: '#1F4D3A' }}
          onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline'; }}
          onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none'; }}>
          Try again
        </button>
      </div>
    );
  }

  /* ── Not configured ──────────────────────────────────────────────────────
   * ERA gracefully returns a "not set up yet" message when GOOGLE_AI_KEY is
   * missing. That's not a suggestion — show it as an info note, never with an
   * Apply button (there's nothing to apply). */
  const notConfigured = /^ERA is (not set up|unavailable|not available)/i.test(result.trim());
  if (notConfigured) {
    return (
      <div
        className={`flex flex-wrap items-start gap-x-3 gap-y-2 px-3.5 py-3 rounded-xl ${mtResult}`}
        style={{ background: 'rgba(232,197,126,0.08)', border: '1px solid rgba(232,197,126,0.3)' }}
      >
        <div className="flex items-start gap-2.5 flex-1 min-w-[180px]">
          <span className="mt-0.5"><ERABadge locked /></span>
          <p className="text-[12.5px] min-w-0" style={{ color: '#6B7A72', lineHeight: 1.55 }}>{result}</p>
        </div>
        <button
          onClick={() => { setState('idle'); setResult(''); }}
          className="shrink-0 rounded-lg p-1 transition hover:bg-[rgba(232,197,126,0.18)]"
          style={{ color: '#6B7A72' }}
          aria-label="Dismiss"
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>
    );
  }

  /* ── Result ──────────────────────────────────────────────────────────────── */
  return (
    <div
      className={`w-full rounded-xl overflow-hidden ${mtResult}`}
      style={{ border: '1px solid rgba(31,77,58,0.18)', boxShadow: '0 2px 16px rgba(31,77,58,0.08)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 100%)' }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={13} strokeWidth={2} color="white" style={{ opacity: 0.9 }} />
          <span className="text-[11px] font-bold tracking-[0.1em] uppercase" style={{ color: 'rgba(255,255,255,0.88)' }}>
            ERA Suggestion
          </span>
        </div>
        <button
          onClick={() => setState('idle')}
          className="rounded-lg transition"
          style={{ color: 'rgba(255,255,255,0.6)', padding: '2px' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'white'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
        >
          <X size={13} strokeWidth={2} />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-3.5" style={{ background: '#F5F9F6' }}>
        <p className="text-[13px] whitespace-pre-wrap" style={{ color: '#0F1F18', lineHeight: 1.7 }}>{result}</p>
      </div>

      {/* Actions */}
      <div
        className="flex flex-wrap gap-2 px-4 py-3"
        style={{ borderTop: '1px solid rgba(31,77,58,0.1)', background: 'white' }}
      >
        <button
          onClick={() => { onApply(result); setState('idle'); setResult(''); }}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[12px] font-semibold text-white transition hover:opacity-90"
          style={{ background: '#1F4D3A' }}
        >
          <Check size={12} strokeWidth={2.5} />
          Apply
        </button>
        <button
          onClick={() => { setState('idle'); setResult(''); }}
          className="inline-flex items-center h-9 px-4 rounded-lg text-[12px] font-medium transition hover:bg-[#F5F5F0]"
          style={{ background: 'white', border: '1px solid #E5E0D4', color: '#3A4A42' }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
