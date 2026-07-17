'use client';

import { useState } from 'react';
import { Send, Mail, Clock, Check, ArrowRight, Loader2 } from 'lucide-react';
import { describeError } from '@/components/ui/status-state';
import { useToast } from '@/hooks/use-toast';

const TOPICS = [
  { value: 'General question',     label: 'General question' },
  { value: 'Technical support',    label: 'Technical support' },
  { value: 'Billing / plans',      label: 'Billing / plans' },
  { value: 'Partnership',          label: 'Partnership' },
  { value: 'Demo request',         label: 'Demo request' },
  { value: 'Press inquiry',        label: 'Press inquiry' },
  { value: 'Something else',       label: 'Something else' },
];

const SIDEBAR = [
  {
    icon: <Mail size={18} strokeWidth={1.8} />,
    title: 'Email',
    value: 'hello@eventera.so',
    href: 'mailto:hello@eventera.so',
    desc: 'We reply within one business day.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
      </svg>
    ),
    title: 'WhatsApp',
    value: '+253 77 040 907',
    href: 'https://wa.me/25377040907',
    desc: 'For quick questions and demos.',
  },
  {
    icon: <Clock size={18} strokeWidth={1.8} />,
    title: 'Office hours',
    value: 'Mon – Fri',
    href: null,
    desc: '9:00 AM – 6:00 PM (EAT)',
  },
];

const INPUT_CLASS = `
  w-full px-4 py-3 rounded-xl text-[14px] text-[#0F1F18] placeholder:text-[#65736B]
  outline-none transition-all duration-150
  focus:ring-2 focus:ring-[#1F4D3A]/15 focus:border-[#1F4D3A]/40
`.trim();

const INPUT_STYLE = {
  background: '#FFFFFF',
  border: '1px solid #E5E0D4',
  boxShadow: '0 1px 2px rgba(15,31,24,0.04)',
};

export function ContactFormClient() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? 'Your message could not be sent.');
      }
      setState('sent');
      toast({
        title: 'Message sent',
        description: "We'll get back to you within one business day.",
        variant: 'success',
      });
    } catch (err) {
      setErrorMsg(describeError(err, 'your message'));
      setState('error');
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-8 lg:gap-12 items-start">

      {/* ── Left: Form ─────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl p-7 lg:p-9"
        style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 1px 3px rgba(15,31,24,0.05)' }}
      >
        {state === 'sent' ? (
          /* Success state */
          <div className="py-12 flex flex-col items-center text-center">
            <div
              className="h-16 w-16 rounded-2xl grid place-items-center mb-6"
              style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }}
            >
              <Check size={28} strokeWidth={2.5} className="text-white" />
            </div>
            <h3 className="font-display font-bold text-[24px] text-[#0F1F18] tracking-tight mb-2">
              Message sent
            </h3>
            <p className="text-[15px] text-[#3A4A42] leading-relaxed max-w-[360px]">
              We&apos;ll get back to you within one business day. Check your inbox for a confirmation.
            </p>
            <button
              onClick={() => { setForm({ name: '', email: '', topic: '', message: '' }); setState('idle'); }}
              className="mt-8 inline-flex items-center gap-2 text-[13px] font-medium text-[#1F4D3A] hover:underline"
            >
              <ArrowRight size={13} strokeWidth={2} className="rotate-180" />
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name + Email */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] tracking-[0.16em] uppercase text-[#65736B] mb-2">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Amina Hassan"
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                />
              </div>
              <div>
                <label className="block text-[11px] tracking-[0.16em] uppercase text-[#65736B] mb-2">
                  Work email
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@company.com"
                  className={INPUT_CLASS}
                  style={INPUT_STYLE}
                />
              </div>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-[11px] tracking-[0.16em] uppercase text-[#65736B] mb-2">
                Topic
              </label>
              <select
                value={form.topic}
                onChange={set('topic')}
                className={INPUT_CLASS + ' appearance-none'}
                style={{ ...INPUT_STYLE, color: form.topic ? '#0F1F18' : '#65736B' }}
              >
                <option value="">How can we help?</option>
                {TOPICS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div>
              <label className="block text-[11px] tracking-[0.16em] uppercase text-[#65736B] mb-2">
                Message
              </label>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={set('message')}
                placeholder="Tell us more…"
                className={INPUT_CLASS + ' resize-none'}
                style={INPUT_STYLE}
              />
            </div>

            {/* Error */}
            {state === 'error' && (
              <p role="alert" className="text-[13px]" style={{ color: '#B8423C' }}>{errorMsg}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={state === 'sending'}
              className="inline-flex items-center gap-2.5 h-12 px-7 rounded-xl text-white text-[14px] font-semibold transition hover:opacity-90 disabled:opacity-60"
              style={{ background: '#1F4D3A' }}
            >
              {state === 'sending' ? (
                <Loader2 size={15} strokeWidth={2} className="animate-spin" />
              ) : (
                <Send size={14} strokeWidth={2} />
              )}
              {state === 'sending' ? 'Sending…' : 'Send message'}
            </button>
          </form>
        )}
      </div>

      {/* ── Right: Sidebar ──────────────────────────────────────────────── */}
      <aside className="space-y-3 lg:pt-1">

        {SIDEBAR.map(item => {
          const inner = (
            <div
              className="flex items-start gap-4 p-4 rounded-2xl transition-all"
              style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }}
            >
              <div
                className="h-10 w-10 rounded-xl grid place-items-center shrink-0"
                style={{ background: 'rgba(31,77,58,0.07)', color: '#1F4D3A' }}
              >
                {item.icon}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] tracking-[0.14em] uppercase text-[#65736B] mb-0.5">
                  {item.title}
                </div>
                <div className="text-[14px] font-semibold text-[#0F1F18] truncate">
                  {item.value}
                </div>
                <div className="text-[12px] text-[#3A4A42] mt-0.5">{item.desc}</div>
              </div>
            </div>
          );

          return item.href ? (
            <a key={item.title} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
              className="block group hover:scale-[1.01] transition-transform duration-150">
              {inner}
            </a>
          ) : (
            <div key={item.title}>{inner}</div>
          );
        })}

        {/* Response time */}
        <div
          className="rounded-2xl px-5 py-4 mt-2"
          style={{ background: 'rgba(31,77,58,0.05)', border: '1px solid rgba(31,77,58,0.10)' }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: '#2D7A4F' }} />
            <span className="text-[10px] tracking-[0.16em] uppercase" style={{ color: '#1F4D3A' }}>
              Response time
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-[#3A4A42]">
            We aim to reply within <span className="font-semibold text-[#0F1F18]">one business day</span>.
            For urgent issues, include &quot;urgent&quot; in your subject line.
          </p>
        </div>

      </aside>
    </div>
  );
}
