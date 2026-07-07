'use client';

import { useState } from 'react';
import { Check, X, ChevronDown, Upload } from 'lucide-react';

interface Author { name: string; email: string; affiliation: string }

const CATEGORIES = [
  'Engineering & Infrastructure',
  'Design & UX',
  'Business & Entrepreneurship',
  'Policy & Governance',
  'Research & Academia',
];

const INPUT = 'w-full rounded-xl px-4 py-3 text-[15px] outline-none transition';
const INPUT_STYLE = { background: 'white', border: '1px solid #E5E0D4', color: '#0F1F18' };
const INPUT_FOCUS = 'focus:border-[#E8C57E] focus:ring-[3px] focus:ring-[rgba(232,197,126,0.15)]';

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function AbstractSubmissionClient({
  eventSlug,
  eventName,
  deadline,
}: {
  eventSlug: string;
  eventName: string;
  deadline: string;
  daysLeft?: number;
}) {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Step 1
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [kwInput, setKwInput] = useState('');
  const [category, setCategory] = useState('');

  // Step 2
  const [primaryAuthor, setPrimaryAuthor] = useState<Author>({ name: '', email: '', affiliation: '' });
  const [presenting, setPresenting] = useState(true);
  const [coAuthors, setCoAuthors] = useState<Author[]>([]);

  const wordCount = countWords(abstract);
  const maxWords = 400;

  const addKeyword = (kw: string) => {
    const trimmed = kw.trim();
    if (trimmed && !keywords.includes(trimmed) && keywords.length < 8) {
      setKeywords(prev => [...prev, trimmed]);
    }
    setKwInput('');
  };

  const addCoAuthor = () => setCoAuthors(prev => [...prev, { name: '', email: '', affiliation: '' }]);
  const setCoAuthor = (i: number, field: keyof Author, val: string) =>
    setCoAuthors(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
  const removeCoAuthor = (i: number) => setCoAuthors(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/events/cfp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventSlug, title, abstract, keywords, category, primaryAuthor, presenting, coAuthors }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(json.error ?? 'Could not submit your abstract. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setSubmitError('Could not submit your abstract. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const STEPS = ['Paper details', 'Authors', 'Review & submit'];

  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#E8EFEB' }}>
          <Check size={24} strokeWidth={2.5} color="#1F4D3A" />
        </div>
        <h2 className="font-display font-normal text-[28px] mb-3" style={{ color: '#1F4D3A', letterSpacing: '-0.02em' }}>
          Abstract submitted
        </h2>
        <p className="text-[15px] max-w-[440px] mx-auto" style={{ color: '#6B7A72' }}>
          We&apos;ll review your submission and send decisions by email. Thank you for contributing to {eventName}.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex items-center gap-2.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center  text-[12px] shrink-0 transition-colors"
                style={{
                  background: i < step ? '#E8EFEB' : i === step ? '#1F4D3A' : 'transparent',
                  border: `1.5px solid ${i <= step ? '#1F4D3A' : '#E5E0D4'}`,
                  color: i === step ? 'white' : i < step ? '#1F4D3A' : '#6B7A72',
                }}
              >
                {i < step ? <Check size={11} strokeWidth={2.5} /> : i + 1}
              </div>
              <span
                className="text-[13px] font-medium whitespace-nowrap hidden sm:block"
                style={{ color: i <= step ? '#1F4D3A' : '#6B7A72' }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-6 h-px mx-1" style={{ background: '#E5E0D4' }} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — Paper details */}
      {step === 0 && (
        <div className="space-y-5">
          <div>
            <label className="block text-[13px] font-medium mb-2" style={{ color: '#3A4A42' }}>Paper title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter your paper title"
              className={`${INPUT} text-[17px] h-14 ${INPUT_FOCUS}`}
              style={INPUT_STYLE}
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-2" style={{ color: '#3A4A42' }}>Abstract</label>
            <textarea
              value={abstract}
              onChange={e => setAbstract(e.target.value)}
              placeholder="Describe your paper in clear, accessible language…"
              className={`${INPUT} resize-y ${INPUT_FOCUS}`}
              style={{ ...INPUT_STYLE, minHeight: 180, lineHeight: 1.6 }}
            />
            <div
              className=" text-[12px] text-right mt-1.5"
              style={{ color: wordCount > maxWords ? '#B8423C' : wordCount > maxWords * 0.9 ? '#C97A2D' : '#6B7A72' }}
            >
              {wordCount} / {maxWords} words
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-2" style={{ color: '#3A4A42' }}>Keywords</label>
            <div
              className="flex flex-wrap gap-2 p-3 rounded-xl"
              style={{ border: '1px solid #E5E0D4', background: 'white', minHeight: 48 }}
            >
              {keywords.map(kw => (
                <span
                  key={kw}
                  className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[13px] font-medium"
                  style={{ background: '#E8EFEB', color: '#1F4D3A' }}
                >
                  {kw}
                  <button onClick={() => setKeywords(prev => prev.filter(k => k !== kw))}>
                    <X size={11} strokeWidth={2.5} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={kwInput}
                onChange={e => setKwInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(kwInput); } }}
                placeholder={keywords.length === 0 ? 'Add keyword and press Enter' : ''}
                className="flex-1 min-w-[120px] text-[14px] outline-none bg-transparent py-1"
                style={{ color: '#0F1F18' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-2" style={{ color: '#3A4A42' }}>Category</label>
            <div className="relative">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className={`${INPUT} appearance-none pr-10 ${INPUT_FOCUS}`}
                style={INPUT_STYLE}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" color="#6B7A72" />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium mb-2" style={{ color: '#3A4A42' }}>Full paper</label>
            <div
              className="rounded-xl px-4 py-3 flex items-start gap-2.5"
              style={{ border: '1px solid #E5E0D4', background: '#FAF6EE' }}
            >
              <Upload size={16} color="#3A4A42" className="mt-0.5 shrink-0" />
              <span className="text-[13px] leading-relaxed" style={{ color: '#3A4A42' }}>
                Your abstract is all that&apos;s needed to apply. Authors whose abstracts are accepted
                will be emailed a link to upload their full paper (PDF).
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Authors */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <div className="font-display font-medium text-[16px] mb-3" style={{ color: '#1F4D3A' }}>Primary author (you)</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['name', 'email', 'affiliation'] as const).map(f => (
                <input
                  key={f}
                  type={f === 'email' ? 'email' : 'text'}
                  value={primaryAuthor[f]}
                  onChange={e => setPrimaryAuthor(prev => ({ ...prev, [f]: e.target.value }))}
                  placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                  className={`${INPUT} ${INPUT_FOCUS}`}
                  style={INPUT_STYLE}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setPresenting(v => !v)}
              className="flex items-center gap-2.5 mt-4 cursor-pointer"
            >
              <div
                className="relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200"
                style={{ background: presenting ? '#1F4D3A' : '#E5E0D4' }}
              >
                <span
                  className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 mt-0.5"
                  style={{ transform: presenting ? 'translateX(17px)' : 'translateX(2px)' }}
                />
              </div>
              <span className="text-[14px]" style={{ color: '#3A4A42' }}>I am presenting this paper</span>
            </button>
          </div>

          <div>
            <div className="font-display font-medium text-[16px] mb-3" style={{ color: '#1F4D3A' }}>Co-authors</div>
            <div className="space-y-3">
              {coAuthors.map((a, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative">
                  {(['name', 'email', 'affiliation'] as const).map(f => (
                    <input
                      key={f}
                      type={f === 'email' ? 'email' : 'text'}
                      value={a[f]}
                      onChange={e => setCoAuthor(i, f, e.target.value)}
                      placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                      className={`${INPUT} ${INPUT_FOCUS}`}
                      style={INPUT_STYLE}
                    />
                  ))}
                  <button
                    onClick={() => removeCoAuthor(i)}
                    className="absolute -right-6 top-3 text-[#B8423C] hover:text-[#8B1F1F] sm:static sm:col-span-3 sm:w-fit"
                    title="Remove co-author"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addCoAuthor}
              className="mt-3 px-4 py-2 rounded-xl text-[13px] font-medium transition-colors"
              style={{ background: '#E8EFEB', color: '#1F4D3A' }}
            >
              + Add co-author
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Review & submit */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4', background: 'white' }}>
            {[
              { key: 'Title', value: title || '—' },
              { key: 'Abstract', value: abstract ? abstract.slice(0, 120) + '…' : '—' },
              { key: 'Keywords', value: keywords.join(' · ') || '—' },
              { key: 'Category', value: category || '—' },
              {
                key: 'Authors',
                value: [primaryAuthor.name && `${primaryAuthor.name} (${primaryAuthor.affiliation})`, ...coAuthors.filter(a => a.name).map(a => `${a.name} (${a.affiliation})`)].filter(Boolean).join(' · ') || '—',
              },
            ].map((row, i, arr) => (
              <div
                key={row.key}
                className="flex items-start gap-4 px-5 py-4"
                style={{ borderBottom: i < arr.length - 1 ? '1px solid #F0EBE3' : 'none' }}
              >
                <span className="text-[12px] w-24 shrink-0 pt-0.5" style={{ color: '#6B7A72' }}>{row.key}</span>
                <span className="flex-1 text-[14px]" style={{ color: '#0F1F18' }}>{row.value}</span>
                <button
                  onClick={() => setStep(i < 3 ? 0 : 1)}
                  className="text-[12px] shrink-0"
                  style={{ color: '#6B7A72' }}
                >
                  ✎
                </button>
              </div>
            ))}
          </div>

          {submitError && (
            <div
              className="rounded-xl px-4 py-3 text-[13px]"
              style={{ background: 'rgba(184,66,60,0.08)', border: '1px solid rgba(184,66,60,0.35)', color: '#B8423C' }}
            >
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !title || !abstract || !category}
            className="w-full py-3.5 rounded-xl font-display font-medium text-[16px] text-white transition-opacity"
            style={{ background: '#1F4D3A', opacity: submitting || !title || !abstract || !category ? 0.6 : 1 }}
          >
            {submitting ? 'Submitting…' : 'Submit abstract'}
          </button>
          <p className="text-[13px] text-center" style={{ color: '#6B7A72' }}>
            You&apos;ll receive a confirmation email. Deadline: {deadline}.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => setStep(s => s - 1)}
          className="px-5 py-2.5 rounded-xl font-medium text-[14px] transition-colors"
          style={{ visibility: step === 0 ? 'hidden' : 'visible', background: '#E8EFEB', color: '#1F4D3A' }}
        >
          ← Back
        </button>
        {step < 2 && (
          <button
            onClick={() => setStep(s => s + 1)}
            className="ml-auto px-6 py-2.5 rounded-xl font-medium text-[14px] text-white"
            style={{ background: '#1F4D3A' }}
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  );
}
