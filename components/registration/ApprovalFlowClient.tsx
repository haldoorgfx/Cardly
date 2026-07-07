'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, ChevronRight, Upload, Check } from 'lucide-react';

interface Question {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'file' | 'select';
  required: boolean;
  options?: string[];
}

interface Props {
  eventId: string;
  eventName: string;
  eventSlug: string;
  coverImage: string | null;
  questions: Question[];
}

type State = 'form' | 'pending';

const STEPS = [
  { label: 'Apply' },
  { label: 'Organizer reviews' },
  { label: 'Confirm seat' },
  { label: 'Eventera Card' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INPUT_STYLE = { background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' } as const;

export function ApprovalFlowClient({ eventId, eventName, eventSlug, questions }: Props) {
  const [state, setState] = useState<State>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const currentStep = state === 'form' ? 0 : 1;

  function setAnswer(id: string, val: string) {
    setAnswers(prev => ({ ...prev, [id]: val }));
    if (fieldErrors[id]) setFieldErrors(p => ({ ...p, [id]: '' }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.__name = 'Full name is required';
    if (!email.trim()) errs.__email = 'Email is required';
    else if (!EMAIL_RE.test(email.trim())) errs.__email = 'Enter a valid email address';
    for (const q of questions) {
      if (q.required && q.type !== 'file' && !answers[q.id]?.trim()) {
        errs[q.id] = `${q.label} is required`;
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          answers: { ...answers, ...fileNames },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'We couldn’t submit your application. Please try again.');
        return;
      }
      setState('pending');
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      {/* Header strip */}
      <div className="px-5 py-4 border-b" style={{ background: '#FFFFFF', borderColor: '#E5E0D4' }}>
        <p className="text-[12px] font-semibold text-center" style={{ color: '#3A4A42' }}>{eventName}</p>
      </div>

      <div className="max-w-lg mx-auto px-5 py-10">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition ${
                  i <= currentStep ? 'bg-[#1F4D3A] text-white' : 'bg-[#E5E0D4] text-[#3A4A42]'
                }`}>
                  {i < currentStep ? <Check size={13} strokeWidth={3} /> : i + 1}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${i <= currentStep ? 'text-[#1F4D3A]' : 'text-[#6B7A72]'}`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-12 sm:w-16 h-px mx-2" style={{ background: i < currentStep ? '#1F4D3A' : '#E5E0D4' }} />
              )}
            </div>
          ))}
        </div>

        {/* STATE 1: Application form */}
        {state === 'form' && (
          <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <h1 className="font-display font-bold text-[22px] mb-1" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
              Apply to attend
            </h1>
            <p className="text-[13px] mb-6" style={{ color: '#3A4A42' }}>
              Complete the form below. The organizer reviews applications before confirming your seat.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Full name */}
              <div>
                <label htmlFor="apply-name" className="block text-[13px] font-semibold mb-1.5" style={{ color: fieldErrors.__name ? '#B8423C' : '#3A4A42' }}>
                  Full name <span style={{ color: '#B8423C' }}>*</span>
                </label>
                <input
                  id="apply-name"
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); if (fieldErrors.__name) setFieldErrors(p => ({ ...p, __name: '' })); }}
                  placeholder="Amina Osman"
                  className="w-full h-11 px-4 rounded-xl text-[16px] outline-none focus:border-[#1F4D3A] focus:ring-[3px] focus:ring-[rgba(31,77,58,0.12)]"
                  style={{ ...INPUT_STYLE, borderColor: fieldErrors.__name ? '#B8423C' : '#E5E0D4' }}
                />
                {fieldErrors.__name && <p className="text-[12px] mt-1 font-medium" style={{ color: '#B8423C' }}>{fieldErrors.__name}</p>}
              </div>
              {/* Email */}
              <div>
                <label htmlFor="apply-email" className="block text-[13px] font-semibold mb-1.5" style={{ color: fieldErrors.__email ? '#B8423C' : '#3A4A42' }}>
                  Email <span style={{ color: '#B8423C' }}>*</span>
                </label>
                <input
                  id="apply-email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); if (fieldErrors.__email) setFieldErrors(p => ({ ...p, __email: '' })); }}
                  placeholder="you@example.com"
                  className="w-full h-11 px-4 rounded-xl text-[16px] outline-none focus:border-[#1F4D3A] focus:ring-[3px] focus:ring-[rgba(31,77,58,0.12)]"
                  style={{ ...INPUT_STYLE, borderColor: fieldErrors.__email ? '#B8423C' : '#E5E0D4' }}
                />
                {fieldErrors.__email && <p className="text-[12px] mt-1 font-medium" style={{ color: '#B8423C' }}>{fieldErrors.__email}</p>}
              </div>

              {/* Organizer questions */}
              {questions.map(q => {
                const err = fieldErrors[q.id];
                return (
                  <div key={q.id}>
                    <label htmlFor={`apply-${q.id}`} className="block text-[13px] font-semibold mb-1.5" style={{ color: err ? '#B8423C' : '#3A4A42' }}>
                      {q.label}
                      {q.required && <span style={{ color: '#B8423C' }}> *</span>}
                    </label>
                    {q.type === 'textarea' ? (
                      <textarea
                        id={`apply-${q.id}`}
                        value={answers[q.id] ?? ''}
                        onChange={e => setAnswer(q.id, e.target.value)}
                        rows={4}
                        placeholder="Share your answer…"
                        className="w-full px-4 py-3 rounded-xl text-[16px] outline-none resize-y focus:border-[#1F4D3A] focus:ring-[3px] focus:ring-[rgba(31,77,58,0.12)]"
                        style={{ ...INPUT_STYLE, borderColor: err ? '#B8423C' : '#E5E0D4' }}
                      />
                    ) : q.type === 'select' && q.options?.length ? (
                      <select
                        id={`apply-${q.id}`}
                        value={answers[q.id] ?? ''}
                        onChange={e => setAnswer(q.id, e.target.value)}
                        className="w-full h-11 px-4 rounded-xl text-[16px] outline-none focus:border-[#1F4D3A] focus:ring-[3px] focus:ring-[rgba(31,77,58,0.12)]"
                        style={{ ...INPUT_STYLE, borderColor: err ? '#B8423C' : '#E5E0D4', color: answers[q.id] ? '#0F1F18' : '#6B7A72' }}
                      >
                        <option value="">Select…</option>
                        {q.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : q.type === 'file' ? (
                      <label
                        htmlFor={`apply-${q.id}`}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition hover:bg-[#FAF6EE]"
                        style={{ borderColor: err ? '#B8423C' : '#E5E0D4', background: '#FFFFFF' }}
                      >
                        <Upload size={15} style={{ color: '#1F4D3A' }} />
                        <span className="text-[14px] truncate" style={{ color: fileNames[q.id] ? '#0F1F18' : '#6B7A72' }}>
                          {fileNames[q.id] ?? 'Choose a file…'}
                        </span>
                        <input
                          id={`apply-${q.id}`}
                          type="file"
                          className="sr-only"
                          onChange={e => {
                            const f = e.target.files?.[0];
                            setFileNames(prev => ({ ...prev, [q.label]: f?.name ?? '' }));
                            if (err) setFieldErrors(p => ({ ...p, [q.id]: '' }));
                          }}
                        />
                      </label>
                    ) : (
                      <input
                        id={`apply-${q.id}`}
                        value={answers[q.id] ?? ''}
                        onChange={e => setAnswer(q.id, e.target.value)}
                        placeholder="Your answer"
                        className="w-full h-11 px-4 rounded-xl text-[16px] outline-none focus:border-[#1F4D3A] focus:ring-[3px] focus:ring-[rgba(31,77,58,0.12)]"
                        style={{ ...INPUT_STYLE, borderColor: err ? '#B8423C' : '#E5E0D4' }}
                      />
                    )}
                    {err && <p className="text-[12px] mt-1 font-medium" style={{ color: '#B8423C' }}>{err}</p>}
                  </div>
                );
              })}

              {error && (
                <div className="px-4 py-3 rounded-xl text-[13px] font-medium" style={{ background: '#FEF2F2', color: '#B8423C', border: '1px solid #FECACA' }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50 mt-2"
                style={{ background: '#1F4D3A', color: '#FAF6EE' }}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  <>Submit application <ChevronRight size={15} /></>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STATE 2: Pending — real success state after a confirmed POST */}
        {state === 'pending' && (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#E8EFEB' }}>
              <Clock size={28} style={{ color: '#1F4D3A' }} />
            </div>
            <h2 className="font-display font-bold text-[22px] mb-2" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
              Application submitted
            </h2>
            <p className="text-[14px] mb-6" style={{ color: '#3A4A42', lineHeight: 1.6 }}>
              Thanks, {name.split(' ')[0] || 'there'}. You&rsquo;re in the queue — the organizer reviews applications and
              you&rsquo;ll get an email at <b style={{ color: '#0F1F18' }}>{email}</b> with their decision.
            </p>
            <Link
              href={`/e/${eventSlug}`}
              className="inline-flex items-center justify-center h-11 px-6 rounded-xl text-[14px] font-semibold transition hover:opacity-90"
              style={{ background: '#1F4D3A', color: '#FAF6EE' }}
            >
              Back to event
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
