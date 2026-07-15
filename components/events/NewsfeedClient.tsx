'use client';

import { useState, useRef } from 'react';
import { ImageIcon, Gift, Clock, Send, X, Pin, Info, Heart, MessageCircle } from 'lucide-react';
import { PageShell, PageHeader } from '@/components/dash';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Post = any;

interface Props {
  eventId: string;
  eventName: string;
  initialPosts: Post[];
}

const DEMO_SCHEDULED: Post[] = [
  { id: 's1', body: 'Day 2 starts in one hour — grab coffee at the gold lounge before the AI panel fills up.', scheduled_at: '2026-03-12T08:00:00Z', published_at: null, is_pinned: false },
  { id: 's2', body: 'Lunch is served — vegetarian line is on the terrace side.', scheduled_at: '2026-03-12T12:30:00Z', published_at: null, is_pinned: false },
  { id: 's3', body: 'Closing keynote in 15 minutes. Doors close at 18:00 sharp.', scheduled_at: '2026-03-12T17:45:00Z', published_at: null, is_pinned: false },
];

const DEMO_PUBLISHED: Post[] = [
  { id: 'p1', body: 'Welcome to AfriTech Summit 2026! Wi-Fi: KEMPINSKI-EVENT · code in your welcome email. The full agenda is in your app.', scheduled_at: null, published_at: '2026-03-11T09:12:00Z', is_pinned: true },
  { id: 'p2', body: 'The fintech panel was packed — here\'s the moment the room voted on cross-border rails.', scheduled_at: null, published_at: '2026-03-11T11:40:00Z', is_pinned: false, image_url: null },
];

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
}

