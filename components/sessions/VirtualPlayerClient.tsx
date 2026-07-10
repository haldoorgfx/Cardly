'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Play, Volume2, Maximize2, ChevronUp, Send, BookmarkPlus, BookmarkCheck } from 'lucide-react';
import Link from 'next/link';

interface Speaker { id: string; full_name: string; avatar_url?: string | null; title?: string | null }
interface Question { id: string; question: string; upvotes_count: number; is_featured: boolean; is_anonymous: boolean; created_at: string; registrations?: { attendee_name: string } | null }
interface RelatedSession { id: string; title: string; starts_at: string; track?: string | null }

interface Props {
  event: { id: string; name: string; slug: string }
  session: { id: string; title: string; description: string; stream_url: string | null; starts_at: string; ends_at: string | null; track: string | null }
  speakers: Speaker[]
  initialQuestions: Question[]
  relatedSessions: RelatedSession[]
}

function initials(name: string) { return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(); }

function timeStr(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function VirtualPlayerClient({ event, session, speakers, initialQuestions, relatedSessions }: Props) {
  const searchParams = useSearchParams();
  const regId = searchParams.get('reg');

  const [playing, setPlaying] = useState(false);
  const [sideTab, setSideTab] = useState<'qa' | 'chat' | 'people'>('qa');
  const [questions, setQuestions] = useState(initialQuestions);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [newQ, setNewQ] = useState('');
  const [sending, setSending] = useState(false);
  const [inAgenda, setInAgenda] = useState(false);
  const [agendaLoading, setAgendaLoading] = useState(false);

  const upvote = useCallback((qId: string) => {
    setVoted(prev => {
      const next = new Set(prev);
      const wasOn = next.has(qId);
      if (wasOn) { next.delete(qId); } else { next.add(qId); }
      setQuestions(qs =>
        qs.map(q => q.id === qId ? { ...q, upvotes_count: q.upvotes_count + (wasOn ? -1 : 1) } : q)
          .sort((a, b) => b.upvotes_count - a.upvotes_count)
      );
      // Persist when the attendee has a registration
      if (regId) {
        fetch(`/api/events/${event.id}/q-and-a`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question_id: qId, registration_id: regId }),
        }).catch(() => {});
      }
      return next;
    });
  }, [regId, event.id]);

  const toggleAgenda = async () => {
    if (!regId) return; // must be registered
    setAgendaLoading(true);
    try {
      const res = await fetch(`/api/sessions/${session.id}/agenda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_id: regId, action: inAgenda ? 'remove' : 'add' }),
      });
      if (res.ok) setInAgenda(v => !v);
    } finally {
      setAgendaLoading(false);
    }
  };

  const submitQuestion = async () => {
    if (!newQ.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/events/${event.id}/q-and-a`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newQ.trim(), session_id: session.id, registration_id: regId ?? undefined }),
      });
      const data = await res.json() as { question: Question };
      if (data.question) setQuestions(prev => [data.question, ...prev]);
      setNewQ('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      {/* Player region */}
      <div className="flex flex-col lg:grid" style={{ gridTemplateColumns: '65fr 35fr', minHeight: 'calc(100vh - 64px)' }}>

        {/* Video column */}
        <div style={{ background: '#07120c', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Brand strip */}
          <div
            className="absolute top-0 left-0 right-0 z-10 px-5 py-3.5 font-display font-semibold text-[13px] tracking-wider"
            style={{ color: '#E8C57E', background: 'linear-gradient(to bottom, rgba(0,0,0,0.5), transparent)' }}
          >
            {event.name}
          </div>

          {/* Video stage */}
          <div className="flex-1 relative overflow-hidden">
            {session.stream_url ? (
              <iframe
                src={session.stream_url}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(31,77,58,0.3) 0%, transparent 70%)' }}>
                {!playing && (
                  <button
                    onClick={() => setPlaying(true)}
                    className="w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105"
                    style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
                  >
                    <Play size={24} fill="white" color="white" style={{ marginLeft: 3 }} />
                  </button>
                )}
                {playing && (
                  <div className="text-white text-[15px] font-display" style={{ opacity: 0.4 }}>
                    Live stream
                  </div>
                )}
              </div>
            )}

            {/* LIVE badge */}
            <div className="absolute top-4 right-4 flex items-center gap-2  text-[12px] text-white z-10">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: '#B8423C', boxShadow: '0 0 0 3px rgba(184,66,60,0.3)', animation: 'pulse 1.4s infinite' }}
              />
              LIVE · {Math.floor(Math.random() * 300 + 50)} watching
            </div>
          </div>

          {/* Controls */}
          <div
            className="h-12 flex items-center gap-4 px-4 shrink-0"
            style={{ background: 'rgba(7,18,12,0.95)' }}
          >
            <button onClick={() => setPlaying(v => !v)}>
              <Play size={18} color="rgba(255,255,255,0.85)" fill={playing ? 'rgba(255,255,255,0.85)' : 'none'} />
            </button>
            <Volume2 size={18} color="rgba(255,255,255,0.85)" className="cursor-pointer" />
            <div className="flex-1 h-1 rounded-full relative" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="absolute left-0 top-0 bottom-0 rounded-full" style={{ width: '42%', background: '#E8C57E' }} />
            </div>
            <span className=" text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>24:18 / 58:00</span>
            <span className=" text-[11px] px-1.5 py-0.5 rounded" style={{ border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.7)' }}>1080p</span>
            <Maximize2 size={18} color="rgba(255,255,255,0.85)" className="cursor-pointer" />
          </div>
        </div>

        {/* Side panel */}
        <div style={{ background: '#FAF6EE', borderLeft: '1px solid #E5E0D4', display: 'flex', flexDirection: 'column' }}>
          {/* Tabs */}
          <div className="flex shrink-0" style={{ borderBottom: '1px solid #E5E0D4' }}>
            {([
              { key: 'qa', label: `Q&A (${questions.length})` },
              { key: 'chat', label: 'Chat' },
              { key: 'people', label: 'People' },
            ] as { key: 'qa' | 'chat' | 'people'; label: string }[]).map(t => (
              <button
                key={t.key}
                onClick={() => setSideTab(t.key)}
                className="flex-1 py-3.5 text-[13px] font-medium text-center transition-colors border-b-2 -mb-px"
                style={{
                  color: sideTab === t.key ? '#1F4D3A' : '#6B7A72',
                  borderBottomColor: sideTab === t.key ? '#E8C57E' : 'transparent',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {sideTab === 'qa' && (
              questions.length === 0 ? (
                <p className="text-center text-[13px] py-8" style={{ color: '#6B7A72' }}>No questions yet. Be the first to ask.</p>
              ) : (
                questions.map(q => {
                  const asker = q.is_anonymous ? 'Anonymous' : q.registrations?.attendee_name ?? 'Attendee';
                  const mins = Math.floor((Date.now() - new Date(q.created_at).getTime()) / 60000);
                  const ago = mins < 1 ? 'just now' : `${mins}m ago`;
                  const isVoted = voted.has(q.id);
                  return (
                    <div
                      key={q.id}
                      className="rounded-xl p-3.5 flex gap-3"
                      style={{
                        border: `1px solid ${q.is_featured ? '#E8C57E' : '#E5E0D4'}`,
                        borderLeft: q.is_featured ? '2px solid #E8C57E' : '1px solid #E5E0D4',
                        background: 'white',
                      }}
                    >
                      {/* Upvote */}
                      <button onClick={() => upvote(q.id)} className="flex flex-col items-center gap-1 shrink-0 w-8">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{
                            border: `1px solid ${isVoted ? '#1F4D3A' : '#E5E0D4'}`,
                            background: isVoted ? '#1F4D3A' : 'transparent',
                          }}
                        >
                          <ChevronUp size={13} color={isVoted ? 'white' : '#6B7A72'} />
                        </div>
                        <span className=" font-medium text-[12px]" style={{ color: '#1F4D3A' }}>{q.upvotes_count}</span>
                      </button>
                      <div className="flex-1 min-w-0">
                        {q.is_featured && (
                          <div className="text-[10px] font-semibold mb-1" style={{ color: '#C9A45E' }}>★ Featured by moderator</div>
                        )}
                        <p className="text-[13px] leading-snug" style={{ color: '#0F1F18' }}>{q.question}</p>
                        <p className="text-[11px] mt-1.5" style={{ color: '#6B7A72' }}>{asker} · {ago}</p>
                      </div>
                    </div>
                  );
                })
              )
            )}
            {sideTab === 'chat' && (
              <p className="text-center text-[13px] py-8" style={{ color: '#6B7A72' }}>Live chat coming soon.</p>
            )}
            {sideTab === 'people' && (
              <p className="text-center text-[13px] py-8" style={{ color: '#6B7A72' }}>Attendee list not available for virtual sessions.</p>
            )}
          </div>

          {/* Ask bar */}
          {sideTab === 'qa' && (
            <div className="shrink-0 flex gap-2.5 p-3.5" style={{ borderTop: '1px solid #E5E0D4' }}>
              <input
                type="text"
                value={newQ}
                onChange={e => setNewQ(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitQuestion()}
                placeholder="Ask a question…"
                className="flex-1 rounded-full px-4 py-2 text-[13px] outline-none"
                style={{ border: '1px solid #E5E0D4', background: 'white', color: '#0F1F18' }}
              />
              <button
                onClick={submitQuestion}
                disabled={sending || !newQ.trim()}
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-opacity"
                style={{ background: '#1F4D3A', opacity: sending || !newQ.trim() ? 0.5 : 1 }}
              >
                <Send size={15} color="white" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Below: session info + related */}
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-10 py-10 pb-20">
        <div className="flex items-start justify-between gap-5 flex-wrap pb-7" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-normal text-[22px]" style={{ color: '#1F4D3A', letterSpacing: '-0.015em' }}>
              {session.title}
            </h2>
            {speakers.length > 0 && (
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                {speakers.map(sp => (
                  <div key={sp.id} className="flex items-center gap-2">
                    {sp.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sp.avatar_url} alt={sp.full_name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-display font-semibold shrink-0" style={{ background: '#1F4D3A' }}>
                        {initials(sp.full_name)}
                      </div>
                    )}
                    <span className="text-[13px]" style={{ color: '#3A4A42' }}>{sp.full_name}</span>
                  </div>
                ))}
              </div>
            )}
            {session.description && (
              <p className="text-[15px] leading-relaxed mt-4 max-w-[560px]" style={{ color: '#3A4A42' }}>
                {session.description}
              </p>
            )}
          </div>
          {regId ? (
            <button
              onClick={toggleAgenda}
              disabled={agendaLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium shrink-0 transition-colors"
              style={{
                background: inAgenda ? '#E8EFEB' : 'white',
                border: `1px solid ${inAgenda ? '#1F4D3A' : '#E5E0D4'}`,
                color: '#1F4D3A',
                opacity: agendaLoading ? 0.6 : 1,
              }}
            >
              {inAgenda ? <BookmarkCheck size={14} /> : <BookmarkPlus size={14} />}
              {inAgenda ? 'Saved to agenda' : 'Add to agenda'}
            </button>
          ) : (
            <Link
              href={`/e/${event.slug}/register`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-medium shrink-0 transition-colors hover:bg-[#E8EFEB]"
              style={{ background: 'white', border: '1px solid #E5E0D4', color: '#1F4D3A', textDecoration: 'none' }}
            >
              <BookmarkPlus size={14} />
              Add to agenda
            </Link>
          )}
        </div>

        {relatedSessions.length > 0 && (
          <div className="mt-10">
            <h3 className="font-display font-normal text-[20px] mb-5" style={{ color: '#1F4D3A' }}>Related sessions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {relatedSessions.map(r => (
                <Link
                  key={r.id}
                  href={`/e/${event.slug}/sessions/${r.id}/watch`}
                  className="rounded-xl overflow-hidden block transition-shadow hover:shadow-md"
                  style={{ border: '1px solid #E5E0D4', background: 'white' }}
                >
                  <div className="h-28" style={{ background: 'linear-gradient(135deg, #E8EFEB, #E5E0D4)' }} />
                  <div className="p-3.5">
                    <div className="font-medium text-[14px] leading-snug" style={{ color: '#1F4D3A' }}>{r.title}</div>
                    <div className=" text-[12px] mt-1.5" style={{ color: '#6B7A72' }}>
                      {timeStr(r.starts_at)}{r.track ? ` · ${r.track}` : ''}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{ box-shadow:0 0 0 0 rgba(184,66,60,0.6);} 50%{ box-shadow:0 0 0 5px rgba(184,66,60,0);} }
        @media (max-width:860px) {
          .player-grid { grid-template-columns: 1fr !important; height: auto !important; }
        }
      `}</style>
    </div>
  );
}
