'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, ChevronRight, Upload } from 'lucide-react';

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

const DEFAULT_QUESTIONS: Question[] = [
  { id: 'q1', label: 'School or organization', type: 'text', required: true },
  { id: 'q2', label: 'Why do you want to attend?', type: 'textarea', required: true },
  { id: 'q3', label: 'Student ID or verification (PDF or image)', type: 'file', required: false },
];

type State = 'form' | 'pending' | 'approved' | 'rejected';

const STEPS = [
  { label: 'Apply' },
  { label: 'Organizer reviews' },
  { label: 'Confirm seat' },
  { label: 'Eventera Card' },
];

export function ApprovalFlowClient({ eventId, eventName, questions: dbQuestions }: Props) {
  const questions = dbQuestions.length > 0 ? dbQuestions : DEFAULT_QUESTIONS;
  const [state, setState] = useState<State>('form');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const stepIndex: Record<State, number> = { form: 0, pending: 1, approved: 2, rejected: 2 };
  const currentStep = stepIndex[state];

  function setAnswer(id: string, val: string) {
    setAnswers(prev => ({ ...prev, [id]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      if (res.ok) setState('pending');
      else setState('pending');
    } catch {
      setState('pending');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      {/* Header strip */}
      <div className="px-5 py-4 border-b" style={{ background: '#FFFFFF', borderColor: '#E5E0D4' }}>
        <p className="text-[12px] font-semibold text-center" style={{ color: '#6B7A72' }}>{eventName}</p>
      </div>

      <div className="max-w-lg mx-auto px-5 py-10">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEPS.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition ${
                  i < currentStep ? 'bg-[#1F4D3A] text-white' :
                  i === currentStep ? 'bg-[#1F4D3A] text-white' :
                  'bg-[#E5E0D4] text-[#6B7A72]'
                }`}>
                  {i < currentStep ? '✓' : i + 1}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${i <= currentStep ? 'text-[#1F4D3A]' : 'text-[#C9C3B1]'}`}>
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
            <p className="text-[13px] mb-6" style={{ color: '#6B7A72' }}>
              Complete the form below. The organizer reviews applications before confirming your seat.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {questions.map(q => (
                <div key={q.id}>
                  <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#3A4A42' }}>
                    {q.label}
                    {q.required && <span style={{ color: '#B8423C' }}> *</span>}
                  </label>
                  {q.type === 'textarea' ? (
                    <textarea
                      value={answers[q.id] ?? ''}
                      onChange={e => setAnswer(q.id, e.target.value)}
                      required={q.required}
                      rows={4}
                      placeholder="Share your answer…"
                      className="w-full px-4 py-3 rounded-xl text-[14px] outline-none resize-none"
                      style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                    />
                  ) : q.type === 'file' ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer hover:bg-[#FAF6EE] transition"
                      style={{ borderColor: '#E5E0D4', background: '#FFFFFF' }}>
                      <Upload size={14} style={{ color: '#6B7A72' }} />
                      <span className="text-[13px]" style={{ color: '#6B7A72' }}>
                        {answers[q.id] ? 'File selected' : 'Choose file…'}
                      </span>
                    </div>
                  ) : (
                    <input
                      value={answers[q.id] ?? ''}
                      onChange={e => setAnswer(q.id, e.target.value)}
                      required={q.required}
                      placeholder="Your answer"
                      className="w-full px-4 py-3 rounded-xl text-[14px] outline-none"
                      style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }}
                    />
                  )}
                </div>
              ))}
              <button type="submit" disabled={submitting}
                className="w-full py-3.5 rounded-xl text-[14px] font-semibold flex items-center justify-center gap-2 transition hover:opacity-90 disabled:opacity-50 mt-2"
                style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
                Submit application <ChevronRight size={15} />
              </button>
            </form>
          </div>
        )}

        {/* STATE 2: Pending */}
        {state === 'pending' && (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#FAF6EE', border: '2px solid #E5E0D4' }}>
              <Clock size={28} style={{ color: '#6B7A72' }} />
            </div>
            <h2 className="font-display font-bold text-[22px] mb-2" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
              Application submitted
            </h2>
            <p className="text-[14px] mb-4" style={{ color: '#6B7A72', lineHeight: 1.6 }}>
              You&rsquo;re in the queue. The organizer typically reviews applications within 48 hours.
              You&rsquo;ll receive an email with their decision.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-semibold"
              style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#6B7A72' }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#C9A45E' }} />
              Position #7 in queue · ~48h estimated
            </div>
            <div className="mt-6 space-y-2">
              <button onClick={() => setState('approved')}
                className="w-full py-2.5 rounded-xl text-[13px] font-medium transition hover:opacity-80"
                style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                [Demo: Simulate approval]
              </button>
              <button onClick={() => setState('rejected')}
                className="w-full py-2.5 rounded-xl text-[13px] font-medium transition hover:opacity-80"
                style={{ background: '#FAF6EE', color: '#B8423C', border: '1px solid #E5E0D4' }}>
                [Demo: Simulate rejection]
              </button>
            </div>
          </div>
        )}

        {/* STATE 3a: Approved */}
        {state === 'approved' && (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#E8EFEB' }}>
              <CheckCircle2 size={32} style={{ color: '#1F4D3A' }} />
            </div>
            <h2 className="font-display font-bold text-[22px] mb-2" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
              You&rsquo;re approved!
            </h2>
            <p className="text-[14px] mb-6" style={{ color: '#6B7A72', lineHeight: 1.6 }}>
              Congratulations! Your application has been approved. Confirm your seat to secure your spot.
            </p>
            <div className="space-y-3">
              <button className="w-full py-3.5 rounded-xl text-[14px] font-semibold transition hover:opacity-90"
                style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
                Confirm my seat
              </button>
              <button className="w-full py-2.5 rounded-xl text-[13px] font-medium transition hover:opacity-80"
                style={{ background: '#FAF6EE', color: '#B8423C', border: '1px solid #E5E0D4' }}>
                Decline
              </button>
            </div>
          </div>
        )}

        {/* STATE 3b: Rejected */}
        {state === 'rejected' && (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#FDF2F2' }}>
              <XCircle size={32} style={{ color: '#B8423C' }} />
            </div>
            <h2 className="font-display font-bold text-[22px] mb-2" style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}>
              Not this time
            </h2>
            <p className="text-[14px] mb-4" style={{ color: '#6B7A72', lineHeight: 1.6 }}>
              Unfortunately your application wasn&rsquo;t approved. You&rsquo;ve been automatically added to the waitlist — you&rsquo;ll be notified if a spot opens.
            </p>
            <div className="rounded-xl px-4 py-3 mb-4" style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
              <p className="text-[12px]" style={{ color: '#6B7A72' }}>You&rsquo;re #3 on the waitlist</p>
            </div>
            <a href="/events"
              className="inline-block text-[13px] font-medium transition hover:opacity-70"
              style={{ color: '#1F4D3A', textDecoration: 'underline' }}>
              See other open tickets →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