export function NewsfeedClient({ eventId, eventName, initialPosts }: Props) {
  const publishedFromDb = initialPosts.filter(p => p.published_at);
  const scheduledFromDb = initialPosts.filter(p => p.scheduled_at && !p.published_at);

  const [published, setPublished] = useState<Post[]>(publishedFromDb.length > 0 ? publishedFromDb : DEMO_PUBLISHED);
  const [scheduled, setScheduled] = useState<Post[]>(scheduledFromDb.length > 0 ? scheduledFromDb : DEMO_SCHEDULED);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function removeScheduled(id: string) {
    setScheduled(prev => prev.filter(p => p.id !== id));
  }

  async function postNow() {
    if (!body.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        const newPost = await res.json();
        setPublished(prev => [newPost, ...prev]);
        setBody('');
      }
    } catch {
      // Optimistic local add
      setPublished(prev => [{
        id: `local-${Date.now()}`, body, published_at: new Date().toISOString(), is_pinned: false,
      }, ...prev]);
      setBody('');
    } finally {
      setPosting(false);
    }
  }

  return (
    <PageShell width="wide">
      <PageHeader title="Event newsfeed" />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Composer + Scheduled */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Composer */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <textarea
              ref={textareaRef}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Post an update to all attendees…"
              rows={4}
              className="w-full px-5 pt-4 pb-3 text-[14px] outline-none resize-none"
              style={{ color: '#0F1F18', background: 'transparent' }}
            />
            <div className="flex items-center gap-1 px-4 pb-3 pt-2 border-t" style={{ borderColor: '#E5E0D4' }}>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition hover:bg-[#FAF6EE]"
                style={{ color: '#65736B' }}>
                <ImageIcon size={13} /> Photo
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition hover:bg-[#FAF6EE]"
                style={{ color: '#65736B' }}>
                <Gift size={13} /> GIF
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition hover:bg-[#FAF6EE]"
                style={{ color: '#65736B' }}>
                <Clock size={13} /> Schedule
              </button>
              <div className="flex-1" />
              <button
                onClick={postNow}
                disabled={!body.trim() || posting}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-40"
                style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
                <Send size={13} /> Post now
              </button>
            </div>
          </div>

          {/* Scheduled posts */}
          {scheduled.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-semibold text-[14px]" style={{ color: '#0F1F18' }}>Scheduled</span>
                <span className="px-2 py-0.5 rounded-full text-[12.5px] font-semibold"
                  style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                  {scheduled.length} queued
                </span>
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
                {scheduled.map((p: Post, i: number) => (
                  <div key={p.id} className="flex items-start gap-4 px-5 py-4"
                    style={{ background: '#FFFFFF', borderBottom: i < scheduled.length - 1 ? '1px solid #E5E0D4' : 'none' }}>
                    <div className="shrink-0 mt-0.5">
                      <div className="text-[12.5px] font-semibold" style={{ color: '#65736B', fontFamily: 'Inter, system-ui, sans-serif' }}>
                        {p.scheduled_at ? fmtDateTime(p.scheduled_at) : '—'}
                      </div>
                    </div>
                    <p className="flex-1 text-[13px] line-clamp-2" style={{ color: '#3A4A42' }}>{p.body}</p>
                    <button onClick={() => removeScheduled(p.id)}
                      className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition hover:bg-[#FAF6EE]"
                      style={{ color: '#C9C3B1' }}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="rounded-2xl px-5 py-4 flex items-start gap-3"
            style={{ background: '#E8EFEB', border: '1px solid #C9E0D4' }}>
            <Info size={15} style={{ color: '#1F4D3A', marginTop: 2, flexShrink: 0 }} />
            <p className="text-[13px]" style={{ color: '#3A4A42', lineHeight: 1.5 }}>
              Posts appear in every attendee&rsquo;s event view and trigger a push to people who opted in.
              Schedule your day-of posts the night before — announcements land better than blasts for in-the-moment updates.
            </p>
          </div>

          {/* Published posts */}
          {published.length > 0 && (
            <div>
              <div className="font-semibold text-[14px] mb-3" style={{ color: '#0F1F18' }}>Published</div>
              <div className="space-y-3">
                {published.map((p: Post) => (
                  <div key={p.id} className="rounded-2xl px-5 py-4" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[12.5px]" style={{ color: '#C9C3B1', fontFamily: 'Inter, system-ui, sans-serif' }}>
                        {p.published_at ? fmtTime(p.published_at) : '—'}
                      </span>
                      {p.is_pinned && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-semibold"
                          style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                          <Pin size={9} /> Pinned
                        </span>
                      )}
                    </div>
                    <p className="text-[14px]" style={{ color: '#3A4A42', lineHeight: 1.5 }}>{p.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Live preview */}
        <div className="w-full lg:w-72 lg:shrink-0">
          <div className="lg:sticky lg:top-4">
            <p className="text-[12.5px] font-semibold mb-2" style={{ color: '#65736B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Live preview — what attendees see
            </p>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0F1F18', border: '1px solid #163828' }}>
              {/* Feed header */}
              <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="font-display font-bold text-[15px]" style={{ color: '#FAF6EE' }}>{eventName}</div>
                <div className="text-[12px] font-semibold tracking-widest mt-0.5" style={{ color: '#E8C57E' }}>
                  FEED · DAY 1
                </div>
              </div>

              {/* Preview posts */}
              <div className="px-4 py-3 space-y-4">
                {[
                  { author: 'Eventera Studio', time: '09:12', body: 'Welcome to AfriTech Summit 2026! Wi-Fi: KEMPINSKI-EVENT · code in your welcome email. The full agenda is in your app.', pinned: true, hearts: 184, comments: 23 },
                  { author: 'Eventera Studio', time: '11:40', body: 'The fintech panel was packed — here\'s the moment the room voted on cross-border rails.', pinned: false, hearts: 97, comments: 11 },
                  { author: 'Leila Haddad', time: '12:05', body: 'Anyone heading to the harbor walk after sessions? Meet at the gold lounge — look for my Eventera Card.', pinned: false, hearts: 31, comments: 8 },
                ].map((post, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[12px] font-bold"
                      style={{ background: 'linear-gradient(135deg,#1F4D3A,#2A6A50)', color: '#FAF6EE' }}>
                      {post.author[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[12.5px] font-semibold" style={{ color: '#FAF6EE' }}>{post.author}</span>
                        {post.pinned && (
                          <span className="text-[11.5px] font-bold tracking-wider px-1.5 py-0.5 rounded"
                            style={{ background: '#E8C57E20', color: '#E8C57E' }}>PINNED</span>
                        )}
                        <span className="text-[12px] ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>{post.time}</span>
                      </div>
                      <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{post.body}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        <span className="inline-flex items-center gap-1"><Heart size={12} strokeWidth={1.8} /> {post.hearts}</span>
                        <span className="inline-flex items-center gap-1"><MessageCircle size={12} strokeWidth={1.8} /> {post.comments}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
