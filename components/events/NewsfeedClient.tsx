'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Pin, Info, Megaphone } from 'lucide-react';
import { PageShell, PageHeader } from '@/components/dash';
import { toast } from '@/hooks/use-toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Post = any;

interface Props {
  eventId: string;
  eventName: string;
  initialPosts: Post[];
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
}

export function NewsfeedClient({ eventId, eventName, initialPosts }: Props) {
  const router = useRouter();
  // Real data only — no seeded demo posts.
  const published = initialPosts.filter(p => p.published_at);
  const scheduled = initialPosts.filter(p => p.scheduled_at && !p.published_at);

  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  async function postNow() {
    if (!body.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: 'Couldn’t post the update', description: data.error ?? 'Please try again.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Posted to attendees', variant: 'success' });
      setBody('');
      router.refresh();
    } catch {
      toast({ title: 'Couldn’t reach the server', description: 'Check your connection and try again.', variant: 'destructive' });
    } finally {
      setPosting(false);
    }
  }

  return (
    <PageShell width="default">
      <PageHeader title="Event newsfeed" subtitle={`Post updates to everyone attending ${eventName}`} />

      <div className="space-y-4">
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
          <div className="flex items-center px-4 pb-3 pt-2 border-t" style={{ borderColor: '#E5E0D4' }}>
            <span className="text-[12px]" style={{ color: '#65736B' }}>Appears in every attendee’s event view.</span>
            <div className="flex-1" />
            <button
              onClick={postNow}
              disabled={!body.trim() || posting}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition hover:opacity-90 disabled:opacity-40"
              style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
              <Send size={13} /> {posting ? 'Posting…' : 'Post now'}
            </button>
          </div>
        </div>

        {/* Scheduled posts (real, read-only) */}
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
                  <div className="shrink-0 mt-0.5 text-[12.5px] font-semibold" style={{ color: '#65736B' }}>
                    {p.scheduled_at ? fmtDateTime(p.scheduled_at) : '—'}
                  </div>
                  <p className="flex-1 text-[13px]" style={{ color: '#3A4A42' }}>{p.body}</p>
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
            Posts appear in every attendee’s event view and trigger a push to people who opted in. Keep them short and timely.
          </p>
        </div>

        {/* Published posts */}
        {published.length > 0 ? (
          <div>
            <div className="font-semibold text-[14px] mb-3" style={{ color: '#0F1F18' }}>Published</div>
            <div className="space-y-3">
              {published.map((p: Post) => (
                <div key={p.id} className="rounded-2xl px-5 py-4" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[12.5px]" style={{ color: '#C9C3B1' }}>
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
        ) : (
          <div className="rounded-2xl py-14 text-center" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <Megaphone size={26} style={{ color: '#C9C3B1' }} className="mx-auto mb-3" />
            <p className="font-medium text-[15px] mb-1" style={{ color: '#0F1F18' }}>No posts yet</p>
            <p className="text-[13px]" style={{ color: '#65736B' }}>Your first update will show here and reach every attendee.</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
