'use client';

import { useState } from 'react';
import { Clock, Send, X, Pin, Info, Loader2 } from 'lucide-react';

interface Post {
  id: string;
  body: string;
  image_url?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  is_pinned?: boolean;
  created_at?: string;
}

interface Props {
  eventId: string;
  eventName: string;
  initialPosts: Post[];
  deletePost: (postId: string) => Promise<{ ok?: boolean; error?: string }>;
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
}

export function NewsfeedClient({ eventId, eventName, initialPosts, deletePost }: Props) {
  const [published, setPublished] = useState<Post[]>(initialPosts.filter(p => p.published_at));
  const [scheduled, setScheduled] = useState<Post[]>(initialPosts.filter(p => p.scheduled_at && !p.published_at));
  const [body, setBody] = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isScheduling = scheduleOpen && !!scheduleAt;

  async function submit() {
    if (!body.trim() || posting) return;
    setPosting(true);
    setError(null);
    try {
      const scheduled_at = isScheduling ? new Date(scheduleAt).toISOString() : null;
      const res = await fetch(`/api/events/${eventId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, scheduled_at }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? 'Could not publish the post.');
        return;
      }
      if (data.published_at) {
        setPublished(prev => [data, ...prev]);
      } else {
        setScheduled(prev => [data, ...prev].sort((a, b) =>
          new Date(a.scheduled_at ?? 0).getTime() - new Date(b.scheduled_at ?? 0).getTime()));
      }
      setBody('');
      setScheduleAt('');
      setScheduleOpen(false);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setPosting(false);
    }
  }

  async function removeScheduled(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      const res = await deletePost(id);
      if (res.error) { setError(res.error); return; }
      setScheduled(prev => prev.filter(p => p.id !== id));
    } catch {
      setError('Could not delete the scheduled post.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex-1 p-6 max-w-5xl">
      <h1 className="font-display font-bold text-[26px] mb-6" style={{ color: '#0F1F18', letterSpacing: '-0.025em' }}>
        Event newsfeed
      </h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Composer + Scheduled + Published */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Composer */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Post an update to all attendees…"
              rows={4}
              className="w-full px-5 pt-4 pb-3 text-[14px] outline-none resize-none"
              style={{ color: '#0F1F18', background: 'transparent' }}
            />
            {scheduleOpen && (
              <div className="px-4 pb-2 flex items-center gap-2">
                <Clock size={13} style={{ color: '#6B7A72' }} />
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  min={new Date().toISOString().slice(0, 16)}
                  onChange={e => setScheduleAt(e.target.value)}
                  className="text-[13px] rounded-lg px-2.5 py-1.5 outline-none"
                  style={{ border: '1px solid #E5E0D4', color: '#0F1F18', background: '#FAF6EE' }}
                />
                {scheduleAt && (
                  <button onClick={() => setScheduleAt('')} className="text-[12px]" style={{ color: '#6B7A72' }}>Clear</button>
                )}
              </div>
            )}
            <div className="flex items-center gap-1 px-4 pb-3 pt-2 border-t" style={{ borderColor: '#E5E0D4' }}>
              <button onClick={() => setScheduleOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium transition hover:bg-[#FAF6EE]"
                style={{ color: scheduleOpen ? '#1F4D3A' : '#6B7A72', background: scheduleOpen ? '#E8EFEB' : 'transparent' }}>
                <Clock size={13} /> Schedule
              </button>
              <div className="flex-1" />
              <button
                onClick={submit}
                disabled={!body.trim() || posting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-40"
                style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
                {posting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                {isScheduling ? 'Schedule' : 'Post now'}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[13px] px-4 py-2.5 rounded-xl" style={{ background: 'rgba(184,66,60,0.08)', color: '#B8423C' }}>{error}</p>
          )}

          {/* Scheduled posts */}
          {scheduled.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-semibold text-[14px]" style={{ color: '#0F1F18' }}>Scheduled</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ background: '#E8EFEB', color: '#1F4D3A' }}>
                  {scheduled.length} queued
                </span>
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
                {scheduled.map((p, i) => (
                  <div key={p.id} className="flex items-start gap-4 px-5 py-4"
                    style={{ background: '#FFFFFF', borderBottom: i < scheduled.length - 1 ? '1px solid #E5E0D4' : 'none' }}>
                    <div className="shrink-0 mt-0.5">
                      <div className="text-[11px] font-semibold" style={{ color: '#3A4A42' }}>
                        {p.scheduled_at ? fmtDateTime(p.scheduled_at) : '—'}
                      </div>
                    </div>
                    <p className="flex-1 text-[13px] line-clamp-2" style={{ color: '#3A4A42' }}>{p.body}</p>
                    <button onClick={() => removeScheduled(p.id)} disabled={deletingId === p.id}
                      aria-label="Delete scheduled post"
                      className="shrink-0 w-10 h-10 rounded-md flex items-center justify-center transition hover:bg-[rgba(184,66,60,0.08)] disabled:opacity-50"
                      style={{ color: '#B8423C' }}>
                      {deletingId === p.id ? <Loader2 size={13} className="animate-spin" /> : <X size={14} />}
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
              Schedule your day-of posts the night before — they land better than in-the-moment blasts.
            </p>
          </div>

          {/* Published posts */}
          {published.length > 0 ? (
            <div>
              <div className="font-semibold text-[14px] mb-3" style={{ color: '#0F1F18' }}>Published</div>
              <div className="space-y-3">
                {published.map(p => (
                  <div key={p.id} className="rounded-2xl px-5 py-4" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px]" style={{ color: '#6B7A72' }}>
                        {p.published_at ? fmtTime(p.published_at) : '—'}
                      </span>
                      {p.is_pinned && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
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
          ) : scheduled.length === 0 && (
            <div className="rounded-2xl px-5 py-12 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
              <p className="text-[14px] font-medium mb-1" style={{ color: '#0F1F18' }}>No updates yet</p>
              <p className="text-[13px]" style={{ color: '#3A4A42' }}>Post your first announcement above — it reaches every attendee.</p>
            </div>
          )}
        </div>

        {/* Right: Live preview */}
        <div className="w-full lg:w-72 lg:shrink-0">
          <div className="lg:sticky lg:top-4">
            <p className="text-[11px] font-semibold mb-2" style={{ color: '#6B7A72', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Live preview — what attendees see
            </p>
            <div className="rounded-2xl overflow-hidden" style={{ background: '#0F1F18', border: '1px solid #163828' }}>
              {/* Feed header */}
              <div className="px-4 pt-4 pb-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                <div className="font-display font-bold text-[15px]" style={{ color: '#FAF6EE' }}>{eventName}</div>
                <div className="text-[10px] font-semibold tracking-widest mt-0.5" style={{ color: '#E8C57E' }}>
                  FEED
                </div>
              </div>

              {/* Preview posts — real published posts */}
              <div className="px-4 py-3 space-y-4">
                {published.length === 0 ? (
                  <p className="text-[12px] py-6 text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Published posts appear here.
                  </p>
                ) : (
                  published.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold"
                        style={{ background: 'linear-gradient(135deg,#1F4D3A,#2A6A50)', color: '#FAF6EE' }}>
                        {eventName[0]?.toUpperCase() ?? 'E'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[11px] font-semibold" style={{ color: '#FAF6EE' }}>{eventName}</span>
                          {p.is_pinned && (
                            <span className="text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded"
                              style={{ background: '#E8C57E20', color: '#E8C57E' }}>PINNED</span>
                          )}
                          <span className="text-[10px] ml-auto" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            {p.published_at ? fmtTime(p.published_at) : ''}
                          </span>
                        </div>
                        <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{p.body}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
