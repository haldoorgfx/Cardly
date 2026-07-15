'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, Calendar, MapPin } from 'lucide-react';

interface Props {
  slug: string;
  pageId: string;
  title: string;
  coverUrl: string | null;
  startsAt: string | null;
  city: string | null;
  currentCount: number;
}

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

export default function WaitlistJoinClient({ slug, title, coverUrl, startsAt, city, currentCount }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [position, setPosition] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${slug}/waitlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return; }
      setPosition(data.position);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const dateStr = fmtDate(startsAt);

  return (
    <div className="max-w-[480px] mx-auto px-5 py-12 pb-24">
      {/* Event context card */}
      <div
        className="rounded-2xl overflow-hidden mb-8"
        style={{ border: '1px solid #E5E0D4' }}
      >
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt={title} className="w-full h-32 object-cover" />
        ) : (
          <div className="w-full h-32" style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 60%, #E8C57E 100%)' }} />
        )}
        <div className="px-5 py-4" style={{ background: '#FFFFFF' }}>
          <div className="font-display font-semibold text-[18px] mb-2" style={{ color: '#0F1F18', letterSpacing: '-0.015em' }}>
            {title}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]" style={{ color: '#6B7A72', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {dateStr && (
              <span className="flex items-center gap-1.5">
                <Calendar size={11} style={{ color: '#6B7A72' }} /> {dateStr}
              </span>
            )}
            {city && (
              <span className="flex items-center gap-1.5">
                <MapPin size={11} style={{ color: '#6B7A72' }} /> {city}
              </span>
            )}
          </div>
        </div>
      </div>

      {position !== null ? (
        /* ── Success state ── */
        <div
          className="rounded-2xl p-8 text-center"
          style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: '#E8EFEB' }}
          >
            <Users size={24} style={{ color: '#0F1F18' }} />
          </div>
          <h1
            className="font-display font-semibold text-[22px] mb-2"
            style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}
          >
            You&rsquo;re on the list
          </h1>
          <p className="text-[14px] mb-1" style={{ color: '#6B7A72' }}>
            Your position
          </p>
          <div
            className="text-[42px] font-medium mb-4"
            style={{ color: '#0F1F18', fontFamily: 'Inter, system-ui, sans-serif', lineHeight: 1.1 }}
          >
            #{position}
          </div>
          <p className="text-[13px] mb-6 leading-relaxed" style={{ color: '#6B7A72' }}>
            We&rsquo;ll email you if a spot opens up. No action needed.
          </p>
          <Link
            href={`/e/${slug}`}
            className="inline-flex items-center h-10 px-5 rounded-xl text-[14px] font-medium transition hover:opacity-90"
            style={{ background: '#1F4D3A', color: '#FFFFFF' }}
          >
            Back to event
          </Link>
        </div>
      ) : (
        /* ── Join form ── */
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}
        >
          {/* Waitlist count context */}
          {currentCount > 0 && (
            <div
              className="flex items-center gap-2.5 rounded-xl px-4 py-3 mb-6 text-[13px]"
              style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#6B7A72' }}
            >
              <Users size={14} style={{ color: '#6B7A72' }} />
              <span>
                <span className="font-medium" style={{ color: '#0F1F18', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {currentCount}
                </span>{' '}
                {currentCount === 1 ? 'person' : 'people'} ahead of you
              </span>
            </div>
          )}

          <h1
            className="font-display font-semibold text-[22px] mb-1.5"
            style={{ color: '#0F1F18', letterSpacing: '-0.02em' }}
          >
            Join the waitlist
          </h1>
          <p className="text-[14px] mb-6" style={{ color: '#6B7A72' }}>
            This event is sold out. Join the queue and we&rsquo;ll notify you if a spot opens.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#0F1F18' }}>
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Your name"
                className="w-full h-11 px-4 rounded-xl text-[14px] outline-none transition"
                style={{ border: '1px solid #E5E0D4', background: '#FAFAF8', color: '#0F1F18' }}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: '#0F1F18' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full h-11 px-4 rounded-xl text-[14px] outline-none transition"
                style={{ border: '1px solid #E5E0D4', background: '#FAFAF8', color: '#0F1F18' }}
              />
            </div>

            {error && (
              <p className="text-[13px]" style={{ color: '#B8423C' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim() || !email.trim()}
              className="h-11 rounded-xl text-[14px] font-medium transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#1F4D3A', color: '#FFFFFF' }}
            >
              {loading ? 'Joining…' : 'Join waitlist'}
            </button>
          </form>

          <div className="mt-5 text-center text-[12px]" style={{ color: '#6B7A72' }}>
            Already registered?{' '}
            <Link href="/my-tickets" className="font-medium hover:underline" style={{ color: '#1F4D3A' }}>
              View my tickets →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
